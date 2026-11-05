import { describe, expect, it } from 'vitest';
import { createLeaveInputSchema, leaveSlotsInputSchema } from './leave-contracts';

const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'];
const mappings = ids.map((id, index) => ({
  sourceSessionId: id,
  targetDate: `2026-11-${10 + index}`,
  targetPeriod: 'FULL_DAY',
  startsAt: `2026-11-${10 + index}T08:00:00+07:00`,
  endsAt: `2026-11-${10 + index}T10:00:00+07:00`,
}));
const input = {
  fromDate: '2026-11-07',
  toDate: '2026-11-07',
  period: 'FULL_DAY',
  reason: 'Việc gia đình',
  sourceVersions: ids.map((sessionId) => ({ sessionId, version: 1 })),
  sessionMappings: mappings,
};

describe('per-session leave mapping contract', () => {
  it('allows independent dates and clocks for full-day leave and all-day slot discovery', () => {
    expect(createLeaveInputSchema.parse(input).sessionMappings).toEqual(mappings);
    expect(
      leaveSlotsInputSchema.safeParse({
        sourceSessionId: ids[0],
        targetDate: '2026-11-10',
        targetPeriod: 'FULL_DAY',
      }).success,
    ).toBe(true);
  });
  it('preserves legacy full-day mappings and rejects mixing the two mapping modes', () => {
    const dayMappings = [{ sourceDate: '2026-11-07', targetDate: '2026-11-10' }];
    expect(
      createLeaveInputSchema.safeParse({ ...input, sessionMappings: undefined, dayMappings })
        .success,
    ).toBe(true);
    expect(createLeaveInputSchema.safeParse({ ...input, dayMappings }).success).toBe(false);
    expect(createLeaveInputSchema.safeParse({ ...input, sessionMappings: [] }).success).toBe(false);
    expect(
      createLeaveInputSchema.safeParse({
        ...input,
        period: 'MORNING',
        sessionMappings: undefined,
        dayMappings,
      }).success,
    ).toBe(false);
  });
});
