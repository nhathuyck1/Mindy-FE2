'use client';

import { useId, useState, type ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ChartSkeleton } from '@/components/ui/loading-skeletons';
import type { AdminOverviewQueries } from '../api/admin-overview-queries';
import { countValues, monthlyActivity } from '../lib/admin-overview';
import { roleLabels, statusLabels } from '../lib/admin-resources';
import { AdminQueryState } from './admin-query-state';

const activityConfig = {
  users: { label: 'Người dùng mới', color: 'var(--color-mint)' },
  classes: { label: 'Lớp học mới', color: 'var(--color-coral)' },
} satisfies ChartConfig;

const classConfig = {
  count: { label: 'Lớp học', color: 'var(--color-mint)' },
} satisfies ChartConfig;

const roleConfig = {
  STUDENT: { label: 'Học viên', color: 'var(--color-mint)' },
  MENTOR: { label: 'Giảng viên', color: 'var(--color-forest)' },
  MANAGER: { label: 'Quản lý', color: 'var(--color-coral)' },
  ADMIN: { label: 'Quản trị viên', color: 'var(--color-sunshine)' },
} satisfies ChartConfig;

type QueryState = {
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => unknown;
};

export function OverviewDataState(props: { queries: readonly QueryState[] }) {
  const failed = props.queries.find((query) => query.isError);
  if (!failed) return <ChartSkeleton />;
  return (
    <AdminQueryState
      loading={false}
      error={failed.error}
      onRetry={() => {
        for (const query of props.queries) void query.refetch();
      }}
    />
  );
}

function ChartPanel(props: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3 px-5 sm:px-6">
        <div>
          <h2 className="text-base font-extrabold">{props.title}</h2>
          {props.description && <p className="mt-1 text-xs text-muted">{props.description}</p>}
        </div>
        {props.action}
      </CardHeader>
      <CardContent className="min-w-0 px-3 sm:px-5">{props.children}</CardContent>
    </Card>
  );
}

export function ActivityChart(props: { queries: AdminOverviewQueries; now: Date }) {
  const [months, setMonths] = useState(6);
  const gradientId = useId().replaceAll(':', '');
  const { users, classes } = props.queries;
  const data = monthlyActivity(users.data ?? [], classes.data ?? [], months, props.now);
  const hasData = data.some((item) => item.users || item.classes);
  return (
    <ChartPanel
      title="Hoạt động theo thời gian"
      description="Số người dùng và lớp học mới theo tháng"
      action={
        <NativeSelect
          aria-label="Khoảng thời gian biểu đồ"
          value={months}
          className="h-10 rounded-lg text-xs"
          onChange={(event) => setMonths(Number(event.target.value))}
        >
          {[3, 6, 12].map((value) => (
            <NativeSelectOption key={value} value={value}>
              {value} tháng gần đây
            </NativeSelectOption>
          ))}
        </NativeSelect>
      }
    >
      {!users.data || !classes.data || users.isError || classes.isError ? (
        <OverviewDataState queries={[users, classes]} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 px-2 text-xs text-muted">
            {Object.entries(activityConfig).map(([key, config]) => (
              <span key={key} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-4 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                {config.label}
              </span>
            ))}
          </div>
          {!hasData && (
            <p role="status" className="mb-3 px-2 text-xs text-muted">
              Chưa có hoạt động mới trong khoảng thời gian này.
            </p>
          )}
          <ChartContainer
            config={activityConfig}
            className="h-64 w-full aspect-auto"
            aria-label="Biểu đồ người dùng và lớp học mới theo tháng"
          >
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`${gradientId}-users`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-mint)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--color-mint)" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id={`${gradientId}-classes`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-coral)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="var(--color-coral)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 4" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={18}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, 'auto']}
              />
              <ChartTooltip content={<ChartTooltipContent className="text-sm" />} />
              <Area
                type="monotone"
                dataKey="classes"
                stroke="var(--color-coral)"
                fill={`url(#${gradientId}-classes)`}
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="var(--color-mint)"
                fill={`url(#${gradientId}-users)`}
                strokeWidth={2.5}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
          <details className="mt-4 px-2 text-xs text-muted">
            <summary className="w-fit cursor-pointer font-bold hover:text-mint">
              Xem số liệu theo tháng
            </summary>
            <dl className="mt-3 grid gap-2" aria-label="Số liệu hoạt động theo tháng">
              {data.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-wrap justify-between gap-2 border-b border-line/60 pb-2"
                >
                  <dt>{item.label}</dt>
                  <dd>
                    {item.users} người dùng · {item.classes} lớp học
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        </>
      )}
    </ChartPanel>
  );
}

export function ClassStatusChart(props: { query: AdminOverviewQueries['classes'] }) {
  const counts = countValues(props.query.data ?? [], (item) => item.status);
  const statuses = [
    ['DRAFT', 'Nháp'],
    ['OPEN', 'Tuyển sinh'],
    ['IN_PROGRESS', 'Đang học'],
    ['COMPLETED', 'Hoàn thành'],
    ['CANCELLED', 'Đã hủy'],
  ] as const;
  const data = statuses.map(([status, label]) => ({
    status,
    label,
    count: counts.get(status) ?? 0,
  }));
  const active = (counts.get('OPEN') ?? 0) + (counts.get('IN_PROGRESS') ?? 0);
  return (
    <ChartPanel title="Trạng thái lớp học" description="Phân bổ lớp học trong toàn hệ thống">
      {!props.query.data || props.query.isError ? (
        <OverviewDataState queries={[props.query]} />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-x-8 gap-y-3 px-2">
            <div>
              <p className="text-xs text-muted">Đang tuyển sinh & đang học</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">
                {active}
                <span className="ml-2 text-xs font-semibold text-muted">
                  / {props.query.data.length} lớp
                </span>
              </p>
            </div>
          </div>
          <ChartContainer
            config={classConfig}
            className="h-52 w-full aspect-auto"
            aria-label="Biểu đồ số lớp theo trạng thái"
          >
            <BarChart
              accessibilityLayer
              data={data}
              margin={{ top: 12, right: 6, left: -25, bottom: 0 }}
              barSize={36}
            >
              <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 4" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval="preserveStartEnd"
                minTickGap={8}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} domain={[0, 'auto']} />
              <ChartTooltip
                cursor={{ fill: 'var(--color-soft)' }}
                content={
                  <ChartTooltipContent
                    className="text-sm"
                    labelFormatter={(_, payload) => {
                      const entry = data.find((item) => item.label === payload[0]?.payload?.label);
                      return entry ? statusLabels[entry.status] : '';
                    }}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--color-mint)"
                radius={[5, 5, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
          <details className="mt-4 px-2 text-xs text-muted">
            <summary className="w-fit cursor-pointer font-bold hover:text-mint">
              Xem số liệu trạng thái
            </summary>
            <dl className="mt-3 space-y-2">
              {data.map((item) => (
                <div key={item.status} className="flex justify-between gap-2">
                  <dt>{statusLabels[item.status]}</dt>
                  <dd className="font-bold tabular-nums">{item.count}</dd>
                </div>
              ))}
            </dl>
          </details>
        </>
      )}
    </ChartPanel>
  );
}

export function UserRolesChart(props: { query: AdminOverviewQueries['users'] }) {
  const counts = countValues(props.query.data ?? [], (item) => item.role);
  const data = Object.entries(roleConfig).map(([role, config]) => ({
    role,
    count: counts.get(role) ?? 0,
    fill: config.color,
  }));
  const total = props.query.data?.length ?? 0;
  return (
    <ChartPanel title="Vai trò tài khoản">
      {!props.query.data || props.query.isError ? (
        <OverviewDataState queries={[props.query]} />
      ) : !total ? (
        <p className="py-16 text-center text-sm text-muted">Chưa có người dùng.</p>
      ) : (
        <>
          <ChartContainer
            config={roleConfig}
            className="mx-auto h-48 w-full max-w-64 aspect-auto"
            aria-label="Biểu đồ tỷ lệ vai trò tài khoản"
          >
            <PieChart accessibilityLayer>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="role" hideLabel className="text-sm" />}
              />
              <Pie
                data={data.filter((item) => item.count > 0)}
                dataKey="count"
                nameKey="role"
                innerRadius="70%"
                outerRadius="94%"
                stroke="var(--color-canvas)"
                strokeWidth={3}
                isAnimationActive={false}
              >
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !('cx' in viewBox)) return null;
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          dy="-0.2em"
                          className="fill-foreground text-3xl font-extrabold"
                        >
                          {total.toLocaleString('vi-VN')}
                        </tspan>
                        <tspan x={viewBox.cx} dy="1.9em" className="fill-muted text-xs">
                          tài khoản
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <dl className="mt-4 space-y-3 px-2">
            {data.map((item) => (
              <div key={item.role} className="flex items-center justify-between gap-2 text-xs">
                <dt className="flex items-center gap-2 text-muted">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  {roleLabels[item.role]}
                </dt>
                <dd className="font-extrabold tabular-nums">
                  {item.count}{' '}
                  <span className="ml-1 font-normal text-muted">
                    ({Math.round((item.count / total) * 100)}%)
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </ChartPanel>
  );
}
