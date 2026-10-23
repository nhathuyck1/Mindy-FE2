'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, CalendarOff, CircleAlert, MessageSquareText } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { useManagerQuery } from '../api/manager-queries';
import { managerLeaveError, useManagerLeaveCommand } from '../api/manager-leave-queries';
import {
  approveManagerLeaveSchema,
  managerLeaveDetailSchema,
  rejectManagerLeaveSchema,
} from '../schemas/manager-leave-contracts';
import { ManagerState } from './manager-shared';
import {
  LeaveStatusBadge,
  ManagerLeaveClassName,
  ManagerLeaveMentorName,
  ManagerLeavePagination,
  ManagerLeaveStudentName,
  leavePeriodLabels,
  managerLeaveDate,
} from './manager-leave-ui';

type ActionKind = 'approve' | 'reject';

export function ManagerLeaveDetailPage(props: { requestId: string }) {
  const [itemPage, setItemPage] = useState(1);
  const [conflictPage, setConflictPage] = useState(1);
  const [confirmation, setConfirmation] = useState<{
    action: ActionKind;
    version: number;
    returnFocus: HTMLElement | null;
  } | null>(null);
  const approveButton = useRef<HTMLButtonElement>(null);
  const rejectButton = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const base = `management/mentor-leave-requests/${props.requestId}`;
  const detail = useManagerQuery(`${base}?page=1&pageSize=20`, managerLeaveDetailSchema);
  const sourcePage = useManagerQuery(
    `${base}?page=${itemPage}&pageSize=20`,
    managerLeaveDetailSchema,
  );
  const conflicts = useManagerQuery(
    `${base}?page=${conflictPage}&pageSize=20`,
    managerLeaveDetailSchema,
  );
  const command = useManagerLeaveCommand();
  const leave = detail.data;
  const unknownOutcome =
    command.isError && (!(command.error instanceof ApiError) || command.error.status >= 500);
  const canAct = Boolean(leave && leave.status === 'PENDING' && Date.parse(leave.expiresAt) > now);
  const partialDayConflict = Boolean(
    leave && leave.period !== 'FULL_DAY' && leave.studentConflictCount > 0,
  );
  const staleSources = Boolean(leave && leave.status === 'PENDING' && !leave.sourcesCurrent);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function openConfirmation(action: ActionKind) {
    command.reset();
    setNotice('');
    if (action === 'approve' && (partialDayConflict || staleSources)) return;
    const refreshed = await detail.refetch();
    const current = refreshed.data;
    if (!current) return;
    if (current.status !== 'PENDING' || Date.parse(current.expiresAt) <= Date.now()) {
      setNotice('Đơn không còn trong hạn xử lý. Chi tiết đã được tải lại.');
      return;
    }
    if (action === 'approve' && !current.sourcesCurrent) {
      setNotice('Lịch nguồn đã thay đổi. Mentor cần rút đơn chờ và gửi đơn mới.');
      return;
    }
    if (action === 'approve' && current.period !== 'FULL_DAY' && current.studentConflictCount > 0) {
      setNotice('Đơn nghỉ theo buổi có xung đột lịch học viên nên không thể duyệt.');
      return;
    }
    setReason('');
    setAcknowledged(false);
    setConfirmation({
      action,
      version: current.version,
      returnFocus: action === 'approve' ? approveButton.current : rejectButton.current,
    });
  }

  function closeConfirmation() {
    const target = confirmation?.returnFocus;
    setConfirmation(null);
    window.setTimeout(() => {
      if (target?.isConnected) target.focus({ preventScroll: true });
    }, 0);
  }

  async function submitAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      submitting ||
      command.isPending ||
      !confirmation ||
      !leave ||
      leave.version !== confirmation.version
    )
      return;
    const input =
      confirmation.action === 'approve'
        ? approveManagerLeaveSchema.safeParse({
            expectedVersion: confirmation.version,
            reason,
            acknowledgeStudentConflicts:
              leave.period === 'FULL_DAY' && leave.studentConflictCount > 0 ? acknowledged : false,
          })
        : rejectManagerLeaveSchema.safeParse({
            expectedVersion: confirmation.version,
            reason,
          });
    if (!input.success) return;
    setSubmitting(true);
    try {
      const result = await command.mutateAsync({
        path: `${base}/${confirmation.action}`,
        body: input.data,
      });
      if (confirmation.action === 'approve' && 'request' in result) {
        setNotice(
          `Đã duyệt đơn, tạo ${result.replacements.length} buổi dạy bù và xử lý ${result.studentConflictCount} xung đột học viên.`,
        );
      } else {
        setNotice('Đã từ chối đơn xin nghỉ. Lịch dạy được giữ nguyên.');
      }
      setConfirmation(null);
      setReason('');
      setAcknowledged(false);
      await Promise.all([detail.refetch(), sourcePage.refetch(), conflicts.refetch()]);
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 409 ||
          [
            'LEAVE_VERSION_CONFLICT',
            'LEAVE_STATE_CONFLICT',
            'LEAVE_REQUEST_STALE',
            'LEAVE_REQUEST_EXPIRED',
            'LEAVE_STUDENT_CONFLICT_ACK_REQUIRED',
          ].includes(error.code))
      ) {
        setConfirmation(null);
        setAcknowledged(false);
        setNotice(managerLeaveError(error));
        await Promise.all([detail.refetch(), sourcePage.refetch(), conflicts.refetch()]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const visibleSourceItems = sourcePage.data?.items ?? [];
  const visibleSourceById = new Map(
    visibleSourceItems.map((entry) => [entry.sourceSessionId, entry]),
  );

  return (
    <div className="min-w-0 space-y-6">
      <Button asChild variant="outline">
        <Link href="/manager/leave-requests">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Danh sách đơn
        </Link>
      </Button>

      <header className="admin-page-heading">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-mint uppercase">
            Mindy / Đơn xin nghỉ mentor
          </p>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <CalendarOff aria-hidden="true" className="size-7 text-mint" />
            Chi tiết đơn xin nghỉ
          </h1>
        </div>
      </header>

      <ManagerState pending={detail.isPending} error={detail.error} retry={detail.refetch}>
        {leave && (
          <div className="space-y-6">
            <section
              className="admin-table-panel space-y-5 p-5 sm:p-6"
              aria-label="Thông tin đơn xin nghỉ"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold">
                    {managerLeaveDate(leave.fromDate)} – {managerLeaveDate(leave.toDate)} ·{' '}
                    {leavePeriodLabels[leave.period]}
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Gửi lúc {managerLeaveDate(leave.submittedAt)} · Hạn duyệt{' '}
                    {managerLeaveDate(leave.expiresAt)}
                  </p>
                </div>
                <LeaveStatusBadge status={leave.status} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-soft/60 p-4">
                  <p className="mb-2 text-xs font-bold text-muted">Mentor gửi đơn</p>
                  <ManagerLeaveMentorName id={leave.mentorId} />
                </div>
                <div className="rounded-xl bg-soft/60 p-4">
                  <p className="mb-2 text-xs font-bold text-muted">Lý do xin nghỉ</p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    {leave.reason}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-lg border border-line px-3 py-2">
                  {leave.itemCount} buổi bị ảnh hưởng
                </span>
                <span className="rounded-lg border border-line px-3 py-2">
                  {leave.studentConflictCount} xung đột lịch học viên hiện tại
                </span>
                <span className="rounded-lg border border-line px-3 py-2">
                  {leave.sourcesCurrent ? 'Lịch nguồn còn khớp' : 'Lịch nguồn đã thay đổi'}
                </span>
              </div>
              {leave.classExtensions.length > 0 && (
                <div className="rounded-xl border border-line p-4">
                  <h3 className="font-extrabold">Ngày kết thúc dự kiến của lớp</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {leave.classExtensions.map((extension) => (
                      <li
                        key={extension.classId}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <ManagerLeaveClassName id={extension.classId} />
                        <span>{managerLeaveDate(extension.endDate)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {staleSources && (
                <p
                  role="alert"
                  className="flex items-start gap-3 rounded-xl bg-peach p-4 text-sm leading-6"
                >
                  <CircleAlert aria-hidden="true" className="mt-1 size-4 shrink-0" />
                  Buổi nguồn đã thay đổi. Không thể duyệt đơn này; mentor cần rút đơn chờ và gửi đơn
                  mới. Manager vẫn có thể từ chối.
                </p>
              )}
              {leave.status === 'PENDING' && Date.parse(leave.expiresAt) <= now && (
                <p role="alert" className="rounded-xl bg-soft p-4 text-sm">
                  Đơn đã quá hạn xử lý. Hãy tải lại để xác nhận trạng thái mới.
                </p>
              )}
              {notice && (
                <p role="status" className="rounded-xl bg-mint/10 p-4 text-sm leading-6">
                  {notice}
                </p>
              )}
              {command.isError && !confirmation && !notice && (
                <p role="alert" className="rounded-xl bg-peach p-4 text-sm leading-6">
                  {managerLeaveError(command.error)}
                </p>
              )}
              {leave.review && (
                <div className="flex items-start gap-3 rounded-xl bg-soft p-4 text-sm leading-6">
                  <MessageSquareText
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-mint"
                  />
                  <div>
                    <p className="font-bold">Phản hồi xử lý</p>
                    <p className="mt-1 whitespace-pre-wrap break-words">{leave.review.reason}</p>
                    <p className="mt-1 text-muted">{managerLeaveDate(leave.review.reviewedAt)}</p>
                  </div>
                </div>
              )}
            </section>

            <section className="admin-table-panel min-w-0" aria-label="Lịch gốc và lịch dạy bù">
              <header className="p-5 sm:p-6">
                <h2 className="text-lg font-extrabold">Lịch bị ảnh hưởng và lịch dạy bù</h2>
                <p className="mt-1 text-sm text-muted">
                  Đối chiếu từng buổi trước khi ra quyết định.
                </p>
              </header>
              <ManagerState
                pending={sourcePage.isPending}
                error={sourcePage.error}
                retry={sourcePage.refetch}
              >
                {visibleSourceItems.length === 0 ? (
                  <p
                    role="status"
                    className="border-t border-line p-8 text-center text-sm text-muted"
                  >
                    Không có buổi trên trang này.
                  </p>
                ) : (
                  <ul className="divide-y divide-line border-t border-line">
                    {visibleSourceItems.map((session) => (
                      <li
                        key={session.sourceSessionId}
                        className="grid gap-4 p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center"
                      >
                        <div className="min-w-0 space-y-2">
                          <p className="text-xs font-bold tracking-wide text-muted uppercase">
                            Buổi gốc
                          </p>
                          <ManagerLeaveClassName id={session.classId} />
                          <p className="text-sm leading-6">
                            {managerLeaveDate(session.sourceStartsAt)} –{' '}
                            {managerLeaveDate(session.sourceEndsAt)}
                          </p>
                          <p className="break-all text-xs text-muted">
                            Mã buổi: {session.sourceSessionId}
                          </p>
                        </div>
                        <ArrowDown aria-hidden="true" className="size-5 text-mint sm:-rotate-90" />
                        <div className="min-w-0 space-y-2 rounded-xl bg-mint/5 p-4">
                          <p className="text-xs font-bold tracking-wide text-mint uppercase">
                            Buổi dạy bù đề xuất
                          </p>
                          <p className="text-sm leading-6">
                            {managerLeaveDate(session.startsAt)} –{' '}
                            {managerLeaveDate(session.endsAt)}
                          </p>
                          {session.replacementSessionId ? (
                            <p className="break-all text-xs text-muted">
                              Buổi bù đã tạo: {session.replacementSessionId}
                            </p>
                          ) : (
                            <p className="text-xs text-muted">
                              Chưa tạo · chỉ được tạo sau khi duyệt
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {sourcePage.data && leave.itemCount > 20 && (
                  <ManagerLeavePagination
                    page={itemPage}
                    total={leave.itemCount}
                    noun="buổi"
                    onChange={setItemPage}
                  />
                )}
              </ManagerState>
            </section>

            <section className="admin-table-panel min-w-0" aria-label="Xung đột lịch học viên">
              <header className="p-5 sm:p-6">
                <h2 className="text-lg font-extrabold">Xung đột lịch học viên</h2>
                <p className="mt-1 text-sm text-muted">
                  {leave.studentConflictCount} xung đột đang được kiểm tra lại ở thời điểm xem.
                </p>
              </header>
              <ManagerState
                pending={conflicts.isPending}
                error={conflicts.error}
                retry={conflicts.refetch}
              >
                {conflicts.data?.studentConflicts.length ? (
                  <ul className="divide-y divide-line border-t border-line">
                    {conflicts.data.studentConflicts.map((conflict) => {
                      const source = visibleSourceById.get(conflict.sourceSessionId);
                      return (
                        <li
                          key={`${conflict.sourceSessionId}:${conflict.studentId}:${conflict.conflictingSessionId}`}
                          className="grid min-w-0 gap-3 p-5 md:grid-cols-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-muted">Học viên</p>
                            <ManagerLeaveStudentName id={conflict.studentId} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-muted">Buổi dạy bù</p>
                            <p className="break-all text-sm">
                              {source
                                ? managerLeaveDate(source.startsAt)
                                : conflict.sourceSessionId}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-muted">Buổi bị trùng</p>
                            <p className="break-all text-sm">{conflict.conflictingSessionId}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p
                    role="status"
                    className="border-t border-line p-8 text-center text-sm text-muted"
                  >
                    Không có xung đột học viên hiện tại.
                  </p>
                )}
                {conflicts.data && leave.studentConflictCount > 20 && (
                  <ManagerLeavePagination
                    page={conflictPage}
                    total={leave.studentConflictCount}
                    noun="xung đột"
                    onChange={setConflictPage}
                  />
                )}
              </ManagerState>
            </section>

            {canAct && (
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  ref={rejectButton}
                  variant="outline"
                  disabled={submitting || command.isPending || detail.isFetching}
                  onClick={() => void openConfirmation('reject')}
                >
                  Từ chối đơn
                </Button>
                <Button
                  ref={approveButton}
                  disabled={
                    submitting ||
                    command.isPending ||
                    staleSources ||
                    partialDayConflict ||
                    detail.isFetching
                  }
                  title={partialDayConflict ? 'Đơn nghỉ theo buổi có xung đột học viên' : undefined}
                  onClick={() => void openConfirmation('approve')}
                >
                  Duyệt đơn
                </Button>
              </div>
            )}
          </div>
        )}
      </ManagerState>

      {confirmation && leave && (
        <Modal
          title={confirmation.action === 'approve' ? 'Xác nhận duyệt đơn' : 'Xác nhận từ chối đơn'}
          contentClassName="sm:max-w-2xl"
          returnFocus={confirmation.returnFocus}
          onClose={() => {
            if (!submitting && !command.isPending && !unknownOutcome) closeConfirmation();
          }}
        >
          <form className="space-y-5 p-5" onSubmit={submitAction}>
            <p className="text-sm leading-6">
              {confirmation.action === 'approve'
                ? `Duyệt đơn sẽ hủy ${leave.itemCount} buổi gốc, tạo lịch dạy bù và ghi khoảng nghỉ cho mentor.`
                : 'Từ chối đơn sẽ giữ nguyên các buổi dạy hiện tại.'}
            </p>
            <p className="rounded-xl bg-soft p-4 text-sm">
              {managerLeaveDate(leave.fromDate)} – {managerLeaveDate(leave.toDate)} ·{' '}
              {leavePeriodLabels[leave.period]} · phiên bản {confirmation.version}
            </p>
            {confirmation.action === 'approve' &&
              leave.period === 'FULL_DAY' &&
              leave.studentConflictCount > 0 && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 text-sm leading-6">
                  <Checkbox
                    checked={acknowledged}
                    disabled={submitting || command.isPending || unknownOutcome}
                    onCheckedChange={(checked) => setAcknowledged(checked === true)}
                    aria-label="Xác nhận đã xem xung đột lịch học viên"
                  />
                  <span>
                    Tôi đã xem {leave.studentConflictCount} xung đột lịch học viên và xác nhận tiếp
                    tục duyệt.
                  </span>
                </label>
              )}
            <label htmlFor="leave-review-reason" className="block space-y-2 text-sm font-semibold">
              Lý do xử lý
              <Textarea
                id="leave-review-reason"
                required
                minLength={1}
                maxLength={1000}
                value={reason}
                disabled={submitting || command.isPending || unknownOutcome}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  confirmation.action === 'approve' ? 'Ghi lý do duyệt đơn' : 'Nêu lý do từ chối'
                }
                className="min-h-28"
              />
              <span className="block font-normal text-muted">
                Từ 1 đến 1000 ký tự sau khi bỏ khoảng trắng đầu/cuối.
              </span>
            </label>
            {leave.version !== confirmation.version && (
              <p role="alert" className="rounded-xl bg-peach p-4 text-sm">
                Đơn đã đổi phiên bản. Đóng xác nhận, tải lại chi tiết rồi quyết định lại.
              </p>
            )}
            {command.error && (
              <p role="alert" className="rounded-xl bg-peach p-4 text-sm leading-6">
                {managerLeaveError(command.error)}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={submitting || command.isPending || unknownOutcome}
                onClick={closeConfirmation}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  command.isPending ||
                  leave.version !== confirmation.version ||
                  !reason.trim() ||
                  (confirmation.action === 'approve' &&
                    leave.period === 'FULL_DAY' &&
                    leave.studentConflictCount > 0 &&
                    !acknowledged)
                }
              >
                {submitting || command.isPending
                  ? 'Đang gửi…'
                  : unknownOutcome
                    ? 'Gửi lại cùng thao tác'
                    : confirmation.action === 'approve'
                      ? 'Xác nhận duyệt'
                      : 'Xác nhận từ chối'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
