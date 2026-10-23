import type { ScheduleEvent } from '../schemas/user-contracts';

export function scheduleAttendanceLabel(event: ScheduleEvent) {
  if (event.attendanceStatus === 'PRESENT') return 'Có mặt';
  if (event.attendanceStatus === 'ABSENT') return 'Vắng';
  return event.sessionStatus === 'SCHEDULED' ? 'Chưa bắt đầu' : 'Chưa điểm danh';
}
