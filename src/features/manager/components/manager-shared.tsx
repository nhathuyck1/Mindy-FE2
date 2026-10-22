'use client';
import { Button } from '@/components/ui/button';
import { managerError } from '../api/manager-queries';

export const reviewLabels = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Cần chỉnh sửa',
};
export const typeLabels = { ARTICLE: 'Bài viết', FILE: 'Tệp tài liệu', VIDEO: 'Video' };
export function ReviewBadge(props: { status: keyof typeof reviewLabels }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${props.status === 'PENDING_REVIEW' || props.status === 'REJECTED' ? 'bg-peach text-forest' : props.status === 'APPROVED' ? 'bg-mint/10 text-forest' : 'bg-soft text-muted'}`}
    >
      {reviewLabels[props.status]}
    </span>
  );
}
export function ManagerState(props: {
  pending: boolean;
  error: unknown;
  errorMessage?: string;
  retry: () => unknown;
  children: React.ReactNode;
}) {
  if (props.pending)
    return (
      <p role="status" className="p-8 text-muted">
        Đang tải dữ liệu…
      </p>
    );
  if (props.error)
    return (
      <div role="alert" className="space-y-3 rounded-xl bg-peach p-6">
        <p>{props.errorMessage ?? managerError(props.error)}</p>
        <Button variant="outline" onClick={() => props.retry()}>
          Thử lại
        </Button>
      </div>
    );
  return props.children;
}
export function managerDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}
export function ManagerPagination(props: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4 text-sm text-muted">
      <span>
        {props.total} tài liệu · Trang {props.page}/{Math.max(1, Math.ceil(props.total / 20))}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={props.page <= 1}
          onClick={() => props.onChange(props.page - 1)}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          disabled={props.page * 20 >= props.total}
          onClick={() => props.onChange(props.page + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}
