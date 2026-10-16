'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

import Link from 'next/link';
import { useState, type ComponentProps } from 'react';
import { Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Icon } from '@/components/ui/icon';
import { useAdminList } from '../api/admin-queries';
import { useAdminOverview, type AdminOverviewQueries } from '../api/admin-overview-queries';
import { formatAdminDate } from '../lib/admin-resources';
import { coursesByClassCount, monthlyActivity } from '../lib/admin-overview';
import {
  ActivityChart,
  ClassStatusChart,
  UserRolesChart,
  OverviewDataState,
} from './admin-overview-charts';
import { AdminQueryState } from './admin-query-state';
import { AdminStatus } from './admin-status';
import { StatCardSkeleton } from '@/components/ui/loading-skeletons';

function OverviewCard(props: {
  label: string;
  icon: ComponentProps<typeof Icon>['name'];
  href: string;
  color: string;
  query: {
    data?: readonly { createdAt: string }[];
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => unknown;
  };
  now: Date;
  value?: number;
  note?: string;
}) {
  const { query } = props;
  if (query.isPending)
    return (
      <StatCardSkeleton
        label={`Đang tải ${props.label.toLocaleLowerCase('vi-VN')}`}
        className="p-5 sm:p-5"
      />
    );
  const data = monthlyActivity(query.data ?? [], [], 6, props.now);
  const value = props.value ?? query.data?.length;
  const hasData = query.data !== undefined && !query.isError;
  return (
    <Card className="gap-3 p-5">
      <div className="flex items-start gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl"
          style={{
            color: props.color,
            backgroundColor: `color-mix(in srgb, ${props.color} 9%, var(--color-canvas))`,
          }}
        >
          <Icon name={props.icon} className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-muted">
            <Link href={props.href} className="hover:text-mint">
              {props.label}
            </Link>
          </h2>
          {hasData ? (
            <p
              className="mt-1 text-4xl leading-tight font-extrabold tracking-tight tabular-nums"
              aria-label={`${props.label}: ${value}`}
            >
              {value?.toLocaleString('vi-VN')}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Chưa tải được số liệu</p>
          )}
        </div>
      </div>
      <div className="flex min-h-9 items-center justify-between gap-2">
        {hasData ? (
          <p className="text-xs text-muted">
            {props.note ?? `${data.at(-1)?.users ?? 0} mới trong tháng`}
          </p>
        ) : (
          <Button variant="link" size="unstyled" onClick={() => query.refetch()}>
            Thử lại
          </Button>
        )}
        {hasData && !props.note && (
          <ChartContainer
            config={{ users: { label: 'Tạo mới', color: props.color } }}
            className="h-9 w-20 shrink-0 aspect-auto"
            aria-label={`${props.label}, số tạo mới trong 6 tháng`}
          >
            <AreaChart
              data={data}
              accessibilityLayer
              margin={{ left: 1, right: 1, top: 4, bottom: 1 }}
            >
              <Area
                dataKey="users"
                type="monotone"
                stroke={props.color}
                fill={props.color}
                fillOpacity={0.09}
                strokeWidth={1.7}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </Card>
  );
}

function PopularCourses(props: { queries: AdminOverviewQueries }) {
  const { courses, classes } = props.queries;
  const ranked = coursesByClassCount(courses.data ?? [], classes.data ?? []);
  const max = Math.max(1, ...ranked.map((course) => course.classCount));
  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2 px-5">
        <h2 className="text-base font-extrabold">Khóa học theo số lớp</h2>
        <Link href="/admin/courses" className="text-xs font-bold text-mint">
          Xem tất cả →
        </Link>
      </CardHeader>
      <CardContent className="px-5">
        {!courses.data || !classes.data || courses.isError || classes.isError ? (
          <OverviewDataState queries={[courses, classes]} />
        ) : !ranked.length ? (
          <p className="py-12 text-center text-sm text-muted">Chưa có khóa học.</p>
        ) : (
          <ol className="divide-y divide-line/70">
            {ranked.map((course, index) => (
              <li key={course.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-soft text-xs font-extrabold text-mint">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold" title={course.title}>
                      {course.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">{course.classCount} lớp học</p>
                    <div aria-hidden="true" className="mt-2 h-1 rounded-full bg-soft">
                      <div
                        className="h-full rounded-full bg-mint"
                        style={{ width: `${(course.classCount / max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminOverview() {
  const classes = useAdminList('classes', { page: 1, pageSize: 5 });
  const overview = useAdminOverview();
  const [now, setNow] = useState(() => new Date());
  const refreshing = Object.values(overview).some((query) => query.isFetching);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow mb-2 text-muted">Mindy Admin</p>
          <h1 className="text-[34px] font-extrabold tracking-tight sm:text-[38px]">
            Tổng quan đào tạo
          </h1>
          <p className="mt-2 text-base text-muted">
            Theo dõi hoạt động và nhịp phát triển của Mindy.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="unstyled"
            size="unstyled"
            className="admin-button"
            disabled={refreshing}
            onClick={() => {
              setNow(new Date());
              for (const query of Object.values(overview)) void query.refetch();
              void classes.refetch();
            }}
          >
            <Icon
              name="refresh"
              className={`size-4 ${refreshing ? 'motion-safe:animate-spin' : ''}`}
            />
            Làm mới
          </Button>
          <Link href="/admin/workflow" className="admin-button">
            <Icon name="layers" className="size-4" />
            Quy trình vận hành
            <Icon name="arrow" className="size-4" />
          </Link>
        </div>
      </div>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          label="Tổng người dùng"
          icon="users"
          href="/admin/users"
          query={overview.users}
          color="var(--color-mint)"
          now={now}
        />
        <OverviewCard
          label="Tổng khóa học"
          icon="book"
          href="/admin/courses"
          query={overview.courses}
          color="var(--color-coral)"
          now={now}
        />
        <OverviewCard
          label="Tổng lớp học"
          icon="layers"
          href="/admin/classes"
          query={overview.classes}
          color="var(--color-forest)"
          now={now}
        />
        <OverviewCard
          label="Đang tuyển sinh"
          icon="calendar"
          href="/admin/classes"
          query={overview.classes}
          color="var(--color-status-green)"
          now={now}
          value={overview.classes.data?.filter((item) => item.status === 'OPEN').length}
          note="Lớp đang nhận đăng ký"
        />
      </div>
      <div className="mb-5 grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ActivityChart queries={overview} now={now} />
        <ClassStatusChart query={overview.classes} />
      </div>
      <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <section className="admin-table-panel min-w-0 md:col-span-2 xl:col-span-1">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
            <div>
              <h2 className="text-lg font-extrabold">Lớp học trong hệ thống</h2>
              <p className="mt-1 text-sm text-muted">5 lớp đầu tiên trong danh sách quản trị</p>
            </div>
            <Link href="/admin/classes" className="text-sm font-extrabold text-mint">
              Xem tất cả →
            </Link>
          </div>
          {classes.isPending || classes.isError ? (
            <AdminQueryState
              loading={classes.isPending}
              columns={4}
              error={classes.error}
              onRetry={() => classes.refetch()}
            />
          ) : !classes.data.items.length ? (
            <p className="p-10 text-center text-base text-muted">Chưa có lớp học.</p>
          ) : (
            <Table className="admin-data-table min-w-0 table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Lớp học</TableHead>
                  <TableHead scope="col" className="w-44">
                    Trạng thái
                  </TableHead>
                  <TableHead scope="col" className="hidden w-36 sm:table-cell">
                    Khai giảng
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.data.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableHead scope="row">
                      <p className="truncate font-extrabold text-muted" title={row.name}>
                        {row.name}
                      </p>
                    </TableHead>
                    <TableCell className="overflow-hidden">
                      <AdminStatus status={row.status} />
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">
                      {formatAdminDate(row.date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
        <PopularCourses queries={overview} />
        <UserRolesChart query={overview.users} />
      </div>
    </>
  );
}
