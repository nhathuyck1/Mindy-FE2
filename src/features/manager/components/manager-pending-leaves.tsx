'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useManagerQuery } from '../api/manager-queries';
import {
  managerLeaveListQuerySchema,
  managerLeavePageSchema,
} from '../schemas/manager-leave-contracts';
import { ManagerState } from './manager-shared';
import {
  LeaveStatusBadge,
  ManagerLeaveMentorName,
  ManagerLeavePagination,
  leavePeriodLabels,
  managerLeaveDate,
} from './manager-leave-ui';

export function ManagerPendingLeaves() {
  const [page, setPage] = useState(1);
  const params = managerLeaveListQuerySchema.parse({ page, pageSize: 20, status: 'PENDING' });
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
  const leaves = useManagerQuery(
    `management/mentor-leave-requests?${query}`,
    managerLeavePageSchema,
  );
  const lastPage = leaves.data ? Math.max(1, Math.ceil(leaves.data.total / 20)) : page;
  const currentPage = Math.min(page, lastPage);

  return (
    <section className="admin-table-panel min-w-0" aria-label="Đơn xin nghỉ chờ duyệt">
      <header className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <CalendarOff aria-hidden="true" className="size-5 text-mint" />
            Đơn xin nghỉ chờ duyệt
          </h2>
          <p className="mt-1 text-sm text-muted">
            {leaves.data ? `${leaves.data.total} đơn đang chờ xử lý.` : 'Danh sách đơn mentor gửi.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/manager/leave-requests">Mở danh sách đơn</Link>
          </Button>
          <Button
            variant="outline"
            disabled={leaves.isFetching}
            onClick={() => void leaves.refetch()}
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Làm mới
          </Button>
        </div>
      </header>
      <ManagerState pending={leaves.isPending} error={leaves.error} retry={leaves.refetch}>
        {leaves.data?.items.length === 0 ? (
          <p
            role="status"
            className="border-t border-line px-5 py-12 text-center text-sm text-muted"
          >
            Hiện không có đơn xin nghỉ chờ duyệt.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-data-table min-w-200">
              <caption className="sr-only">Danh sách đơn xin nghỉ mentor chờ duyệt</caption>
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
                      <span className="text-xs text-muted">{leavePeriodLabels[leave.period]}</span>
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
            page={currentPage}
            total={leaves.data.total}
            noun="đơn chờ duyệt"
            onChange={setPage}
          />
        )}
      </ManagerState>
    </section>
  );
}
