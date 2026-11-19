'use client';

import { useId, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ApiError } from '@/lib/api/client';
import { useSession } from '@/features/auth/api/auth-queries';
import { useDashboard } from '../api/dashboard-queries';
import type { DashboardAudience } from '../schemas/dashboard-contracts';
import { ClassDistribution, DashboardRanking, EnrollmentTrend } from './dashboard-charts';
import { RoleDashboard } from './role-dashboard';

export function AnalyticsDashboard(props: { audience: DashboardAudience; embedded?: boolean }) {
  if (props.audience !== 'admin')
    return <RoleDashboard audience={props.audience} embedded={props.embedded} />;
  return <AdminAnalyticsDashboard {...props} audience="admin" />;
}
function AdminAnalyticsDashboard(props: { audience: 'admin'; embedded?: boolean }) {
  const [days, setDays] = useState(90);
  const filterId = useId();
  const session = useSession();
  const query = useDashboard(props.audience, days);
  const mentor = false;
  const data = query.data;
  if (session.data?.role !== props.audience.toUpperCase()) return null;
  const Heading = props.embedded ? 'h2' : 'h1';
  const statistics = data
    ? [
        { label: 'Khóa học', value: data.summary.courses, note: 'Tổng hiện tại' },
        {
          label: 'Lớp học',
          value: data.summary.classes,
          note: `${data.summary.openClasses} tuyển sinh · ${data.summary.activeClasses} đang học`,
        },
        {
          label: 'Lượt đăng ký',
          value: data.summary.registrations,
          note: `Trong ${days} ngày đã chọn`,
        },
        {
          label: 'Học viên riêng biệt',
          value: data.summary.students,
          note: 'Mỗi học viên chỉ tính một lần trong kỳ',
        },
      ]
    : [];

  return (
    <section aria-label="Dashboard đào tạo" className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {mentor ? 'Tổng quan giảng dạy' : 'Tổng quan đào tạo'}
          </Heading>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor={filterId} className="mb-1 block text-xs font-bold text-muted">
              Khoảng thời gian đăng ký
            </label>
            <NativeSelect
              id={filterId}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              <NativeSelectOption value={30}>30 ngày qua</NativeSelectOption>
              <NativeSelectOption value={90}>90 ngày qua</NativeSelectOption>
              <NativeSelectOption value={365}>365 ngày qua</NativeSelectOption>
            </NativeSelect>
          </div>
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Làm mới
          </Button>
        </div>
      </header>

      {query.isPending ? (
        <div role="status" className="admin-table-panel p-8 text-muted">
          Đang tải số liệu dashboard…
        </div>
      ) : query.isError ? (
        <div role="alert" className="admin-table-panel space-y-3 p-6">
          <p className="font-bold">Chưa tải được dashboard</p>
          <p className="text-sm text-muted">
            {query.error instanceof ApiError && query.error.code === 'DASHBOARD_SCHEMA_NOT_READY'
              ? query.error.message
              : 'Vui lòng thử lại. Số liệu sẽ hiển thị khi hệ thống kết nối thành công.'}
          </p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : (
        data && (
          <>
            <div className="admin-table-panel grid sm:grid-cols-2 xl:grid-cols-4">
              {statistics.map((item) => (
                <article
                  key={item.label}
                  className="min-w-0 border-b border-line p-5 last:border-b-0 sm:odd:border-r sm:nth-last-[-n+2]:border-b-0 xl:border-r xl:border-b-0 xl:last:border-r-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-muted">{item.label}</h3>
                  </div>
                  <p className="mt-2 text-3xl font-semibold tabular-nums">
                    {item.value.toLocaleString('vi-VN')}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">{item.note}</p>
                </article>
              ))}
            </div>
            {data.summary.registrations === 0 && (
              <p role="status" className="rounded-xl bg-soft p-4 text-sm text-forest">
                Chưa có đăng ký đã xác nhận trong khoảng thời gian này. Bạn có thể chọn khoảng thời
                gian khác.
              </p>
            )}
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <EnrollmentTrend data={data.trend} />
              <ClassDistribution data={data.classStatuses} />
            </div>
            {
              <div className="grid items-start gap-5 lg:grid-cols-2">
                <DashboardRanking
                  title="Khóa học được đăng ký nhiều nhất"
                  description={`Top 10 theo lượt đăng ký trong ${days} ngày`}
                  rows={data.courses}
                  metric="registrations"
                />
                {mentor ? (
                  <DashboardRanking
                    title="So sánh các lớp của tôi"
                    description="Top 10 lớp phụ trách chính theo lượt đăng ký"
                    rows={data.classes}
                    metric="registrations"
                  />
                ) : (
                  <DashboardRanking
                    title="Mentor có nhiều học viên nhất"
                    description="Top 10 theo số học viên riêng biệt trong kỳ; tính theo mentor phụ trách chính hiện tại"
                    rows={data.mentors}
                    metric="students"
                  />
                )}
              </div>
            }
          </>
        )
      )}
    </section>
  );
}
