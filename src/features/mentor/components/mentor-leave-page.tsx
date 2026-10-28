'use client';
import { useState } from 'react';
import { Plus, RefreshCw, ArrowUpRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useMentorQuery } from '../api/mentor-queries';
import { leaveRequestPageSchema } from '../schemas/leave-contracts';
import { leavePeriods, leaveStatuses } from '../lib/leave-display';
import { MentorHeading, MentorPagination, MentorQueryState, mentorDate } from './mentor-shared';
import { LeaveCreate } from './mentor-leave-create';
import { LeaveDetail } from './mentor-leave-detail';
import { LeaveStatusBadge, LeaveDateIcon } from './mentor-leave-ui';
export function MentorLeavePage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const query = useMentorQuery(
    `mentor/leave-requests?page=${page}&pageSize=20${status ? `&status=${status}` : ''}`,
    leaveRequestPageSchema,
  );
  return (
    <>
      <MentorHeading
        title="Đơn xin nghỉ"
        description={
          creating
            ? 'Chọn khoảng nghỉ, sắp xếp lịch bù và gửi quản lý duyệt.'
            : 'Theo dõi đơn đã gửi và sắp xếp lịch dạy bù của bạn.'
        }
      />
      {creating ? (
        <LeaveCreate
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            setDetail(id);
            setStatus('');
            setPage(1);
          }}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <label className="w-full space-y-2 text-sm font-semibold sm:w-60">
              Trạng thái đơn
              <NativeSelect
                aria-label="Trạng thái đơn"
                wrapperClassName="w-full"
                className="h-11 bg-canvas"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <NativeSelectOption value="">Tất cả trạng thái</NativeSelectOption>
                {Object.entries(leaveStatuses).map(([key, title]) => (
                  <NativeSelectOption key={key} value={key}>
                    {title}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" onClick={() => query.refetch()}>
                <RefreshCw aria-hidden="true" className="size-4" />
                Làm mới
              </Button>
              <Button onClick={() => setCreating(true)}>
                <Plus aria-hidden="true" className="size-4" />
                Tạo đơn xin nghỉ
              </Button>
            </div>
          </div>
          <MentorQueryState pending={query.isPending} error={query.error} retry={query.refetch}>
            {query.data?.total === 0 ? (
              <div className="grid justify-items-center gap-4 rounded-2xl border border-dashed border-line bg-canvas px-5 py-14 text-center">
                <CalendarDays aria-hidden="true" className="size-9 text-mint" />
                <h2 className="text-lg font-extrabold">
                  {status ? 'Không có đơn theo bộ lọc' : 'Bạn chưa có đơn xin nghỉ'}
                </h2>
                <p className="max-w-sm text-sm leading-6 text-muted">
                  {status
                    ? 'Chọn trạng thái khác để xem các đơn đã gửi.'
                    : 'Khi cần nghỉ dạy, tạo đơn và chọn lịch bù để quản lý xem xét.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => (status ? setStatus('') : setCreating(true))}
                >
                  {status ? 'Xem tất cả đơn' : 'Tạo đơn đầu tiên'}
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line bg-canvas">
                <div className="flex items-center justify-between border-b border-line bg-soft/40 px-5 py-3 text-sm">
                  <h2 className="font-bold">Đơn của bạn</h2>
                  <span className="text-muted">{query.data?.total ?? 0} đơn</span>
                </div>
                <ul className="divide-y divide-line">
                  {query.data?.items.map((item) => (
                    <li
                      key={item.id}
                      className="grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                    >
                      <LeaveDateIcon />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-extrabold">
                            {mentorDate(`${item.fromDate}T00:00:00+07:00`, false)}
                            {item.toDate !== item.fromDate
                              ? ` – ${mentorDate(`${item.toDate}T00:00:00+07:00`, false)}`
                              : ''}
                          </h3>
                          <LeaveStatusBadge status={item.status} />
                        </div>
                        <p className="mt-2 text-sm text-muted">
                          {leavePeriods[item.period]} · {item.itemCount} buổi bị ảnh hưởng
                        </p>
                        <p className="mt-2 line-clamp-1 text-sm">{item.reason}</p>
                      </div>
                      <Button
                        variant="ghost"
                        className="justify-self-start text-mint sm:justify-self-end"
                        onClick={() => setDetail(item.id)}
                      >
                        Xem đơn
                        <ArrowUpRight aria-hidden="true" className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {query.data && query.data.total > 20 && (
              <MentorPagination page={page} total={query.data.total} onChange={setPage} />
            )}
          </MentorQueryState>
        </>
      )}
      {detail && <LeaveDetail key={detail} id={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
