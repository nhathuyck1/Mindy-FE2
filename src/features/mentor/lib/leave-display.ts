export const leavePeriods: Record<string, string> = {
  MORNING: 'Buổi sáng',
  AFTERNOON: 'Buổi chiều',
  EVENING: 'Buổi tối',
  FULL_DAY: 'Cả ngày',
};
export const leaveStatuses: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  WITHDRAWN: 'Đã rút',
  EXPIRED: 'Hết hạn',
};
export function localDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export function makeupMinDate(
  asOf: string,
  timeZone: string,
  now = Date.now(),
  leave?: { period: string; toDate: string; sourceStartsAt: string },
) {
  const today = localDate(new Date(Math.max(Date.parse(asOf), now)).toISOString(), timeZone);
  if (!leave) return today;
  // A full-day range blocks every clock until the end of its final day.
  const afterLeave = new Date(`${leave.toDate}T00:00:00Z`);
  afterLeave.setUTCDate(afterLeave.getUTCDate() + 1);
  const earliest =
    leave.period === 'FULL_DAY'
      ? afterLeave.toISOString().slice(0, 10)
      : localDate(leave.sourceStartsAt, timeZone);
  return earliest > today ? earliest : today;
}

export function leaveClock(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
}
