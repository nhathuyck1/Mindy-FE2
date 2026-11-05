'use client';

import { BookOpen, Files, FolderOpen, RefreshCw } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { Course } from '@/features/courses/schemas/course-contracts';
import { useManagerMaterialCounts } from '../api/manager-material-counts';
import { ManagerCourseList } from './manager-course-list';

const colors = [
  'var(--color-mint)',
  'var(--color-forest)',
  'var(--color-coral)',
  'var(--color-headsup)',
  'color-mix(in srgb, var(--color-mint) 55%, var(--color-canvas))',
  'color-mix(in srgb, var(--color-forest) 70%, var(--color-coral))',
];
const percent = new Intl.NumberFormat('vi-VN', {
  style: 'percent',
  maximumFractionDigits: 1,
});

export function ManagerMaterialsDashboard(props: {
  courses: Course[];
  onSelect: (id: string) => void;
}) {
  const counts = useManagerMaterialCounts(props.courses);
  const pending = counts.some((query) => query.isPending);
  const error = counts.some((query) => query.isError);
  const ready = !pending && !error;
  const total = counts.reduce((sum, query) => sum + (query.data ?? 0), 0);
  const withMaterials = counts.filter((query) => (query.data ?? 0) > 0).length;
  const rows = props.courses.map((course, index) => ({
    ...course,
    count: counts[index]?.isError ? undefined : counts[index]?.data,
    fill: colors[index % colors.length],
  }));
  const distribution = rows.filter((row) => (row.count ?? 0) > 0);
  const config = Object.fromEntries(
    rows.map((row) => [row.id, { label: row.title, color: row.fill }]),
  );
  const stats = [
    { label: 'Tổng tài liệu', value: ready ? total : null, icon: Files },
    { label: 'Tổng khóa học', value: props.courses.length, icon: BookOpen },
    { label: 'Khóa học có tài liệu', value: ready ? withMaterials : null, icon: FolderOpen },
  ];

  return (
    <div className="space-y-6">
      <section aria-label="Thống kê tài liệu" className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-2xl border border-line bg-canvas p-5"
          >
            <span className="rounded-xl bg-mint/10 p-3 text-mint">
              <stat.icon aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {stat.value?.toLocaleString('vi-VN') ?? '—'}
              </p>
            </div>
          </div>
        ))}
      </section>
      <section
        aria-label="Tỷ lệ tài liệu theo khóa học"
        className="admin-table-panel min-w-0 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Tỷ lệ tài liệu theo khóa học</h2>
            <p className="mt-1 text-sm text-muted">
              Số tài liệu của mỗi khóa trên tổng tài liệu, gồm mọi trạng thái duyệt.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={counts.some((query) => query.isFetching) || !counts.length}
            onClick={() =>
              counts.forEach((query) => {
                void query.refetch();
              })
            }
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Làm mới thống kê
          </Button>
        </div>
        {error ? (
          <p role="alert" className="mt-5 rounded-xl bg-peach p-4 text-sm">
            Chưa tải được đầy đủ số lượng tài liệu. Hãy làm mới thống kê để thử lại.
          </p>
        ) : pending ? (
          <p role="status" className="py-12 text-center text-sm text-muted">
            Đang tải thống kê tài liệu…
          </p>
        ) : total === 0 ? (
          <p role="status" className="py-12 text-center text-sm text-muted">
            Chưa có tài liệu để hiển thị tỷ lệ.
          </p>
        ) : (
          <div className="mt-5 grid min-w-0 items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <ChartContainer
              config={config}
              className="mx-auto h-64 w-full max-w-80 aspect-auto"
              aria-label="Biểu đồ tròn tỷ lệ tài liệu theo khóa học"
            >
              <PieChart accessibilityLayer>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="id"
                      hideLabel
                      className="max-w-64"
                      formatter={(value, name) => {
                        const row = rows.find((item) => item.id === name);
                        const count = Number(value);
                        return (
                          <div className="space-y-1">
                            <p className="font-semibold break-words">{row?.title}</p>
                            <p>
                              {count.toLocaleString('vi-VN')} tài liệu ·{' '}
                              {percent.format(count / total)}
                            </p>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Pie
                  data={distribution}
                  dataKey="count"
                  nameKey="id"
                  innerRadius="65%"
                  outerRadius="90%"
                  paddingAngle={distribution.length > 1 ? 3 : 0}
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
                            className="text-3xl font-bold"
                          >
                            {total.toLocaleString('vi-VN')}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            dy="1.8em"
                            fill="var(--color-muted)"
                            className="text-xs"
                          >
                            tài liệu
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul
              aria-label="Số lượng và tỷ lệ tài liệu"
              className="scrollbar-hidden max-h-72 min-w-0 divide-y divide-line overflow-y-auto"
            >
              {distribution.map((row) => (
                <li key={row.id} className="flex min-w-0 items-center gap-3 py-3">
                  <span
                    aria-hidden="true"
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: row.fill }}
                  />
                  <span className="min-w-0 flex-1 text-sm font-semibold break-words">
                    {row.title}
                  </span>
                  <span className="shrink-0 text-right text-sm tabular-nums">
                    <span className="block font-bold">
                      {percent.format((row.count ?? 0) / total)}
                    </span>
                    <span className="text-xs text-muted">
                      {row.count?.toLocaleString('vi-VN')} tài liệu
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <ManagerCourseList
        courses={props.courses}
        counts={Object.fromEntries(rows.map((row) => [row.id, row.count]))}
        onSelect={props.onSelect}
      />
    </div>
  );
}
