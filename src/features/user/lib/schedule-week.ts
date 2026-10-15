const dayMs = 86400000;
export function vietnamToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function scheduleWeek(date: string) {
  const start = new Date(date + 'T00:00:00+07:00');
  const weekday = new Date(start.getTime() + 7 * 3600000).getUTCDay();
  start.setTime(start.getTime() - ((weekday + 6) % 7) * dayMs);
  return { from: start.toISOString(), to: new Date(start.getTime() + 7 * dayMs).toISOString() };
}
export function shiftDate(date: string, days: number) {
  return vietnamToday(new Date(new Date(date + 'T00:00:00+07:00').getTime() + days * dayMs));
}
