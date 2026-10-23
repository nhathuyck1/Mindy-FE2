'use client';

import { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserRound,
  Monitor,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, deliveryLabel } from '@/features/courses/lib/course-format';
import { useMySchedule } from '../api/user-queries';
import { scheduleWeek, shiftDate, vietnamToday } from '../lib/schedule-week';
import { UserDataState } from './user-data-state';
import { UserDetailsDialog } from './user-details-dialog';
import type { ScheduleEvent } from '../schemas/user-contracts';
const weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const statuses = {
  SCHEDULED: 'Sắp diễn ra',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};
const attendanceLabels = { PRESENT: 'Có mặt', ABSENT: 'Vắng' } as const;
export function UserSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(() => vietnamToday());
  const [selected, setSelected] = useState<ScheduleEvent | null>(null);
  const { from, to } = scheduleWeek(selectedDate);
  const query = useMySchedule(from, to);
  const monday = vietnamToday(new Date(from));
  const days = weekdays.map((label, index) => ({ label, date: shiftDate(monday, index) }));
  return (
    <>
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Lịch học</h1>
        <p className="mt-2 text-sm sm:text-base">
          Theo dõi thời khóa biểu của bạn từ Thứ 2 đến Chủ nhật.
        </p>
      </div>
      <section
        aria-label="Thời khóa biểu tuần"
        className="min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-4 sm:p-5">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold">
              <CalendarDays aria-hidden="true" className="size-5 text-mint" />
              {formatDate(from)} – {formatDate(days[6].date)}
            </h2>
            <p className="mt-1 text-xs">Giờ Việt Nam (UTC+7)</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Chuyển tuần"
              className="inline-flex items-center rounded-xl bg-canvas p-0.5"
            >
              <Button
                variant="ghost"
                size="icon-lg"
                className="size-11 rounded-lg border-0 shadow-none"
                aria-label="Tuần trước"
                onClick={() => {
                  setSelectedDate(shiftDate(selectedDate, -7));
                  setSelected(null);
                }}
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                className="min-h-11 rounded-lg border-0 px-4 text-base font-semibold shadow-none"
                onClick={() => {
                  setSelectedDate(vietnamToday());
                  setSelected(null);
                }}
              >
                Tuần này
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                className="size-11 rounded-lg border-0 shadow-none"
                aria-label="Tuần sau"
                onClick={() => {
                  setSelectedDate(shiftDate(selectedDate, 7));
                  setSelected(null);
                }}
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
            <label className="sr-only" htmlFor="schedule-date">
              Chọn ngày xem lịch
            </label>
            <input
              id="schedule-date"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
                  setSelectedDate(e.target.value);
                  setSelected(null);
                }
              }}
              className="min-h-11 min-w-0 rounded-lg border border-line/50 bg-canvas px-2 text-sm"
            />
          </div>
        </div>
        {query.isPending ? (
          <div className="p-5">
            <UserDataState loading />
          </div>
        ) : query.isError ? (
          <div className="p-5">
            <UserDataState error={query.error} retry={() => void query.refetch()} />
          </div>
        ) : (
          <>
            <p className="px-5 pt-4 text-xs lg:hidden">Vuốt ngang để xem đủ 7 ngày trong tuần.</p>
            {query.data.items.length === 0 && (
              <p role="status" className="px-5 pt-4 text-sm">
                Tuần này bạn chưa có lịch học.
              </p>
            )}
            <div
              role="region"
              aria-label="Bảng lịch học từ Thứ 2 đến Chủ nhật"
              tabIndex={0}
              className="mt-4 max-w-full overflow-x-auto overscroll-x-contain"
            >
              <table className="w-full min-w-[980px] table-fixed border-collapse text-left">
                <thead>
                  <tr>
                    {days.map((day) => (
                      <th
                        key={day.date}
                        scope="col"
                        className={
                          'border-y border-r border-line p-4 text-center last:border-r-0 ' +
                          (day.date === vietnamToday() ? 'bg-mint text-canvas' : 'bg-soft')
                        }
                      >
                        <span className="block text-sm font-extrabold">{day.label}</span>
                        <span className="mt-1 block text-xs font-normal">
                          {formatDate(day.date)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {days.map((day) => {
                      const dayStart = Date.parse(day.date + 'T00:00:00+07:00');
                      const events = query.data.items.filter(
                        (event) =>
                          Date.parse(event.startsAt) < dayStart + 86400000 &&
                          Date.parse(event.endsAt) > dayStart,
                      );
                      return (
                        <td
                          key={day.date}
                          className="h-96 border-r border-line p-2 align-top last:border-r-0"
                        >
                          <div className="space-y-3">
                            {events.length === 0 ? (
                              <p className="py-6 text-center text-xs text-muted">
                                Không có buổi học
                              </p>
                            ) : (
                              events.map((event) => (
                                <article
                                  key={`${event.sessionId}:${event.enrollmentId}:${event.makeupPlacementId ?? 'regular'}`}
                                  aria-label={event.sessionTitle}
                                  className={
                                    'overflow-hidden rounded-xl border text-sm ' +
                                    (event.sessionStatus === 'CANCELLED'
                                      ? 'border-coral/40 bg-peach/50'
                                      : 'border-line bg-soft/70')
                                  }
                                >
                                  <button
                                    type="button"
                                    aria-label={'Xem chi tiết ' + event.sessionTitle}
                                    onClick={() => setSelected(event)}
                                    className="block min-h-24 w-full cursor-pointer p-3 text-left transition-colors hover:bg-mint/10 focus-visible:-outline-offset-4"
                                  >
                                    <span className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-forest">
                                      <Clock aria-hidden="true" className="size-3.5 shrink-0" />
                                      {formatTime(event.startsAt)} – {formatTime(event.endsAt)}
                                    </span>
                                    <span
                                      className={
                                        'block line-clamp-2 text-sm leading-relaxed font-extrabold ' +
                                        (event.sessionStatus === 'CANCELLED' ? 'line-through' : '')
                                      }
                                    >
                                      {event.courseTitle}
                                    </span>
                                    <span className="mt-2 flex items-center gap-1.5 text-xs">
                                      {event.deliveryMode === 'ONLINE' ? (
                                        <Monitor
                                          aria-hidden="true"
                                          className="size-3.5 shrink-0 text-mint"
                                        />
                                      ) : (
                                        <MapPin
                                          aria-hidden="true"
                                          className="size-3.5 shrink-0 text-mint"
                                        />
                                      )}
                                      {event.deliveryMode === 'ONLINE' ? 'Online' : 'Offline'}
                                    </span>
                                    <span className="mt-2 flex min-w-0 items-center gap-1.5 text-xs">
                                      <UserRound
                                        aria-hidden="true"
                                        className="size-3.5 shrink-0 text-mint"
                                      />
                                      <span
                                        className="truncate"
                                        title={event.mentor?.displayName || undefined}
                                      >
                                        {event.mentor?.displayName || 'Chưa xác định giảng viên'}
                                      </span>
                                    </span>
                                    {event.attendanceStatus &&
                                      event.attendanceStatus !== 'UNMARKED' && (
                                        <span className="mt-2 inline-flex rounded-lg bg-canvas px-2.5 py-1 text-xs font-bold">
                                          Điểm danh: {attendanceLabels[event.attendanceStatus]}
                                        </span>
                                      )}
                                    {event.sessionStatus !== 'SCHEDULED' && (
                                      <span className="mt-2 block text-xs font-semibold">
                                        {statuses[event.sessionStatus]}
                                      </span>
                                    )}
                                  </button>
                                </article>
                              ))
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
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
