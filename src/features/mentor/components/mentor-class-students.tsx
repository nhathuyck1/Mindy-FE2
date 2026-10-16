'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/loading-skeletons';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMentorQuery } from '../api/mentor-queries';
import { classRosterSchema } from '../schemas/mentor-contracts';
import { MentorQueryState, mentorLabels } from './mentor-shared';

const paymentTabs = [
  { value: '', label: 'Tất cả' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'EXPIRED', label: 'Hết hạn' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];
function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLocaleLowerCase('vi')
    .trim();
}
function RosterStatus(props: { value: string }) {
  const positive = ['ACTIVE', 'COMPLETED', 'PAID'].includes(props.value);
  const negative = ['CANCELLED', 'EXPIRED'].includes(props.value);
  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[15px] font-extrabold ${positive ? 'border-status-green/25 bg-status-green/8 text-status-green' : negative ? 'border-status-red/25 bg-status-red/8 text-status-red' : 'border-status-yellow/25 bg-status-yellow/8 text-status-yellow'}`}
    >
      <span
        aria-hidden="true"
        className="size-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none"
      />
      {mentorLabels[props.value] ?? props.value}
    </Badge>
  );
}
export function MentorClassStudents(props: { classId: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'none' | 'asc' | 'desc'>('none');
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(status ? { orderStatus: status } : {}),
    ...(paymentType ? { paymentType } : {}),
  });
  const students = useMentorQuery(
    `mentor/classes/${props.classId}/students?${params}`,
    classRosterSchema,
  );
  const rows = (students.data?.items ?? []).filter((student) =>
    normalizeName(student.studentName).includes(normalizeName(search)),
  );
  if (sort !== 'none')
    rows.sort(
      (a, b) => a.studentName.localeCompare(b.studentName, 'vi') * (sort === 'asc' ? 1 : -1),
    );
  const totalPages = Math.max(1, Math.ceil((students.data?.total ?? 0) / pageSize));
  function changePage(next: number) {
    setPage(next);
    setSearch('');
  }
  return (
    <section className="admin-table-panel" aria-label="Danh sách học viên Mentor">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-6 pb-5 sm:px-6">
        <div>
          <h2 className="text-lg font-extrabold">Học viên của lớp</h2>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {students.data
              ? `${students.data.total.toLocaleString('vi-VN')} học viên theo bộ lọc`
              : 'Danh sách đăng ký của lớp'}
          </p>
        </div>
        <Button
          type="button"
          variant="unstyled"
          size="unstyled"
          disabled={students.isFetching}
          onClick={() => students.refetch()}
          className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm font-bold text-muted disabled:opacity-50"
        >
          <RefreshCw
            className={`size-4 ${students.isFetching ? 'motion-safe:animate-spin' : ''}`}
          />
          Làm mới
        </Button>
      </div>
      <div
        className="flex max-w-full gap-1 overflow-x-auto border-b border-line px-5 sm:px-6"
        role="group"
        aria-label="Lọc trạng thái thanh toán"
      >
        {paymentTabs.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            variant="unstyled"
            size="unstyled"
            aria-label={tab.label}
            aria-pressed={status === tab.value}
            onClick={() => {
              setStatus(tab.value);
              changePage(1);
            }}
            className={`relative min-h-12 shrink-0 cursor-pointer rounded-none border-b-2 pr-7 pl-3 text-sm font-extrabold transition-colors ${status === tab.value ? 'border-mint text-mint' : 'border-transparent text-muted hover:bg-soft'}`}
          >
            {tab.label}
            {status === tab.value &&
              (students.isPending ? (
                <Skeleton
                  aria-hidden="true"
                  className="absolute top-1 right-0.5 h-4 w-6 rounded-full"
                />
              ) : (
                <span className="absolute top-1 right-0.5 min-w-4 rounded-full border border-pastel-red/40 bg-canvas px-1 text-[10px] leading-3.5 font-extrabold text-pastel-red tabular-nums">
                  {students.data?.total.toLocaleString('vi-VN') ?? '—'}
                </span>
              ))}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6 [&>[data-slot=native-select-wrapper]]:max-w-full">
        <div className="relative min-w-0 flex-[1_1_200px] sm:max-w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            aria-label="Tìm học viên trong trang"
            placeholder="Tìm học viên trong trang…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-12 w-full min-w-0 rounded-lg border border-line bg-canvas pr-3 pl-9 text-sm"
          />
        </div>
        <NativeSelect
          aria-label="Hình thức thanh toán"
          value={paymentType}
          onChange={(event) => {
            setPaymentType(event.target.value);
            changePage(1);
          }}
          className="h-12 max-w-full rounded-lg border border-line bg-canvas px-3 text-sm font-bold"
        >
          <NativeSelectOption value="">Mọi hình thức thanh toán</NativeSelectOption>
          <NativeSelectOption value="CASH">Tiền mặt</NativeSelectOption>
          <NativeSelectOption value="PAYOS">payOS</NativeSelectOption>
        </NativeSelect>
      </div>
      {students.isPending ? (
        <TableSkeleton columns={4} label="Đang tải học viên…" />
      ) : (
        <MentorQueryState pending={false} error={students.error} retry={students.refetch}>
          {rows.length === 0 ? (
            <div role="status" className="grid min-h-64 place-items-center p-6 text-center">
              <div>
                <Users className="mx-auto size-8 text-mint" />
                <p className="mt-4 text-base font-extrabold">
                  {search ? 'Không có kết quả phù hợp' : 'Chưa có học viên theo bộ lọc'}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {search
                    ? 'Thử thay đổi từ khóa tìm kiếm.'
                    : 'Thử đổi trạng thái hoặc hình thức thanh toán.'}
                </p>
                {search && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSearch('')}
                  >
                    Xóa tìm kiếm
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              className="max-w-full overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Bảng học viên, cuộn ngang để xem thêm"
            >
              <Table className="admin-data-table min-w-180">
                <TableCaption className="sr-only">
                  Học viên của lớp, trang {page}. {students.data?.total ?? 0} kết quả theo bộ lọc.
                  Tìm kiếm và sắp xếp trong trang hiện tại.
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
                        aria-label="Sắp xếp tên học viên trong trang"
                        onClick={() =>
                          setSort(sort === 'none' ? 'asc' : sort === 'asc' ? 'desc' : 'none')
                        }
                        className="inline-flex min-h-9 cursor-pointer items-center gap-2"
                      >
                        Học viên
                        {sort === 'asc' ? (
                          <ArrowUp className="size-3.5" />
                        ) : sort === 'desc' ? (
                          <ArrowDown className="size-3.5" />
                        ) : (
                          <ArrowUpDown className="size-3.5" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead scope="col">Đăng ký lớp</TableHead>
                    <TableHead scope="col">Thanh toán</TableHead>
                    <TableHead scope="col">Hình thức</TableHead>
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
                      </TableHead>
                      <TableCell>
                        <RosterStatus value={student.enrollmentStatus} />
                      </TableCell>
                      <TableCell>
                        <RosterStatus value={student.orderStatus} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {student.paymentType === 'CASH' ? 'Tiền mặt' : 'payOS'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </MentorQueryState>
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
              <NativeSelectOption key={value} value={value}>
                {value}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        {search && students.data && (
          <span role="status">
            {rows.length} / {students.data.items.length} học viên trong trang
          </span>
        )}
        <nav aria-label="Phân trang học viên" className="flex items-center gap-2">
          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            className="admin-icon-button border border-line"
            aria-label="Trang học viên trước"
            disabled={page <= 1 || students.isFetching}
            onClick={() => changePage(page - 1)}
          >
            <ChevronLeft className="size-4" />
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
            disabled={page >= totalPages || students.isFetching || students.isError}
            onClick={() => changePage(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      </div>
    </section>
  );
}
