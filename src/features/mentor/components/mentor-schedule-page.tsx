'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, CalendarDays, Clock, MapPin, RefreshCw, UserRound, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScheduleWeekControls } from '@/components/ui/schedule-week-controls';
import { WeeklyTimetable } from '@/components/ui/weekly-timetable';
import { useMentorQuery, useMentorWeek } from '../api/mentor-queries';
import {
  mentorClassPageSchema,
  type MentorClass,
  type TeachingSession,
} from '../schemas/mentor-contracts';
import {
  calendarDate,
  sessionTime,
  shiftDate,
  shortClassCode,
  shortDate,
  vietnamDate,
  weekStart,
} from '../lib/weekly-timetable';
import { MentorHeading, MentorQueryState } from './mentor-shared';

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
  const sunday = shiftDate(monday, 6);
  return (
    <>
      <MentorHeading
        title="Lịch dạy của bạn"
        description="Theo dõi lịch đứng lớp và các buổi dạy thay theo tuần. Chọn một buổi để xem thông tin và điểm danh học viên."
      />
      <ScheduleWeekControls monday={monday} onSelect={setMonday} />
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
            <WeeklyTimetable
              monday={monday}
              sessions={schedule.data ?? []}
              label="Bảng lịch dạy theo tuần"
              emptyLabel="Không có buổi dạy trong tuần này."
              summaryLabel="buổi dạy trong tuần · Bấm vào buổi dạy để xem chi tiết."
              sessionKey={(session) => session.sessionId}
              renderSession={(session, day) => (
                <TimetableSession
                  session={session}
                  day={day}
                  classInfo={classById.get(session.classId)}
                />
              )}
            />
          </MentorQueryState>
        </div>
      </section>
    </>
  );
}
