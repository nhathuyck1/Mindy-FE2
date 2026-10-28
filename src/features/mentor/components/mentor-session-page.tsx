'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { z } from 'zod';
import { useSession } from '@/features/auth/api/auth-queries';
import { MentorTeachingNotes } from './mentor-teaching-notes';
import { MentorMeetingEditor } from './mentor-meeting-editor';
import { attendanceCandidatesSchema, workspaceSchema } from '../schemas/workspace-contracts';
import { Play, CheckCheck, RefreshCw, ExternalLink, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { MentorAttendanceRoster } from './mentor-attendance-roster';
import {
  attendanceSchema,
  attendanceWriteSchema,
  sessionContextSchema,
} from '../schemas/mentor-contracts';
import { useMentorQuery, useMentorCommand, mentorError } from '../api/mentor-queries';
import {
  MentorHeading,
  MentorQueryState,
  MentorPagination,
  MentorStatus,
  mentorDate,
} from './mentor-shared';

export function MentorSessionPage(props: { sessionId: string }) {
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<'finalize' | 'present' | 'absent' | null>(null);
  const [notes, setNotes] = useState(false);
  const [meeting, setMeeting] = useState(false);
  const actor = useSession();
  const prefix = `class-sessions/${props.sessionId}`;
  const context = useMentorQuery(`${prefix}/context`, sessionContextSchema);
  const workspace = useMentorQuery(
    `mentor/classes/${context.data?.session.classId}`,
    workspaceSchema,
    Boolean(context.data),
  );
  const attendance = useMentorQuery(
    `${prefix}/attendance?page=${page}&pageSize=20`,
    attendanceSchema,
  );
  const scheduled =
    context.data?.session.status === 'SCHEDULED' && workspace.data?.readonly === false;
  const candidates = useMentorQuery(
    `${prefix}/attendance-candidates?page=${page}&pageSize=20`,
    attendanceCandidatesSchema,
    scheduled,
  );
  const command = useMentorCommand(attendanceWriteSchema);
  const session = attendance.data?.session;
  const busy =
    command.isPending ||
    attendance.isFetching ||
    Boolean(context.error || attendance.error || workspace.error);
  async function act(
    action: 'start' | 'finalize' | 'attendance/sync-roster' | 'attendance' | 'attendance/bulk',
    records?: {
      enrollmentId: string;
      status: 'PRESENT' | 'ABSENT' | 'UNMARKED';
    }[],
    guestRecords?: { makeupPlacementId: string; status: 'PRESENT' | 'ABSENT' | 'UNMARKED' }[],
    checked?: boolean,
  ) {
    if (!session || busy || workspace.data?.readonly) return;
    try {
      await command.mutateAsync({
        path: `${prefix}/${action}`,
        method:
          action.startsWith('attendance') && ['attendance', 'attendance/bulk'].includes(action)
            ? 'PUT'
            : 'POST',
        idempotent: true,
        body: {
          expectedVersion: session.version,
          ...(records ? { records } : {}),
          ...(guestRecords ? { guestRecords } : {}),
          ...(checked === undefined ? {} : { checked }),
        },
      });
      setConfirm(null);
      if (action === 'start') setPage(1);
    } catch {
      /* Error is rendered beside the controls. */
    }
  }
  function mark(
    item: z.infer<typeof attendanceSchema>['items'][number],
    status: 'PRESENT' | 'ABSENT',
  ) {
    if (item.entryType === 'MAKEUP' && item.makeupPlacementId)
      return act('attendance', [], [{ makeupPlacementId: item.makeupPlacementId, status }]);
    return act('attendance', [{ enrollmentId: item.enrollmentId, status }]);
  }
  const teaching = context.data?.session.effectiveMentor?.id === actor.data?.id;
  const meetingAllowed =
    teaching &&
    !workspace.data?.readonly &&
    ['SCHEDULED', 'IN_PROGRESS'].includes(context.data?.session.status ?? '');
  const canWriteNote =
    teaching &&
    workspace.data?.status !== 'CANCELLED' &&
    ['IN_PROGRESS', 'COMPLETED'].includes(session?.status ?? '') &&
    Boolean(session?.editableUntil && Date.parse(session.editableUntil) > Date.parse(session.asOf));
  const meetingUrl = context.data?.meetingUrl;
  const safeMeeting =
    meetingUrl &&
    ['https:', 'http:'].includes(new URL(meetingUrl).protocol) &&
    !new URL(meetingUrl).username &&
    !new URL(meetingUrl).password;
  return (
    <>
      <Link href="/mentor" className="mb-6 inline-block text-sm font-bold text-mint">
        ← Lịch dạy
      </Link>
      <MentorHeading
        title={context.data?.session.title ?? 'Thông tin buổi học'}
        description="Theo dõi chuyên cần của học viên và cập nhật điểm danh cho buổi học."
      />
      <MentorQueryState
        pending={
          context.isPending ||
          attendance.isPending ||
          Boolean(context.data && workspace.isPending) ||
          (scheduled && candidates.isPending)
        }
        error={
          !context.data || !attendance.data || !workspace.data
            ? context.error ||
              attendance.error ||
              workspace.error ||
              (scheduled && candidates.error)
            : scheduled && candidates.error
        }
        retry={() =>
          Promise.all([
            context.refetch(),
            attendance.refetch(),
            ...(context.data ? [workspace.refetch()] : []),
            ...(scheduled ? [candidates.refetch()] : []),
          ])
        }
      >
        {(context.error || attendance.error || workspace.error) && (
          <p role="alert" className="mb-4 rounded-xl bg-peach p-4">
            Chưa tải lại được dữ liệu buổi học. Hãy làm mới trước khi tiếp tục; bản nháp ghi chú
            được giữ nguyên.
          </p>
        )}
        <section className="mb-6 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-line bg-canvas p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-soft text-mint"
              aria-hidden="true"
            >
              <Clock3 className="size-6" />
            </span>
            <div className="min-w-0 space-y-2">
              <p className="text-[18px] leading-7 font-semibold">
                {mentorDate(context.data?.session.startsAt ?? null)} –{' '}
                {mentorDate(context.data?.session.endsAt ?? null)}
              </p>
              <p className="text-[16px] leading-6 text-muted">
                {context.data?.roomName ? `Phòng: ${context.data.roomName}` : 'Chưa có phòng học'} ·
                Giờ Việt Nam (UTC+7)
              </p>
              <p className="text-[16px] leading-6">
                {context.data?.session.assignmentType === 'SUBSTITUTE'
                  ? 'Phân công dạy thay'
                  : 'Phân công chính'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {meetingAllowed && (
              <Button variant="outline" onClick={() => setMeeting(true)}>
                Sửa link buổi học
              </Button>
            )}
            {safeMeeting && (
              <Button variant="outline" asChild>
                <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                  Vào phòng học
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            )}
          </div>
        </section>
        <section
          aria-labelledby="attendance-heading"
          className="@container/attendance overflow-hidden rounded-2xl border border-line bg-canvas"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="attendance-heading" className="text-[24px] leading-8 font-bold">
                Bảng điểm danh
              </h2>
              {session && (
                <span className="[&_[data-slot=badge]]:px-3 [&_[data-slot=badge]]:py-1 [&_[data-slot=badge]]:text-[16px]">
                  <MentorStatus value={session.status} />
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {session?.permissions.canStart && !workspace.data?.readonly && (
                <Button disabled={busy} onClick={() => act('start')}>
                  <Play className="size-4" />
                  Bắt đầu buổi
                </Button>
              )}
              {session?.permissions.canSyncRoster && !workspace.data?.readonly && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => act('attendance/sync-roster')}
                >
                  <RefreshCw className="size-4" />
                  Đồng bộ học viên
                </Button>
              )}
              {session?.permissions.canFinalize && !workspace.data?.readonly && (
                <Button disabled={busy} onClick={() => setConfirm('finalize')}>
                  <CheckCheck className="size-4" />
                  Chốt buổi
                </Button>
              )}
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  Promise.all([
                    context.refetch(),
                    attendance.refetch(),
                    workspace.refetch(),
                    ...(scheduled ? [candidates.refetch()] : []),
                  ])
                }
              >
                <RefreshCw aria-hidden="true" className="size-4" />
                Làm mới
              </Button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {command.isError && (
              <p role="alert" className="mt-4 rounded-xl bg-peach p-4">
                {mentorError(command.error)}
              </p>
            )}
            {attendance.data && (
              <>
                {!scheduled && (
                  <div className="mb-5 grid grid-cols-2 gap-3 @3xl/attendance:grid-cols-4">
                    {[
                      ['Trong danh sách', attendance.data.totals.eligible],
                      ['Có mặt', attendance.data.totals.present],
                      ['Vắng mặt', attendance.data.totals.absent],
                      ['Chưa điểm danh', attendance.data.totals.unmarked],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className={`rounded-xl border bg-soft/40 p-4 ${label === 'Vắng mặt' && typeof value === 'number' && value > 0 ? 'border-status-red' : 'border-line'}`}
                      >
                        <p className="text-[16px] leading-6 font-medium text-muted">{label}</p>
                        <p className="mt-2 text-[32px] leading-10 font-bold tabular-nums">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mb-5 flex items-start gap-3 rounded-xl bg-soft/60 px-4 py-3">
                  <Clock3 aria-hidden="true" className="mt-1 size-4 shrink-0 text-mint" />
                  <p className="text-[16px] leading-7 text-muted">
                    {session?.editableUntil
                      ? `Hạn chỉnh sửa: ${mentorDate(session.editableUntil)} (UTC+7).`
                      : 'Chỉ bắt đầu được trong ngày học.'}
                    {!session?.permissions.canEditAttendance && ' Hiện không thể sửa điểm danh.'}
                    {attendance.data.pendingPaymentCount > 0 &&
                      ` Có ${attendance.data.pendingPaymentCount} học viên chờ thanh toán, chưa thuộc danh sách điểm danh.`}
                  </p>
                </div>
                {session?.permissions.canEditAttendance && !workspace.data?.readonly && (
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-canvas p-4">
                    <div>
                      <p className="text-sm font-bold">Điểm danh nhanh</p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Áp dụng cho cả buổi, gồm học viên học bù và tất cả trang.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => setConfirm('present')}
                      >
                        Tất cả có mặt
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => setConfirm('absent')}
                      >
                        Tất cả vắng
                      </Button>
                    </div>
                  </div>
                )}
                {scheduled ? (
                  <section aria-label="Danh sách học viên dự kiến" className="space-y-4">
                    <p role="status" className="text-sm text-muted">
                      Danh sách dự kiến: {candidates.data?.total ?? 0} học viên đủ điều kiện lúc
                      đọc. Bắt đầu buổi sẽ kiểm tra lại và tạo danh sách điểm danh chính thức.
                    </p>
                    <ul className="divide-y divide-line rounded-xl border border-line">
                      {candidates.data?.items.map((item) => (
                        <li
                          key={item.makeupPlacementId ?? item.enrollmentId}
                          className="p-4 text-lg font-semibold"
                        >
                          {item.student.displayName ?? 'Học viên'}
                          {item.entryType === 'MAKEUP' && (
                            <span className="ml-3 text-sm text-mint">Học bù</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {candidates.data?.total === 0 && <p>Chưa có học viên đủ điều kiện.</p>}
                    {candidates.data && (
                      <MentorPagination
                        page={page}
                        total={candidates.data.total}
                        onChange={setPage}
                      />
                    )}
                  </section>
                ) : (
                  <>
                    <MentorAttendanceRoster
                      items={attendance.data.items}
                      disabled={
                        busy ||
                        Boolean(workspace.data?.readonly) ||
                        !session?.permissions.canEditAttendance
                      }
                      scheduled={false}
                      onMark={mark}
                    />
                    <MentorPagination
                      page={page}
                      total={attendance.data.total}
                      onChange={setPage}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </section>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-4">
          <div>
            <p className="text-sm font-bold">Nhật ký buổi học</p>
            <p className="mt-1 text-xs text-muted">
              Lưu nội dung đã dạy và chuẩn bị cho buổi tiếp theo.
            </p>
          </div>
          <Button variant="outline" aria-expanded={notes} onClick={() => setNotes(!notes)}>
            Ghi chú giảng dạy
          </Button>
        </div>
        {notes && (
          <MentorTeachingNotes
            sessionId={props.sessionId}
            canWrite={canWriteNote && !busy}
            editableUntil={session?.editableUntil ?? null}
          />
        )}
      </MentorQueryState>
      {meeting && session && (
        <MentorMeetingEditor
          sessionId={props.sessionId}
          version={session.version}
          meetingUrl={meetingUrl ?? null}
          onClose={() => setMeeting(false)}
        />
      )}
      {confirm && (
        <Modal
          title={confirm === 'finalize' ? 'Chốt buổi học' : 'Điểm danh toàn bộ buổi'}
          onClose={() => {
            if (!command.isPending) setConfirm(null);
          }}
        >
          <div className="space-y-5 p-6">
            <p>
              {confirm === 'finalize'
                ? 'Những học viên chưa điểm danh sẽ chuyển thành vắng mặt. Bạn muốn chốt buổi học này?'
                : `Đánh dấu ${confirm === 'present' ? 'có mặt' : 'vắng mặt'} cho toàn bộ ${attendance.data?.totals.eligible ?? 0} học viên, gồm học bù và tất cả trang?`}
            </p>
            {command.isError && <p role="alert">{mentorError(command.error)}</p>}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>
                Quay lại
              </Button>
              <Button
                disabled={
                  busy ||
                  (confirm === 'finalize'
                    ? !session?.permissions.canFinalize
                    : !session?.permissions.canEditAttendance)
                }
                onClick={() =>
                  confirm === 'finalize'
                    ? act('finalize')
                    : act('attendance/bulk', undefined, undefined, confirm === 'present')
                }
              >
                {command.isPending
                  ? 'Đang lưu…'
                  : confirm === 'finalize'
                    ? 'Xác nhận chốt buổi'
                    : 'Xác nhận toàn bộ'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
