'use client';

import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMentorWeek } from '../api/mentor-queries';
import { calendarDate, sessionTime, shiftDate, weekStart } from '../lib/weekly-timetable';
import { MentorQueryState } from './mentor-shared';

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function LeaveSchedule(props: { date: string; onDateChange: (date: string) => void }) {
  const monday = weekStart(props.date);
  const schedule = useMentorWeek(monday);
  const start = Date.parse(`${props.date}T00:00:00+07:00`);
  const sessions = (schedule.data ?? [])
    .filter(
      (item) => Date.parse(item.startsAt) < start + 86400000 && Date.parse(item.endsAt) > start,
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return (
    <section
      aria-label="Lịch dạy để đối chiếu"
      className="overflow-hidden rounded-2xl border border-mint/20 bg-canvas"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-mint/5 p-4">
        <div>
          <h4 className="flex items-center gap-2 font-bold">
            <CalendarDays className="size-4 text-mint" aria-hidden="true" />
            Lịch dạy của bạn
          </h4>
          <p className="mt-1 text-sm text-muted">
            Đối chiếu lịch trước khi chọn giờ bù · Giờ Việt Nam
          </p>
        </div>
        <div className="flex w-full min-w-0 items-center justify-between gap-1 sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Xem tuần trước"
            onClick={() => props.onDateChange(shiftDate(props.date, -7))}
          >
            <ChevronLeft />
          </Button>
          <span className="text-xs font-bold sm:text-sm">
            {calendarDate(monday)} – {calendarDate(shiftDate(monday, 6))}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Xem tuần sau"
            onClick={() => props.onDateChange(shiftDate(props.date, 7))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1" aria-label="Ngày xem lịch">
          {weekdays.map((label, index) => {
            const day = shiftDate(monday, index);
            return (
              <button
                key={day}
                type="button"
                aria-label={`Xem lịch ngày ${calendarDate(day)}`}
                aria-pressed={props.date === day}
                onClick={() => props.onDateChange(day)}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint ${props.date === day ? 'bg-mint font-bold text-white' : 'bg-soft/50 text-forest hover:bg-mint/10'}`}
              >
                <span className="text-xs">{label}</span>
                <span>{day.slice(8)}</span>
              </button>
            );
          })}
        </div>
        <p className="mb-3 mt-4 text-sm font-bold">Lịch ngày {calendarDate(props.date)}</p>
        <MentorQueryState
          pending={schedule.isPending}
          error={schedule.error}
          retry={schedule.refetch}
        >
          {sessions.length === 0 ? (
            <p className="rounded-xl bg-soft/50 p-4 text-sm text-muted">
              Không có buổi dạy trong lịch ngày này.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {sessions.map((item) => (
                <li key={item.sessionId} className="flex flex-col gap-2 py-3 sm:flex-row sm:gap-4">
                  <span className="flex shrink-0 items-center gap-2 text-sm font-bold text-mint">
                    <Clock3 className="size-4" aria-hidden="true" />
                    {sessionTime(item.startsAt)} – {sessionTime(item.endsAt)}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-sm leading-6">{item.title}</p>
                    {item.status === 'CANCELLED' && <p className="text-xs text-muted">Đã hủy</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </MentorQueryState>
        <p className="mt-3 text-xs leading-5 text-muted">
          Lịch này hiển thị các buổi dạy hiện có. Hệ thống kiểm tra thêm lịch học viên và khoảng
          nghỉ khi tìm giờ, gửi đơn.
        </p>
      </div>
    </section>
  );
}
