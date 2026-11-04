'use client';

import { useState } from 'react';
import type { z } from 'zod';
import { useSession } from '@/features/auth/api/auth-queries';
import { MentorTeachingNotes } from './mentor-teaching-notes';
import { AssignmentList } from '@/features/assignments/components/assignment-list';
import { MentorSessionAssignments } from '@/features/code-assignments/components/mentor-session-assignments';
import { MentorMeetingEditor } from './mentor-meeting-editor';
import { attendanceCandidatesSchema, workspaceSchema } from '../schemas/workspace-contracts';
import {
  Play,
  CheckCheck,
  RefreshCw,
  Clock3,
  Users,
  Check,
  UserRound,
  CircleDashed,
  X,
} from 'lucide-react';
import { NameAvatar } from '@/components/ui/name-avatar';
import { MentorSessionOverview, MentorSessionTools } from './mentor-session-ui';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { MentorAttendanceRoster } from './mentor-attendance-roster';
import {
  attendanceSchema,
  attendanceWriteSchema,
  sessionContextSchema,
} from '../schemas/mentor-contracts';
import { useMentorQuery, useMentorCommand, mentorError } from '../api/mentor-queries';
import { MentorQueryState, MentorPagination, mentorDate } from './mentor-shared';

export function MentorSessionPage(props: { sessionId: string }) {
  const [showAssignments, setShowAssignments] = useState(false);
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
    <div className="min-w-0 rounded-3xl bg-soft/60 p-3 sm:p-5">
      <MentorSessionOverview
        session={context.data?.session}
        status={session?.status}
        classTitle={workspace.data?.name}
        roomName={context.data?.roomName}
        online={Boolean(safeMeeting)}
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
        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-5">
            <section
              aria-labelledby="attendance-heading"
              className="@container/attendance min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-soft/35 p-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint/10 text-mint"
                  >
                    <Users className="size-5" />
                  </span>
                  <div>
                    <h2 id="attendance-heading" className="text-lg font-extrabold">
                      Bảng điểm danh
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                      {scheduled ? candidates.data?.total : attendance.data?.totals.eligible} học
                      viên
                    </p>
                  </div>
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
                        {(
                          [
                            [
                              'Trong danh sách',
                              attendance.data.totals.eligible,
                              Users,
                              'bg-soft text-forest',
                            ],
                            [
                              'Có mặt',
                              attendance.data.totals.present,
                              Check,
                              'bg-mint/10 text-forest',
                            ],
                            [
                              'Vắng mặt',
                              attendance.data.totals.absent,
                              X,
                              'bg-status-red/5 text-status-red',
                            ],
                            [
                              'Chưa điểm danh',
                              attendance.data.totals.unmarked,
                              CircleDashed,
                              'bg-peach/70 text-forest',
                            ],
                          ] as const
                        ).map(([label, value, Icon, tone]) => (
                          <div
                            key={label}
                            role="group"
                            aria-label={label}
                            className={
                              'rounded-xl border p-4 ' +
                              (label === 'Vắng mặt' && value > 0
                                ? 'border-status-red/40 '
                                : 'border-line/60 ') +
                              tone
                            }
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold">{label}</p>
                              <Icon aria-hidden="true" className="size-4 shrink-0 opacity-70" />
                            </div>
                            <p className="mt-2 text-[32px] leading-10 font-bold tabular-nums">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {(session?.editableUntil || attendance.data.pendingPaymentCount > 0) && (
                      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
                        {session?.editableUntil && (
                          <p className="flex items-center gap-1.5">
                            <Clock3 aria-hidden="true" className="size-3.5" />
                            Hạn chỉnh sửa: {mentorDate(session.editableUntil)} (UTC+7).
                          </p>
                        )}
                        {attendance.data.pendingPaymentCount > 0 && (
                          <p>
                            {attendance.data.pendingPaymentCount} học viên chờ thanh toán, chưa
                            thuộc danh sách điểm danh.
                          </p>
                        )}
                      </div>
                    )}
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
                        <ul className="overflow-hidden rounded-xl border border-line">
                          {candidates.data?.items.map((item, index) => (
                            <li
                              key={item.makeupPlacementId ?? item.enrollmentId}
                              className="flex min-w-0 items-center gap-3 px-4 py-4 even:bg-soft/60 sm:gap-4"
                            >
                              <span
                                aria-hidden="true"
                                className="hidden w-5 shrink-0 text-xs font-semibold text-muted sm:block"
                              >
                                {String((page - 1) * 20 + index + 1).padStart(2, '0')}
                              </span>
                              <NameAvatar
                                name={item.student.displayName ?? 'Học viên'}
                                className="size-10 rounded-xl bg-mint/12"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold [overflow-wrap:anywhere]">
                                  {item.student.displayName ?? 'Học viên'}
                                </p>
                                <p className="mt-1 text-xs text-muted">
                                  {item.entryType === 'MAKEUP' ? 'Học bù' : 'Học viên'}
                                </p>
                              </div>
                              <UserRound
                                aria-hidden="true"
                                className="size-4 shrink-0 text-mint/60"
                              />
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
            <div>
              <MentorSessionAssignments
                sessionId={props.sessionId}
                readonly={
                  !context.data ||
                  !workspace.data ||
                  !(teaching || workspace.data.accessScope === 'CLASS') ||
                  workspace.data.readonly ||
                  !['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(context.data.session.status)
                }
              />
            </div>
          </div>
          <MentorSessionTools
            sessionId={props.sessionId}
            cancelled={context.data?.session.status === 'CANCELLED'}
            meetingAllowed={Boolean(meetingAllowed)}
            meetingUrl={safeMeeting ? meetingUrl : null}
            onEditMeeting={() => setMeeting(true)}
            notesOpen={notes}
            onToggleNotes={() => setNotes(!notes)}
            assignmentsAvailable={Boolean(context.data && workspace.data)}
            assignmentsOpen={showAssignments}
            onToggleAssignments={() => setShowAssignments((value) => !value)}
          />
        </div>
        {notes && (
          <div className="mt-5 rounded-2xl border border-line bg-canvas p-5">
            <MentorTeachingNotes
              sessionId={props.sessionId}
              canWrite={canWriteNote && !busy}
              editableUntil={session?.editableUntil ?? null}
            />
          </div>
        )}
        {showAssignments && context.data && workspace.data && (
          <AssignmentList
            sessionId={props.sessionId}
            mentor
            canCreate={
              (teaching || workspace.data.accessScope === 'CLASS') &&
              !workspace.data.readonly &&
              ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(context.data.session.status)
            }
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
    </div>
  );
}
