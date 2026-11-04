'use client';

import { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { Dashboard } from '../schemas/dashboard-contracts';

export function EnrollmentTrend(props: { data: Dashboard['trend'] }) {
  const gradientId = `enrollment-${useId().replaceAll(':', '')}`;
  return (
    <section className="admin-table-panel min-w-0 p-4 sm:p-6">
      <h2 className="text-lg font-extrabold">Xu hướng đăng ký</h2>
      <p className="mt-1 text-sm text-muted">Lượt đăng ký đã xác nhận theo ngày, giờ Việt Nam</p>
      <ChartContainer
        className="mt-5 h-72 w-full aspect-auto"
        config={{
          registrations: { label: 'Lượt đăng ký', color: 'var(--color-mint)' },
        }}
        aria-label="Biểu đồ lượt đăng ký theo ngày"
      >
        <AreaChart data={props.data} accessibilityLayer margin={{ left: -20, right: 12, top: 12 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-mint)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--color-mint)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 4" />
          <XAxis
            dataKey="date"
            minTickGap={40}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: string) => `${value.slice(8)}/${value.slice(5, 7)}`}
          />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
          <ChartTooltip content={<ChartTooltipContent className="min-w-44" />} />
          <Area
            dataKey="registrations"
            type="linear"
            stroke="var(--color-mint)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-bold text-mint">Xem số liệu theo ngày</summary>
        <div className="mt-3 max-h-60 overflow-auto">
          <table className="w-full text-left tabular-nums">
            <caption className="sr-only">Lượt đăng ký theo ngày</caption>
            <thead>
              <tr>
                <th scope="col" className="p-2">
                  Ngày
                </th>
                <th scope="col" className="p-2 text-right">
                  Lượt đăng ký
                </th>
              </tr>
            </thead>
            <tbody>
              {props.data.map((row) => (
                <tr key={row.date} className="border-t border-line">
                  <th scope="row" className="p-2 font-normal">
                    {row.date}
                  </th>
                  <td className="p-2 text-right">{row.registrations.toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function DashboardRanking(props: {
  title: string;
  description: string;
  rows: Dashboard['courses'];
  metric: 'students' | 'registrations';
}) {
  const metricLabel = props.metric === 'students' ? 'Học viên' : 'Lượt đăng ký';
  const color = props.metric === 'students' ? 'var(--color-forest)' : 'var(--color-mint)';
  const maximum = Math.max(1, ...props.rows.map((row) => row[props.metric]));
  return (
    <section aria-label={props.title} className="admin-table-panel min-w-0 p-4 sm:p-6">
      <h2 className="text-lg font-extrabold">{props.title}</h2>
      <p className="mt-1 text-sm text-muted">{props.description}</p>
      {!props.rows.length ? (
        <p className="py-10 text-center text-sm text-muted">Chưa có dữ liệu để so sánh.</p>
      ) : (
        <>
          <ChartContainer
            config={{ [props.metric]: { label: metricLabel, color } }}
            className="mt-5 w-full aspect-auto"
            style={{ height: Math.max(280, props.rows.length * 42) }}
            aria-label={`Biểu đồ ${props.title.toLocaleLowerCase('vi-VN')}`}
          >
            <BarChart
              data={props.rows}
              layout="vertical"
              accessibilityLayer
              margin={{ top: 8, right: 32, left: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke="var(--color-line)" strokeDasharray="3 4" />
              <XAxis
                type="number"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                domain={[0, Math.ceil(maximum * 1.15)]}
              />
              <YAxis
                type="category"
                dataKey="id"
                width={105}
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={(tickProps) => {
                  const row = props.rows.find((item) => item.id === tickProps.payload.value);
                  const name = row?.name ?? '';
                  return (
                    <text
                      x={tickProps.x}
                      y={tickProps.y}
                      dy="0.32em"
                      textAnchor="end"
                      fill="var(--color-muted)"
                      fontSize={11}
                    >
                      <title>{name}</title>
                      {name.length > 15 ? `${name.slice(0, 14)}…` : name}
                    </text>
                  );
                }}
              />
              <ChartTooltip
                cursor={{ fill: 'var(--color-soft)' }}
                content={
                  <ChartTooltipContent
                    className="min-w-44 max-w-64"
                    labelFormatter={(id) => props.rows.find((row) => row.id === id)?.name ?? id}
                  />
                }
              />
              <Bar
                dataKey={props.metric}
                fill={color}
                radius={[0, 6, 6, 0]}
                maxBarSize={26}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey={props.metric}
                  position="right"
                  offset={8}
                  fill="var(--color-forest)"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
          <details className="mt-4 border-t border-line pt-4 text-sm">
            <summary className="cursor-pointer font-bold text-mint">Xem bảng xếp hạng</summary>
            <ol className="mt-5 space-y-4">
              {props.rows.map((row, index) => (
                <li key={row.id}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-soft text-sm font-bold text-mint">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="min-w-0 break-words font-bold">{row.name}</p>
                        <p className="text-sm font-extrabold text-mint tabular-nums">
                          {row[props.metric].toLocaleString('vi-VN')}{' '}
                          {props.metric === 'students' ? 'học viên' : 'lượt đăng ký'}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {row.classes} lớp · {row.students} học viên riêng biệt
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
    </section>
  );
}

const classStatusConfig = {
  OPEN: { label: 'Đang tuyển sinh', color: 'var(--color-mint)' },
  IN_PROGRESS: { label: 'Đang học', color: 'var(--color-forest)' },
  COMPLETED: { label: 'Hoàn thành', color: 'var(--color-coral)' },
  DRAFT: {
    label: 'Bản nháp',
    color: 'color-mix(in srgb, var(--color-mint) 25%, var(--color-canvas))',
  },
  CANCELLED: { label: 'Đã hủy', color: 'var(--color-headsup)' },
};

export function ClassDistribution(props: { data: Dashboard['classStatuses'] }) {
  const total = props.data.reduce((sum, row) => sum + row.count, 0);
  const data = Object.entries(classStatusConfig).map(([status, config]) => ({
    status,
    label: config.label,
    count: props.data.find((row) => row.status === status)?.count ?? 0,
    fill: config.color,
  }));
  return (
    <section className="admin-table-panel min-w-0 p-4 sm:p-6">
      <h2 className="text-lg font-extrabold">Trạng thái lớp học</h2>
      <p className="mt-1 text-sm text-muted">Phân bổ lớp học hiện tại</p>
      {total === 0 ? (
        <p className="grid h-52 place-items-center text-sm text-muted">Chưa có lớp học.</p>
      ) : (
        <ChartContainer
          config={classStatusConfig}
          className="mx-auto mt-4 h-52 w-full max-w-64 aspect-auto"
          aria-label="Biểu đồ phân bổ trạng thái lớp học"
        >
          <PieChart accessibilityLayer>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="status" hideLabel className="min-w-44" />}
            />
            <Pie
              data={data.filter((row) => row.count > 0)}
              dataKey="count"
              nameKey="status"
              innerRadius="68%"
              outerRadius="90%"
              paddingAngle={3}
              stroke="var(--color-canvas)"
              strokeWidth={3}
              isAnimationActive={false}
            >
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null;
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        dy="-0.1em"
                        fill="var(--color-forest)"
                        className="text-3xl font-extrabold"
                      >
                        {total.toLocaleString('vi-VN')}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        dy="1.8em"
                        fill="var(--color-muted)"
                        className="text-xs"
                      >
                        tổng lớp học
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      )}
      <dl className="mt-4 space-y-3">
        {data.map((row) => (
          <div key={row.status} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: row.fill }}
              aria-hidden="true"
            />
            <dt className="flex-1 text-muted">{row.label}</dt>
            <dd className="font-extrabold tabular-nums">
              {row.count.toLocaleString('vi-VN')}
              <span className="ml-2 inline-block w-10 text-right text-xs font-normal text-muted">
                {total ? Math.round((row.count / total) * 100) : 0}%
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
