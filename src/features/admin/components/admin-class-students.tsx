'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { useAdminClassStudents } from '../api/admin-queries';
import { formatAdminDate } from '../lib/admin-resources';
import { AdminQueryState } from './admin-query-state';
import { AdminStatus } from './admin-status';

const enrollmentLabels = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export function AdminClassStudentsDialog(props: {
  classId: string;
  classTitle: string;
  onClose: () => void;
  returnFocus?: HTMLElement | null;
  embedded?: boolean;
}) {
  const [page, setPage] = useState(1);
  const query = useAdminClassStudents(props.classId, page);
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 20));
  return (
    <Modal
      title="Danh sách học viên"
      onClose={props.onClose}
      contentClassName="sm:max-w-5xl"
      returnFocus={props.returnFocus}
      embedded={props.embedded}
    >
      <div className="border-b border-line px-5 py-4">
        <p className="font-extrabold break-words">{props.classTitle}</p>
        <p className="mt-1 text-sm text-muted" aria-live="polite">
          {query.data && !query.isError
            ? `${query.data.total} học viên đăng ký`
            : 'Danh sách đăng ký của lớp'}
        </p>
        <p className="mt-2 text-[15px] leading-6 text-muted">
          Gồm học viên chờ thanh toán, đang học và đã hoàn thành. Đây là danh sách đăng ký lớp.
        </p>
      </div>
      {query.isPending || query.isError ? (
        <AdminQueryState
          loading={query.isPending}
          columns={5}
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : query.data.items.length === 0 ? (
        <p role="status" className="p-10 text-center text-sm text-muted">
          Chưa có học viên trong danh sách này.
        </p>
      ) : (
        <div
          role="region"
          tabIndex={0}
          aria-label="Danh sách học viên, cuộn ngang để xem thêm"
          className="max-h-[50dvh] max-w-full overflow-auto"
        >
          <Table className="admin-data-table min-w-200">
            <TableCaption className="sr-only">
              Học viên lớp {props.classTitle}, trang {page}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Học viên</TableHead>
                <TableHead scope="col">Điện thoại</TableHead>
                <TableHead scope="col">Đăng ký lớp</TableHead>
                <TableHead scope="col">Tài khoản</TableHead>
                <TableHead scope="col">Ngày nhập học</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.items.map((student) => (
                <TableRow key={student.enrollmentId}>
                  <TableHead scope="row">
                    <p className="max-w-64 truncate font-extrabold" title={student.studentName}>
                      {student.studentName}
                    </p>
                    <p
                      className="mt-1 max-w-64 truncate text-[15px] font-normal text-muted"
                      title={student.email}
                    >
                      {student.email}
                    </p>
                  </TableHead>
                  <TableCell>{student.phone || 'Chưa cập nhật'}</TableCell>
                  <TableCell>
                    <AdminStatus
                      status={student.enrollmentStatus}
                      label={enrollmentLabels[student.enrollmentStatus]}
                    />
                  </TableCell>
                  <TableCell>
                    <AdminStatus status={student.studentStatus} />
                  </TableCell>
                  <TableCell>
                    {student.enrolledAt ? formatAdminDate(student.enrolledAt) : 'Chưa nhập học'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-5">
        <Button variant="outline" onClick={props.onClose}>
          Đóng danh sách
        </Button>
        <nav aria-label="Phân trang học viên" className="flex items-center gap-3 text-sm">
          <Button
            variant="outline"
            size="icon"
            aria-label="Trang học viên trước"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            <Icon name="chevron" className="size-4 rotate-180" />
          </Button>
          <span className="font-bold tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Trang học viên sau"
            disabled={page >= totalPages || query.isFetching || query.isError}
            onClick={() => setPage(page + 1)}
          >
            <Icon name="chevron" className="size-4" />
          </Button>
        </nav>
      </div>
    </Modal>
  );
}
