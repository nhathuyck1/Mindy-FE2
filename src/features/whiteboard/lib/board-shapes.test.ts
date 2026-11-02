import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import {
  addShape,
  readShapes,
  replaceText,
  resizeShape,
  LOCAL_BOARD_ORIGIN,
  worldPoint,
  zoomAt,
  eraseAt,
} from './board-shapes';
const first = '11111111-1111-4111-8111-111111111111',
  second = '22222222-2222-4222-8222-222222222222';
describe('whiteboard editing semantics', () => {
  it('preserves Vietnamese text and scopes undo to this editor origin', () => {
    const a = new Y.Doc(),
      b = new Y.Doc(),
      undo = new Y.UndoManager(a.getMap('shapes'), {
        trackedOrigins: new Set([LOCAL_BOARD_ORIGIN]),
        captureTimeout: 0,
      });
    addShape(a, {
      id: first,
      type: 'sticky',
      x: 0,
      y: 0,
      width: 220,
      height: 150,
      color: '#f9d85f',
      text: 'Tiếng Việt',
    });
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a), 'remote');
    addShape(b, {
      id: second,
      type: 'sticky',
      x: 100,
      y: 100,
      width: 220,
      height: 150,
      color: '#f9d85f',
      text: 'Của bạn',
    });
    Y.applyUpdate(a, Y.encodeStateAsUpdate(b), 'remote');
    replaceText(a, first, 'Tiếng Việt: chào bạn');
    undo.undo();
    expect(readShapes(a).find((s) => s.id === first)).toMatchObject({ text: 'Tiếng Việt' });
    undo.undo();
    expect(readShapes(a)).toEqual([expect.objectContaining({ id: second, text: 'Của bạn' })]);
    undo.destroy();
    a.destroy();
    b.destroy();
  });
  it('keeps pointer world coordinates fixed when zooming after pan', () => {
    const view = { x: -180, y: 90, scale: 1.7 },
      pointer = { x: 315, y: 220 },
      world = worldPoint(view, pointer.x, pointer.y);
    const next = zoomAt(view, pointer.x, pointer.y, 2.4);
    expect(worldPoint(next, pointer.x, pointer.y).x).toBeCloseTo(world.x);
    expect(worldPoint(next, pointer.x, pointer.y).y).toBeCloseTo(world.y);
  });
  it('eraser removes an intersected whole stroke at its translated location', () => {
    const doc = new Y.Doc();
    addShape(doc, {
      id: first,
      type: 'stroke',
      x: 200,
      y: 300,
      width: 1,
      height: 1,
      color: '#338a85',
      strokeWidth: 4,
      points: [0, 0, 100, 100],
    });
    eraseAt(doc, 20, 20);
    expect(readShapes(doc)).toHaveLength(1);
    eraseAt(doc, 250, 350);
    expect(readShapes(doc)).toHaveLength(0);
    doc.destroy();
  });
  it('resizes a shape and undoes the resize operation', () => {
    const doc = new Y.Doc(),
      undo = new Y.UndoManager(doc.getMap('shapes'), {
        trackedOrigins: new Set([LOCAL_BOARD_ORIGIN]),
        captureTimeout: 0,
      });
    addShape(doc, {
      id: first,
      type: 'ellipse',
      x: 50,
      y: 60,
      width: 160,
      height: 160,
      color: '#338a85',
      fill: 'transparent',
      strokeWidth: 4,
    });
    resizeShape(doc, first, { x: 40, y: 50, width: 200, height: 220 });
    const resized = readShapes(doc).find((s) => s.id === first);
    expect(resized).toMatchObject({ x: 40, y: 50, width: 200, height: 220 });
    undo.undo();
    const reverted = readShapes(doc).find((s) => s.id === first);
    expect(reverted).toMatchObject({ x: 50, y: 60, width: 160, height: 160 });
    undo.destroy();
    doc.destroy();
  });
});
