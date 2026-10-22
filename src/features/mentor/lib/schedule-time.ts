const MINUTE_MS = 60_000;
const VIETNAM_OFFSET_MS = 7 * 60 * MINUTE_MS;

export function minimumScheduleInput(now: number): string {
  const nextMinute = Math.ceil(now / MINUTE_MS) * MINUTE_MS;
  return new Date(nextMinute + VIETNAM_OFFSET_MS).toISOString().slice(0, 16);
}
