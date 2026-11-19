'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowUpRight, CalendarOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useManagerQuery } from '../api/manager-queries';
import {
  managerLeaveListQuerySchema,
  managerLeavePageSchema,
  managerLeaveStatusSchema,
  managerMentorSchema,
} from '../schemas/manager-leave-contracts';
import { ManagerState } from './manager-shared';
import { ManagerLeaveMentorFilter } from './manager-leave-mentor-filter';
import {
  LeaveStatusBadge,
  ManagerLeaveMentorName,
  ManagerLeavePagination,
  leaveStatusLabels,
  managerLeaveDate,
  leavePeriodLabels,
} from './manager-leave-ui';

const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'] as const;

export function ManagerLeaveRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedStatus = searchParams.get('status');
  const selectedStatus =
    requestedStatus === 'ALL'
      ? 'ALL'
      : managerLeaveStatusSchema.safeParse(requestedStatus).success
        ? requestedStatus!
        : 'PENDING';
  const rawPage = Number(searchParams.get('page') ?? 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const mentorIdValue = searchParams.get('mentorId');
  const mentorId =
    mentorIdValue && managerMentorSchema.shape.id.safeParse(mentorIdValue).success
      ? mentorIdValue
      : undefined;

  const status = selectedStatus === 'ALL' ? undefined : selectedStatus;
  const parsedQuery = managerLeaveListQuerySchema.parse({
    page,
    pageSize: 20,
    ...(status ? { status } : {}),
    ...(mentorId ? { mentorId } : {}),
  });
  const apiQuery = new URLSearchParams(
    Object.entries(parsedQuery).map(([key, value]) => [key, String(value)]),
  );
  const leaves = useManagerQuery(
    `management/mentor-leave-requests?${apiQuery}`,
    managerLeavePageSchema,
  );

  function changeLocation(
    changes: { status?: string | null; page?: number | null; mentorId?: string | null },
    replace = false,
  ) {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ['status', 'page', 'mentorId']) params.delete(key);
    const nextStatus = changes.status === undefined ? selectedStatus : changes.status;
    const nextMentorId = changes.mentorId === undefined ? mentorId : changes.mentorId;
    const nextPage = changes.page ?? 1;
    if (nextStatus && nextStatus !== 'PENDING') params.set('status', nextStatus);
    if (nextPage > 1) params.set('page', String(nextPage));
    if (nextMentorId) params.set('mentorId', nextMentorId);
    const search = params.toString();
    const href = search ? `${pathname}?${search}` : pathname;
    if (replace) router.replace(href);
    else router.push(href);
  }

  useEffect(() => {
    if (!leaves.data) return;
    const pages = Math.max(1, Math.ceil(leaves.data.total / 20));
    if (page <= pages) return;
    const params = new URLSearchParams(searchParams.toString());
    if (pages > 1) params.set('page', String(pages));
    else params.delete('page');
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname);
  }, [leaves.data, page, pathname, router, searchParams]);

  return (
    <div className="min-w-0 space-y-6">
      <header className="admin-page-heading">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <CalendarOff aria-hidden="true" className="size-7 shrink-0 text-mint" />
            Đơn xin nghỉ mentor
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Xem lịch nghỉ và lịch dạy bù trước khi duyệt hoặc từ chối đơn.
          </p>
        </div>
      </header>

      <section
        className="rounded-2xl border border-line bg-canvas p-4 sm:p-5"
        aria-label="Bộ lọc đơn xin nghỉ"
      >
        <div className="grid items-start gap-4 md:grid-cols-[minmax(12rem,0.7fr)_minmax(0,1.3fr)]">
          <label
            className="block min-w-0 space-y-2 text-sm font-semibold"
            htmlFor="leave-status-filter"
          >
            Trạng thái
            <NativeSelect
              id="leave-status-filter"
              aria-label="Lọc theo trạng thái đơn"
              wrapperClassName="w-full"
              className="h-12 text-base"
              value={selectedStatus}
              onChange={(event) => changeLocation({ status: event.target.value })}
            >
              <NativeSelectOption value="PENDING">Chờ duyệt</NativeSelectOption>
              <NativeSelectOption value="ALL">Tất cả trạng thái</NativeSelectOption>
              {statuses.slice(1).map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {leaveStatusLabels[value]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <ManagerLeaveMentorFilter
            mentorId={mentorId}
            onSelect={(id) => changeLocation({ mentorId: id })}
          />
        </div>
      </section>

      <section className="admin-table-panel min-w-0" aria-label="Danh sách đơn xin nghỉ">
        <header className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-extrabold">
              {selectedStatus === 'ALL'
                ? 'Tất cả đơn xin nghỉ'
                : leaveStatusLabels[selectedStatus as keyof typeof leaveStatusLabels]}
            </h2>
            {leaves.data && <p className="mt-1 text-sm text-muted">{leaves.data.total} đơn</p>}
          </div>
          <Button
            variant="outline"
            disabled={leaves.isFetching}
            onClick={() => void leaves.refetch()}
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Tải lại danh sách
          </Button>
        </header>
        <ManagerState pending={leaves.isPending} error={leaves.error} retry={leaves.refetch}>
          {leaves.data?.items.length === 0 ? (
            <p
              role="status"
              className="border-t border-line px-5 py-12 text-center text-sm text-muted"
            >
              Không có đơn phù hợp với bộ lọc.
            </p>
          ) : (
            <div className="border-t border-line">
              <div
                aria-hidden="true"
                className="hidden gap-5 border-b border-line bg-soft/60 px-5 py-3 text-xs font-semibold text-muted xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)_8rem] sm:px-6"
              >
                <span>Mentor</span>
                <span>Khoảng nghỉ & lý do</span>
                <span>Thời gian xử lý</span>
                <span className="text-right">Thao tác</span>
              </div>
              <ul className="divide-y divide-line">
                {leaves.data?.items.map((leave) => (
                  <li
                    key={leave.id}
                    className="grid min-w-0 gap-4 px-5 py-5 transition-colors hover:bg-soft/30 sm:px-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)_8rem] xl:items-start xl:gap-5"
                  >
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 xl:block xl:space-y-3">
                      <ManagerLeaveMentorName id={leave.mentorId} />
                      <LeaveStatusBadge status={leave.status} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold leading-6">
                        {managerLeaveDate(leave.fromDate)}
                        {leave.fromDate !== leave.toDate && (
                          <> – {managerLeaveDate(leave.toDate)}</>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {leavePeriodLabels[leave.period]} · {leave.itemCount} buổi ảnh hưởng
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted wrap-anywhere">
                        {leave.reason}
                      </p>
                    </div>
                    <div className="min-w-0 space-y-1 text-sm">
                      <p className="text-xs text-muted">Hạn duyệt</p>
                      <p className="font-semibold tabular-nums">
                        {managerLeaveDate(leave.expiresAt)}
                      </p>
                      <p className="text-xs leading-5 text-muted">
                        Gửi lúc {managerLeaveDate(leave.submittedAt)}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full xl:w-auto xl:justify-self-end"
                    >
                      <Link href={'/manager/leave-requests/' + leave.id}>
                        Xem và xử lý
                        <ArrowUpRight aria-hidden="true" className="size-4" />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {leaves.data && leaves.data.total > 0 && (
            <ManagerLeavePagination
              page={page}
              total={leaves.data.total}
              onChange={(next) => changeLocation({ page: next })}
            />
          )}
        </ManagerState>
      </section>
    </div>
  );
}
