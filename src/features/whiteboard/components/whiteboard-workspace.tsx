'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  ArrowLeft,
  Circle,
  Shapes,
  Square,
  Type as TextIcon,
  Download,
  Eraser,
  Hand,
  HelpCircle,
  History,
  ImagePlus,
  Minus,
  MoreHorizontal,
  MousePointer2,
  Pencil,
  Plus,
  Redo2,
  Save,
  Scan,
  StickyNote,
  Trash2,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { apiRequest, ApiError } from '@/lib/api/client';
import { useSession } from '@/features/auth/api/auth-queries';
import { useBoardMedia, type ReadyBoardImage } from '../api/use-board-media';
import { BoardConnection } from '../lib/board-connection';
import { addShape, removeShape, worldPoint, zoomAt, type BoardView } from '../lib/board-shapes';
import {
  boardMetadataSchema,
  boardPreviewSchema,
  boardSnapshotSchema,
  boardSnapshotsSchema,
  type BoardMetadata,
  type SessionBoard,
  type BoardShape,
} from '../schemas/whiteboard-contracts';
import { WhiteboardCanvas, type BoardTool } from './whiteboard-canvas';
import { CODE_DRAG_TYPE, CODE_MAX_CHARS, codeShape } from '../lib/code-board';
import type { CodeLanguageKey } from '@/features/code-assignments/schemas/code-contracts';

const palette = [
  '#1d302e',
  '#338a85',
  '#ff7f50',
  '#d94c4c',
  '#6554c0',
  '#2b73bc',
  '#f9d85f',
  '#ffffff',
];
/** What the code workspace can do with an embedded board ("Gửi lên bảng", drag and drop). */
export type BoardBridge = {
  addCode: (
    text: string,
    language: CodeLanguageKey,
    at?: { clientX: number; clientY: number },
  ) => 'ok' | 'readonly' | 'busy' | 'too-long' | 'empty';
};

function shapeLabel(s: BoardShape) {
  if (s.type === 'code') return `Khối code: ${s.text.split('\n')[0]?.slice(0, 30) ?? ''}`;
  return s.type === 'sticky'
    ? s.text.slice(0, 35)
    : s.type === 'text'
      ? s.text.slice(0, 35)
      : s.type === 'ellipse'
        ? 'Hình tròn'
        : s.type === 'rectangle'
          ? s.width === s.height
            ? 'Hình vuông'
            : 'Hình chữ nhật'
          : s.type === 'image'
            ? 'Ảnh'
            : 'Nét vẽ';
}
type Confirm = {
  kind: 'reset' | 'restore';
  body: {
    expectedEpoch: string;
    expectedSequence: string;
    expectedControlVersion: string;
    snapshotId?: string;
  };
};
function fitContent(shapes: BoardShape[], size: { width: number; height: number }): BoardView {
  if (!shapes.length) return { x: 0, y: 0, scale: 1 };
  let x = Infinity,
    y = Infinity,
    r = -Infinity,
    b = -Infinity;
  for (const s of shapes) {
    const xs = s.type === 'stroke' ? s.points.filter((_, i) => i % 2 === 0) : [0, s.width],
      ys = s.type === 'stroke' ? s.points.filter((_, i) => i % 2 === 1) : [0, s.height];
    x = Math.min(x, s.x + Math.min(...xs));
    y = Math.min(y, s.y + Math.min(...ys));
    r = Math.max(r, s.x + Math.max(...xs));
    b = Math.max(b, s.y + Math.max(...ys));
  }
  const scale = Math.min(
    2,
    Math.max(
      0.1,
      Math.min((size.width - 140) / Math.max(r - x, 1), (size.height - 100) / Math.max(b - y, 1)),
    ),
  );
  return {
    x: size.width / 2 - ((x + r) / 2) * scale,
    y: size.height / 2 - ((y + b) / 2) * scale,
    scale,
  };
}
export function WhiteboardWorkspace(props: {
  initial: SessionBoard & { board: BoardMetadata };
  /** Fill the parent (code workspace tab) instead of the viewport; compact header. */
  embedded?: boolean;
  /** Embedded only: false while hidden — keeps syncing but takes no paste/input. */
  active?: boolean;
  /** Receives the bridge once the board is open (null on unmount). */
  onReady?: (bridge: BoardBridge | null) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const active = props.active !== false;
  const [shapeMenu, setShapeMenu] = useState(false);
  const [connection] = useState(() => new BoardConnection(props.initial.board.id));
  const state = useSyncExternalStore(
    connection.subscribe,
    connection.getSnapshot,
    connection.getSnapshot,
  );
  const [tool, setTool] = useState<BoardTool>('select'),
    [color, setColor] = useState(palette[0]),
    [strokeWidth, setStrokeWidth] = useState(4),
    [penSettings, setPenSettings] = useState(false);
  const [view, setView] = useState<BoardView>({ x: 0, y: 0, scale: 1 }),
    [size, setSize] = useState({ width: 320, height: 500 }),
    container = useRef<HTMLDivElement>(null);
  const [selected, select] = useState<string | null>(null),
    [editing, edit] = useState<string | null>(null),
    [menu, setMenu] = useState(false),
    [history, setHistory] = useState(false),
    [historyPage, setHistoryPage] = useState(1);
  const [preview, setPreview] = useState<z.infer<typeof boardPreviewSchema> | null>(null),
    [confirm, setConfirm] = useState<Confirm | null>(null),
    [help, setHelp] = useState(false);
  const [exportDialog, setExportDialog] = useState(false),
    [format, setFormat] = useState<'PNG' | 'PDF'>('PNG'),
    [scope, setScope] = useState<'CONTENT' | 'VIEWPORT'>('CONTENT');
  const [pdf, setPdf] = useState<File | null>(null),
    [pages, setPages] = useState('1'),
    [message, setMessage] = useState(''),
    fileInput = useRef<HTMLInputElement>(null);
  const media = useBoardMedia(connection.boardId),
    session = useSession();
  const board = state.state?.board ?? props.initial.board,
    cap = state.state?.capabilities ?? props.initial.capabilities;
  const editable = connection.editable() && !preview,
    canCommand = state.status === 'online' && state.pending === 0 && !preview;
  const receipt = useRef<{ signature: string; key: string } | null>(null);
  const command = useMutation({
    retry: false,
    mutationFn: (input: { path: string; body: unknown; schema: z.ZodType }) => {
      const signature = JSON.stringify({ path: input.path, body: input.body });
      if (receipt.current?.signature !== signature)
        receipt.current = { signature, key: crypto.randomUUID() };
      return apiRequest({
        path: `whiteboards/${connection.boardId}/${input.path}`,
        method: input.path === 'control' ? 'PATCH' : 'POST',
        body: input.body,
        schema: input.schema,
        idempotencyKey: receipt.current.key,
      });
    },
    onSuccess: () => {
      receipt.current = null;
      connection.refresh();
    },
    onError: (e) =>
      setMessage(
        e instanceof ApiError && e.status === 409
          ? 'Bảng đã thay đổi. Đóng xác nhận, xem lại bảng rồi thực hiện ý định mới.'
          : 'Chưa nhận được kết quả. Thử lại để kiểm tra cùng thao tác.',
      ),
  });
  const snapshots = useQuery({
    queryKey: ['whiteboard-history', session.data?.id, connection.boardId, historyPage],
    enabled: history,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `whiteboards/${connection.boardId}/snapshots?page=${historyPage}&pageSize=10`,
        schema: boardSnapshotsSchema,
        signal,
      }),
    retry: false,
  });
  useEffect(() => {
    connection.start();
    return () => connection.stop();
  }, [connection]);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width),
        height = Math.floor(entry.contentRect.height);
      // A hidden tab reports 0×0; keep the last size so zoom and position survive.
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (connection.getSnapshot().pending) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [connection]);
  function addNote() {
    if (!editable) return;
    const p = worldPoint(view, size.width / 2, size.height / 2),
      id = crypto.randomUUID();
    addShape(connection.doc, {
      id,
      type: 'sticky',
      x: p.x - 110,
      y: p.y - 75,
      width: 220,
      height: 150,
      color: '#f9d85f',
      text: 'Ghi chú mới',
    });
    select(id);
    setTool('select');
  }
  function addPreset(type: 'rectangle' | 'ellipse' | 'text', square = false) {
    if (!editable) return;
    const center = worldPoint(view, size.width / 2, size.height / 2),
      id = crypto.randomUUID();
    const width = type === 'text' ? 280 : type === 'ellipse' || square ? 160 : 220,
      height = type === 'text' ? 96 : type === 'ellipse' || square ? 160 : 140;
    const base = { id, x: center.x - width / 2, y: center.y - height / 2, width, height, color };
    addShape(
      connection.doc,
      type === 'text'
        ? { ...base, type, text: 'Nhập chú thích', fontSize: 24 }
        : { ...base, type, fill: 'transparent', strokeWidth },
    );
    select(id);
    setTool('select');
    setShapeMenu(false);
    if (type === 'text') edit(id);
  }
  function placeImages(images: ReadyBoardImage[]) {
    if (!editable) return;
    const p = worldPoint(view, size.width / 2, size.height / 2);
    for (const [i, a] of images.entries()) {
      const scale = Math.min(1, 480 / a.width, 360 / a.height);
      addShape(connection.doc, {
        id: crypto.randomUUID(),
        type: 'image',
        assetId: a.id,
        x: p.x - (a.width * scale) / 2 + i * 24,
        y: p.y - (a.height * scale) / 2 + i * 24,
        width: a.width * scale,
        height: a.height * scale,
        color: '#ffffff',
      });
    }
    media.clearReady();
  }
  function chooseFile(file: File) {
    setMessage('');
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      setPdf(file);
      setPages('1');
    } else void media.uploadFile(file);
  }
  const latestUpload = useRef(chooseFile);
  useEffect(() => {
    latestUpload.current = chooseFile;
  });
  useEffect(() => {
    if (!cap.canUpload || !active) return;
    const embedded = props.embedded;
    const paste = (e: ClipboardEvent) => {
      // Embedded next to the code editor: only paste into the board when focus is inside it.
      if (embedded && !(e.target instanceof Node && root.current?.contains(e.target))) return;
      if (e.target instanceof Element && e.target.closest('input,textarea,[contenteditable=true]'))
        return;
      const file = [...(e.clipboardData?.files ?? [])].find((f) =>
        ['image/png', 'image/jpeg'].includes(f.type),
      );
      if (file) {
        e.preventDefault();
        latestUpload.current(file);
      }
    };
    window.addEventListener('paste', paste);
    return () => window.removeEventListener('paste', paste);
  }, [cap.canUpload, active, props.embedded]);
  // Latest view/size/permission for the bridge without re-creating it every render.
  const live = useRef({ view, size, editable, canEdit: cap.canEdit });
  useEffect(() => {
    live.current = { view, size, editable, canEdit: cap.canEdit };
  });
  function addCode(
    text: string,
    language: CodeLanguageKey,
    at?: { clientX: number; clientY: number },
  ): ReturnType<BoardBridge['addCode']> {
    const { view: v, size: sz, editable: canWrite, canEdit } = live.current;
    if (!canEdit) return 'readonly';
    // Connected and allowed, but the local queue is full or a snapshot is being previewed.
    if (!canWrite) return 'busy';
    const body = text.replace(/\s+$/, '');
    if (!body.trim()) return 'empty';
    if (body.length > CODE_MAX_CHARS) return 'too-long';
    const box = container.current?.getBoundingClientRect();
    const point =
      at && box
        ? worldPoint(v, at.clientX - box.left, at.clientY - box.top)
        : worldPoint(v, sz.width / 2, sz.height / 2);
    const shape = codeShape(body, language, point);
    addShape(connection.doc, shape);
    select(shape.id);
    setTool('select');
    return 'ok';
  }
  const latestAddCode = useRef(addCode);
  useEffect(() => {
    latestAddCode.current = addCode;
  });
  const onReady = props.onReady;
  // Offer the bridge only once the socket is online and the board state (with permissions) has
  // arrived; before that a send would be refused as if the user could only view.
  const ready = state.status === 'online' && state.state !== null;
  useEffect(() => {
    if (!onReady || !ready) return;
    onReady({ addCode: (...args) => latestAddCode.current(...args) });
    return () => onReady(null);
  }, [onReady, ready]);
  const returnPath = props.initial.context.mentor
    ? `/mentor/sessions/${board.sessionId}`
    : `/user/materials/${props.initial.context.classId}`;
  const selectedShape = state.shapes.find((s) => s.id === selected);
  const status =
    state.status === 'online'
      ? state.pending
        ? 'Đang đồng bộ…'
        : 'Đã lưu'
      : state.status === 'connecting'
        ? 'Đang kết nối…'
        : state.status === 'denied'
          ? 'Đã dừng truy cập'
          : 'Mất kết nối';
  async function saveCheckpoint() {
    setMessage('');
    await command.mutateAsync({
      path: 'snapshots',
      body: { expectedEpoch: board.epoch },
      schema: boardSnapshotSchema,
    });
    setMessage('Đã lưu mốc để có thể khôi phục.');
    void snapshots.refetch();
  }
  async function showPreview(id: string) {
    try {
      const p = await apiRequest({
        path: `whiteboards/${connection.boardId}/snapshots/${id}`,
        schema: boardPreviewSchema,
      });
      setPreview(p);
      setView(fitContent(p.projection, size));
      setHistory(false);
      setMessage('');
    } catch {
      setMessage('Chưa tải được mốc. Hãy thử lại trong lịch sử.');
    }
  }
  if (state.status === 'denied')
    return (
      <main
        className={props.embedded ? 'whiteboard-state' : 'whiteboard-empty'}
        data-embedded={props.embedded ? '' : undefined}
      >
        <div>
          <h1 className="text-xl font-bold">Đã dừng truy cập</h1>
          <p role="alert" className="my-4">
            {state.notice || 'Quyền truy cập bảng đã thay đổi.'}
          </p>
          <Link className="text-link" href={returnPath}>
            Về buổi học
          </Link>
        </div>
      </main>
    );
  return (
    <main
      ref={root}
      className="whiteboard-workspace"
      data-whiteboard-root=""
      data-embedded={props.embedded ? '' : undefined}
      inert={props.embedded && !active ? true : undefined}
      tabIndex={props.embedded ? -1 : undefined}
    >
      <header className="whiteboard-topbar">
        {!props.embedded && (
          <Link
            href={returnPath}
            aria-label="Về buổi học"
            title="Về buổi học"
            className="whiteboard-icon"
          >
            <ArrowLeft size={20} />
          </Link>
        )}
        {!props.embedded && (
          <span className="whiteboard-brand">
            <Image
              src="/brand/mindy-logo.jpg"
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-lg"
            />{' '}
            Mindy
            <span className="whiteboard-brand-dot" />
          </span>
        )}
        <div className="whiteboard-heading">
          <h1 title={board.title}>{board.title}</h1>
          <p title={props.initial.context.className}>{props.initial.context.className}</p>
        </div>
        <div className="whiteboard-status" aria-live="polite">
          <span data-online={state.status === 'online'} className="whiteboard-status-dot" />
          <span>{status}</span>
          <span className="whiteboard-permission">{cap.canEdit ? 'Được vẽ' : 'Chỉ xem'}</span>
        </div>
        <span className="whiteboard-people" title="Người có con trỏ đang hoạt động">
          {new Set(state.peers.map((p) => p.id)).size + 1} đang hoạt động
        </span>
        {cap.canControl && (
          <select
            aria-label="Chế độ bảng"
            value={board.mode}
            disabled={!canCommand || command.isPending}
            onChange={(e) => {
              void command
                .mutateAsync({
                  path: 'control',
                  body: { expectedControlVersion: board.controlVersion, mode: e.target.value },
                  schema: boardMetadataSchema,
                })
                .catch(() => {});
            }}
          >
            <option value="PRESENTATION">Trình bày</option>
            <option value="COLLABORATIVE" disabled={!cap.canCollaborate}>
              Cộng tác
            </option>
          </select>
        )}
        <button
          className="whiteboard-icon"
          aria-label="Thêm thao tác"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          <MoreHorizontal />
        </button>
      </header>
      <div
        className="whiteboard-body"
        ref={container}
        onDragOver={(e) => {
          if (!editable || !e.dataTransfer.types.includes(CODE_DRAG_TYPE)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(e) => {
          const language = e.dataTransfer.getData(CODE_DRAG_TYPE);
          if (language !== 'javascript' && language !== 'java21') return;
          e.preventDefault();
          const result = addCode(e.dataTransfer.getData('text/plain'), language, {
            clientX: e.clientX,
            clientY: e.clientY,
          });
          if (result === 'too-long') setMessage('Đoạn code quá dài (tối đa 5000 ký tự).');
        }}
      >
        <WhiteboardCanvas
          connection={connection}
          state={state}
          view={view}
          setView={setView}
          size={size}
          tool={tool}
          setTool={setTool}
          color={color}
          strokeWidth={strokeWidth}
          selected={selected}
          select={select}
          editing={editing}
          edit={edit}
          preview={preview?.projection}
        />
        <aside className="whiteboard-tools" aria-label="Công cụ bảng vẽ">
          {(
            [
              { id: 'select', label: 'Chọn (V)', Icon: MousePointer2 },
              { id: 'pan', label: 'Di chuyển (H)', Icon: Hand },
              { id: 'pen', label: 'Bút (P)', Icon: Pencil },
              { id: 'eraser', label: 'Tẩy nét (E)', Icon: Eraser },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              className="whiteboard-icon"
              title={t.label}
              aria-label={t.label}
              aria-pressed={tool === t.id}
              disabled={['pen', 'eraser'].includes(t.id) && !editable}
              onClick={() => {
                setTool(t.id);
                if (t.id === 'pen') setPenSettings(true);
              }}
            >
              <t.Icon size={21} />
            </button>
          ))}
          <span className="whiteboard-tool-divider" />
          <button
            className="whiteboard-icon"
            aria-label="Thêm hình và văn bản"
            title="Thêm hình và văn bản"
            disabled={!editable}
            aria-expanded={shapeMenu}
            onClick={() => {
              setShapeMenu(!shapeMenu);
              setPenSettings(false);
            }}
          >
            <Shapes size={21} />
          </button>
          <button
            className="whiteboard-icon"
            title="Màu và độ dày"
            aria-label="Màu và độ dày"
            aria-expanded={penSettings}
            onClick={() => setPenSettings(!penSettings)}
          >
            <span className="whiteboard-current-color" style={{ backgroundColor: color }} />
          </button>
          <button
            className="whiteboard-icon"
            title="Thêm ghi chú"
            aria-label="Thêm ghi chú"
            disabled={!editable}
            onClick={addNote}
          >
            <StickyNote size={21} />
          </button>
          {cap.canUpload && (
            <button
              className="whiteboard-icon"
              title="Tải ảnh hoặc PDF"
              aria-label="Tải ảnh hoặc PDF"
              disabled={!editable || media.busy}
              onClick={() => fileInput.current?.click()}
            >
              <ImagePlus size={21} />
            </button>
          )}
          <span className="whiteboard-tool-divider" />
          <button
            className="whiteboard-icon"
            aria-label="Hoàn tác"
            title="Hoàn tác (Ctrl Z)"
            disabled={!editable}
            onClick={() => connection.undo.undo()}
          >
            <Undo2 size={19} />
          </button>
          <button
            className="whiteboard-icon"
            aria-label="Làm lại"
            title="Làm lại (Ctrl Shift Z)"
            disabled={!editable}
            onClick={() => connection.undo.redo()}
          >
            <Redo2 size={19} />
          </button>
        </aside>
        {shapeMenu && (
          <section className="whiteboard-shape-settings" aria-label="Chọn hình hoặc văn bản">
            <strong>Thêm vào bảng</strong>
            <button onClick={() => addPreset('ellipse')}>
              <Circle size={20} />
              Hình tròn
            </button>
            <button onClick={() => addPreset('rectangle', true)}>
              <Square size={20} />
              Hình vuông
            </button>
            <button onClick={() => addPreset('rectangle')}>
              <Square size={20} />
              Hình chữ nhật
            </button>
            <button onClick={() => addPreset('text')}>
              <TextIcon size={20} />
              Văn bản / chú thích
            </button>
            <p>Chọn rồi kéo để di chuyển. Nhấp đúp văn bản hoặc ghi chú để sửa trực tiếp.</p>
          </section>
        )}
        {penSettings && (
          <section className="whiteboard-pen-settings" aria-label="Thiết lập bút">
            <div className="flex items-center justify-between">
              <strong>Bút vẽ</strong>
              <button
                aria-label="Đóng thiết lập bút"
                className="whiteboard-icon"
                onClick={() => setPenSettings(false)}
              >
                ×
              </button>
            </div>
            <div className="whiteboard-palette">
              {palette.map((c) => (
                <button
                  key={c}
                  style={{ backgroundColor: c }}
                  title={c}
                  aria-label={`Màu ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <label className="flex items-center justify-between gap-3">
              Màu tùy chọn
              <input
                type="color"
                aria-label="Màu tùy chọn"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
            <label className="mt-4 block">
              Độ dày: {strokeWidth}
              <input
                className="mt-2 w-full"
                aria-label="Độ dày bút"
                type="range"
                min={1}
                max={48}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
              />
            </label>
            <div className="whiteboard-stroke-preview">
              <span style={{ height: Math.min(strokeWidth, 32), backgroundColor: color }} />
            </div>
          </section>
        )}
        {menu && (
          <section className="whiteboard-menu" aria-label="Thao tác bảng">
            {cap.canSnapshot && (
              <button
                disabled={!canCommand || command.isPending}
                onClick={() => {
                  void saveCheckpoint().catch(() => {});
                  setMenu(false);
                }}
              >
                <Save size={18} />
                Lưu mốc
              </button>
            )}
            {cap.canSnapshot && (
              <button
                onClick={() => {
                  setHistory(true);
                  setMenu(false);
                }}
              >
                <History size={18} />
                Lịch sử mốc lưu
              </button>
            )}
            {cap.canExport && (
              <button
                disabled={!canCommand}
                onClick={() => {
                  setExportDialog(true);
                  setMenu(false);
                }}
              >
                <Download size={18} />
                Xuất PNG / PDF
              </button>
            )}
            {cap.canRestore && (
              <button
                disabled={!canCommand}
                onClick={() => {
                  setConfirm({
                    kind: 'reset',
                    body: {
                      expectedEpoch: board.epoch,
                      expectedSequence: board.sequence,
                      expectedControlVersion: board.controlVersion,
                    },
                  });
                  setMenu(false);
                }}
              >
                <Trash2 size={18} />
                Xóa nội dung bảng
              </button>
            )}
            <label className="block p-3 text-sm">
              Chọn phần tử bằng bàn phím
              <select
                aria-label="Chọn phần tử"
                value={selected ?? ''}
                onChange={(e) => {
                  select(e.target.value || null);
                  setTool('select');
                }}
              >
                <option value="">Chưa chọn</option>
                {state.shapes.map((s, i) => (
                  <option key={s.id} value={s.id}>
                    {i + 1}. {shapeLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => {
                setHelp(true);
                setMenu(false);
              }}
            >
              <HelpCircle size={18} />
              Hướng dẫn
            </button>
          </section>
        )}
        {selectedShape && !preview && (
          <section className="whiteboard-selection" aria-label="Phần tử đã chọn">
            <span>
              {selectedShape.type === 'sticky'
                ? 'Ghi chú'
                : selectedShape.type === 'text'
                  ? 'Văn bản'
                  : shapeLabel(selectedShape)}
            </span>
            {(selectedShape.type === 'sticky' || selectedShape.type === 'text') && (
              <span className="text-xs text-muted">Nhấp đúp để sửa</span>
            )}
            <button
              aria-label="Xóa phần tử"
              disabled={!editable}
              onClick={() => {
                removeShape(connection.doc, selectedShape.id);
                select(null);
              }}
            >
              <Trash2 size={18} />
            </button>
          </section>
        )}
        <div className="whiteboard-bottom">
          <button
            className="whiteboard-icon whiteboard-help"
            aria-label="Hướng dẫn"
            onClick={() => setHelp(true)}
          >
            <HelpCircle size={20} />
          </button>
          <span className="whiteboard-hint">Kéo để chọn · Cuộn để phóng to · Dán ảnh để thêm</span>
          <div className="whiteboard-zoom">
            <button
              aria-label="Thu nhỏ"
              onClick={() =>
                setView(zoomAt(view, size.width / 2, size.height / 2, view.scale / 1.2))
              }
            >
              <Minus size={18} />
            </button>
            <button
              aria-label="Đặt lại mức phóng"
              onClick={() => setView(zoomAt(view, size.width / 2, size.height / 2, 1))}
            >
              {Math.round(view.scale * 100)}%
            </button>
            <button
              aria-label="Phóng to"
              onClick={() =>
                setView(zoomAt(view, size.width / 2, size.height / 2, view.scale * 1.2))
              }
            >
              <Plus size={18} />
            </button>
            <button
              aria-label="Vừa nội dung"
              title="Vừa nội dung"
              onClick={() => setView(fitContent(preview?.projection ?? state.shapes, size))}
            >
              <Scan size={18} />
            </button>
          </div>
        </div>
        {(message || media.message || state.notice || state.status === 'offline') && (
          <div className="whiteboard-notice" role="status">
            <p>
              {state.notice ||
                message ||
                media.message ||
                'Mất kết nối. Bảng tạm khóa thao tác mới.'}
            </p>
            {state.status === 'offline' && (
              <Button size="sm" onClick={() => void connection.reconnect()}>
                Kết nối lại
              </Button>
            )}
            {media.retry === 'upload' && !media.busy && (
              <Button size="sm" onClick={() => void media.uploadFile()}>
                Kiểm tra tệp
              </Button>
            )}
            {media.retry === 'export' && !media.busy && (
              <Button size="sm" onClick={() => void media.exportFile()}>
                Kiểm tra / tải file
              </Button>
            )}
            {media.busy && (
              <Button size="sm" variant="outline" onClick={media.cancel}>
                Dừng chờ
              </Button>
            )}
            {!!media.ready.length && (
              <Button size="sm" disabled={!editable} onClick={() => placeImages(media.ready)}>
                Thêm ảnh vào bảng
              </Button>
            )}
          </div>
        )}
        {preview && (
          <section className="whiteboard-preview-banner">
            <strong>
              Đang xem mốc lưu · {new Date(preview.createdAt).toLocaleString('vi-VN')}
            </strong>
            <Button
              size="sm"
              onClick={() => {
                setPreview(null);
                setView(fitContent(state.shapes, size));
              }}
            >
              Về bảng hiện tại
            </Button>
            <Button
              size="sm"
              disabled={state.status !== 'online' || state.pending > 0}
              onClick={() =>
                setConfirm({
                  kind: 'restore',
                  body: {
                    snapshotId: preview.id,
                    expectedEpoch: board.epoch,
                    expectedSequence: board.sequence,
                    expectedControlVersion: board.controlVersion,
                  },
                })
              }
            >
              Khôi phục mốc này
            </Button>
          </section>
        )}
      </div>
      <input
        ref={fileInput}
        className="sr-only"
        type="file"
        accept={cap.canImportPdf ? 'image/png,image/jpeg,application/pdf' : 'image/png,image/jpeg'}
        aria-label="Chọn tệp cho bảng"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) chooseFile(file);
        }}
      />
      {history && (
        <Modal
          title="Lịch sử mốc lưu"
          onClose={() => setHistory(false)}
          contentClassName="whiteboard-dialog"
        >
          <div className="space-y-4 p-5">
            {snapshots.isPending ? (
              <p role="status">Đang tải lịch sử…</p>
            ) : snapshots.isError ? (
              <>
                <p role="alert">Chưa tải được lịch sử.</p>
                <Button onClick={() => void snapshots.refetch()}>Thử lại</Button>
              </>
            ) : (
              <>
                {!snapshots.data.items.length && <p>Chưa có mốc lưu.</p>}
                {snapshots.data.items.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3"
                  >
                    <div>
                      <strong>
                        {s.reason === 'MANUAL'
                          ? 'Mốc thủ công'
                          : s.reason === 'SESSION_END'
                            ? 'Kết thúc buổi học'
                            : 'Trước khi thay nội dung'}
                      </strong>
                      <p className="text-sm">{new Date(s.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <Button variant="outline" onClick={() => void showPreview(s.id)}>
                      Xem trước
                    </Button>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <Button disabled={historyPage === 1} onClick={() => setHistoryPage((p) => p - 1)}>
                    Trước
                  </Button>
                  <span>Trang {historyPage}</span>
                  <Button
                    disabled={historyPage * 10 >= snapshots.data.total}
                    onClick={() => setHistoryPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal
          title={confirm.kind === 'reset' ? 'Xóa nội dung bảng?' : 'Khôi phục mốc lưu?'}
          onClose={() => {
            if (!command.isPending) {
              setConfirm(null);
              setMessage('');
              receipt.current = null;
            }
          }}
          contentClassName="whiteboard-dialog"
        >
          <div className="space-y-5 p-5">
            <p>
              Nội dung hiện tại sẽ được lưu thành mốc dự phòng. Những người đang mở bảng sẽ tải lại
              nội dung mới; thao tác chưa lưu của mốc cũ sẽ được bỏ.
            </p>
            {message && <p role="alert">{message}</p>}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                disabled={command.isPending}
                onClick={() => {
                  setConfirm(null);
                  receipt.current = null;
                  setMessage('');
                }}
              >
                Hủy
              </Button>
              <Button
                disabled={command.isPending}
                onClick={() => {
                  setMessage('');
                  void command
                    .mutateAsync({
                      path: confirm.kind === 'reset' ? 'resets' : 'restores',
                      body: confirm.body,
                      schema: boardMetadataSchema,
                    })
                    .then(() => {
                      setConfirm(null);
                      setPreview(null);
                      setMessage('Đã thay nội dung bảng và lưu mốc dự phòng.');
                    })
                    .catch(() => {});
                }}
              >
                {command.isPending ? 'Đang thực hiện…' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {exportDialog && (
        <Modal
          title="Xuất bảng thành file"
          onClose={() => setExportDialog(false)}
          contentClassName="whiteboard-dialog"
        >
          <div className="space-y-5 p-5">
            <p>
              File nền trắng, không gồm lưới, con trỏ hoặc khung chọn. PDF có một trang theo vùng
              xuất.
            </p>
            <label className="block">
              Định dạng
              <select
                className="ml-3"
                value={format}
                onChange={(e) => setFormat(e.target.value === 'PDF' ? 'PDF' : 'PNG')}
              >
                <option>PNG</option>
                <option disabled={!cap.canExportPdf}>PDF</option>
              </select>
            </label>
            <label className="block">
              Phạm vi
              <select
                className="ml-3"
                value={scope}
                onChange={(e) => setScope(e.target.value === 'CONTENT' ? 'CONTENT' : 'VIEWPORT')}
              >
                <option value="CONTENT">Toàn bộ nội dung</option>
                <option value="VIEWPORT">Vùng đang xem</option>
              </select>
            </label>
            <Button
              disabled={media.busy || state.pending > 0}
              onClick={() => {
                void media.exportFile(board, format, scope, view, size);
                setExportDialog(false);
              }}
            >
              Tạo file xuất
            </Button>
          </div>
        </Modal>
      )}
      {pdf && (
        <Modal
          title="Chọn trang PDF"
          onClose={() => setPdf(null)}
          contentClassName="whiteboard-dialog"
        >
          <form
            className="space-y-5 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              const chosen = pages.split(',').map((p) => Number(p.trim()));
              if (
                chosen.length < 1 ||
                chosen.length > 10 ||
                new Set(chosen).size !== chosen.length ||
                chosen.some((n) => !Number.isInteger(n) || n < 1 || n > 100)
              ) {
                setMessage('Chọn tối đa 10 trang khác nhau từ 1 đến 100.');
                return;
              }
              void media.uploadFile(pdf, chosen);
              setPdf(null);
            }}
          >
            <p>{pdf.name} · Tối đa 10 trang; tệp tối đa 10 MiB.</p>
            <label className="block">
              Trang cần thêm, phân cách bằng dấu phẩy
              <input
                required
                className="mt-2 w-full rounded-lg border border-line p-3"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="1, 2, 5"
              />
            </label>
            <Button type="submit">Tải và xử lý trang</Button>
          </form>
        </Modal>
      )}
      {help && (
        <Modal
          title="Dùng bảng vẽ Mindy"
          onClose={() => setHelp(false)}
          contentClassName="whiteboard-dialog"
        >
          <div className="space-y-4 p-5">
            <p>V: chọn · P: bút · E: tẩy cả nét · H: di chuyển.</p>
            <p>
              Cuộn để phóng quanh con trỏ. Trên màn hình cảm ứng: hai ngón để di chuyển và
              thu/phóng.
            </p>
            <p>
              Nhấp đúp ghi chú hoặc chọn rồi bấm Sửa. Ctrl Enter để kết thúc sửa; hỗ trợ gõ tiếng
              Việt.
            </p>
            <p>
              Chọn phần tử từ menu để dùng bàn phím: phím mũi tên di chuyển, Shift để bước dài,
              Enter sửa, Delete xóa.
            </p>
            <p>Ctrl Z hoàn tác thao tác của phiên này. Ctrl Shift Z hoặc Ctrl Y làm lại.</p>
            <p>
              Đã lưu nghĩa là hệ thống đã xác nhận nội dung. Khi mất kết nối, chờ nối lại trước khi
              vẽ tiếp.
            </p>
            <p>
              Mentor có thể dán PNG/JPEG hoặc tải tệp. Lưu mốc để khôi phục; xuất PNG/PDF để tải
              file.
            </p>
          </div>
        </Modal>
      )}
    </main>
  );
}
