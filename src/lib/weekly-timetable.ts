const dayMs = 86400000;
export const teachingShifts = [
  { number: 1, start: 450, end: 540 },
  { number: 2, start: 570, end: 660 },
  { number: 3, start: 780, end: 930 },
  { number: 4, start: 960, end: 1050 },
  { number: 5, start: 1080, end: 1170 },
  { number: 6, start: 1200, end: 1290 },
];
export function vietnamDate(value: Date | string = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}
export function shiftDate(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * dayMs).toISOString().slice(0, 10);
}
export function weekStart(date: string) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return shiftDate(date, -((weekday + 6) % 7));
}
export function shortDate(date: string) {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}
export function calendarDate(date: string) {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
}
export function parseCalendarDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match || Number(match[3]) < 2 || Number(match[3]) > 9998) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}
export function slotTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
export function sessionTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
}
export function buildWeeklyTimetable<
  T extends { sessionId: string; startsAt: string; endsAt: string },
>(sessions: T[], monday: string) {
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(monday, index));
  type Slot = {
    number: number | null;
    start: number | null;
    end: number | null;
    days: T[][];
  };
  const slots: Slot[] = teachingShifts.map((slot) => ({ ...slot, days: days.map((): T[] => []) }));
  const outside: Slot = { number: null, start: null, end: null, days: days.map(() => []) };
  for (const session of sessions) {
    for (const [index, day] of days.entries()) {
      const start = Date.parse(`${day}T00:00:00+07:00`);
      const end = start + dayMs;
      const sessionStart = Date.parse(session.startsAt);
      const sessionEnd = Date.parse(session.endsAt);
      if (sessionStart >= end || sessionEnd <= start) continue;
      const from = Math.floor((Math.max(start, sessionStart) - start) / 60000);
      const to = Math.ceil((Math.min(end, sessionEnd) - start) / 60000);
      // Prefer the slot containing the start. A lesson beginning in a break uses
      // the slot with the most overlap, while keeping its actual BE times.
      let target = slots.find(
        (slot) => slot.start !== null && slot.end !== null && from >= slot.start && from < slot.end,
      );
      if (!target) {
        let longestOverlap = 0;
        for (const slot of slots) {
          if (slot.start === null || slot.end === null) continue;
          const overlap = Math.min(to, slot.end) - Math.max(from, slot.start);
          if (overlap > longestOverlap) {
            target = slot;
            longestOverlap = overlap;
          }
        }
      }
      (target ?? outside).days[index].push(session);
    }
  }
  if (outside.days.some((items) => items.length > 0)) slots.push(outside);
  return {
    days,
    slots: slots.map((slot) => ({
      ...slot,
      days: slot.days.map((items) =>
        items.sort(
          (a, b) =>
            Date.parse(a.startsAt) - Date.parse(b.startsAt) ||
            a.sessionId.localeCompare(b.sessionId),
        ),
      ),
    })),
  };
}

export function shortClassCode(code: string) {
  return code.replace(/-\d+S-\d{8}$/, '');
}
