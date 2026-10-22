'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCw,
  UserRound,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MentorScheduleDatePicker } from './mentor-schedule-date-picker';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { useMentorQuery, useMentorWeek } from '../api/mentor-queries';
import {
  mentorClassPageSchema,
  type MentorClass,
  type TeachingSession,
} from '../schemas/mentor-contracts';
import {
  buildWeeklyTimetable,
  calendarDate,
  sessionTime,
  shiftDate,
  shortClassCode,
  shortDate,
  slotTime,
  vietnamDate,
  weekStart,
} from '../lib/weekly-timetable';
import { MentorHeading, MentorQueryState } from './mentor-shared';

const weekdays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
function TimetableSession(props: {
  session: TeachingSession;
  day: string;
  classInfo?: MentorClass;
}) {
  const item = props.session;
  const starts = vietnamDate(item.startsAt);
  const ends = vietnamDate(item.endsAt);
  return (
    <Link
      href={`/mentor/sessions/${item.sessionId}`}
      className="grid min-h-26 content-start gap-1 rounded-md p-1 text-left transition-colors hover:bg-mint/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
    >
      <span className="flex min-w-0 items-center gap-1 text-[13px] leading-4 font-extrabold text-mint">
        <BookOpen aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate" title={props.classInfo?.code}>
          {props.classInfo ? shortClassCode(props.classInfo.code) : '—'}
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-1 text-[11px] leading-4 font-bold text-status-yellow">
        <Clock aria-hidden="true" className="size-3 shrink-0" />
        <span
          className="truncate"
          title={`${starts !== props.day ? `${shortDate(starts)} ` : ''}${sessionTime(item.startsAt)} – ${ends !== props.day ? `${shortDate(ends)} ` : ''}${sessionTime(item.endsAt)}`}
        >
          {starts !== props.day ? `${shortDate(starts)} ` : ''}
          {sessionTime(item.startsAt)} – {ends !== props.day ? `${shortDate(ends)} ` : ''}
          {sessionTime(item.endsAt)}
        </span>
      </span>
      {props.classInfo && (
        <span
          className={`flex min-w-0 items-center gap-1 text-[11px] leading-4 font-bold ${props.classInfo.deliveryMode === 'ONLINE' ? 'text-status-green' : 'text-forest'}`}
        >
          {props.classInfo.deliveryMode === 'ONLINE' ? (
            <Video aria-hidden="true" className="size-3 shrink-0" />
          ) : (
            <MapPin aria-hidden="true" className="size-3 shrink-0" />
          )}
          {props.classInfo.deliveryMode === 'ONLINE' ? 'Online' : 'Offline'}
        </span>
      )}
      <span className="flex min-w-0 items-center gap-1 text-[11px] leading-4 text-muted">
        <UserRound aria-hidden="true" className="size-3 shrink-0" />
        <span className="min-w-0 truncate" title={item.effectiveMentor?.displayName ?? undefined}>
          {item.effectiveMentor?.displayName ?? '—'}
        </span>
      </span>
      {item.status === 'CANCELLED' && (
        <span className="text-xs font-bold text-status-red">Đã hủy</span>
      )}
      {item.assignmentType === 'SUBSTITUTE' && (
        <span className="w-fit rounded bg-peach px-1.5 text-[11px] leading-4 font-bold text-foreground">
          Dạy thay
        </span>
      )}
    </Link>
  );
}
export function MentorSchedulePage() {
  const [monday, setMonday] = useState(() => weekStart(vietnamDate()));
  const schedule = useMentorWeek(monday);
  const classes = useMentorQuery('mentor/classes?page=1&pageSize=100', mentorClassPageSchema);
  const classById = new Map(classes.data?.items.map((item) => [item.id, item]));
  const today = vietnamDate();
  const timetable = buildWeeklyTimetable(schedule.data ?? [], monday);
  const daysWithLessons = timetable.days.map((_, dayIndex) =>
    timetable.slots.some((slot) => slot.days[dayIndex].length > 0),
  );
  const slots = timetable.slots;
  const sunday = shiftDate(monday, 6);
  return (
    <>
      <MentorHeading
        title="Lịch dạy của bạn"
        description="Theo dõi lịch đứng lớp và các buổi dạy thay theo tuần. Chọn một buổi để xem thông tin và điểm danh học viên."
      />
      <section
        aria-label="Chọn tuần giảng dạy"
        className="mb-4 rounded-xl border border-line bg-canvas px-4 py-3 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <MentorScheduleDatePicker key={monday} monday={monday} onSelect={setMonday} />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-lg px-3 text-[13px] border-0 shadow-sm"
              onClick={() => setMonday(shiftDate(monday, -7))}
            >
              <ChevronLeft className="size-4" />
              Tuần trước
            </Button>
            <Button
              className="h-9 rounded-lg px-3 text-[13px] shadow-sm"
              onClick={() => setMonday(weekStart(vietnamDate()))}
            >
              <CalendarCheck className="size-4" />
              Tuần hiện tại
            </Button>
            <Button
              variant="outline"
              className="h-9 rounded-lg px-3 text-[13px] border-0 shadow-sm"
              onClick={() => setMonday(shiftDate(monday, 7))}
            >
              Tuần sau
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
      <section
        aria-labelledby="weekly-timetable-title"
        className="overflow-hidden rounded-2xl border border-line bg-canvas"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-soft/40 px-3 py-2">
          <h2
            id="weekly-timetable-title"
            className="flex items-center gap-2 text-base font-extrabold"
          >
            <CalendarDays className="size-5 text-mint" />
            Thời khóa biểu tuần
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Làm mới lịch tuần"
              disabled={schedule.isFetching}
              onClick={() => schedule.refetch()}
            >
              <RefreshCw className={schedule.isFetching ? 'motion-safe:animate-spin' : ''} />
            </Button>
          </div>
        </div>
        <div className="p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">
                Tuần {calendarDate(monday)} – {calendarDate(sunday)}
              </p>
              <p className="mt-0.5 text-[12px] text-muted">Giờ Việt Nam (UTC+7)</p>
            </div>
          </div>
          <MentorQueryState
            pending={schedule.isPending}
            error={schedule.error}
            retry={schedule.refetch}
          >
            <p id="timetable-scroll-help" className="mb-3 text-[13px] text-muted xl:hidden">
              Cuộn ngang để xem đủ 7 ngày trong tuần.
            </p>
            <div
              role="region"
              aria-label="Bảng lịch dạy theo tuần"
              aria-describedby="timetable-scroll-help"
              tabIndex={0}
              className="overflow-x-auto rounded-lg border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint [&>[data-slot=table-container]]:overflow-visible"
            >
              <Table className="min-w-230 table-fixed border-collapse text-[13px]">
                <caption className="sr-only">
                  Lịch dạy tuần {shortDate(monday)} đến {shortDate(sunday)}. Các ca được nhóm theo
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
                        <span className="mt-1 block text-[12px] font-semibold">
                          ({shortDate(day)})
                        </span>
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
                                <TimetableSession
                                  key={session.sessionId}
                                  session={session}
                                  classInfo={classById.get(session.classId)}
                                  day={timetable.days[dayIndex]}
                                />
                              ))
                            ) : (
                              <span
                                aria-label="Không có buổi dạy"
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
                  {!schedule.data?.length && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center whitespace-normal text-sm text-muted"
                      >
                        Không có buổi dạy trong tuần này.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-[12px] text-muted">
              {schedule.data?.length ?? 0} buổi dạy trong tuần · Bấm vào buổi dạy để xem chi tiết.
            </p>
          </MentorQueryState>
        </div>
      </section>
    </>
  );
}
