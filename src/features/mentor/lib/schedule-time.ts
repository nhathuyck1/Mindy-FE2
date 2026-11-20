const MINUTE_MS = 60_000;
const VIETNAM_OFFSET_MS = 7 * 60 * MINUTE_MS;

export function minimumScheduleInput(now: number): string {
  const nextMinute = Math.ceil(now / MINUTE_MS) * MINUTE_MS;
  return new Date(nextMinute + VIETNAM_OFFSET_MS).toISOString().slice(0, 16);
}

/** Next minute as a datetime-local value in the browser's own time zone. */
export function minimumLocalInput(now: number): string {
  const nextMinute = Math.ceil(now / MINUTE_MS) * MINUTE_MS;
  const offset = new Date(nextMinute).getTimezoneOffset() * MINUTE_MS;
  return new Date(nextMinute - offset).toISOString().slice(0, 16);
}

/** Lets an already-saved past value submit unchanged; otherwise nothing before `minimum`. */
export function keepSavedMinimum(saved: string, minimum: string): string {
  return saved && saved < minimum ? saved : minimum;
}
