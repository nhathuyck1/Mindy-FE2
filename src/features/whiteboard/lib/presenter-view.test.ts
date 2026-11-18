import { describe, expect, it } from 'vitest';
import { presenterView } from './presenter-view';

describe('follow presenter FOV', () => {
  const viewport = {
    epoch: '11111111-1111-4111-8111-111111111111',
    x: -500,
    y: 250,
    width: 1440,
    height: 900,
    scale: 1.5,
  };
  it.each([
    { width: 320, height: 600 },
    { width: 1920, height: 1080 },
  ])('fits all FOV corners and centers the instructor view at %j', (size) => {
    const view = presenterView(viewport, size);
    const left = viewport.x * view.scale + view.x;
    const top = viewport.y * view.scale + view.y;
    const right = (viewport.x + viewport.width / viewport.scale) * view.scale + view.x;
    const bottom = (viewport.y + viewport.height / viewport.scale) * view.scale + view.y;
    expect(left).toBeGreaterThanOrEqual(-0.00001);
    expect(top).toBeGreaterThanOrEqual(-0.00001);
    expect(right).toBeLessThanOrEqual(size.width + 0.00001);
    expect(bottom).toBeLessThanOrEqual(size.height + 0.00001);
    expect((left + right) / 2).toBeCloseTo(size.width / 2);
    expect((top + bottom) / 2).toBeCloseTo(size.height / 2);
  });
});
