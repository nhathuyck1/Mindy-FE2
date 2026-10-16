'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingOverlay } from '@/components/ui/spinner';
import { mentorError } from '../api/mentor-queries';

export const mentorLabels: Record<string, string> = {
  DRAFT: 'Bản nháp',
  OPEN: 'Đang mở',
  LOCKED: 'Đang khóa',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  SCHEDULED: 'Chưa bắt đầu',
  ACTIVE: 'Đang học',
  PENDING_PAYMENT: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  PENDING: 'Chờ thanh toán',
  EXPIRED: 'Hết hạn',
  UNMARKED: 'Chưa điểm danh',
  PRESENT: 'Có mặt',
  ABSENT: 'Vắng mặt',
  PENDING_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Cần chỉnh sửa',
  ARTICLE: 'Bài viết',
  FILE: 'Tài liệu',
  VIDEO: 'Video',
};
export function MentorStatus(props: { value: string }) {
  return (
    <Badge variant="outline" className="border-mint/20 bg-soft text-foreground">
      {mentorLabels[props.value] ?? props.value}
    </Badge>
  );
}
export function MentorQueryState(props: {
  pending: boolean;
  error: unknown;
  retry: () => unknown;
  empty?: boolean;
  children: React.ReactNode;
}) {
  if (props.pending)
    return (
      <div className="relative min-h-56">
        <LoadingOverlay scope="modal" label="Đang tải dữ liệu…" />
      </div>
    );
  if (props.error)
    return (
      <div role="alert" className="space-y-4 rounded-xl border border-line p-6">
        <p>{mentorError(props.error)}</p>
        <Button variant="outline" onClick={() => props.retry()}>
          Thử lại
        </Button>
      </div>
    );
  if (props.empty)
    return (
      <p
        role="status"
        className="rounded-2xl border border-dashed border-line bg-canvas p-10 text-center text-muted"
      >
        Chưa có dữ liệu trong mục này.
      </p>
    );
  return props.children;
}
export function MentorPagination(props: {
  page: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(props.total / (props.pageSize ?? 20)));
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span>
        {props.total} kết quả · Trang {props.page}/{pages}
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
          disabled={props.page >= pages}
          onClick={() => props.onChange(props.page + 1)}
        >
          Tiếp
        </Button>
      </div>
    </div>
  );
}
export function mentorDate(value: string | null, time = true) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    ...(time ? { timeStyle: 'short' as const } : {}),
  }).format(new Date(value));
}
export function MentorHeading(props: { title: string; description: string }) {
  return (
    <div className="mb-7">
      <p className="eyebrow text-mint">Mindy · Mentor</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{props.title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-muted">{props.description}</p>
    </div>
  );
}
