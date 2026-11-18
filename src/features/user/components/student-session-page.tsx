'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatDate, formatTime, deliveryLabel } from '@/features/courses/lib/course-format';
import { useMySchedule } from '../api/user-queries';
import { scheduleWeek } from '../lib/schedule-week';
import { StudentSessionResources } from './student-session-resources';
import { UserDataState } from './user-data-state';
import type { ScheduleEvent } from '../schemas/user-contracts';

function attendanceLabel(event: ScheduleEvent) {
  const status = event.creditedAttendanceStatus ?? event.attendanceStatus;
  if (event.attendanceExcluded) return 'Không tính điểm danh';
  if (status === 'PRESENT')
    return event.attendanceApplicability === 'MAKEUP_CREDITED' ? 'Có mặt (học bù)' : 'Có mặt';
  if (status === 'ABSENT') return 'Vắng';
  return {
    ELIGIBLE: 'Chưa điểm danh',
    NOT_STARTED: 'Buổi học chưa bắt đầu',
    NOT_ELIGIBLE: 'Không thuộc diện điểm danh',
    PAYMENT_PENDING: 'Chờ xác nhận thanh toán',
    LEGACY_NO_DATA: 'Chưa có dữ liệu điểm danh',
    MAKEUP_PENDING: 'Chờ điểm danh học bù',
    MAKEUP_CREDITED: 'Đã ghi nhận học bù',
  }[event.attendanceApplicability];
}

export function StudentSessionPage(props: {
  sessionId: string;
  date: string;
  enrollmentId: string;
  makeupPlacementId?: string;
}) {
  const { from, to } = scheduleWeek(props.date);
  const query = useMySchedule(from, to);
  const event = query.data?.items.find(
    (event) =>
      event.sessionId === props.sessionId &&
      event.enrollmentId === props.enrollmentId &&
      (event.makeupPlacementId ?? undefined) === props.makeupPlacementId,
  );
  return (
    <div className="min-w-0 space-y-6">
      <Link href="/user/schedule" className="text-link inline-flex min-h-11 items-center gap-2">
        <ArrowLeft aria-hidden="true" className="size-4" /> Về lịch học
      </Link>
      {query.isPending ? (
        <UserDataState loading />
      ) : query.isError ? (
        <UserDataState error={query.error} retry={() => void query.refetch()} />
      ) : !event ? (
        <UserDataState empty="Không tìm thấy buổi học trong lịch của bạn. Lịch có thể đã thay đổi, hãy quay lại lịch học." />
      ) : (
        <>
          <header className="space-y-3">
            <h1 className="text-2xl font-extrabold break-words sm:text-3xl">
              {event.sessionTitle}
            </h1>
            <p className="text-sm text-muted">
              {event.classCode} · {event.className} · {event.courseTitle}
            </p>
          </header>
          <section
            aria-label="Thông tin và điểm danh"
            className="rounded-2xl border border-line p-4 sm:p-5"
          >
            <h2 className="text-lg font-extrabold">Thông tin buổi học</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Buổi học', String(event.sessionNumber)],
                [
                  'Trạng thái',
                  {
                    SCHEDULED: 'Sắp diễn ra',
                    IN_PROGRESS: 'Đang diễn ra',
                    COMPLETED: 'Đã hoàn thành',
                    CANCELLED: 'Đã hủy',
                  }[event.sessionStatus],
                ],
                ['Điểm danh', attendanceLabel(event)],
                ['Giảng viên', event.mentor?.displayName || 'Chưa xác định giảng viên'],
                ['Bắt đầu', formatDate(event.startsAt) + ' · ' + formatTime(event.startsAt)],
                ['Kết thúc', formatDate(event.endsAt) + ' · ' + formatTime(event.endsAt)],
                ['Hình thức', deliveryLabel(event.deliveryMode)],
                [
                  'Phòng học',
                  event.roomName ||
                    (event.deliveryMode === 'ONLINE' ? 'Học trực tuyến' : 'Chưa cập nhật phòng'),
                ],
                ['Chương', event.unitTitle],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted">{label}</dt>
                  <dd className="mt-1 font-bold break-words">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted">Thời gian hiển thị theo giờ Việt Nam (UTC+7).</p>
          </section>
          <StudentSessionResources key={event.sessionId + event.enrollmentId} event={event} />
        </>
      )}
    </div>
  );
}
