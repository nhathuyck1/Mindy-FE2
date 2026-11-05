export const teachingSlots = [
  { number: 1, start: 450, end: 540 },
  { number: 2, start: 570, end: 660 },
  { number: 3, start: 720, end: 840 },
  { number: 4, start: 780, end: 930 },
  { number: 5, start: 960, end: 1050 },
  { number: 6, start: 1080, end: 1170 },
  { number: 7, start: 1200, end: 1290 },
] as const;

export function isTeachingSlot(
  startsAt: string,
  endsAt: string,
  timeZone: string,
  catalogue: readonly { start: number; end: number }[] = teachingSlots,
) {
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const minutes = (value: string) => {
    const [hour, minute] = clock.format(new Date(value)).split(':').map(Number);
    return hour * 60 + minute;
  };
  return catalogue.some(
    (slot) =>
      minutes(startsAt) === slot.start &&
      minutes(endsAt) === slot.end &&
      Date.parse(endsAt) - Date.parse(startsAt) === (slot.end - slot.start) * 60000 &&
      Date.parse(startsAt) % 60000 === 0,
  );
}
