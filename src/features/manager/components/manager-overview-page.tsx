'use client';

import Link from 'next/link';
import { AnalyticsDashboard } from '@/features/dashboard/components/analytics-dashboard';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCheck,
  Clock3,
  FileText,
  PencilLine,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { materialsSchema } from '../schemas/manager-contracts';
import { useManagerQuery } from '../api/manager-queries';
import { ManagerPendingMaterials } from './manager-pending-materials';
import { ManagerPendingLeaves } from './manager-pending-leaves';

const statuses = [
  { title: 'Chờ duyệt', status: 'PENDING_REVIEW', icon: Clock3, tone: 'text-coral' },
  { title: 'Đã duyệt', status: 'APPROVED', icon: CheckCheck, tone: 'text-mint' },
  { title: 'Bản nháp', status: 'DRAFT', icon: PencilLine, tone: 'text-forest' },
] as const;

export function ManagerOverviewPage() {
  const pending = useManagerQuery(
    'manager/materials?page=1&pageSize=1&reviewStatus=PENDING_REVIEW',
    materialsSchema,
  );
  const approved = useManagerQuery(
    'manager/materials?page=1&pageSize=1&reviewStatus=APPROVED',
    materialsSchema,
  );
  const drafts = useManagerQuery(
    'manager/materials?page=1&pageSize=1&reviewStatus=DRAFT',
    materialsSchema,
  );
  const counts = [
    { ...statuses[0], query: pending },
    { ...statuses[1], query: approved },
    { ...statuses[2], query: drafts },
  ];

  return (
    <div className="space-y-7">
      <header className="admin-page-heading">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tổng quan Manager</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/manager/schedule">
              <CalendarDays aria-hidden="true" className="size-4" />
              Lịch và khai giảng
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/manager/materials?view=inventory&reviewStatus=PENDING_REVIEW">
              <FileText aria-hidden="true" className="size-4" />
              Quản lý tài liệu
            </Link>
          </Button>
          <Button asChild>
            <Link href="/manager/collections">
              <Wallet aria-hidden="true" className="size-4" />
              Thu tiền
            </Link>
          </Button>
        </div>
      </header>

      <section aria-label="Thống kê tài liệu" className="space-y-3">
        <h2 className="text-lg font-bold">Tài liệu</h2>
        <div className="grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {counts.map((item) => (
            <div key={item.status} className="min-w-0">
              {item.query.isError ? (
                <div
                  className="flex min-h-20 flex-wrap items-center justify-between gap-2 px-4 py-3"
                  role="alert"
                >
                  <span className="text-sm">{item.title}: chưa tải được</span>
                  <Button variant="outline" onClick={() => void item.query.refetch()}>
                    Thử lại
                  </Button>
                </div>
              ) : (
                <Link
                  href={`/manager/materials?view=inventory&reviewStatus=${item.status}`}
                  aria-label={
                    item.query.data ? `${item.title}: ${item.query.data.total}` : item.title
                  }
                  className="group flex min-h-20 items-center gap-3 px-4 py-4 transition-colors hover:bg-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mint"
                >
                  <item.icon aria-hidden="true" className={`size-5 shrink-0 ${item.tone}`} />
                  <span className="flex-1 text-sm font-semibold">{item.title}</span>
                  <span
                    aria-live="polite"
                    className="text-2xl font-extrabold text-forest tabular-nums"
                  >
                    {item.query.isPending ? (
                      <span className="text-sm font-normal text-muted">Đang tải…</span>
                    ) : (
                      item.query.data?.total.toLocaleString('vi-VN')
                    )}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted group-hover:text-mint"
                  />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <AnalyticsDashboard audience="manager" embedded />

      <ManagerPendingMaterials
        onRefresh={() => {
          void pending.refetch();
          void approved.refetch();
          void drafts.refetch();
        }}
      />

      <ManagerPendingLeaves />
    </div>
  );
}
