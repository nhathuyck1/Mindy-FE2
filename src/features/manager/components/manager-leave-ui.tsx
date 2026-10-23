'use client';

import { Button } from '@/components/ui/button';
import { useManagerQuery } from '../api/manager-queries';
import {
  managerClassLabelSchema,
  managerMentorSchema,
  managerStudentSchema,
} from '../schemas/manager-leave-contracts';

export const leavePeriodLabels = {
  MORNING: 'Buổi sáng',
  AFTERNOON: 'Buổi chiều',
  EVENING: 'Buổi tối',
  FULL_DAY: 'Cả ngày',
} as const;

export const leaveStatusLabels = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  WITHDRAWN: 'Đã rút đơn',
  EXPIRED: 'Hết hạn',
} as const;

export function LeaveStatusBadge(props: { status: keyof typeof leaveStatusLabels }) {
  const tone =
    props.status === 'PENDING'
      ? 'bg-peach text-forest'
      : props.status === 'APPROVED'
        ? 'bg-mint/10 text-forest'
        : props.status === 'REJECTED'
          ? 'bg-soft text-forest'
          : 'bg-soft text-muted';
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {leaveStatusLabels[props.status]}
    </span>
  );
}

export function ManagerLeaveMentorName(props: { id: string }) {
  const query = useManagerQuery(
    `manager/mentors/${props.id}`,
    managerMentorSchema.refine((mentor) => mentor.id === props.id),
  );
  return (
    <span className="inline-flex min-w-0 flex-col items-start">
      <span className="break-words font-semibold">{query.data?.displayName || props.id}</span>
      {query.isPending ? (
        <span className="text-xs text-muted">Đang tải tên mentor…</span>
      ) : query.isError ? (
        <Button
          variant="link"
          className="h-auto min-h-8 px-0 text-xs"
          onClick={() => void query.refetch()}
        >
          Tải lại tên mentor
        </Button>
      ) : (
        query.data && <span className="break-all text-xs text-muted">{query.data.email}</span>
      )}
    </span>
  );
}

export function ManagerLeaveClassName(props: { id: string }) {
  const query = useManagerQuery(
    `manager/classes/${props.id}`,
    managerClassLabelSchema.refine((classInfo) => classInfo.id === props.id),
  );
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
      {query.data ? (
        <span className="break-words font-semibold">
          {query.data.name} <span className="text-muted">({query.data.code})</span>
        </span>
      ) : (
        <span className="break-all text-muted">Lớp {props.id}</span>
      )}
      {query.isPending && <span className="text-xs text-muted">Đang tải…</span>}
      {query.isError && (
        <Button
          variant="link"
          className="h-auto min-h-8 px-0 text-xs"
          onClick={() => void query.refetch()}
        >
          Tải lại tên lớp
        </Button>
      )}
    </span>
  );
}

export function ManagerLeaveStudentName(props: { id: string }) {
  const query = useManagerQuery(
    `manager/students/${props.id}`,
    managerStudentSchema.refine((student) => student.id === props.id),
  );
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>{query.data?.displayName || props.id}</span>
      {query.isPending && <span className="text-xs text-muted">Đang tải tên…</span>}
      {query.isError && (
        <Button
          variant="link"
          className="h-auto min-h-8 px-0 text-xs"
          onClick={() => void query.refetch()}
        >
          Tải lại
        </Button>
      )}
    </span>
  );
}

export function ManagerLeavePagination(props: {
  page: number;
  total: number;
  pageSize?: number;
  noun?: string;
  onChange: (page: number) => void;
}) {
  const pageSize = props.pageSize ?? 20;
  const pages = Math.max(1, Math.ceil(props.total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4 text-sm text-muted">
      <span>
        {props.total} {props.noun ?? 'đơn'} · Trang {props.page}/{pages}
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
          Sau
        </Button>
      </div>
    </div>
  );
}

export function managerLeaveDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T00:00:00+07:00` : value);
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    ...(value.length === 10 ? {} : { timeStyle: 'short' }),
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
}
