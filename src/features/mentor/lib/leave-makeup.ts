import { localDate } from './leave-display';
import { teachingShifts } from '@/lib/weekly-timetable';

type Interval = { startsAt: string; endsAt: string };
export type LeaveWindow = {
  fromDate: string;
  toDate: string;
  period: string;
  timeZone: string;
};

export function overlaps(a: Interval, b: Interval) {
  return (
    Date.parse(a.startsAt) < Date.parse(b.endsAt) && Date.parse(b.startsAt) < Date.parse(a.endsAt)
  );
}

export function localClock(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
}

export function withinTeachingShift(slot: Interval, timeZone: string) {
  if (
    Date.parse(slot.endsAt) <= Date.parse(slot.startsAt) ||
    localDate(slot.startsAt, timeZone) !== localDate(slot.endsAt, timeZone)
  )
    return false;
  const seconds = (value: string) => {
    const [hours, minutes, seconds] = localClock(value, timeZone).split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };
  const start = seconds(slot.startsAt);
  const end = seconds(slot.endsAt);
  return teachingShifts.some((shift) => start >= shift.start * 60 && end <= shift.end * 60);
}

export function outsideLeave(slot: Interval, leave: LeaveWindow) {
  // Compare wall-clock timestamps in the server's timezone, including sessions crossing midnight.
  const stamp = (value: string) =>
    Date.parse(`${localDate(value, leave.timeZone)}T${localClock(value, leave.timeZone)}Z`);
  const start = stamp(slot.startsAt),
    end = stamp(slot.endsAt);
  const hours: Record<string, [number, number]> = {
    MORNING: [0, 12],
    AFTERNOON: [12, 18],
    EVENING: [18, 24],
    FULL_DAY: [0, 24],
  };
  const [from, to] = hours[leave.period] ?? [0, 24];
  for (
    let day = Date.parse(`${leave.fromDate}T00:00:00Z`);
    day <= Date.parse(`${leave.toDate}T00:00:00Z`);
    day += 86400000
  ) {
    if (start < day + to * 3600000 && end > day + from * 3600000) return false;
  }
  return true;
}
