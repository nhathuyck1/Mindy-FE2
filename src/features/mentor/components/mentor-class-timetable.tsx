'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CalendarDays, Clock3, UserRound, ArrowRight, Filter, X } from 'lucide-react';
import { MentorReportHeading } from './mentor-report-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMentorQuery } from '../api/mentor-queries';
import { workspaceSessionsSchema } from '../schemas/workspace-contracts';
import { MentorPagination, MentorQueryState, MentorStatus, mentorDate } from './mentor-shared';

export function MentorDateFilter(props: { onApply: (query: string) => void }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  return (
    <form
      className="mb-5 grid grid-cols-1 items-end gap-3 rounded-2xl border border-line bg-canvas p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        if (
          !from !== !to ||
          (from && (to < from || Date.parse(to) - Date.parse(from) >= 93 * 86400000))
        ) {
          setError('Chọn đủ hai ngày, từ ngày không sau đến ngày và tối đa 93 ngày.');
          return;
        }
        setError('');
        props.onApply(
          from
            ? `&from=${encodeURIComponent(`${from}T00:00:00+07:00`)}&to=${encodeURIComponent(new Date(Date.parse(`${to}T00:00:00+07:00`) + 86400000).toISOString())}`
            : '',
        );
      }}
    >
      <label className="min-w-0 space-y-2 text-sm font-bold">
        Từ ngày
        <Input
          className="h-12"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </label>
      <label className="min-w-0 space-y-2 text-sm font-bold">
        Đến ngày
        <Input className="h-12" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </label>
      <Button type="submit" variant="outline">
        <Filter aria-hidden="true" className="size-4" />
        Áp dụng
      </Button>
      <Button
        type="button"
        variant="ghost"
        aria-label="Bỏ lọc thời gian"
        disabled={!from && !to}
        onClick={() => {
          setFrom('');
          setTo('');
          setError('');
          props.onApply('');
        }}
      >
        <X aria-hidden="true" className="size-4" />
        <span>Bỏ lọc</span>
      </Button>
      {error && (
        <p role="alert" className="w-full text-status-red">
          {error}
        </p>
      )}
    </form>
  );
}
export function MentorClassTimetable(props: { classId: string }) {
  const [range, setRange] = useState('');
  return (
    <>
      <MentorReportHeading
        title="Lịch buổi học"
        description="Mở một buổi để xem lớp, điểm danh và ghi chú giảng dạy."
      />
      <MentorDateFilter onApply={setRange} />
      <Timetable key={range} classId={props.classId} range={range} />
    </>
  );
}
function Timetable(props: { classId: string; range: string }) {
  const [page, setPage] = useState(1);
  const query = useMentorQuery(
    `mentor/classes/${props.classId}/sessions?page=${page}&pageSize=20${props.range}`,
    workspaceSessionsSchema,
  );
  return (
    <MentorQueryState
      pending={query.isPending}
      error={query.error}
      retry={query.refetch}
      empty={query.data?.total === 0}
    >
      <ul className="overflow-hidden rounded-2xl border border-line bg-canvas divide-y divide-line">
        {query.data?.items.map((item) => (
          <li
            key={item.sessionId}
            className="grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
          >
            <div
              aria-hidden="true"
              className="hidden size-12 place-items-center rounded-xl bg-mint/8 text-mint sm:grid"
            >
              <CalendarDays className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h2 className="text-base font-extrabold break-words">{item.title}</h2>
                <MentorStatus value={item.status} />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="size-4 shrink-0" />
                  {mentorDate(item.startsAt)} –{' '}
                  {new Intl.DateTimeFormat('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(item.endsAt))}
                </span>
                <span className="inline-flex items-center gap-2">
                  <UserRound className="size-4 shrink-0" />
                  {item.effectiveMentor?.displayName ?? 'Chưa xác định người dạy'}
                </span>
              </div>
            </div>
            {item.capabilities.readSessionContext ? (
              <Button asChild variant="outline" className="justify-self-start sm:justify-self-end">
                <Link href={`/mentor/sessions/${item.sessionId}`}>
                  Mở buổi học
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            ) : (
              <span className="text-sm text-muted">Buổi do mentor khác phụ trách</span>
            )}
          </li>
        ))}
      </ul>
      {query.data && <MentorPagination page={page} total={query.data.total} onChange={setPage} />}
    </MentorQueryState>
  );
}
