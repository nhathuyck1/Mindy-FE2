import { describe, expect, it } from 'vitest';
import { outsideLeave, overlaps, withinTeachingShift, type LeaveWindow } from './leave-makeup';
import { createLeaveInputSchema } from '../schemas/leave-contracts';

const leave: LeaveWindow = {
  fromDate: '2026-11-02',
  toDate: '2026-11-03',
  period: 'FULL_DAY',
  timeZone: 'Asia/Ho_Chi_Minh',
};
const slot = (day: string, from: string, to: string) => ({
  startsAt: `${day}T${from}:00+07:00`,
  endsAt: `${day}T${to}:00+07:00`,
});
describe('Makeup leave boundaries', () => {
  it('keeps makeup inside teaching shifts, including boundaries and UTC input', () => {
    for (const [from, to] of [
      ['07:30', '09:00'],
      ['09:30', '11:00'],
      ['13:00', '15:30'],
      ['16:00', '17:30'],
      ['18:00', '19:30'],
      ['20:00', '21:30'],
    ]) {
      expect(withinTeachingShift(slot('2026-11-10', from, to), leave.timeZone)).toBe(true);
    }
    for (const [from, to] of [
      ['00:00', '02:00'],
      ['07:15', '08:45'],
      ['08:00', '10:00'],
      ['19:00', '21:00'],
      ['20:00', '22:00'],
      ['23:00', '01:00'],
    ]) {
      expect(withinTeachingShift(slot('2026-11-10', from, to), leave.timeZone)).toBe(false);
    }
    expect(
      withinTeachingShift(
        { startsAt: '2026-11-10T00:30:00Z', endsAt: '2026-11-10T02:00:00Z' },
        leave.timeZone,
      ),
    ).toBe(true);
  });
  it('blocks all days in the full-day leave range and allows a later week', () => {
    expect(outsideLeave(slot('2026-11-02', '15:00', '17:00'), leave)).toBe(false);
    expect(outsideLeave(slot('2026-11-03', '19:00', '21:00'), leave)).toBe(false);
    expect(outsideLeave(slot('2026-11-10', '15:00', '17:00'), leave)).toBe(true);
  });
  it('permits same-day makeup exactly outside the partial leave, blocking any overlap', () => {
    expect(
      outsideLeave(slot('2026-11-02', '12:00', '14:00'), { ...leave, period: 'MORNING' }),
    ).toBe(true);
    expect(
      outsideLeave(slot('2026-11-02', '11:45', '13:45'), { ...leave, period: 'MORNING' }),
    ).toBe(false);
    expect(
      outsideLeave(slot('2026-11-03', '16:00', '18:00'), { ...leave, period: 'EVENING' }),
    ).toBe(true);
    expect(
      outsideLeave(slot('2026-11-03', '17:00', '19:00'), { ...leave, period: 'EVENING' }),
    ).toBe(false);
  });
  it('handles UTC timestamps at local midnight and adjacent makeup slots', () => {
    expect(
      outsideLeave({ startsAt: '2026-11-01T17:00:00Z', endsAt: '2026-11-01T19:00:00Z' }, leave),
    ).toBe(false);
    expect(
      overlaps(slot('2026-11-10', '08:00', '10:00'), slot('2026-11-10', '10:00', '12:00')),
    ).toBe(false);
    expect(
      overlaps(slot('2026-11-10', '08:00', '10:00'), slot('2026-11-10', '09:45', '11:45')),
    ).toBe(true);
  });
  it('accepts full-day session mappings at the proxy boundary but rejects mixed mapping formats', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const input = {
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      period: leave.period,
      reason: 'Việc riêng',
      sourceVersions: [{ sessionId: id, version: 1 }],
      sessionMappings: [
        {
          sourceSessionId: id,
          targetDate: '2026-11-10',
          targetPeriod: 'FULL_DAY',
          ...slot('2026-11-10', '15:00', '17:00'),
        },
      ],
    };
    expect(createLeaveInputSchema.safeParse(input).success).toBe(true);
    expect(
      createLeaveInputSchema.safeParse({
        ...input,
        dayMappings: [{ sourceDate: leave.fromDate, targetDate: '2026-11-10' }],
      }).success,
    ).toBe(false);
  });
});
