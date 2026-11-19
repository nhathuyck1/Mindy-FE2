'use client';
import { TodaySchedule } from './today-schedule';
import { MentorTeachingCharts } from './role-dashboard-charts';
import { ManagerRevenueOverview } from './manager-revenue-overview';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { apiRequest } from '@/lib/api/client';
import { useSession } from '@/features/auth/api/auth-queries';
import { managerDashboardSchema, mentorDashboardSchema } from '../schemas/role-dashboard-contracts';

export function RoleDashboard(props: { audience: 'manager' | 'mentor'; embedded?: boolean }) {
  const [days, setDays] = useState(90);
  const session = useSession();
  const query = useQuery<
    z.infer<typeof managerDashboardSchema> | z.infer<typeof mentorDashboardSchema>
  >({
    queryKey: ['dashboard', session.data?.id, props.audience, days],
    enabled:
      session.data?.status === 'ACTIVE' && session.data.role === props.audience.toUpperCase(),
    retry: false,
    queryFn: ({ signal }) =>
      props.audience === 'manager'
        ? apiRequest({
            path: `manager/dashboard?days=${days}`,
            schema: managerDashboardSchema,
            signal,
          })
        : apiRequest({
            path: `mentor/dashboard?days=${days}`,
            schema: mentorDashboardSchema,
            signal,
          }),
  });
  if (session.data?.role !== props.audience.toUpperCase()) return null;
  const Heading = props.embedded ? 'h2' : 'h1',
    data = query.data;
  return (
    <section className="space-y-5" aria-label="Dashboard theo vai trò">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Heading
          className={
            props.audience === 'manager'
              ? 'text-xl font-semibold tracking-tight'
              : 'text-2xl font-extrabold'
          }
        >
          {props.audience === 'manager' ? 'Tổng quan thu tiền' : 'Tổng quan giảng dạy'}
        </Heading>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm">
            <span className="sr-only">Khoảng thời gian</span>
            <NativeSelect value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {[30, 90, 365].map((d) => (
                <NativeSelectOption key={d} value={d}>
                  {d} ngày
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {props.audience === 'manager' && <RefreshCw aria-hidden className="size-4" />}
            Làm mới
          </Button>
        </div>
      </header>
      {query.isPending ? (
        <div role="status" className="space-y-4">
          <p className="text-sm text-muted">Đang tải số liệu…</p>
          {props.audience === 'manager' && (
            <div
              aria-hidden
              className="h-36 rounded-xl border border-line bg-soft motion-safe:animate-pulse"
            />
          )}
        </div>
      ) : query.isError ? (
        <p role="alert">
          Chưa tải được dashboard.{' '}
          <Button variant="link" onClick={() => void query.refetch()}>
            Thử lại
          </Button>
        </p>
      ) : data?.scope === 'MANAGER' ? (
        <ManagerRevenueOverview data={data} />
      ) : data?.scope === 'MENTOR' ? (
        <>
          <div className="grid grid-cols-2 gap-y-3 border-y border-line py-3 lg:grid-cols-3">
            {[
              ['Lớp phụ trách chính', data.summary.primaryClasses],
              ['Học viên trong phạm vi', data.summary.students],
              ['Buổi được phân công trong kỳ', data.summary.assignedSessions],
              ['Buổi dạy thay', data.summary.substituteSessions],
              ['Buổi đã hoàn thành', data.summary.completedSessions],
              ['Giờ dạy thực tế', data.summary.actualTeachingHours.toFixed(2)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 px-4 py-3">
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <MentorTeachingCharts data={data} />
          <TodaySchedule audience="mentor" />
        </>
      ) : null}
    </section>
  );
}
