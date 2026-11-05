'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMentorWeek } from '@/features/mentor/api/mentor-queries';
import { useMySchedule } from '@/features/user/api/user-queries';
import {
  calendarDate,
  sessionTime,
  shiftDate,
  vietnamDate,
  weekStart,
} from '@/lib/weekly-timetable';

const labels = {
  SCHEDULED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export function TodaySchedule(props: { audience: 'mentor' | 'student' }) {
  const [today, setToday] = useState(vietnamDate);
  useEffect(() => {
    const update = () => setToday(vietnamDate());
    const midnight = Date.parse(`${shiftDate(today, 1)}T00:00:00+07:00`);
    const timer = window.setTimeout(update, Math.max(100, midnight - Date.now() + 50));
    window.addEventListener('focus', update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', update);
    };
  }, [today]);
  const mentor = useMentorWeek(weekStart(today));
  const student = useMySchedule(`${today}T00:00:00+07:00`, `${shiftDate(today, 1)}T00:00:00+07:00`);
  const query = props.audience === 'mentor' ? mentor : student;
  const events = (
    props.audience === 'mentor'
      ? (mentor.data ?? []).map((item) => ({
          id: item.sessionId,
          title: item.title,
          startsAt: item.startsAt,
          endsAt: item.endsAt,
          status: item.status,
          detail: '',
          href: `/mentor/sessions/${item.sessionId}`,
        }))
      : (student.data?.items ?? []).map((item) => ({
          id: `${item.sessionId}:${item.enrollmentId}:${item.makeupPlacementId ?? ''}`,
          title: item.sessionTitle,
          startsAt: item.startsAt,
          endsAt: item.endsAt,
          status: item.sessionStatus,
          detail: item.className,
          href: '/user/schedule',
        }))
  )
    .filter((item) => vietnamDate(item.startsAt) === today && item.status !== 'CANCELLED')
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt) || a.id.localeCompare(b.id));
  return (
    <section
      aria-label="Lịch hôm nay"
      className="overflow-hidden rounded-2xl border border-line bg-canvas"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold">Lịch hôm nay</h2>
          <span className="text-sm text-muted">{calendarDate(today)}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            className="text-sm font-bold text-mint underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-mint"
            href={props.audience === 'mentor' ? '/mentor' : '/user/schedule'}
          >
            Xem lịch đầy đủ
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Làm mới lịch hôm nay"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            <RefreshCw aria-hidden className="size-4" />
          </Button>
        </div>
      </header>
      {query.isPending ? (
        <p role="status" className="px-6 py-8 text-sm text-muted">
          Đang tải lịch hôm nay…
        </p>
      ) : query.isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 px-6 py-8 text-sm">
          <p>Chưa tải được lịch hôm nay.</p>
          <Button type="button" variant="outline" onClick={() => query.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : !events.length ? (
        <p role="status" className="px-6 py-8 text-sm text-muted">
          Hôm nay không có buổi {props.audience === 'mentor' ? 'dạy' : 'học'}.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {events.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex min-h-28 items-center gap-4 px-5 py-5 transition-colors hover:bg-soft/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mint sm:gap-5 sm:px-6"
              >
                <span className="w-16 shrink-0 rounded-xl bg-soft px-2 py-3 text-center text-base font-extrabold text-forest tabular-nums sm:w-20 sm:text-lg">
                  {sessionTime(item.startsAt)}
                  <span className="mt-1 block text-xs font-medium text-muted">
                    {sessionTime(item.endsAt)}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold break-words">{item.title}</span>
                  {item.detail && (
                    <span className="mt-1 block text-sm text-muted break-words">{item.detail}</span>
                  )}
                  <span
                    className={`mt-2 inline-flex rounded-md px-2 py-1 text-xs font-semibold ${item.status === 'IN_PROGRESS' ? 'bg-mint/10 text-forest' : 'bg-soft text-forest'}`}
                  >
                    {labels[item.status]}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-sm font-bold text-mint">
                  <span className="hidden sm:inline">
                    {props.audience === 'mentor' ? 'Vào buổi dạy' : 'Xem lịch học'}
                  </span>
                  <ArrowUpRight aria-hidden className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
