'use client';

import Link from 'next/link';
import { useState } from 'react';
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
  const [confirm, setConfirm] = useState(false);
  const prefix = `class-sessions/${props.sessionId}`;
  const context = useMentorQuery(`${prefix}/context`, sessionContextSchema);
  const attendance = useMentorQuery(
    `${prefix}/attendance?page=${page}&pageSize=20`,
    attendanceSchema,
  );
  const command = useMentorCommand(attendanceWriteSchema);
  const session = attendance.data?.session;
  const busy = command.isPending || attendance.isFetching;
  async function act(
    action: 'start' | 'finalize' | 'attendance/sync-roster' | 'attendance',
    records?: {
      enrollmentId: string;
      status: 'PRESENT' | 'ABSENT' | 'UNMARKED';
    }[],
  ) {
    if (!session || busy) return;
    try {
      await command.mutateAsync({
        path: `${prefix}/${action}`,
        method: action === 'attendance' ? 'PUT' : 'POST',
        idempotencyKey: crypto.randomUUID(),
        body: { expectedVersion: session.version, ...(records ? { records } : {}) },
      });
      setConfirm(false);
    } catch {
      /* Error is rendered beside the controls. */
    }
  }
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
        pending={context.isPending || attendance.isPending}
        error={context.error || attendance.error}
        retry={() => Promise.all([context.refetch(), attendance.refetch()])}
      >
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
          {safeMeeting && (
            <Button variant="outline" asChild>
              <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                Vào phòng học
                <ExternalLink className="size-4" />
              </a>
            </Button>
          )}
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
              {session?.permissions.canStart && (
                <Button disabled={busy} onClick={() => act('start')}>
                  <Play className="size-4" />
                  Bắt đầu buổi
                </Button>
              )}
              {session?.permissions.canSyncRoster && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => act('attendance/sync-roster')}
                >
                  <RefreshCw className="size-4" />
                  Đồng bộ học viên
                </Button>
              )}
              {session?.permissions.canFinalize && (
                <Button disabled={busy} onClick={() => setConfirm(true)}>
                  <CheckCheck className="size-4" />
                  Chốt buổi
                </Button>
              )}
              <Button variant="outline" disabled={busy} onClick={() => attendance.refetch()}>
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
                      <p className="mt-2 text-[32px] leading-10 font-bold tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>
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
                <MentorAttendanceRoster
                  items={attendance.data.items}
                  disabled={busy || !session?.permissions.canEditAttendance}
                  scheduled={session?.status === 'SCHEDULED'}
                  onMark={(enrollmentId, status) =>
                    act('attendance', [
                      {
                        enrollmentId,
                        status,
                      },
                    ])
                  }
                />
                <MentorPagination page={page} total={attendance.data.total} onChange={setPage} />
              </>
            )}
          </div>
        </section>
      </MentorQueryState>
      {confirm && (
        <Modal
          title="Chốt buổi học"
          onClose={() => {
            if (!command.isPending) setConfirm(false);
          }}
        >
          <div className="space-y-5 p-6">
            <p>
              Những học viên chưa điểm danh sẽ chuyển thành vắng mặt. Bạn muốn chốt buổi học này?
            </p>
            {command.isError && <p role="alert">{mentorError(command.error)}</p>}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" disabled={busy} onClick={() => setConfirm(false)}>
                Quay lại
              </Button>
              <Button
                disabled={busy || !session?.permissions.canFinalize}
                onClick={() => act('finalize')}
              >
                {command.isPending ? 'Đang chốt…' : 'Xác nhận chốt buổi'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
