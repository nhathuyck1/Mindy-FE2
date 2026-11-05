'use client';
import { useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import { Ellipse, Group, Layer, Line, Rect, Stage, Text } from 'react-konva';
import { BoardConnection, type BoardConnectionState } from '../lib/board-connection';
import {
  addShape,
  eraseAt,
  moveShape,
  removeShape,
  replaceText,
  resizeShape,
  worldPoint,
  zoomAt,
  type BoardView,
} from '../lib/board-shapes';
import type { BoardShape } from '../schemas/whiteboard-contracts';
import { WhiteboardImage } from './whiteboard-image';
import { WhiteboardCodeBlock } from './whiteboard-code-block';
import { CODE_FONT, CODE_PALETTE, codeMetrics } from '../lib/code-board';

export type BoardTool = 'select' | 'pan' | 'pen' | 'eraser';
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function handleLocalPosition(
  handle: ResizeHandle,
  width: number,
  height: number,
): { x: number; y: number } {
  switch (handle) {
    case 'nw':
      return { x: -4, y: -4 };
    case 'n':
      return { x: width / 2, y: -4 };
    case 'ne':
      return { x: width + 4, y: -4 };
    case 'e':
      return { x: width + 4, y: height / 2 };
    case 'se':
      return { x: width + 4, y: height + 4 };
    case 's':
      return { x: width / 2, y: height + 4 };
    case 'sw':
      return { x: -4, y: height + 4 };
    case 'w':
      return { x: -4, y: height / 2 };
  }
}

function handleCursor(handle: ResizeHandle): string {
  switch (handle) {
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
  }
}

function computeResizedBox(params: {
  handle: ResizeHandle;
  initial: { x: number; y: number; width: number; height: number };
  dx: number;
  dy: number;
  minWidth: number;
  minHeight: number;
  keepRatio: boolean;
  aspectRatio: number;
}): { x: number; y: number; width: number; height: number } {
  const { handle, initial, minWidth, minHeight, keepRatio, aspectRatio } = params;
  const { dx, dy } = params;

  if (keepRatio && ['nw', 'ne', 'se', 'sw'].includes(handle)) {
    const signX = handle === 'nw' || handle === 'sw' ? -1 : 1;
    const signY = handle === 'nw' || handle === 'ne' ? -1 : 1;
    const projX = dx * signX;
    const projY = dy * signY;
    const dominant = Math.abs(projX) > Math.abs(projY * aspectRatio) ? projX : projY * aspectRatio;
    const clampedDominant = Math.max(
      dominant,
      minWidth - initial.width,
      (minHeight - initial.height) * aspectRatio,
    );
    const newWidth = Math.max(minWidth, Math.min(10000, initial.width + clampedDominant));
    const newHeight = Math.max(minHeight, Math.min(10000, newWidth / aspectRatio));

    const newX = signX === -1 ? initial.x + initial.width - newWidth : initial.x;
    const newY = signY === -1 ? initial.y + initial.height - newHeight : initial.y;
    return { x: newX, y: newY, width: newWidth, height: newHeight };
  }

  let x = initial.x;
  let y = initial.y;
  let width = initial.width;
  let height = initial.height;

  if (handle === 'e' || handle === 'ne' || handle === 'se') {
    width = Math.max(minWidth, Math.min(10000, initial.width + dx));
  } else if (handle === 'w' || handle === 'nw' || handle === 'sw') {
    const rawWidth = initial.width - dx;
    width = Math.max(minWidth, Math.min(10000, rawWidth));
    x = initial.x + (initial.width - width);
  }

  if (handle === 's' || handle === 'se' || handle === 'sw') {
    height = Math.max(minHeight, Math.min(10000, initial.height + dy));
  } else if (handle === 'n' || handle === 'ne' || handle === 'nw') {
    const rawHeight = initial.height - dy;
    height = Math.max(minHeight, Math.min(10000, rawHeight));
    y = initial.y + (initial.height - height);
  }

  return { x, y, width, height };
}

function findHandleAt(
  point: { x: number; y: number },
  shape: BoardShape,
  view: BoardView,
  threshold: number,
): ResizeHandle | null {
  if (shape.type === 'stroke') return null;
  for (const h of RESIZE_HANDLES) {
    const localPos = handleLocalPosition(h, shape.width, shape.height);
    const screenX = (shape.x + localPos.x) * view.scale + view.x;
    const screenY = (shape.y + localPos.y) * view.scale + view.y;
    if (Math.hypot(point.x - screenX, point.y - screenY) <= threshold) {
      return h;
    }
  }
  return null;
}

type Gesture =
  | { type: 'pen'; points: number[] }
  | { type: 'pan'; x: number; y: number; view: BoardView }
  | { type: 'drag'; id: string; x: number; y: number; initialX: number; initialY: number }
  | {
      type: 'resize';
      id: string;
      handle: ResizeHandle;
      startX: number;
      startY: number;
      initialBox: { x: number; y: number; width: number; height: number; type: string };
      aspectRatio: number;
      keepRatio: boolean;
    }
  | { type: 'pinch'; distance: number; mid: { x: number; y: number }; view: BoardView }
  | { type: 'eraser' };
export function WhiteboardCanvas(props: {
  connection: BoardConnection;
  state: BoardConnectionState;
  view: BoardView;
  setView: (v: BoardView) => void;
  size: { width: number; height: number };
  tool: BoardTool;
  setTool: (t: BoardTool) => void;
  color: string;
  strokeWidth: number;
  selected: string | null;
  select: (id: string | null) => void;
  editing: string | null;
  edit: (id: string | null) => void;
  preview?: BoardShape[];
}) {
  const root = useRef<HTMLDivElement>(null),
    stage = useRef<Konva.Stage>(null),
    pointers = useRef(new Map<number, { x: number; y: number }>()),
    gesture = useRef<Gesture | null>(null);
  const latest = useRef(props);
  const lastTap = useRef<{ id: string; at: number } | null>(null);
  useEffect(() => {
    latest.current = props;
  });
  const [draft, setDraft] = useState<number[]>([]),
    [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null),
    [resizeDraft, setResizeDraft] = useState<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>(null),
    [hoverHandle, setHoverHandle] = useState<ResizeHandle | null>(null),
    [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null),
    [composition, setComposition] = useState<string | null>(null);
  const [theme] = useState(() => {
    const css = getComputedStyle(document.documentElement);
    return {
      mint: css.getPropertyValue('--color-mint').trim(),
      forest: css.getPropertyValue('--color-forest').trim(),
    };
  });
  const editable = props.connection.editable() && !props.preview;
  const items = props.preview ?? props.state.shapes;
  const editing = items.find(
    (s): s is Extract<BoardShape, { type: 'sticky' | 'text' | 'code' }> =>
      s.id === props.editing && (s.type === 'sticky' || s.type === 'text' || s.type === 'code'),
  );
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const p = latest.current,
        box = element.getBoundingClientRect();
      p.setView(
        zoomAt(
          p.view,
          event.clientX - box.left,
          event.clientY - box.top,
          p.view.scale * (event.deltaY > 0 ? 0.9 : 1.1),
        ),
      );
    };
    element.addEventListener('wheel', wheel, { passive: false });
    void document.fonts.ready.then(() => stage.current?.batchDraw());
    return () => element.removeEventListener('wheel', wheel);
  }, []);
  const local = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };
  function shapeAt(point: { x: number; y: number }) {
    let node: Konva.Node | undefined = stage.current?.getIntersection(point) ?? undefined;
    while (node) {
      if (node.id()) {
        const id = node.id();
        return items.find((s) => s.id === id);
      }
      node = node.getParent() ?? undefined;
    }
    return undefined;
  }
  function editAt(point: { x: number; y: number }) {
    const shape = shapeAt(point);
    if (
      editable &&
      (shape?.type === 'sticky' || shape?.type === 'text' || shape?.type === 'code')
    ) {
      props.select(shape.id);
      props.setTool('select');
      props.edit(shape.id);
    }
  }
  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest('textarea,button')) return;
    const point = local(event);
    pointers.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        type: 'pinch',
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        view: props.view,
      };
      setDraft([]);
      setDrag(null);
      setResizeDraft(null);
      return;
    }
    if (pointers.current.size > 2) return;
    const world = worldPoint(props.view, point.x, point.y);
    props.edit(null);
    if (props.tool === 'pen' && editable) {
      gesture.current = { type: 'pen', points: [world.x, world.y] };
      setDraft([world.x, world.y]);
      props.select(null);
      return;
    }
    if (props.tool === 'eraser' && editable) {
      gesture.current = { type: 'eraser' };
      eraseAt(props.connection.doc, world.x, world.y, 12 / props.view.scale);
      return;
    }
    if (props.tool === 'select' && props.selected && editable) {
      const selectedShape = items.find((s) => s.id === props.selected);
      if (selectedShape && selectedShape.type !== 'stroke') {
        const threshold = event.pointerType === 'touch' ? 20 : 12;
        const hitHandle = findHandleAt(point, selectedShape, props.view, threshold);
        if (hitHandle) {
          setActiveHandle(hitHandle);
          gesture.current = {
            type: 'resize',
            id: selectedShape.id,
            handle: hitHandle,
            startX: world.x,
            startY: world.y,
            initialBox: {
              x: selectedShape.x,
              y: selectedShape.y,
              width: selectedShape.width,
              height: selectedShape.height,
              type: selectedShape.type,
            },
            aspectRatio: selectedShape.width / selectedShape.height,
            keepRatio: selectedShape.type === 'image' || event.shiftKey,
          };
          setResizeDraft({
            id: selectedShape.id,
            x: selectedShape.x,
            y: selectedShape.y,
            width: selectedShape.width,
            height: selectedShape.height,
          });
          return;
        }
      }
    }
    let node: Konva.Node | undefined = stage.current?.getIntersection(point) ?? undefined;
    let id = '';
    while (node) {
      if (node.id()) {
        id = node.id();
        break;
      }
      node = node.getParent() ?? undefined;
    }
    const shape = items.find((s) => s.id === id);
    if (props.tool === 'select' && shape) {
      props.select(shape.id);
      if (editable)
        gesture.current = {
          type: 'drag',
          id: shape.id,
          x: world.x,
          y: world.y,
          initialX: shape.x,
          initialY: shape.y,
        };
    } else {
      props.select(null);
      gesture.current = { type: 'pan', x: point.x, y: point.y, view: props.view };
    }
  }
  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const point = local(event);
    if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, point);
    const world = worldPoint(props.view, point.x, point.y);
    props.connection.awareness(world.x, world.y);
    const g = gesture.current;
    if (!g && props.tool === 'select' && props.selected && editable) {
      const selectedShape = items.find((s) => s.id === props.selected);
      if (selectedShape && selectedShape.type !== 'stroke') {
        const h = findHandleAt(point, selectedShape, props.view, 12);
        setHoverHandle(h);
      } else {
        setHoverHandle(null);
      }
    } else if (!g && hoverHandle) {
      setHoverHandle(null);
    }
    if (!g) return;
    if (g.type === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()],
        mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const anchor = worldPoint(g.view, g.mid.x, g.mid.y);
      const scale = Math.max(
        0.1,
        Math.min(4, (g.view.scale * Math.hypot(a.x - b.x, a.y - b.y)) / Math.max(1, g.distance)),
      );
      props.setView({ x: mid.x - anchor.x * scale, y: mid.y - anchor.y * scale, scale });
    }
    if (g.type === 'pan')
      props.setView({ ...g.view, x: g.view.x + point.x - g.x, y: g.view.y + point.y - g.y });
    if (
      g.type === 'pen' &&
      editable &&
      g.points.length < 20000 &&
      Math.abs(world.x) <= 100000 &&
      Math.abs(world.y) <= 100000
    ) {
      g.points.push(world.x, world.y);
      setDraft([...g.points]);
    }
    if (g.type === 'eraser' && editable)
      eraseAt(props.connection.doc, world.x, world.y, 12 / props.view.scale);
    if (g.type === 'drag' && editable)
      setDrag({ id: g.id, x: g.initialX + world.x - g.x, y: g.initialY + world.y - g.y });
    if (g.type === 'resize' && editable) {
      const currentKeepRatio = event.shiftKey ? !g.keepRatio : g.keepRatio;
      const minW =
        g.initialBox.type === 'code'
          ? 140
          : g.initialBox.type === 'sticky'
            ? 80
            : g.initialBox.type === 'text'
              ? 40
              : 20;
      const minH =
        g.initialBox.type === 'code'
          ? 70
          : g.initialBox.type === 'sticky'
            ? 60
            : g.initialBox.type === 'text'
              ? 30
              : 20;
      const nextBox = computeResizedBox({
        handle: g.handle,
        initial: g.initialBox,
        dx: world.x - g.startX,
        dy: world.y - g.startY,
        minWidth: minW,
        minHeight: minH,
        keepRatio: currentKeepRatio,
        aspectRatio: g.aspectRatio,
      });
      setResizeDraft({ id: g.id, ...nextBox });
    }
  }
  function pointerUp(event: React.PointerEvent<HTMLDivElement>, cancel = false) {
    pointers.current.delete(event.pointerId);
    const g = gesture.current;
    if (!cancel && editable && event.pointerType === 'touch' && g?.type === 'drag' && !drag) {
      const now = Date.now();
      if (lastTap.current?.id === g.id && now - lastTap.current.at < 400) {
        editAt(local(event));
        lastTap.current = null;
      } else lastTap.current = { id: g.id, at: now };
    }
    if (!cancel && editable && pointers.current.size === 0) {
      if (g?.type === 'pen' && g.points.length >= 4)
        addShape(props.connection.doc, {
          id: crypto.randomUUID(),
          type: 'stroke',
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          color: props.color,
          strokeWidth: props.strokeWidth,
          points: g.points,
        });
      if (g?.type === 'drag' && drag) moveShape(props.connection.doc, g.id, drag.x, drag.y);
      if (g?.type === 'resize' && resizeDraft) resizeShape(props.connection.doc, g.id, resizeDraft);
    }
    gesture.current = null;
    setActiveHandle(null);
    setDraft([]);
    setDrag(null);
    setResizeDraft(null);
  }
  function keyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest('textarea,input,button,select'))
      return;
    if (event.key === 'Escape') {
      props.select(null);
      props.edit(null);
      props.setTool('select');
      setDrag(null);
      setResizeDraft(null);
      setHoverHandle(null);
      setActiveHandle(null);
      return;
    }
    if (!editable) return;
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(key)) {
      event.preventDefault();
      if (key === 'y' || event.shiftKey) props.connection.undo.redo();
      else props.connection.undo.undo();
      return;
    }
    if (key === 'v') props.setTool('select');
    if (key === 'p') props.setTool('pen');
    if (key === 'e') props.setTool('eraser');
    if (key === 'h') props.setTool('pan');
    if (props.selected && ['Delete', 'Backspace'].includes(event.key)) {
      event.preventDefault();
      removeShape(props.connection.doc, props.selected);
      props.select(null);
    }
    if (props.selected && ['Enter', 'F2'].includes(event.key)) {
      event.preventDefault();
      props.edit(props.selected);
    }
    const selected = items.find((s) => s.id === props.selected);
    if (selected && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      if (event.altKey && selected.type !== 'stroke') {
        const nextW = Math.max(
          selected.type === 'code' ? 140 : selected.type === 'sticky' ? 80 : 20,
          Math.min(
            10000,
            selected.width +
              (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0),
          ),
        );
        const nextH = Math.max(
          selected.type === 'code' ? 70 : selected.type === 'sticky' ? 60 : 20,
          Math.min(
            10000,
            selected.height +
              (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0),
          ),
        );
        resizeShape(props.connection.doc, selected.id, {
          x: selected.x,
          y: selected.y,
          width: nextW,
          height: nextH,
        });
      } else {
        moveShape(
          props.connection.doc,
          selected.id,
          selected.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0),
          selected.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0),
        );
      }
    }
  }
  const grid = 32 * props.view.scale;
  const currentCursorHandle = activeHandle ?? hoverHandle;
  const cursorStyle = currentCursorHandle ? handleCursor(currentCursorHandle) : undefined;
  return (
    <div
      ref={root}
      tabIndex={0}
      aria-label="Vùng bảng vẽ. V chọn, P bút, E tẩy, H di chuyển. Chọn phần tử trong menu để dùng bàn phím."
      className={`whiteboard-canvas tool-${props.tool}`}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={(e) => pointerUp(e)}
      onPointerCancel={(e) => pointerUp(e, true)}
      onDoubleClick={(e) => {
        if (e.target instanceof Element && e.target.closest('textarea')) return;
        const box = e.currentTarget.getBoundingClientRect();
        editAt({ x: e.clientX - box.left, y: e.clientY - box.top });
      }}
      onKeyDown={keyDown}
      style={{
        backgroundSize: `${grid}px ${grid}px`,
        backgroundPosition: `${props.view.x}px ${props.view.y}px`,
        cursor: cursorStyle,
      }}
    >
      <Stage
        ref={stage}
        width={props.size.width}
        height={props.size.height}
        x={props.view.x}
        y={props.view.y}
        scaleX={props.view.scale}
        scaleY={props.view.scale}
      >
        <Layer>
          {items.map((shape) => {
            const currentBox =
              resizeDraft?.id === shape.id
                ? { ...shape, ...resizeDraft }
                : drag?.id === shape.id
                  ? { ...shape, x: drag.x, y: drag.y }
                  : shape;
            return (
              <Group
                key={shape.id}
                id={shape.id}
                x={currentBox.x}
                y={currentBox.y}
                onDblClick={() => {
                  if (
                    editable &&
                    (shape.type === 'sticky' || shape.type === 'text' || shape.type === 'code')
                  )
                    props.edit(shape.id);
                }}
                onDblTap={() => {
                  if (
                    editable &&
                    (shape.type === 'sticky' || shape.type === 'text' || shape.type === 'code')
                  )
                    props.edit(shape.id);
                }}
              >
                {shape.type === 'sticky' && (
                  <>
                    <Rect
                      width={currentBox.width}
                      height={currentBox.height}
                      fill={shape.color}
                      cornerRadius={4}
                      shadowColor={theme.forest}
                      shadowOpacity={0.12}
                      shadowBlur={8}
                      shadowOffsetY={3}
                    />
                    <Text
                      text={shape.text}
                      width={currentBox.width}
                      height={currentBox.height}
                      padding={12}
                      fontFamily="Nunito Variable"
                      fontSize={16}
                      lineHeight={1.375}
                      fill={theme.forest}
                    />
                  </>
                )}
                {shape.type === 'stroke' && (
                  <Line
                    points={shape.points}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    lineCap="round"
                    lineJoin="round"
                    hitStrokeWidth={Math.max(16, shape.strokeWidth)}
                  />
                )}
                {shape.type === 'rectangle' && (
                  <Rect
                    width={currentBox.width}
                    height={currentBox.height}
                    fill={shape.fill}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                  />
                )}
                {shape.type === 'ellipse' && (
                  <Ellipse
                    x={currentBox.width / 2}
                    y={currentBox.height / 2}
                    radiusX={currentBox.width / 2}
                    radiusY={currentBox.height / 2}
                    fill={shape.fill}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                  />
                )}
                {shape.type === 'text' && (
                  <Text
                    width={currentBox.width}
                    height={currentBox.height}
                    text={shape.text}
                    padding={12}
                    fontFamily="Nunito Variable"
                    fontSize={shape.fontSize}
                    lineHeight={1.375}
                    fill={shape.color}
                  />
                )}
                {shape.type === 'code' && (
                  <WhiteboardCodeBlock
                    shape={shape}
                    width={currentBox.width}
                    height={currentBox.height}
                  />
                )}
                {shape.type === 'image' && (
                  <WhiteboardImage
                    boardId={props.connection.boardId}
                    shape={
                      resizeDraft?.id === shape.id
                        ? { ...shape, width: currentBox.width, height: currentBox.height }
                        : shape
                    }
                  />
                )}
                {props.selected === shape.id && (
                  <>
                    <Rect
                      x={-4}
                      y={-4}
                      width={currentBox.width + 8}
                      height={currentBox.height + 8}
                      stroke={theme.mint}
                      strokeWidth={1.5 / props.view.scale}
                      dash={[6 / props.view.scale, 4 / props.view.scale]}
                      listening={false}
                    />
                    {shape.type !== 'stroke' &&
                      RESIZE_HANDLES.map((h) => {
                        const pos = handleLocalPosition(h, currentBox.width, currentBox.height);
                        const s = 8 / props.view.scale;
                        return (
                          <Rect
                            key={h}
                            x={pos.x - s / 2}
                            y={pos.y - s / 2}
                            width={s}
                            height={s}
                            fill="#FFFFFF"
                            stroke={theme.mint}
                            strokeWidth={1.5 / props.view.scale}
                            cornerRadius={1.5 / props.view.scale}
                            listening={false}
                          />
                        );
                      })}
                  </>
                )}
              </Group>
            );
          })}
          {draft.length >= 4 && (
            <Line
              points={draft}
              stroke={props.color}
              strokeWidth={props.strokeWidth}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
          )}
          {!props.preview &&
            props.state.peers.map((peer) => (
              <Group key={peer.connectionId} x={peer.x} y={peer.y} listening={false}>
                <Line points={[0, 0, 0, 16, 5, 12, 11, 12, 0, 0]} fill={theme.mint} closed />
                <Text
                  x={12}
                  y={12}
                  text={peer.name}
                  fontFamily="Nunito Variable"
                  fontSize={12 / props.view.scale}
                  fill={theme.forest}
                />
              </Group>
            ))}
        </Layer>
      </Stage>
      {editing && editable && (
        <textarea
          aria-label={editing.type === 'code' ? 'Nội dung khối code' : 'Nội dung ghi chú'}
          spellCheck={editing.type !== 'code'}
          wrap={editing.type === 'code' ? 'off' : undefined}
          autoFocus
          maxLength={5000}
          value={composition ?? editing.text}
          onCompositionStart={() => setComposition(editing.text)}
          onCompositionEnd={(e) => {
            replaceText(props.connection.doc, editing.id, e.currentTarget.value);
            setComposition(null);
          }}
          onChange={(e) => {
            if (composition !== null) setComposition(e.target.value);
            else replaceText(props.connection.doc, editing.id, e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            // Code blocks: Tab indents instead of leaving the editor.
            if (editing.type === 'code' && e.key === 'Tab' && !e.shiftKey) {
              e.preventDefault();
              const el = e.currentTarget,
                start = el.selectionStart;
              const next = `${el.value.slice(0, start)}  ${el.value.slice(el.selectionEnd)}`;
              if (next.length <= 5000) {
                replaceText(props.connection.doc, editing.id, next);
                requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
              }
              return;
            }
            if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
              props.edit(null);
              root.current?.focus();
            }
          }}
          onBlur={() => {
            props.edit(null);
            setComposition(null);
          }}
          className="whiteboard-note-editor"
          style={{
            left: props.view.x + editing.x * props.view.scale,
            top: props.view.y + editing.y * props.view.scale,
            width: editing.width * props.view.scale,
            height: editing.height * props.view.scale,
            fontSize: (editing.type === 'sticky' ? 16 : editing.fontSize) * props.view.scale,
            backgroundColor:
              editing.type === 'sticky'
                ? editing.color
                : editing.type === 'code'
                  ? CODE_PALETTE.bg
                  : 'var(--color-canvas)',
            color:
              editing.type === 'text'
                ? editing.color
                : editing.type === 'code'
                  ? CODE_PALETTE.plain
                  : 'var(--color-forest)',
            ...(editing.type === 'code'
              ? (() => {
                  const m = codeMetrics(editing.fontSize);
                  return {
                    fontFamily: CODE_FONT,
                    lineHeight: `${m.lineHeight * props.view.scale}px`,
                    padding: `${(m.header + m.pad) * props.view.scale}px ${m.pad * props.view.scale}px`,
                    whiteSpace: 'pre' as const,
                    borderRadius: 10 * props.view.scale,
                  };
                })()
              : {}),
          }}
        />
      )}
    </div>
  );
}
