'use client';
import { useId, type ReactNode } from 'react';
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
  shortDate,
  slotTime,
  vietnamDate,
  shiftDate,
} from '@/lib/weekly-timetable';
const weekdays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
type TimedSession = { sessionId: string; startsAt: string; endsAt: string };
export function WeeklyTimetable<T extends TimedSession>(props: {
  monday: string;
  sessions: T[];
  label: string;
  emptyLabel: string;
  summaryLabel: string;
  sessionKey: (session: T) => string;
  renderSession: (session: T, day: string) => ReactNode;
}) {
  const helpId = useId();
  const monday = props.monday;
  const sunday = shiftDate(monday, 6);
  const today = vietnamDate();
  const timetable = buildWeeklyTimetable(props.sessions, monday);
  const slots = timetable.slots;
  const daysWithLessons = timetable.days.map((_, dayIndex) =>
    slots.some((slot) => slot.days[dayIndex].length > 0),
  );
  return (
    <>
      <p id={helpId} className="mb-3 text-[13px] text-muted xl:hidden">
        Cuộn ngang để xem đủ 7 ngày trong tuần.
      </p>
      <div
        role="region"
        aria-label={props.label}
        aria-describedby={helpId}
        tabIndex={0}
        className="overflow-x-auto rounded-lg border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint [&>[data-slot=table-container]]:overflow-visible"
      >
        <Table className="min-w-230 table-fixed border-collapse text-[13px]">
          <caption className="sr-only">
            Thời khóa biểu tuần {shortDate(monday)} đến {shortDate(sunday)}. Các ca được nhóm theo
            sáu khung giờ cố định, giờ từng buổi theo lịch thực tế.
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
            {slots.map((slot) => (
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
                {slot.days.map((sessions, dayIndex) => (
                  <TableCell
                    key={timetable.days[dayIndex]}
                    className={`h-20 border-r border-line p-1 align-top whitespace-normal last:border-r-0 ${timetable.days[dayIndex] === today ? 'bg-mint/3' : ''}`}
                  >
                    <div className="divide-y divide-line">
                      {sessions.length ? (
                        sessions.map((session) => (
                          <div key={props.sessionKey(session)}>
                            {props.renderSession(session, timetable.days[dayIndex])}
                          </div>
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
            {!props.sessions.length && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={8}
                  className="h-24 text-center whitespace-normal text-sm text-muted"
                >
                  {props.emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-[12px] text-muted">
        {props.sessions.length} {props.summaryLabel}
      </p>
    </>
  );
}
