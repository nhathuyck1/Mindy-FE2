'use client';
import { useState } from 'react';
import { BookOpen, CalendarDays, Clock, UserRound, Video, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScheduleWeekControls } from '@/components/ui/schedule-week-controls';
import { WeeklyTimetable } from '@/components/ui/weekly-timetable';
import {
  calendarDate,
  shortClassCode,
  shortDate,
  shiftDate,
  weekStart,
  vietnamDate,
} from '@/lib/weekly-timetable';
import { formatDate, formatTime, deliveryLabel } from '@/features/courses/lib/course-format';
import { useMySchedule } from '../api/user-queries';
import { scheduleWeek } from '../lib/schedule-week';
import { UserDataState } from './user-data-state';
import { UserDetailsDialog } from './user-details-dialog';
import type { ScheduleEvent } from '../schemas/user-contracts';
const statuses = {
  SCHEDULED: 'Sắp diễn ra',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};
const attendanceLabels = { PRESENT: 'Có mặt', ABSENT: 'Vắng' } as const;
function StudentTimetableSession(props: {
  event: ScheduleEvent;
  day: string;
  onSelect: () => void;
}) {
  const { event } = props;
  const starts = vietnamDate(event.startsAt);
  const ends = vietnamDate(event.endsAt);
  return (
    <button
      type="button"
      aria-label={'Xem chi tiết ' + event.sessionTitle}
      onClick={props.onSelect}
      className="grid min-h-26 w-full cursor-pointer content-start gap-1 rounded-md p-1 text-left transition-colors hover:bg-mint/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
    >
      <span className="flex min-w-0 items-center gap-1 text-[13px] leading-4 font-extrabold text-mint">
        <BookOpen aria-hidden="true" className="size-3.5 shrink-0" />
        <span
          className={
            'min-w-0 truncate ' + (event.sessionStatus === 'CANCELLED' ? 'line-through' : '')
          }
          title={event.classCode + ' · ' + event.courseTitle}
        >
          {shortClassCode(event.classCode)}
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-1 text-[11px] leading-4 font-bold text-status-yellow">
        <Clock aria-hidden="true" className="size-3 shrink-0" />
        <span
          className="truncate"
          title={
            formatDate(event.startsAt) +
            ' ' +
            formatTime(event.startsAt) +
            ' – ' +
            formatDate(event.endsAt) +
            ' ' +
            formatTime(event.endsAt)
          }
        >
          {starts !== props.day ? shortDate(starts) + ' ' : ''}
          {formatTime(event.startsAt)} – {ends !== props.day ? shortDate(ends) + ' ' : ''}
          {formatTime(event.endsAt)}
        </span>
      </span>
      <span
        className={
          'flex min-w-0 items-center gap-1 text-[11px] leading-4 font-bold ' +
          (event.deliveryMode === 'ONLINE' ? 'text-status-green' : 'text-forest')
        }
      >
        {event.deliveryMode === 'ONLINE' ? (
          <Video aria-hidden="true" className="size-3 shrink-0" />
        ) : (
          <MapPin aria-hidden="true" className="size-3 shrink-0" />
        )}
        {event.deliveryMode === 'ONLINE' ? 'Online' : 'Offline'}
      </span>
      <span className="flex min-w-0 items-center gap-1 text-[11px] leading-4 text-muted">
        <UserRound aria-hidden="true" className="size-3 shrink-0" />
        <span className="min-w-0 truncate" title={event.mentor?.displayName || undefined}>
          {event.mentor?.displayName || 'Chưa xác định giảng viên'}
        </span>
      </span>
      {event.attendanceStatus && event.attendanceStatus !== 'UNMARKED' && (
        <span className="text-xs font-bold">
          Điểm danh: {attendanceLabels[event.attendanceStatus]}
        </span>
      )}
      {event.sessionStatus !== 'SCHEDULED' && (
        <span
          className={
            'text-xs font-bold ' + (event.sessionStatus === 'CANCELLED' ? 'text-status-red' : '')
          }
        >
          {statuses[event.sessionStatus]}
        </span>
      )}
    </button>
  );
}
export function UserSchedulePage() {
  const [monday, setMonday] = useState(() => weekStart(vietnamDate()));
  const [selected, setSelected] = useState<ScheduleEvent | null>(null);
  const { from, to } = scheduleWeek(monday);
  const query = useMySchedule(from, to);
  const sunday = shiftDate(monday, 6);
  return (
    <>
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Lịch học</h1>
        <p className="mt-2 text-sm sm:text-base">
          Theo dõi thời khóa biểu của bạn từ Thứ Hai đến Chủ nhật. Chọn một buổi để xem chi tiết.
        </p>
      </div>
      <ScheduleWeekControls
        monday={monday}
        onSelect={(date) => {
          setMonday(date);
          setSelected(null);
        }}
      />
      <section
        aria-labelledby="weekly-timetable-title"
        className="min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-soft/40 px-3 py-2">
          <h2
            id="weekly-timetable-title"
            className="flex items-center gap-2 text-base font-extrabold"
          >
            <CalendarDays aria-hidden="true" className="size-5 text-mint" />
            Thời khóa biểu tuần
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Làm mới lịch tuần"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw className={query.isFetching ? 'motion-safe:animate-spin' : ''} />
          </Button>
        </div>
        <div className="p-3">
          <div className="mb-2">
            <p className="text-sm font-bold">
              Tuần {calendarDate(monday)} – {calendarDate(sunday)}
            </p>
            <p className="mt-0.5 text-[12px] text-muted">Giờ Việt Nam (UTC+7)</p>
          </div>
          {query.isPending ? (
            <UserDataState loading />
          ) : query.isError ? (
            <UserDataState error={query.error} retry={() => void query.refetch()} />
          ) : (
            <WeeklyTimetable
              monday={monday}
              sessions={query.data.items}
              label="Bảng lịch học từ Thứ Hai đến Chủ nhật"
              emptyLabel="Tuần này bạn chưa có lịch học."
              summaryLabel="buổi học trong tuần · Bấm vào buổi học để xem chi tiết."
              sessionKey={(event) =>
                [event.sessionId, event.enrollmentId, event.makeupPlacementId ?? 'regular'].join(
                  ':',
                )
              }
              renderSession={(event, day) => (
                <article aria-label={event.sessionTitle}>
                  <StudentTimetableSession
                    event={event}
                    day={day}
                    onSelect={() => setSelected(event)}
                  />
                </article>
              )}
            />
          )}
        </div>
      </section>
      {selected && (
        <UserDetailsDialog title="Chi tiết lớp học" onClose={() => setSelected(null)}>
          <div>
            <p className="text-sm font-bold text-mint">{selected.classCode}</p>
            <h3 className="mt-2 text-xl font-extrabold">{selected.className}</h3>
            <p className="mt-2 text-sm">{selected.courseTitle}</p>
            <p
              className={
                'mt-3 inline-flex rounded-lg px-3 py-2 text-xs font-bold ' +
                (selected.sessionStatus === 'CANCELLED' ? 'bg-peach' : 'bg-soft')
              }
            >
              {statuses[selected.sessionStatus]}
            </p>
            {selected.attendanceStatus && selected.attendanceStatus !== 'UNMARKED' && (
              <p className="mt-2 inline-flex rounded-lg bg-soft px-3 py-2 text-xs font-bold">
                Điểm danh: {attendanceLabels[selected.attendanceStatus]}
              </p>
            )}
          </div>
          <dl className="grid gap-5 border-t border-line pt-5 text-sm sm:grid-cols-2">
            {[
              ['Buổi học', String(selected.sessionNumber)],
              ['Nội dung buổi học', selected.sessionTitle],
              ['Chương', selected.unitTitle],
              ['Giảng viên', selected.mentor?.displayName || 'Chưa xác định giảng viên'],
              ['Bắt đầu', formatDate(selected.startsAt) + ' · ' + formatTime(selected.startsAt)],
              ['Kết thúc', formatDate(selected.endsAt) + ' · ' + formatTime(selected.endsAt)],
              ['Hình thức', deliveryLabel(selected.deliveryMode)],
              [
                'Phòng học',
                selected.roomName ||
                  (selected.deliveryMode === 'ONLINE' ? 'Học trực tuyến' : 'Chưa cập nhật phòng'),
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted">{label}</dt>
                <dd className="mt-1 break-words font-bold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted">Thời gian hiển thị theo giờ Việt Nam (UTC+7).</p>
          {selected.accessMode === 'CASH_PREVIEW' && (
            <p className="rounded-xl bg-peach p-4 text-sm">Chờ xác nhận thanh toán tiền mặt.</p>
          )}
        </UserDetailsDialog>
      )}
    </>
  );
}
