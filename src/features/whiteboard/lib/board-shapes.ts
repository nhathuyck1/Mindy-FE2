import * as Y from 'yjs';
import { boardProjectionSchema, type BoardShape } from '../schemas/whiteboard-contracts';
export const LOCAL_BOARD_ORIGIN = Symbol('local-board');
export function readShapes(doc: Y.Doc): BoardShape[] {
  return boardProjectionSchema.parse(
    [...doc.getMap<Y.Map<unknown>>('shapes').values()].map((s) => s.toJSON()),
  );
}
export function addShape(doc: Y.Doc, value: BoardShape): void {
  doc.transact(() => {
    const shape = new Y.Map<unknown>();
    for (const [k, v] of Object.entries(value))
      shape.set(k, k === 'text' ? new Y.Text(String(v)) : v);
    doc.getMap('shapes').set(value.id, shape);
  }, LOCAL_BOARD_ORIGIN);
}
export function moveShape(doc: Y.Doc, id: string, x: number, y: number): void {
  const shape = doc.getMap<Y.Map<unknown>>('shapes').get(id);
  if (!shape) return;
  doc.transact(() => {
    shape.set('x', Math.max(-100000, Math.min(100000, x)));
    shape.set('y', Math.max(-100000, Math.min(100000, y)));
  }, LOCAL_BOARD_ORIGIN);
}
export function resizeShape(
  doc: Y.Doc,
  id: string,
  box: { x: number; y: number; width: number; height: number },
): void {
  const shape = doc.getMap<Y.Map<unknown>>('shapes').get(id);
  if (!shape) return;
  doc.transact(() => {
    shape.set('x', Math.max(-100000, Math.min(100000, Math.round(box.x))));
    shape.set('y', Math.max(-100000, Math.min(100000, Math.round(box.y))));
    shape.set('width', Math.max(1, Math.min(10000, Math.round(box.width))));
    shape.set('height', Math.max(1, Math.min(10000, Math.round(box.height))));
  }, LOCAL_BOARD_ORIGIN);
}
export function replaceText(doc: Y.Doc, id: string, next: string): void {
  const text = doc.getMap<Y.Map<unknown>>('shapes').get(id)?.get('text');
  if (!(text instanceof Y.Text)) return;
  const previous = text.toString();
  let start = 0;
  while (start < previous.length && start < next.length && previous[start] === next[start]) start++;
  let end = previous.length,
    nextEnd = next.length;
  while (end > start && nextEnd > start && previous[end - 1] === next[nextEnd - 1]) {
    end--;
    nextEnd--;
  }
  doc.transact(() => {
    if (end > start) text.delete(start, end - start);
    if (nextEnd > start) text.insert(start, next.slice(start, nextEnd));
  }, LOCAL_BOARD_ORIGIN);
}
export function removeShape(doc: Y.Doc, id: string): void {
  doc.transact(() => doc.getMap('shapes').delete(id), LOCAL_BOARD_ORIGIN);
}
export function distanceToSegment(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const dx = x2 - x1,
    dy = y2 - y1,
    t =
      dx === 0 && dy === 0
        ? 0
        : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - x1 - t * dx, y - y1 - t * dy);
}
export function eraseAt(doc: Y.Doc, x: number, y: number, radius = 12): void {
  const ids = readShapes(doc).flatMap((s) => {
    if (s.type !== 'stroke') return [];
    for (let i = 0; i < s.points.length - 2; i += 2) {
      if (
        distanceToSegment(
          x - s.x,
          y - s.y,
          s.points[i],
          s.points[i + 1],
          s.points[i + 2],
          s.points[i + 3],
        ) <=
        radius + s.strokeWidth / 2
      )
        return [s.id];
    }
    return [];
  });
  doc.transact(() => {
    ids.forEach((id) => doc.getMap('shapes').delete(id));
  }, LOCAL_BOARD_ORIGIN);
}
export function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
export function fromBase64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
export interface BoardView {
  x: number;
  y: number;
  scale: number;
}
export const worldPoint = (view: BoardView, x: number, y: number) => ({
  x: (x - view.x) / view.scale,
  y: (y - view.y) / view.scale,
});
export function zoomAt(view: BoardView, x: number, y: number, scale: number): BoardView {
  const point = worldPoint(view, x, y);
  const next = Math.max(0.1, Math.min(4, scale));
  return { x: x - point.x * next, y: y - point.y * next, scale: next };
}
