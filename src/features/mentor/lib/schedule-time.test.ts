import { describe, expect, it } from 'vitest';
import { keepSavedMinimum, minimumScheduleInput } from './schedule-time';

describe('schedule-time', () => {
  it('rounds up to the next Vietnam minute', () => {
    expect(minimumScheduleInput(Date.parse('2026-11-19T16:20:30Z'))).toBe('2026-11-19T23:21');
  });
  it('keeps a saved past value as the minimum, else uses the minimum', () => {
    expect(keepSavedMinimum('', '2026-11-19')).toBe('2026-11-19');
    expect(keepSavedMinimum('2026-11-01', '2026-11-19')).toBe('2026-11-01');
    expect(keepSavedMinimum('2026-12-01', '2026-11-19')).toBe('2026-11-19');
    expect(keepSavedMinimum('2026-11-01T08:00', '2026-11-19T23:21')).toBe('2026-11-01T08:00');
  });
});
