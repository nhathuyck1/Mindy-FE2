type MakeupInterval = { startsAt: string; endsAt: string };

export function makeupSlotsOverlap(first: MakeupInterval, second: MakeupInterval) {
  return (
    Date.parse(first.startsAt) < Date.parse(second.endsAt) &&
    Date.parse(first.endsAt) > Date.parse(second.startsAt)
  );
}

export function hasOverlappingMakeupSlots(slots: readonly MakeupInterval[]) {
  return slots.some((slot, index) =>
    slots.slice(index + 1).some((other) => makeupSlotsOverlap(slot, other)),
  );
}
