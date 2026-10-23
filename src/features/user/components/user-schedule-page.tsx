'use client';

import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, deliveryLabel } from '@/features/courses/lib/course-format';
import { useMySchedule } from '../api/user-queries';
import { scheduleWeek, shiftDate, vietnamToday } from '../lib/schedule-week';
import { UserDataState } from './user-data-state';
import { UserDetailsDialog } from './user-details-dialog';
import { UserScheduleMeeting } from './user-schedule-meeting';
import { AssignmentList } from '@/features/assignments/assignment-list';
import type { ScheduleEvent } from '../schemas/user-contracts';
import { UserWeeklyTimetable } from './user-weekly-timetable';
import { scheduleAttendanceLabel } from '../lib/schedule-attendance';
const weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const statuses = {
  SCHEDULED: 'Sắp diễn ra',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};
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
            <UserWeeklyTimetable events={query.data.items} monday={monday} onSelect={setSelected} />
          </>
        )}
      </section>
      {selected && (
        <UserDetailsDialog title="Chi tiết lớp học" onClose={() => setSelected(null)}>
          <div>
            <p className="text-sm font-bold text-mint">{selected.classCode}</p>
            <h3 className="mt-2 text-xl font-extrabold">{selected.className}</h3>
            <p className="mt-2 text-sm">{selected.courseTitle}</p>
            {selected.sessionStatus !== 'COMPLETED' && (
              <p
                className={
                  'mt-3 inline-flex rounded-lg px-3 py-2 text-xs font-bold ' +
                  (selected.sessionStatus === 'CANCELLED' ? 'bg-peach' : 'bg-soft')
                }
              >
                {statuses[selected.sessionStatus]}
              </p>
            )}
          </div>
          <dl className="grid gap-5 border-t border-line pt-5 text-sm sm:grid-cols-2">
            {[
              ['Buổi học', String(selected.sessionNumber)],
              ['Nội dung buổi học', selected.sessionTitle],
              ['Điểm danh', scheduleAttendanceLabel(selected)],
              ['Chương', selected.unitTitle],
              ['Mentor', selected.mentor.displayName || 'Chưa cập nhật mentor'],
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
          {selected.deliveryMode === 'ONLINE' &&
            selected.accessMode === 'FULL' &&
            selected.sessionStatus !== 'CANCELLED' && (
              <UserScheduleMeeting key={selected.sessionId} event={selected} />
            )}
          {selected.accessMode === 'CASH_PREVIEW' && (
            <p className="rounded-xl bg-peach p-4 text-sm">Chờ xác nhận thanh toán tiền mặt.</p>
          )}
          {selected.accessMode === 'FULL' && selected.sessionStatus !== 'CANCELLED' && (
            <AssignmentList
              key={`assignments-${selected.sessionId}`}
              classId={selected.classId}
              sessionId={selected.sessionId}
            />
          )}
        </UserDetailsDialog>
      )}
    </>
  );
}
