'use client';

import Link from 'next/link';
import { CheckCheck, Clock3, FileText, PencilLine, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { materialsSchema } from '../schemas/manager-contracts';
import { useManagerQuery } from '../api/manager-queries';
import { ManagerState } from './manager-shared';
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
          <p className="mb-2 text-xs font-semibold tracking-widest text-mint uppercase">
            Mindy / Không gian Manager
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Tổng quan Manager</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Theo dõi tài liệu và đơn xin nghỉ cần xử lý, mở nhanh các công việc quản lý.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
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

      <section aria-label="Thống kê tài liệu" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {counts.map((item) => (
          <article
            key={item.status}
            className="min-w-0 rounded-2xl border border-line bg-canvas p-5 transition-colors hover:border-mint"
          >
            <Link
              href={`/manager/materials?view=inventory&reviewStatus=${item.status}`}
              className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            >
              <item.icon aria-hidden="true" className={`size-5 ${item.tone}`} />
              <span className="font-bold">{item.title}</span>
            </Link>
            <ManagerState
              pending={item.query.isPending}
              error={item.query.error}
              retry={() => void item.query.refetch()}
            >
              {item.query.data && (
                <Link
                  href={`/manager/materials?view=inventory&reviewStatus=${item.status}`}
                  className="mt-4 block text-3xl font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                  aria-label={`${item.title}: ${item.query.data.total}`}
                  aria-live="polite"
                >
                  {item.query.data.total.toLocaleString('vi-VN')}
                </Link>
              )}
            </ManagerState>
            <Link
              href={`/manager/materials?view=inventory&reviewStatus=${item.status}`}
              className="mt-2 inline-flex min-h-11 items-center text-sm text-muted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            >
              Mở danh sách lọc
            </Link>
          </article>
        ))}
      </section>

      <ManagerPendingMaterials
        onRefresh={() => {
          void pending.refetch();
          void approved.refetch();
          void drafts.refetch();
        }}
      />

      <ManagerPendingLeaves />

      <section className="admin-table-panel p-5 sm:p-6">
        <h2 className="text-lg font-extrabold">Công việc Manager</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Chọn Quản lý tài liệu để mở danh sách khóa học và chương. Đơn xin nghỉ mở hàng chờ duyệt
          mentor. Mục Thu tiền mở danh sách phiếu thu hiện có.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/manager/materials">Danh sách khóa học</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/manager/leave-requests">Đơn xin nghỉ</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/manager/collections">Mở Thu tiền</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
