'use client';

import { BookOpen, Clock, MapPin, UserRound, Video } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  buildWeeklyTimetable,
  sessionTime,
  shortClassCode,
  shortDate,
  slotTime,
  vietnamDate,
} from '@/lib/weekly-timetable';
import type { ScheduleEvent } from '../schemas/user-contracts';
import { scheduleAttendanceLabel } from '../lib/schedule-attendance';

const weekdays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];

function ScheduleLesson(props: {
  event: ScheduleEvent;
  day: string;
  onSelect: (event: ScheduleEvent) => void;
}) {
  const event = props.event;
  const startDay = vietnamDate(event.startsAt),
    endDay = vietnamDate(event.endsAt);
  const attendance =
    event.attendanceStatus === 'PRESENT'
      ? { color: 'bg-status-green/10 text-status-green' }
      : event.attendanceStatus === 'ABSENT'
        ? { color: 'bg-status-red/10 text-status-red' }
        : { color: 'bg-soft text-muted' };
  const label = scheduleAttendanceLabel(event);
  return (
    <article aria-label={event.sessionTitle}>
      <button
        type="button"
        aria-label={`Xem chi tiết ${event.sessionTitle}`}
        onClick={() => props.onSelect(event)}
        className="grid min-h-26 w-full cursor-pointer content-start gap-1 rounded-md p-1 text-left transition-colors hover:bg-mint/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
      >
        <span className="flex min-w-0 items-center gap-1 text-[13px] leading-4 font-extrabold text-mint">
          <BookOpen aria-hidden="true" className="size-3.5 shrink-0" />
          <span
            title={event.classCode}
            className={`min-w-0 truncate ${event.sessionStatus === 'CANCELLED' ? 'line-through' : ''}`}
          >
            {shortClassCode(event.classCode)}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1 text-[11px] leading-4 font-bold text-status-yellow">
          <Clock aria-hidden="true" className="size-3 shrink-0" />
          <span className="truncate">
            {startDay !== props.day ? `${shortDate(startDay)} ` : ''}
            {sessionTime(event.startsAt)} – {endDay !== props.day ? `${shortDate(endDay)} ` : ''}
            {sessionTime(event.endsAt)}
          </span>
        </span>
        <span
          className={`flex min-w-0 items-center gap-1 text-[11px] leading-4 font-bold ${event.deliveryMode === 'ONLINE' ? 'text-status-green' : 'text-forest'}`}
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
          <span className="min-w-0 truncate" title={event.mentor.displayName ?? undefined}>
            {event.mentor.displayName ?? '—'}
          </span>
        </span>
        {event.sessionStatus === 'CANCELLED' ? (
          <span className="w-fit rounded-full bg-status-red/10 px-2 py-0.5 text-[11px] leading-4 font-bold text-status-red">
            Đã hủy
          </span>
        ) : (
          <>
            <span
              aria-label={`Điểm danh: ${label}`}
              className={`mt-1 w-fit rounded-full px-2 py-0.5 text-[11px] leading-4 font-semibold ${attendance.color}`}
            >
              {label}
            </span>
            {event.sessionStatus === 'IN_PROGRESS' && (
              <span className="text-[11px] font-bold text-mint">Đang diễn ra</span>
            )}
          </>
        )}
      </button>
    </article>
  );
}

export function UserWeeklyTimetable(props: {
  events: ScheduleEvent[];
  monday: string;
  onSelect: (event: ScheduleEvent) => void;
}) {
  const timetable = buildWeeklyTimetable(props.events, props.monday);
  const today = vietnamDate();
  const daysWithLessons = timetable.days.map((_, index) =>
    timetable.slots.some((slot) => slot.days[index].length > 0),
  );
  return (
    <div className="p-3">
      <div
        role="region"
        aria-label="Bảng lịch học từ Thứ 2 đến Chủ nhật"
        tabIndex={0}
        className="overflow-x-auto rounded-lg border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint [&>[data-slot=table-container]]:overflow-visible"
      >
        <Table className="min-w-230 table-fixed border-collapse text-[13px]">
          <caption className="sr-only">
            Lịch học tuần {shortDate(props.monday)} đến {shortDate(timetable.days[6])}. Sáu ca cố
            định; thời gian trên từng buổi là giờ học thực tế.
          </caption>
          <colgroup>
            <col className="w-16" />
            {timetable.days.map((day, index) => (
              <col key={day} className={daysWithLessons[index] ? undefined : 'w-20'} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                scope="col"
                className="sticky left-0 z-20 w-16 border-r border-line bg-soft px-2 py-2 text-center text-[13px]"
              >
                Ca học
              </TableHead>
              {timetable.days.map((day, index) => (
                <TableHead
                  key={day}
                  scope="col"
                  aria-current={day === today ? 'date' : undefined}
                  className={`border-r border-line px-1.5 py-2 text-center text-[12px] last:border-r-0 ${day === today ? 'bg-mint/20 text-mint' : 'bg-soft/60'}`}
                >
                  {weekdays[index]}
                  <span className="mt-1 block text-[12px] font-semibold">({shortDate(day)})</span>
                  {day === today && <span className="sr-only">Hôm nay</span>}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timetable.slots.map((slot) => (
              <TableRow key={slot.number ?? 'outside'} className="hover:bg-transparent">
                <TableHead
                  scope="row"
                  className="sticky left-0 z-10 border-r border-line bg-canvas px-2 py-3 text-center text-[12px]"
                >
                  <span className="block text-muted">{slot.number ?? 'Khác'}</span>
                  {slot.start !== null && slot.end !== null && (
                    <span className="mt-1 inline-flex flex-col items-center justify-center gap-1 text-[10px] leading-3 font-normal whitespace-nowrap text-muted tabular-nums">
                      <span>{slotTime(slot.start)}</span>
                      <span className="leading-2">|</span>
                      <span>{slotTime(slot.end)}</span>
                    </span>
                  )}
                </TableHead>
                {slot.days.map((events, index) => (
                  <TableCell
                    key={timetable.days[index]}
                    className={`h-20 border-r border-line p-1 align-top whitespace-normal last:border-r-0 ${timetable.days[index] === today ? 'bg-mint/3' : ''}`}
                  >
                    <div className="divide-y divide-line">
                      {events.length ? (
                        events.map((event) => (
                          <ScheduleLesson
                            key={event.sessionId}
                            event={event}
                            day={timetable.days[index]}
                            onSelect={props.onSelect}
                          />
                        ))
                      ) : (
                        <span
                          aria-label="Không có buổi học"
                          className="block px-1.5 py-2 text-muted/60"
                        >
                          –
                        </span>
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-[12px] text-muted">
        {props.events.length} buổi học trong tuần · Bấm vào buổi học để xem chi tiết.
      </p>
    </div>
  );
}
