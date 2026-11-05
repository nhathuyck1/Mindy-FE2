import { describe, expect, it } from 'vitest';
import { hasOverlappingMakeupSlots, makeupSlotsOverlap } from './leave-makeup';

const slot = { startsAt: '2026-11-15T19:15:00+07:00', endsAt: '2026-11-15T21:15:00+07:00' };
describe('proposed makeup conflicts', () => {
  it.each([
    ['identical', '2026-11-15T19:15:00+07:00', '2026-11-15T21:15:00+07:00'],
    ['partial overlap', '2026-11-15T20:00:00+07:00', '2026-11-15T22:00:00+07:00'],
    ['contained', '2026-11-15T20:00:00+07:00', '2026-11-15T20:30:00+07:00'],
    ['different timezone notation', '2026-11-15T12:15:00Z', '2026-11-15T14:15:00Z'],
  ])('blocks %s times', (_name, startsAt, endsAt) => {
    const other = { startsAt, endsAt };
    expect(makeupSlotsOverlap(slot, other)).toBe(true);
    expect(makeupSlotsOverlap(other, slot)).toBe(true);
    expect(hasOverlappingMakeupSlots([slot, other])).toBe(true);
  });
  it('allows adjacent slots and the same clock on different dates', () => {
    const slots = [
      slot,
      { startsAt: '2026-11-15T17:15:00+07:00', endsAt: slot.startsAt },
      { startsAt: slot.endsAt, endsAt: '2026-11-15T23:15:00+07:00' },
      { startsAt: '2026-11-16T19:15:00+07:00', endsAt: '2026-11-16T21:15:00+07:00' },
    ];
    expect(hasOverlappingMakeupSlots(slots)).toBe(false);
    expect(hasOverlappingMakeupSlots([])).toBe(false);
    expect(hasOverlappingMakeupSlots([slot])).toBe(false);
  });
});
