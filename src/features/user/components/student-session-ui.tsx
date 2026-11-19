import Link from 'next/link';
import { ArrowLeft, CalendarDays, ClipboardCheck, GraduationCap, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LinkLoadingIcon } from '@/components/ui/link-loading-icon';
import { NameAvatar } from '@/components/ui/name-avatar';
import { formatDate, formatTime, deliveryLabel } from '@/features/courses/lib/course-format';
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

export function StudentSessionBackLink() {
  return (
    <Link
      href="/user/schedule"
      className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-forest underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"
    >
      <LinkLoadingIcon>
        <ArrowLeft aria-hidden="true" className="size-4" />
      </LinkLoadingIcon>
      Về lịch học
    </Link>
  );
}

export function StudentSessionOverview(props: { event: ScheduleEvent }) {
  const event = props.event;
  return (
    <header className="min-w-0 rounded-3xl border border-mint/20 bg-linear-to-br from-mint/15 via-soft to-mint/5 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <StudentSessionBackLink />
        <Badge
          variant="outline"
          className={`max-w-full gap-2 border-mint/20 px-3 py-1.5 font-bold whitespace-normal ${event.sessionStatus === 'IN_PROGRESS' ? 'bg-forest text-canvas' : event.sessionStatus === 'CANCELLED' ? 'border-coral/25 bg-peach text-forest' : 'bg-canvas/80 text-forest'}`}
        >
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
          {
            {
              SCHEDULED: 'Sắp diễn ra',
              IN_PROGRESS: 'Đang diễn ra',
              COMPLETED: 'Đã hoàn thành',
              CANCELLED: 'Đã hủy',
            }[event.sessionStatus]
          }
        </Badge>
      </div>
      <h1 className="max-w-4xl text-2xl leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">
        {event.sessionTitle}
      </h1>
      <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-forest">
        <GraduationCap aria-hidden="true" className="mt-1 size-4 shrink-0" />
        <span className="min-w-0 [overflow-wrap:anywhere]">
          {event.classCode} · {event.className} · {event.courseTitle}
        </span>
      </p>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-mint/15 pt-4 text-sm">
        <p className="flex min-w-0 items-start gap-2">
          <CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mint" />
          <span className="min-w-0 leading-6 tabular-nums">
            <span className="sr-only">Bắt đầu: </span>
            <time dateTime={event.startsAt}>
              {formatTime(event.startsAt)} · {formatDate(event.startsAt)}
            </time>
            {' – '}
            <span className="sr-only">Kết thúc: </span>
            <time dateTime={event.endsAt}>
              {formatTime(event.endsAt)}
              {formatDate(event.startsAt) !== formatDate(event.endsAt) &&
                ' · ' + formatDate(event.endsAt)}
            </time>
          </span>
        </p>
        <p className="flex min-w-0 items-start gap-2 leading-6">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mint" />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            {event.roomName ||
              (event.deliveryMode === 'ONLINE' ? 'Học trực tuyến' : 'Chưa cập nhật phòng')}
          </span>
        </p>
        <span className="text-xs leading-6 text-muted">Giờ Việt Nam (UTC+7)</span>
      </div>
    </header>
  );
}

export function StudentSessionDetails(props: { event: ScheduleEvent }) {
  return (
    <section
      aria-label="Thông tin buổi học"
      className="min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas"
    >
      <h2 className="border-b border-line bg-soft/35 px-5 py-4 text-lg font-extrabold">
        Thông tin buổi học
      </h2>
      <dl className="grid gap-x-6 gap-y-5 p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">Giảng viên</dt>
          <dd className="mt-2 flex min-w-0 items-center gap-2.5 font-bold">
            <NameAvatar name={props.event.mentor?.displayName || '?'} className="size-9 text-xs" />
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {props.event.mentor?.displayName || 'Chưa xác định giảng viên'}
            </span>
          </dd>
        </div>
        {[
          ['Buổi học', String(props.event.sessionNumber)],
          ['Chương', props.event.unitTitle],
          ['Hình thức', deliveryLabel(props.event.deliveryMode)],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-2 leading-6 font-bold [overflow-wrap:anywhere]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function StudentSessionAttendance(props: { event: ScheduleEvent }) {
  return (
    <section
      aria-label="Điểm danh của bạn"
      className="min-w-0 rounded-2xl border border-coral/20 bg-peach/70 p-5"
    >
      <h2 className="flex items-center gap-2.5 text-base font-extrabold">
        <ClipboardCheck aria-hidden="true" className="size-5 shrink-0 text-forest" />
        Điểm danh của bạn
      </h2>
      <p className="mt-3 text-sm leading-6 font-bold [overflow-wrap:anywhere]">
        {attendanceLabel(props.event)}
      </p>
    </section>
  );
}
