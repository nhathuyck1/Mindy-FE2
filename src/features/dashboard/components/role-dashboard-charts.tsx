'use client';

import { useId } from 'react';
import type { z } from 'zod';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type {
  managerDashboardSchema,
  mentorDashboardSchema,
} from '../schemas/role-dashboard-contracts';

type ManagerDashboard = z.infer<typeof managerDashboardSchema>;
type MentorDashboard = z.infer<typeof mentorDashboardSchema>;
const colors = [
  'var(--color-mint)',
  'var(--color-coral)',
  'var(--color-forest)',
  'var(--color-headsup)',
];
export const revenueLabel = (amount: string | number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    typeof amount === 'string' ? BigInt(amount) : amount,
  );
const compact = (value: number) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const panel = 'min-w-0 rounded-2xl border border-line bg-canvas p-4 sm:p-6';

export function RevenueTrend(props: { rows: ManagerDashboard['trend'] }) {
  const id = `revenue-${useId().replaceAll(':', '')}`;
  return (
    <section className={panel} aria-label="Xu hướng thực thu">
      <h3 className="text-lg font-extrabold">Xu hướng thực thu</h3>
      <p className="mt-1 text-sm text-muted">Doanh thu đã thanh toán theo ngày</p>
      {props.rows.length ? (
        <ChartContainer
          config={{ value: { label: 'Thực thu', color: colors[0] } }}
          className="mt-5 h-72 w-full aspect-auto"
          aria-label="Biểu đồ thực thu theo ngày"
        >
          <AreaChart
            data={props.rows.map((row) => ({ ...row, value: Number(row.amount) }))}
            accessibilityLayer
            margin={{ left: 0, right: 12, top: 12 }}
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[0]} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors[0]} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 4" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => `${value.slice(8)}/${value.slice(5, 7)}`}
              minTickGap={36}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tickFormatter={compact} width={55} axisLine={false} tickLine={false} />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => revenueLabel(Number(value))} />}
            />
            <Area
              dataKey="value"
              type="linear"
              stroke={colors[0]}
              strokeWidth={2}
              fill={`url(#${id})`}
              dot={props.rows.length === 1}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <p className="py-12 text-sm text-muted">Chưa có khoản thu trong kỳ.</p>
      )}
      <details className="mt-4 border-t border-line pt-4 text-sm">
        <summary className="cursor-pointer font-bold text-mint">Thực thu theo ngày</summary>
        <div className="mt-3 max-h-64 overflow-auto">
          <table className="w-full text-left tabular-nums">
            <thead>
              <tr>
                <th className="p-2">Ngày</th>
                <th className="p-2 text-right">Số đơn</th>
                <th className="p-2 text-right">Thực thu</th>
              </tr>
            </thead>
            <tbody>
              {props.rows.map((row) => (
                <tr key={row.date} className="border-t border-line">
                  <td className="p-2">{row.date}</td>
                  <td className="p-2 text-right">{row.orders}</td>
                  <td className="p-2 text-right whitespace-nowrap">{revenueLabel(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function RevenueBreakdown(props: {
  title: string;
  rows: ManagerDashboard['courses'];
  donut?: boolean;
}) {
  const rows = [...props.rows].sort((a, b) =>
    BigInt(a.amount) > BigInt(b.amount) ? -1 : BigInt(a.amount) < BigInt(b.amount) ? 1 : 0,
  );
  const data = (props.donut ? rows : rows.slice(0, 10)).map((row, i) => ({
    ...row,
    value: Number(row.amount),
    fill: colors[i % colors.length],
  }));
  const hasRevenue = data.some((row) => row.value > 0);
  return (
    <section className={panel} aria-label={props.title}>
      <h3 className="text-lg font-extrabold">{props.title}</h3>
      <p className="mt-1 text-sm text-muted">
        {props.donut
          ? 'Tỷ trọng thực thu theo phương thức thanh toán'
          : 'So sánh thực thu · tối đa 10 mục cao nhất'}
      </p>
      {hasRevenue ? (
        <ChartContainer
          config={{ value: { label: 'Thực thu', color: colors[0] } }}
          className="mt-5 w-full aspect-auto"
          style={{ height: props.donut ? 260 : Math.max(240, data.length * 46) }}
          aria-label={`Biểu đồ ${props.title.toLocaleLowerCase('vi-VN')}`}
        >
          {props.donut ? (
            <PieChart accessibilityLayer>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelKey="name"
                    formatter={(value) => revenueLabel(Number(value))}
                  />
                }
              />
              <Pie
                data={data.filter((row) => row.value > 0)}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="88%"
                paddingAngle={3}
                stroke="var(--color-canvas)"
                strokeWidth={3}
                isAnimationActive={false}
              />
            </PieChart>
          ) : (
            <BarChart data={data} layout="vertical" accessibilityLayer margin={{ right: 12 }}>
              <CartesianGrid horizontal={false} stroke="var(--color-line)" strokeDasharray="3 4" />
              <XAxis type="number" tickFormatter={compact} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tickFormatter={(name: string) =>
                  name.length > 15 ? `${name.slice(0, 14)}…` : name
                }
                interval={0}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => revenueLabel(Number(value))} />}
              />
              <Bar
                dataKey="value"
                fill={colors[0]}
                radius={[0, 5, 5, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            </BarChart>
          )}
        </ChartContainer>
      ) : (
        <p className="py-12 text-sm text-muted">Chưa có khoản thu trong kỳ.</p>
      )}
      {props.donut && (
        <ul className="mt-3 space-y-3">
          {data.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: row.fill }} />
              <span className="min-w-0 flex-1 break-words">{row.name}</span>
              <span className="font-bold tabular-nums">{revenueLabel(row.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      {!!rows.length && (
        <details className="mt-4 border-t border-line pt-4 text-sm">
          <summary className="cursor-pointer font-bold text-mint">Xem số liệu chi tiết</summary>
          <div className="mt-3 max-h-64 overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="p-2">Tên</th>
                  <th className="p-2 text-right">Số đơn</th>
                  <th className="p-2 text-right">Thực thu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-line">
                    <td className="p-2 break-words">{row.name}</td>
                    <td className="p-2 text-right">{row.orders}</td>
                    <td className="p-2 text-right whitespace-nowrap">{revenueLabel(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}

const leaveLabels: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  PENDING_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};
export function MentorTeachingCharts(props: { data: MentorDashboard }) {
  const summary = props.data.summary;
  const sessions = [
    { name: 'Được phân công', count: summary.assignedSessions },
    { name: 'Dạy thay', count: summary.substituteSessions },
    { name: 'Đã hoàn thành', count: summary.completedSessions },
  ];
  const leaves = props.data.leaveRequests.map((row, index) => ({
    ...row,
    name: leaveLabels[row.status] ?? row.status,
    fill: colors[index % colors.length],
  }));
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className={panel} aria-label="Hoạt động giảng dạy">
        <h3 className="text-lg font-extrabold">Hoạt động giảng dạy</h3>
        <p className="mt-1 text-sm text-muted">
          Số buổi trong kỳ · {summary.actualTeachingHours.toLocaleString('vi-VN')} giờ dạy thực tế
        </p>
        <ChartContainer
          config={{ count: { label: 'Số buổi', color: colors[0] } }}
          className="mt-5 h-64 w-full aspect-auto"
          aria-label="Biểu đồ số buổi giảng dạy"
        >
          <BarChart data={sessions} accessibilityLayer margin={{ left: -25, right: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 4" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={{ fontSize: 10 }}
            />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill={colors[0]}
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
        <p className="mt-3 text-xs text-muted">
          Buổi dạy thay và buổi hoàn thành có thể thuộc các buổi được phân công.
        </p>
      </section>
      <section className={panel} aria-label="Đơn nghỉ của bạn">
        <h3 className="text-lg font-extrabold">Đơn nghỉ của bạn</h3>
        <p className="mt-1 text-sm text-muted">Phân bổ theo trạng thái trong kỳ</p>
        {leaves.some((row) => row.count > 0) ? (
          <>
            <ChartContainer
              config={{ count: { label: 'Số đơn' } }}
              className="mt-5 h-52 w-full aspect-auto"
              aria-label="Biểu đồ trạng thái đơn nghỉ"
            >
              <PieChart accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent labelKey="name" />} />
                <Pie
                  data={leaves.filter((row) => row.count > 0)}
                  dataKey="count"
                  nameKey="name"
                  innerRadius="60%"
                  outerRadius="88%"
                  isAnimationActive={false}
                />
              </PieChart>
            </ChartContainer>
            <ul className="mt-4 space-y-2">
              {leaves.map((row) => (
                <li key={row.status} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: row.fill }} />
                  <span className="flex-1">{row.name}</span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="grid min-h-64 place-items-center text-sm text-muted">
            Không có đơn trong kỳ.
          </p>
        )}
      </section>
    </div>
  );
}
