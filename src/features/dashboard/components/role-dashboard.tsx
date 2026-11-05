'use client';
import { TodaySchedule } from './today-schedule';
import { RevenueTrend, RevenueBreakdown, MentorTeachingCharts } from './role-dashboard-charts';
import { useState } from 'react';
import type { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { apiRequest } from '@/lib/api/client';
import { useSession } from '@/features/auth/api/auth-queries';
import { managerDashboardSchema, mentorDashboardSchema } from '../schemas/role-dashboard-contracts';

const vnd = (n: string) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(BigInt(n));
const time = (s: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(s));
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
        <Heading className="text-2xl font-extrabold">
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
            Làm mới
          </Button>
        </div>
      </header>
      {query.isPending ? (
        <p role="status">Đang tải số liệu…</p>
      ) : query.isError ? (
        <p role="alert">
          Chưa tải được dashboard.{' '}
          <Button variant="link" onClick={() => void query.refetch()}>
            Thử lại
          </Button>
        </p>
      ) : data?.scope === 'MANAGER' ? (
        <>
          <div className="grid grid-cols-2 gap-y-3 border-y border-line py-3 lg:grid-cols-4">
            {[
              ['Thực thu', vnd(data.summary.collectedAmount)],
              ['Đơn đã thanh toán', data.summary.paidOrders],
              ['Đang chờ thu', vnd(data.summary.pendingAmount)],
              ['Đơn chờ thu', data.summary.pendingOrders],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 px-4 py-3">
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <RevenueTrend rows={data.trend} />
            <RevenueBreakdown title="Theo phương thức" rows={data.paymentMethods} donut />
          </div>
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <RevenueBreakdown title="Theo khóa học" rows={data.courses} />
            <RevenueBreakdown title="Theo lớp" rows={data.classes} />
          </div>
          <div className="border-t border-line py-5">
            <h3 className="font-bold">Lớp cần dời khai giảng</h3>
            {data.openingAlerts.length ? (
              data.openingAlerts.map((a) => (
                <p key={a.classId} className="mt-2">
                  {a.className} · {time(a.scheduledStartAt)} · {a.activeStudentCount}/3 học viên,
                  thiếu {a.missingStudents}.
                </p>
              ))
            ) : (
              <p className="text-sm text-muted">Không có cảnh báo.</p>
            )}
          </div>
          <div className="border-t border-line py-5">
            <h3 className="font-bold">Đơn cần đối soát</h3>
            {data.reconciliation.length ? (
              data.reconciliation.map((o) => (
                <p key={o.orderId} className="break-all">
                  {o.orderId} · {vnd(o.amount)}
                </p>
              ))
            ) : (
              <p className="text-sm text-muted">Không có đơn cần đối soát.</p>
            )}
          </div>
        </>
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
