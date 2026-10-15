import { describe, expect, it } from 'vitest';
import { scheduleWeek, shiftDate, vietnamToday } from './schedule-week';
import { myScheduleFiltersSchema } from '../schemas/user-contracts';
describe('Vietnam weekly calendar boundary', () => {
  it('Keeps Sunday in the same Monday–Sunday week, independent of host timezone', () => {
    expect(scheduleWeek('2026-10-18')).toEqual({
      from: '2026-10-11T17:00:00.000Z',
      to: '2026-10-18T17:00:00.000Z',
    });
    expect(vietnamToday(new Date('2026-10-11T17:00:00Z'))).toBe('2026-10-12');
    expect(shiftDate('2026-01-01', -7)).toBe('2025-12-25');
  });
  it('Rejects reversed, excessive or unzoned API ranges', () => {
    for (const input of [
      { from: '2026-10-12', to: '2026-10-19' },
      { from: '2026-10-12T00:00:00Z', to: '2026-10-11T00:00:00Z' },
      { from: '2026-10-12T00:00:00Z', to: '2026-11-13T00:00:00Z' },
    ])
      expect(myScheduleFiltersSchema.safeParse(input).success).toBe(false);
    expect(myScheduleFiltersSchema.safeParse(scheduleWeek('2026-10-18')).success).toBe(true);
  });
});
