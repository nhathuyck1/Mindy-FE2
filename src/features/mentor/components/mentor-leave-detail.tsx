'use client';
import { useState } from 'react';
import { ArrowDown, MessageSquareText } from 'lucide-react';
import { LeaveStatusBadge } from './mentor-leave-ui';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { useMentorCommand, useMentorQuery, mentorError } from '../api/mentor-queries';
import { leaveRequestSchema, withdrawLeaveInputSchema } from '../schemas/leave-contracts';
import { leavePeriods } from '../lib/leave-display';
import { MentorPagination, MentorQueryState, mentorDate } from './mentor-shared';
export function LeaveDetail(props: { id: string; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [withdraw, setWithdraw] = useState<{ version: number } | null>(null);
  const [reason, setReason] = useState('');
  const query = useMentorQuery(
    `mentor/leave-requests/${props.id}?page=${page}&pageSize=20`,
    leaveRequestSchema,
  );
  const command = useMentorCommand(leaveRequestSchema);
  const item = query.data;
  return (
    <Modal
      title="Chi tiết đơn xin nghỉ"
      contentClassName="sm:max-w-2xl"
      onClose={() => {
        if (!command.isPending) props.onClose();
      }}
    >
      <div className="space-y-5 p-5">
        <MentorQueryState pending={query.isPending} error={query.error} retry={query.refetch}>
          {item && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-extrabold">
                  {item.fromDate} – {item.toDate} · {leavePeriods[item.period]}
                </p>
                <LeaveStatusBadge status={item.status} />
              </div>
              <div className="rounded-xl bg-soft/60 p-4">
                <p className="mb-2 text-xs font-bold text-muted">Lý do xin nghỉ</p>
                <p className="text-sm leading-6 whitespace-pre-wrap break-words">{item.reason}</p>
              </div>
              <p className="text-sm text-muted">
                Gửi {mentorDate(item.submittedAt)} · Hết hạn {mentorDate(item.expiresAt)}
              </p>
              <p>
                Xung đột lịch học viên hiện tại:{' '}
                {item.studentConflictCount === null ? 'Chưa có dữ liệu' : item.studentConflictCount}
              </p>
              <h3 className="font-extrabold">Lịch dạy bù đề xuất</h3>
              <ul className="space-y-3">
                {item.items.map((session) => (
                  <li
                    key={session.sourceSessionId}
                    className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center"
                  >
                    <p className="text-sm leading-6 text-muted">
                      Buổi gốc: {mentorDate(session.sourceStartsAt)} –{' '}
                      {mentorDate(session.sourceEndsAt)}
                    </p>
                    <ArrowDown aria-hidden="true" className="size-4 text-mint sm:-rotate-90" />
                    <p className="rounded-lg bg-mint/5 p-3 text-sm leading-6 font-semibold text-forest">
                      Dạy bù: {mentorDate(session.startsAt)} – {mentorDate(session.endsAt)}
                    </p>
                    {session.replacementSessionId && (
                      <p className="text-sm text-mint">Đã tạo buổi dạy bù</p>
                    )}
                  </li>
                ))}
              </ul>
              {item.itemCount > 20 && (
                <MentorPagination page={page} total={item.itemCount} onChange={setPage} />
              )}
              {item.classExtensions.length > 0 && (
                <p className="text-sm text-muted">
                  Ngày kết thúc dự kiến của các lớp:{' '}
                  {[...new Set(item.classExtensions.map((entry) => entry.endDate))].join(', ')}.
                </p>
              )}
              {item.review && (
                <p className="flex items-start gap-3 rounded-xl bg-soft p-4 text-sm leading-6 whitespace-pre-wrap">
                  <MessageSquareText
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-mint"
                  />
                  Phản hồi: {item.review.reason} · {mentorDate(item.review.reviewedAt)}
                </p>
              )}
              {item.status === 'PENDING' && !withdraw && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setWithdraw({ version: item.version });
                    command.reset();
                  }}
                >
                  Rút đơn
                </Button>
              )}
              {withdraw && item.status === 'PENDING' && (
                <form
                  className="space-y-4 rounded-xl border border-line p-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const input = withdrawLeaveInputSchema.safeParse({
                      expectedVersion: withdraw.version,
                      reason,
                    });
                    if (!input.success) return;
                    try {
                      await command.mutateAsync({
                        path: `mentor/leave-requests/${props.id}/withdraw`,
                        body: input.data,
                        idempotent: true,
                      });
                      setWithdraw(null);
                    } catch {
                      /* shown below */
                    }
                  }}
                >
                  <label className="block space-y-2 font-bold">
                    Lý do rút đơn
                    <Textarea
                      required
                      maxLength={1000}
                      value={reason}
                      disabled={command.isPending}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <p className="text-sm text-muted">
                    Rút đơn chờ duyệt không làm thay đổi lịch dạy.
                  </p>
                  {command.error && <p role="alert">{mentorError(command.error)}</p>}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="submit"
                      disabled={
                        command.isPending || !reason.trim() || item.version !== withdraw.version
                      }
                    >
                      Xác nhận rút đơn
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={command.isPending}
                      onClick={() => setWithdraw(null)}
                    >
                      Quay lại
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </MentorQueryState>
      </div>
    </Modal>
  );
}
