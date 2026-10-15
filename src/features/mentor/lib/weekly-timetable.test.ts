import { describe, expect, it } from 'vitest';
import { teachingSessionSchema } from '../schemas/mentor-contracts';
import {
  buildWeeklyTimetable,
  vietnamDate,
  weekStart,
  calendarDate,
  parseCalendarDate,
} from './weekly-timetable';

function calendarSession(id: number, startsAt: string, endsAt: string) {
  const uuid = `10000000-0000-4000-8000-${String(id).padStart(12, '0')}`;
  const person = { id: uuid, displayName: 'Mentor' };
  return teachingSessionSchema.parse({
    sessionId: uuid,
    classId: uuid,
    classUnitId: uuid,
    title: `Buổi ${id}`,
    startsAt,
    endsAt,
    status: 'SCHEDULED',
    primaryMentor: person,
    effectiveMentor: person,
    assignmentType: 'PRIMARY',
    version: 1,
    actualStartedAt: null,
    actualEndedAt: null,
    editableUntil: null,
    asOf: startsAt,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}
describe('weekly teaching timetable', () => {
  it('shows dd/mm/yyyy and rejects invalid calendar dates before selecting a week', () => {
    expect(calendarDate('2026-10-12')).toBe('12/10/2026');
    expect(parseCalendarDate('28/10/2026')).toBe('2026-10-28');
    expect(parseCalendarDate('29/02/2028')).toBe('2028-02-29');
    expect(parseCalendarDate('29/02/2026')).toBeNull();
    expect(parseCalendarDate('31/04/2026')).toBeNull();
    expect(parseCalendarDate('10/28/2026')).toBeNull();
  });
  it('finds Monday across year boundaries and groups by Vietnam calendar days', () => {
    expect(vietnamDate('2026-10-11T18:00:00Z')).toBe('2026-10-12');
    expect(weekStart('2027-01-03')).toBe('2026-12-28');
    const result = buildWeeklyTimetable(
      [calendarSession(1, '2026-10-11T18:00:00Z', '2026-10-11T19:00:00Z')],
      '2026-10-12',
    );
    expect(result.days).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ]);
    expect(result.slots.find((slot) => slot.number === null)?.days[0]).toHaveLength(1);
    expect(result.slots.find((slot) => slot.number === null)?.days[6]).toHaveLength(0);
  });
  it('preserves simultaneous sessions and shows both parts of an overnight lesson', () => {
    const first = calendarSession(1, '2026-10-13T09:30:00+07:00', '2026-10-13T11:45:00+07:00');
    const second = calendarSession(2, first.startsAt, first.endsAt);
    const overnight = calendarSession(3, '2026-10-18T23:00:00+07:00', '2026-10-19T01:00:00+07:00');
    const current = buildWeeklyTimetable([second, overnight, first], '2026-10-12');
    expect(current.slots[1].days[1].map((session) => session.sessionId)).toEqual([
      first.sessionId,
      second.sessionId,
    ]);
    expect(current.slots.find((slot) => slot.number === null)?.days[6]).toEqual([overnight]);
    const next = buildWeeklyTimetable([overnight], '2026-10-19');
    expect(next.slots.find((slot) => slot.number === null)?.days[0]).toEqual([overnight]);
  });
  it('keeps six fixed slots even when empty and assigns every configured start correctly', () => {
    const ranges = [
      ['07:30', '09:00'],
      ['09:30', '11:00'],
      ['13:00', '15:30'],
      ['16:00', '17:30'],
      ['18:00', '19:30'],
      ['20:00', '21:30'],
    ];
    const sessions = ranges.map(([start, end], index) =>
      calendarSession(index + 1, `2026-10-12T${start}:00+07:00`, `2026-10-12T${end}:00+07:00`),
    );
    expect(
      buildWeeklyTimetable([], '2026-10-12').slots.map((slot) => [
        slot.number,
        slot.start,
        slot.end,
      ]),
    ).toEqual([
      [1, 450, 540],
      [2, 570, 660],
      [3, 780, 930],
      [4, 960, 1050],
      [5, 1080, 1170],
      [6, 1200, 1290],
    ]);
    const result = buildWeeklyTimetable(sessions, '2026-10-12');
    expect(result.slots).toHaveLength(6);
    for (const [index, slot] of result.slots.entries())
      expect(slot.days[0]).toEqual([sessions[index]]);
  });
  it('uses overlap for starts in breaks without changing actual times or hiding out-of-slot lessons', () => {
    const afternoon = calendarSession(1, '2026-10-13T12:30:00+07:00', '2026-10-13T14:45:00+07:00');
    const morning = calendarSession(2, '2026-10-13T09:00:00+07:00', '2026-10-13T11:00:00+07:00');
    const outside = calendarSession(3, '2026-10-13T21:30:00+07:00', '2026-10-13T22:00:00+07:00');
    const result = buildWeeklyTimetable([afternoon, morning, outside], '2026-10-12');
    expect(result.slots[0].days[1]).toEqual([]);
    expect(result.slots[1].days[1]).toEqual([morning]);
    expect(result.slots[2].days[1][0].startsAt).toBe(afternoon.startsAt);
    expect(result.slots[5].days[1]).toEqual([]);
    expect(result.slots.find((slot) => slot.number === null)?.days[1]).toEqual([outside]);
  });
});
