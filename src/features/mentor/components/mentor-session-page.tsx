'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Play, CheckCheck, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Modal } from '@/components/ui/modal';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
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
    records?: { enrollmentId: string; status: 'PRESENT' | 'ABSENT' | 'UNMARKED' }[],
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
        description="Điểm danh theo danh sách đã chụp khi bắt đầu buổi. Mentor được chỉnh sửa đến hết ngày kế tiếp ngày học."
      />
      <MentorQueryState pending={context.isPending} error={context.error} retry={context.refetch}>
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-canvas p-6">
          <div className="space-y-2">
            <p className="font-bold">
              {mentorDate(context.data?.session.startsAt ?? null)} –{' '}
              {mentorDate(context.data?.session.endsAt ?? null)}
            </p>
            <p className="text-sm text-muted">
              {context.data?.roomName ? `Phòng: ${context.data.roomName}` : 'Chưa có phòng học'} ·
              Giờ Việt Nam (UTC+7)
            </p>
            <p className="text-sm">
              {context.data?.session.assignmentType === 'SUBSTITUTE'
                ? 'Phân công dạy thay'
                : 'Phân công chính'}
            </p>
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
      </MentorQueryState>
      <MentorQueryState
        pending={attendance.isPending}
        error={attendance.error}
        retry={attendance.refetch}
      >
        <section className="rounded-2xl border border-line bg-canvas p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold">Bảng điểm danh</h2>
              {session && <MentorStatus value={session.status} />}
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
                Làm mới
              </Button>
            </div>
          </div>
          {command.isError && (
            <p role="alert" className="mt-4 rounded-xl bg-peach p-4">
              {mentorError(command.error)}
            </p>
          )}
          {attendance.data && (
            <>
              <div className="my-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                  ['Trong danh sách', attendance.data.totals.eligible],
                  ['Có mặt', attendance.data.totals.present],
                  ['Vắng mặt', attendance.data.totals.absent],
                  ['Chưa điểm danh', attendance.data.totals.unmarked],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-line bg-soft p-4">
                    <p className="text-sm text-muted">{label}</p>
                    <p className="mt-2 text-2xl font-extrabold">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mb-4 text-sm leading-6 text-muted">
                {session?.editableUntil
                  ? `Hạn chỉnh sửa: ${mentorDate(session.editableUntil)} (UTC+7).`
                  : 'Chỉ bắt đầu được trong ngày học.'}
                {!session?.permissions.canEditAttendance && ' Hiện không thể sửa điểm danh.'}
                {attendance.data.pendingPaymentCount > 0 &&
                  ` Có ${attendance.data.pendingPaymentCount} học viên chờ thanh toán, chưa thuộc danh sách điểm danh.`}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Có mặt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.data.items.map((item) => (
                    <TableRow key={item.attendanceId}>
                      <TableCell className="font-bold">
                        {item.student.displayName ?? 'Học viên'}
                      </TableCell>
                      <TableCell>
                        <MentorStatus value={item.status} />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          aria-label={`Có mặt: ${item.student.displayName ?? item.student.id}`}
                          checked={item.status === 'PRESENT'}
                          disabled={busy || !session?.permissions.canEditAttendance}
                          onCheckedChange={(checked) =>
                            act('attendance', [
                              {
                                enrollmentId: item.enrollmentId,
                                status:
                                  checked === true
                                    ? 'PRESENT'
                                    : session?.status === 'COMPLETED'
                                      ? 'ABSENT'
                                      : 'UNMARKED',
                              },
                            ])
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {attendance.data.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-muted">
                        {session?.status === 'SCHEDULED'
                          ? 'Bắt đầu buổi để chụp danh sách điểm danh.'
                          : 'Chưa có học viên trong danh sách điểm danh.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <MentorPagination page={page} total={attendance.data.total} onChange={setPage} />
            </>
          )}
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
              Những học viên chưa được tick có mặt sẽ chuyển thành vắng mặt. Bạn muốn chốt buổi học
              này?
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
