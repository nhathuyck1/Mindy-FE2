import { BookOpen, Files, FolderOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function MaterialCount(props: { value?: number | null; pending: boolean; label: string }) {
  if (props.pending)
    return (
      <span
        role="status"
        aria-label={props.label}
        aria-busy="true"
        className="inline-flex min-h-[1em] items-center align-middle"
      >
        <span
          aria-hidden="true"
          data-slot="skeleton"
          className="inline-block h-[0.8em] w-[2.5ch] animate-pulse rounded bg-mint/10 motion-reduce:animate-none"
        />
      </span>
    );
  return props.value == null ? (
    <>
      <span>—</span>
      <span className="sr-only">Chưa tải được số lượng</span>
    </>
  ) : (
    props.value.toLocaleString('vi-VN')
  );
}

export function MaterialsDistributionLoading() {
  return (
    <div
      role="status"
      aria-label="Đang tải thống kê tài liệu"
      aria-busy="true"
      className="mt-5 grid min-w-0 items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
    >
      <span className="sr-only">Đang tải thống kê tài liệu…</span>
      <div aria-hidden="true" className="grid h-64 place-items-center">
        <div
          data-slot="skeleton"
          className="size-52 animate-pulse rounded-full border-[24px] border-line/70 motion-reduce:animate-none"
        />
      </div>
      <div aria-hidden="true" className="min-w-0 divide-y divide-line">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex min-h-16 items-center gap-3 py-3">
            <Skeleton className="size-3 shrink-0 rounded-full motion-reduce:animate-none" />
            <Skeleton className="h-4 w-2/3 max-w-64 motion-reduce:animate-none" />
            <div className="ml-auto space-y-2">
              <Skeleton className="h-4 w-12 motion-reduce:animate-none" />
              <Skeleton className="h-3 w-16 motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ManagerMaterialsLoading() {
  const stats = [
    { label: 'Tổng tài liệu', icon: Files },
    { label: 'Tổng khóa học', icon: BookOpen },
    { label: 'Khóa học có tài liệu', icon: FolderOpen },
  ];
  return (
    <div
      role="status"
      aria-label="Đang tải danh sách khóa học"
      aria-busy="true"
      className="space-y-6"
    >
      <span className="sr-only">Đang tải danh sách khóa học…</span>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-2xl border border-line bg-canvas p-5"
          >
            <span className="rounded-xl bg-mint/10 p-3 text-mint">
              <stat.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted">{stat.label}</p>
              <Skeleton className="mt-1 h-9 w-16 motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
      <div className="admin-table-panel min-w-0 p-5 sm:p-6">
        <div aria-hidden="true" className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Tỷ lệ tài liệu theo khóa học</h2>
            <p className="mt-1 text-sm text-muted">
              Số tài liệu của mỗi khóa trên tổng tài liệu, gồm mọi trạng thái duyệt.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="size-4" />
            Làm mới thống kê
          </Button>
        </div>
        <MaterialsDistributionLoading />
      </div>
      <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-line bg-canvas">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-5 sm:px-6">
          <h2 className="text-lg font-bold">Danh sách khóa học</h2>
          <Skeleton className="h-5 w-20 motion-reduce:animate-none" />
        </div>
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex min-h-24 items-center gap-4 border-b border-line px-5 py-5 last:border-b-0 sm:px-6"
          >
            <Skeleton className="size-12 shrink-0 rounded-xl motion-reduce:animate-none" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4 max-w-80 motion-reduce:animate-none" />
              <Skeleton className="h-4 w-20 motion-reduce:animate-none" />
            </div>
            <Skeleton className="hidden h-9 w-24 motion-reduce:animate-none sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
