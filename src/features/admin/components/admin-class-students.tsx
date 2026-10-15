'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { useAdminClassStudent, useAdminClassStudents } from '../api/admin-queries';
import { useAdminDetail } from '../api/admin-edit-queries';
import { formatAdminDate, normalizeAdminSearch } from '../lib/admin-resources';
import type { AdminClassStudent } from '../schemas/admin-contracts';
import { AdminQueryState } from './admin-query-state';
import { AdminStatus } from './admin-status';

const enrollmentLabels = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

function AdminClassStudentDetail(props: {
  classId: string;
  student: AdminClassStudent;
  onClose: () => void;
  returnFocus: HTMLElement | null;
}) {
  const query = useAdminClassStudent(props.classId, props.student.studentId);
  return (
    <Modal
      title="Thông tin học viên"
      onClose={props.onClose}
      returnFocus={props.returnFocus}
      contentClassName="w-[calc(100vw-2rem)] max-w-2xl sm:max-w-2xl"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xl font-extrabold break-words">{props.student.studentName}</p>
            <p className="mt-1 text-base break-all text-muted">{props.student.email}</p>
          </div>
          <AdminStatus
            status={props.student.enrollmentStatus}
            label={enrollmentLabels[props.student.enrollmentStatus]}
          />
        </div>
        {query.isPending || query.isError ? (
          <AdminQueryState
            loading={query.isPending}
            variant="modal"
            error={query.error}
            onRetry={() => query.refetch()}
          />
        ) : (
          <dl className="mt-6 divide-y divide-line text-base">
            {[
              { label: 'Điện thoại', value: query.data.phone || 'Chưa cập nhật' },
              { label: 'Tài khoản', value: <AdminStatus status={query.data.studentStatus} /> },
              { label: 'Ngày đăng ký', value: formatAdminDate(query.data.registeredAt) },
              {
                label: 'Ngày nhập học',
                value: query.data.enrolledAt
                  ? formatAdminDate(query.data.enrolledAt)
                  : 'Chưa nhập học',
              },
              { label: 'Tạo tài khoản', value: formatAdminDate(query.data.accountCreatedAt) },
              { label: 'Đăng nhập cuối', value: formatAdminDate(query.data.lastLoginAt) },
            ].map((field) => (
              <div key={field.label} className="grid gap-1 py-3 sm:grid-cols-[150px_1fr] sm:gap-4">
                <dt className="text-sm text-muted">{field.label}</dt>
                <dd className="min-w-0 font-semibold break-words">{field.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Modal>
  );
}

export function AdminClassStudentsPage(props: { classId: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [viewing, setViewing] = useState<{
    student: AdminClassStudent;
    returnFocus: HTMLElement;
  } | null>(null);
  const classQuery = useAdminDetail('classes', props.classId);
  const query = useAdminClassStudents(props.classId, page, pageSize);
  const classInfo = classQuery.data?.resource === 'classes' ? classQuery.data.value : undefined;
  const rows = (query.data?.items ?? []).filter((student) =>
    normalizeAdminSearch(
      [student.studentName, student.email, student.phone ?? ''].join(' '),
    ).includes(normalizeAdminSearch(search)),
  );
  if (sort !== 'none')
    rows.sort(
      (a, b) => a.studentName.localeCompare(b.studentName, 'vi') * (sort === 'asc' ? 1 : -1),
    );
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  function changePage(next: number) {
    setPage(next);
    setSearch('');
  }

  return (
    <>
      <div className="admin-page-heading">
        <div className="w-full min-w-0">
          <Link
            href="/admin/classes"
            className="text-link mb-3 inline-flex items-center gap-1 text-sm"
          >
            <Icon name="chevron" className="size-3 rotate-180" />
            Quay lại lớp học
          </Link>
          <p className="eyebrow mb-2 text-muted">Học viên theo lớp</p>
          {classInfo ? (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="min-w-0 text-[34px] leading-tight font-extrabold tracking-tight break-words sm:text-[38px]">
                {classInfo.name}
              </h1>
              <AdminStatus status={classInfo.status} />
            </div>
          ) : classQuery.isPending ? (
            <Skeleton aria-label="Đang tải lớp học" className="h-11 w-72 max-w-full" />
          ) : (
            <h1 className="text-[34px] leading-tight font-extrabold tracking-tight sm:text-[38px]">
              Danh sách học viên
            </h1>
          )}
          {classInfo && (
            <div className="mt-3 space-y-1 text-base text-muted">
              <p>
                Giảng viên:{' '}
                <strong className="font-bold text-ink">
                  {classInfo.mentor.displayName || 'Chưa cập nhật tên'}
                </strong>
              </p>
              <p>
                Khai giảng:{' '}
                <strong className="font-bold text-ink">
                  {formatAdminDate(classInfo.startDate)}
                </strong>
              </p>
            </div>
          )}
        </div>
      </div>

      <section className="admin-table-panel" aria-label="Danh sách học viên">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-6 pb-5 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold">Danh sách học viên</h2>
            <p className="mt-1 text-sm text-muted" aria-live="polite">
              {query.data
                ? `${query.data.total.toLocaleString('vi-VN')} học viên đăng ký · gồm chờ thanh toán, đang học và hoàn thành`
                : 'Danh sách đăng ký của lớp'}
            </p>
          </div>
          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm font-bold text-muted disabled:opacity-50"
          >
            <Icon
              name="refresh"
              className={`size-4 ${query.isFetching ? 'motion-safe:animate-spin' : ''}`}
            />
            Làm mới
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 sm:px-6">
          <div className="relative min-w-0 flex-[1_1_200px] sm:max-w-80">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            />
            <Input
              aria-label="Tìm học viên trong trang"
              placeholder="Tìm học viên trong trang…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 w-full min-w-0 rounded-lg border border-line bg-canvas pr-3 pl-9 text-sm"
            />
          </div>
        </div>

        {query.isPending || query.isError ? (
          <AdminQueryState
            loading={query.isPending}
            columns={6}
            error={query.error}
            onRetry={() => query.refetch()}
          />
        ) : rows.length === 0 ? (
          <div role="status" className="grid min-h-64 place-items-center p-6 text-center">
            <div>
              <Icon name="users" className="mx-auto size-8 text-mint" />
              <p className="mt-4 text-base font-extrabold">
                {search ? 'Không có kết quả phù hợp' : 'Chưa có học viên trong lớp'}
              </p>
              <p className="mt-2 text-sm text-muted">
                {search
                  ? 'Thử thay đổi từ khóa tìm kiếm.'
                  : 'Học viên đăng ký sẽ xuất hiện tại đây.'}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="max-w-full overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="Bảng học viên, cuộn ngang để xem thêm"
          >
            <Table className="admin-data-table">
              <TableCaption className="sr-only">
                Học viên lớp {classInfo?.name ?? ''}, trang {page}. {query.data.total} học viên.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead
                    scope="col"
                    aria-sort={
                      sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : 'none'
                    }
                  >
                    <Button
                      variant="unstyled"
                      size="unstyled"
                      type="button"
                      onClick={() => setSort(sort === 'asc' ? 'desc' : 'asc')}
                      className="inline-flex cursor-pointer items-center gap-2"
                    >
                      Học viên
                      <span aria-hidden="true">
                        {sort === 'asc' ? '↑' : sort === 'desc' ? '↓' : '↕'}
                      </span>
                    </Button>
                  </TableHead>
                  <TableHead scope="col">Điện thoại</TableHead>
                  <TableHead scope="col">Đăng ký lớp</TableHead>
                  <TableHead scope="col">Tài khoản</TableHead>
                  <TableHead scope="col">Ngày nhập học</TableHead>
                  <TableHead scope="col" className="text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((student) => (
                  <TableRow key={student.enrollmentId}>
                    <TableHead scope="row">
                      <p
                        className="max-w-65 truncate text-sm font-extrabold text-muted"
                        title={student.studentName}
                      >
                        {student.studentName}
                      </p>
                      <p
                        className="mt-1 max-w-65 truncate text-[15px] font-normal text-muted"
                        title={student.email}
                      >
                        {student.email}
                      </p>
                    </TableHead>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {student.phone || 'Chưa cập nhật'}
                    </TableCell>
                    <TableCell>
                      <AdminStatus
                        status={student.enrollmentStatus}
                        label={enrollmentLabels[student.enrollmentStatus]}
                      />
                    </TableCell>
                    <TableCell>
                      <AdminStatus status={student.studentStatus} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {student.enrolledAt ? formatAdminDate(student.enrolledAt) : 'Chưa nhập học'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-11 rounded-lg border-mint/30 bg-soft text-mint hover:bg-mint/15"
                        title="Xem thông tin học viên"
                        aria-label={`Xem thông tin học viên: ${student.studentName}`}
                        aria-haspopup="dialog"
                        onClick={(event) =>
                          setViewing({ student, returnFocus: event.currentTarget })
                        }
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-4 text-sm text-muted sm:px-6">
          <label className="flex items-center gap-2">
            Số dòng
            <NativeSelect
              aria-label="Số dòng mỗi trang"
              value={pageSize}
              className="h-9 rounded-lg border border-line bg-canvas px-2 font-bold"
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                changePage(1);
              }}
            >
              {[10, 20, 50].map((value) => (
                <NativeSelectOption key={value}>{value}</NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <nav aria-label="Phân trang học viên" className="flex items-center gap-2">
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              className="admin-icon-button border border-line"
              aria-label="Trang học viên trước"
              disabled={page <= 1 || query.isFetching}
              onClick={() => changePage(page - 1)}
            >
              <Icon name="chevron" className="size-4 rotate-180" />
            </Button>
            <span className="px-2 font-bold tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              className="admin-icon-button border border-line"
              aria-label="Trang học viên sau"
              disabled={page >= totalPages || query.isFetching || query.isError}
              onClick={() => changePage(page + 1)}
            >
              <Icon name="chevron" className="size-4" />
            </Button>
          </nav>
        </div>
      </section>

      {viewing && (
        <AdminClassStudentDetail
          classId={props.classId}
          student={viewing.student}
          returnFocus={viewing.returnFocus}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}
