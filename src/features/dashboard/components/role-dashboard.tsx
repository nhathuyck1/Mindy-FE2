'use client';
import Link from 'next/link';
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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <Heading className="text-2xl font-extrabold">
          {props.audience === 'manager' ? 'Tổng quan thu tiền' : 'Tổng quan giảng dạy'}
        </Heading>
        <div className="flex flex-wrap gap-2">
          <label className="text-sm">
            Khoảng thời gian
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Thực thu', vnd(data.summary.collectedAmount)],
              ['Đơn đã thanh toán', data.summary.paidOrders],
              ['Đang chờ thu', vnd(data.summary.pendingAmount)],
              ['Đơn chờ thu', data.summary.pendingOrders],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-canvas p-4">
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <RevenueTable title="Theo phương thức" rows={data.paymentMethods} />
          <RevenueTable title="Theo khóa học" rows={data.courses} />
          <RevenueTable title="Theo lớp" rows={data.classes} />
          <details className="rounded-xl border border-line p-4">
            <summary className="cursor-pointer font-bold">Thực thu theo ngày</summary>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Ngày</th>
                    <th>Số đơn</th>
                    <th className="text-right">Thực thu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trend.map((d) => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td className="text-center">{d.orders}</td>
                      <td className="text-right">{vnd(d.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <div className="rounded-xl border border-line p-4">
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
          <div className="rounded-xl border border-line p-4">
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Lớp phụ trách chính', data.summary.primaryClasses],
              ['Học viên trong phạm vi', data.summary.students],
              ['Buổi được phân công trong kỳ', data.summary.assignedSessions],
              ['Buổi dạy thay', data.summary.substituteSessions],
              ['Buổi đã hoàn thành', data.summary.completedSessions],
              ['Giờ dạy thực tế', data.summary.actualTeachingHours.toFixed(2)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-canvas p-4">
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-line p-4">
            <h3 className="font-bold">Lịch sắp tới</h3>
            {data.upcoming.length ? (
              <ul className="space-y-3">
                {data.upcoming.map((s) => (
                  <li key={s.sessionId}>
                    <Link className="text-mint underline" href={`/mentor/classes/${s.classId}`}>
                      {s.title}
                    </Link>{' '}
                    · {time(s.startsAt)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Chưa có buổi sắp tới.</p>
            )}
          </div>
          <div className="rounded-xl border border-line p-4">
            <h3 className="font-bold">Đơn nghỉ của bạn</h3>
            {data.leaveRequests.length ? (
              data.leaveRequests.map((s) => (
                <p key={s.status}>
                  {s.status}: {s.count}
                </p>
              ))
            ) : (
              <p className="text-sm text-muted">Không có đơn trong kỳ.</p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
function RevenueTable(props: {
  title: string;
  rows: { id: string; name: string; amount: string; orders: number }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-canvas p-4">
      <h3 className="mb-3 font-bold">{props.title}</h3>
      {props.rows.length ? (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Tên</th>
              <th>Số đơn</th>
              <th className="text-right">Thực thu</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="py-3">{r.name}</td>
                <td className="text-center">{r.orders}</td>
                <td className="text-right">{vnd(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-muted">Chưa có khoản thu trong kỳ.</p>
      )}
    </div>
  );
}
