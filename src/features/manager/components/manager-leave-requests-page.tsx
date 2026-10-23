'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useManagerQuery } from '../api/manager-queries';
import {
  managerLeaveListQuerySchema,
  managerLeavePageSchema,
  managerLeaveStatusSchema,
  managerMentorSchema,
  managerPeoplePageSchema,
} from '../schemas/manager-leave-contracts';
import { ManagerState } from './manager-shared';
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
  const [mentorSearch, setMentorSearch] = useState('');
  const [mentorQuery, setMentorQuery] = useState('');
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

  useEffect(() => {
    const timer = window.setTimeout(() => setMentorQuery(mentorSearch.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [mentorSearch]);

  const mentorSuggestions = useManagerQuery(
    `manager/mentors?page=1&pageSize=20&q=${encodeURIComponent(mentorQuery)}`,
    managerPeoplePageSchema,
    mentorQuery.length >= 2 && !mentorId,
  );
  const selectedMentor = useManagerQuery(
    `manager/mentors/${mentorId ?? ''}`,
    managerMentorSchema.refine((mentor) => mentor.id === mentorId),
    Boolean(mentorId),
  );
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

  const mentorInputValue = mentorSearch || selectedMentor.data?.displayName || '';
  const showSuggestions = !mentorId && mentorQuery.length >= 2;

  return (
    <div className="space-y-6">
      <header className="admin-page-heading">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-mint uppercase">
            Mindy / Không gian Manager
          </p>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <CalendarOff aria-hidden="true" className="size-7 text-mint" />
            Đơn xin nghỉ mentor
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Xem lịch nghỉ và lịch dạy bù trước khi duyệt hoặc từ chối đơn.
          </p>
        </div>
      </header>

      <section className="admin-table-panel space-y-4 p-5 sm:p-6" aria-label="Bộ lọc đơn xin nghỉ">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-sm font-semibold" htmlFor="leave-status-filter">
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
          <div className="relative space-y-2 text-sm font-semibold">
            <label htmlFor="leave-mentor-filter">Tìm mentor</label>
            <div className="flex gap-2">
              <Input
                id="leave-mentor-filter"
                value={mentorInputValue}
                onChange={(event) => {
                  setMentorSearch(event.target.value);
                  if (mentorId) changeLocation({ mentorId: null });
                }}
                autoComplete="off"
                placeholder="Nhập tên hoặc email mentor"
                aria-describedby="leave-mentor-help"
                className="min-h-12"
              />
              {(mentorSearch || mentorId) && (
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Xóa bộ lọc mentor"
                  onClick={() => {
                    setMentorSearch('');
                    setMentorQuery('');
                    changeLocation({ mentorId: null });
                  }}
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              )}
            </div>
            <p id="leave-mentor-help" className="font-normal text-muted">
              Nhập ít nhất 2 ký tự rồi chọn mentor trong gợi ý.
            </p>
            {showSuggestions && (
              <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-canvas p-2 shadow-lg">
                {mentorSuggestions.isPending ? (
                  <p role="status" className="p-3 text-sm text-muted">
                    Đang tìm mentor…
                  </p>
                ) : mentorSuggestions.isError ? (
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 p-2 text-sm"
                    role="alert"
                  >
                    <span>Chưa tải được gợi ý mentor.</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void mentorSuggestions.refetch()}
                    >
                      Thử lại
                    </Button>
                  </div>
                ) : mentorSuggestions.data?.items.length ? (
                  <ul role="listbox" aria-label="Gợi ý mentor">
                    {mentorSuggestions.data.items.map((mentor) => (
                      <li key={mentor.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={false}
                          onClick={() => {
                            setMentorSearch(mentor.displayName);
                            changeLocation({ mentorId: mentor.id });
                          }}
                          className="flex min-h-12 w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-soft focus-visible:outline-2 focus-visible:outline-mint"
                        >
                          <span className="font-semibold">{mentor.displayName}</span>
                          <span className="text-xs text-muted">{mentor.email}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p role="status" className="p-3 text-sm text-muted">
                    Không tìm thấy mentor khớp.
                  </p>
                )}
              </div>
            )}
          </div>
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
            <div className="overflow-x-auto">
              <table className="admin-data-table min-w-200">
                <caption className="sr-only">Danh sách đơn xin nghỉ mentor</caption>
                <thead>
                  <tr>
                    <th scope="col">Mentor</th>
                    <th scope="col">Khoảng nghỉ</th>
                    <th scope="col">Lý do</th>
                    <th scope="col">Buổi ảnh hưởng</th>
                    <th scope="col">Gửi lúc</th>
                    <th scope="col">Hạn duyệt</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.data?.items.map((leave) => (
                    <tr key={leave.id}>
                      <td>
                        <ManagerLeaveMentorName id={leave.mentorId} />
                      </td>
                      <td className="min-w-45">
                        <span className="block whitespace-nowrap">
                          {managerLeaveDate(leave.fromDate)} – {managerLeaveDate(leave.toDate)}
                        </span>
                        <span className="text-xs text-muted">
                          {leavePeriodLabels[leave.period]}
                        </span>
                      </td>
                      <td className="max-w-64 whitespace-pre-wrap break-words">{leave.reason}</td>
                      <td>{leave.itemCount}</td>
                      <td className="whitespace-nowrap">{managerLeaveDate(leave.submittedAt)}</td>
                      <td className="whitespace-nowrap">{managerLeaveDate(leave.expiresAt)}</td>
                      <td>
                        <LeaveStatusBadge status={leave.status} />
                      </td>
                      <td>
                        <Button asChild variant="outline">
                          <Link href={`/manager/leave-requests/${leave.id}`}>Xem và xử lý</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
