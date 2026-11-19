import type { PresenterViewport } from '../schemas/whiteboard-contracts';
import type { BoardView } from './board-shapes';

/** Fit the whole instructor FOV, centered even when the student uses a narrow screen. */
export function presenterView(
  viewport: PresenterViewport,
  size: { width: number; height: number },
): BoardView {
  const scale =
    viewport.scale * Math.min(size.width / viewport.width, size.height / viewport.height);
  return {
    scale,
    x: size.width / 2 - (viewport.x + viewport.width / viewport.scale / 2) * scale,
    y: size.height / 2 - (viewport.y + viewport.height / viewport.scale / 2) * scale,
  };
}
