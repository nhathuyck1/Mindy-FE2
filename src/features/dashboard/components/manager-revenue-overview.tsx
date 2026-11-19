import Link from 'next/link';
import type { z } from 'zod';
import { ArrowUpRight, CalendarClock, CircleAlert } from 'lucide-react';
import type { managerDashboardSchema } from '../schemas/role-dashboard-contracts';
import { RevenueBreakdown, RevenueTrend, revenueLabel } from './role-dashboard-charts';

type ManagerDashboard = z.infer<typeof managerDashboardSchema>;
const time = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
const actionLink =
  'inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-forest underline-offset-4 hover:underline';

export function ManagerRevenueOverview(props: { data: ManagerDashboard }) {
  const data = props.data;
  return (
    <>
      <dl
        aria-label="Số liệu thu tiền"
        className="grid min-w-0 divide-y divide-line overflow-hidden rounded-xl border border-line bg-canvas md:grid-cols-2 md:divide-x md:divide-y-0"
      >
        <div className="min-w-0 px-5 py-5 sm:px-6 sm:py-6">
          <dt className="text-sm font-medium text-muted">Thực thu</dt>
          <dd className="mt-2 text-2xl font-semibold tracking-tight text-forest tabular-nums wrap-anywhere sm:text-3xl">
            {revenueLabel(data.summary.collectedAmount)}
          </dd>
          <dd className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-muted">
            <span>Đơn đã thanh toán</span>
            <strong className="font-semibold text-foreground tabular-nums">
              {data.summary.paidOrders.toLocaleString('vi-VN')}
            </strong>
          </dd>
        </div>
        <div className="min-w-0 px-5 py-5 sm:px-6 sm:py-6">
          <dt className="text-sm font-medium text-muted">Đang chờ thu</dt>
          <dd className="mt-2 text-2xl font-semibold tracking-tight tabular-nums wrap-anywhere sm:text-3xl">
            {revenueLabel(data.summary.pendingAmount)}
          </dd>
          <dd className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-muted">
            <span>Đơn chờ thu</span>
            <strong className="font-semibold text-foreground tabular-nums">
              {data.summary.pendingOrders.toLocaleString('vi-VN')}
            </strong>
          </dd>
        </div>
      </dl>

      <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <RevenueTrend rows={data.trend} />
        <RevenueBreakdown title="Theo phương thức" rows={data.paymentMethods} donut />
      </div>
      <div className="grid min-w-0 items-stretch gap-5 lg:grid-cols-2">
        <RevenueBreakdown title="Theo khóa học" rows={data.courses} />
        <RevenueBreakdown title="Theo lớp" rows={data.classes} />
      </div>

      <section
        aria-label="Lưu ý vận hành"
        className="grid min-w-0 divide-y divide-line overflow-hidden rounded-xl border border-line bg-canvas lg:grid-cols-2 lg:divide-x lg:divide-y-0"
      >
        <div className="min-w-0 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <CalendarClock aria-hidden className="size-4 shrink-0 text-mint" />
            Lớp cần dời khai giảng
          </h3>
          {data.openingAlerts.length ? (
            <ul className="mt-3 divide-y divide-line">
              {data.openingAlerts.map((item) => (
                <li key={item.classId} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`/manager/schedule?classId=${item.classId}`}
                    className={`${actionLink} max-w-full`}
                  >
                    <span className="min-w-0 wrap-anywhere">{item.className}</span>
                    <ArrowUpRight aria-hidden className="size-4 shrink-0" />
                  </Link>
                  <p className="text-sm leading-6 text-muted">
                    {time(item.scheduledStartAt)} · {item.activeStudentCount}/3 học viên, thiếu{' '}
                    {item.missingStudents}.
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">Không có cảnh báo.</p>
          )}
        </div>
        <div className="min-w-0 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <CircleAlert aria-hidden className="size-4 shrink-0 text-mint" />
            Đơn cần đối soát
          </h3>
          {data.reconciliation.length ? (
            <>
              <ul className="mt-3 divide-y divide-line">
                {data.reconciliation.map((item) => (
                  <li key={item.orderId} className="space-y-1.5 py-3 first:pt-0 last:pb-0">
                    <p className="font-semibold tabular-nums wrap-anywhere">
                      {revenueLabel(item.amount)}
                    </p>
                    <p className="text-sm leading-6 text-muted wrap-anywhere">{item.reason}</p>
                    <details className="text-xs text-muted">
                      <summary className="min-h-8 cursor-pointer content-center">Mã đơn</summary>
                      <p className="mt-1 break-all">{item.orderId}</p>
                    </details>
                  </li>
                ))}
              </ul>
              <Link href="/manager/collections" className={`${actionLink} mt-3`}>
                Xem thu tiền
                <ArrowUpRight aria-hidden className="size-4" />
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">Không có đơn cần đối soát.</p>
          )}
        </div>
      </section>
    </>
  );
}
