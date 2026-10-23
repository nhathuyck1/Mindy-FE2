'use client';
import { useState } from 'react';
import { ArrowLeft, CalendarDays, Send, CheckCircle2 } from 'lucide-react';
import { LeaveSteps, LeaveStepHeading } from './mentor-leave-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useMentorCommand, mentorError } from '../api/mentor-queries';
import {
  createLeaveInputSchema,
  leavePreviewInputSchema,
  leavePreviewSchema,
  leaveRequestSchema,
  type LeavePreview,
  type LeaveSessionMapping,
} from '../schemas/leave-contracts';
import { leavePeriods } from '../lib/leave-display';
import { mentorDate } from './mentor-shared';
import { SessionMakeupSlot } from './mentor-leave-makeup-slot';
import { LeaveSchedule } from './mentor-leave-schedule';
import { shiftDate, vietnamDate } from '../lib/weekly-timetable';
import { overlaps } from '../lib/leave-makeup';
export function LeaveCreate(props: { onClose: () => void; onCreated: (id: string) => void }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [period, setPeriod] = useState('FULL_DAY');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<LeavePreview | null>(null);
  const [sessions, setSessions] = useState<Record<string, LeaveSessionMapping>>({});
  const [error, setError] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => vietnamDate());
  const read = useMentorCommand(leavePreviewSchema);
  const create = useMentorCommand(leaveRequestSchema);
  const busy = read.isPending || create.isPending;
  const minimumLeaveDate = shiftDate(vietnamDate(), 2);
  const resetPreview = () => {
    setPreview(null);
    setSessions({});
    setError('');
    read.reset();
    create.reset();
  };
  const mappingsComplete =
    preview &&
    preview.affectedSessions.length > 0 &&
    preview.affectedSessions.every((item) => sessions[item.sessionId]);
  return (
    <section
      className="mx-auto mb-6 max-w-4xl space-y-6 rounded-2xl border border-line bg-canvas p-5 sm:p-8"
      aria-label="Tạo đơn xin nghỉ"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Đơn xin nghỉ mới</h2>
        <Button variant="outline" disabled={busy} onClick={props.onClose}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Đóng form
        </Button>
      </div>
      <LeaveSteps current={!preview ? 1 : mappingsComplete ? 3 : 2} />
      <p className="text-sm leading-6 text-muted">
        Gửi trước ít nhất hai ngày lịch. Chọn lịch dạy bù cho đầy đủ các buổi bị ảnh hưởng; lịch chỉ
        được áp dụng sau khi quản lý duyệt.
      </p>
      <LeaveStepHeading
        step={1}
        title="Chọn khoảng nghỉ"
        description="Chọn ngày và khoảng thời gian bạn cần nghỉ dạy."
      />
      <form
        className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (fromDate < shiftDate(vietnamDate(), 2)) {
            setError('Ngày bắt đầu nghỉ phải từ ngày hiện tại + 2 ngày trở đi.');
            return;
          }
          const input = leavePreviewInputSchema.safeParse({ fromDate, toDate, period });
          if (!input.success) {
            setError('Chọn khoảng ngày hợp lệ, tối đa 93 ngày.');
            return;
          }
          setError('');
          setPreview(null);
          setSessions({});
          create.reset();
          try {
            setPreview(
              await read.mutateAsync({ path: 'mentor/leave-requests/preview', body: input.data }),
            );
          } catch {
            /* shown below */
          }
        }}
      >
        <label className="min-w-0 space-y-2 text-sm font-bold">
          Nghỉ từ ngày
          <Input
            className="h-12"
            type="date"
            min={minimumLeaveDate}
            required
            value={fromDate}
            disabled={busy}
            onChange={(e) => {
              setFromDate(e.target.value);
              if (toDate && toDate < e.target.value) setToDate('');
              resetPreview();
            }}
          />
        </label>
        <label className="min-w-0 space-y-2 text-sm font-bold">
          Nghỉ đến ngày
          <Input
            className="h-12"
            type="date"
            min={fromDate > minimumLeaveDate ? fromDate : minimumLeaveDate}
            required
            value={toDate}
            disabled={busy}
            onChange={(e) => {
              setToDate(e.target.value);
              resetPreview();
            }}
          />
        </label>
        <label className="min-w-0 space-y-2 text-sm font-bold">
          Khoảng nghỉ
          <NativeSelect
            wrapperClassName="w-full"
            className="h-12"
            value={period}
            disabled={busy}
            onChange={(e) => {
              setPeriod(e.target.value);
              resetPreview();
            }}
          >
            {Object.entries(leavePeriods).map(([key, title]) => (
              <NativeSelectOption value={key} key={key}>
                {title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <Button
          type="submit"
          className="sm:col-span-2 lg:col-span-3 lg:justify-self-start"
          disabled={busy}
        >
          {read.isPending ? 'Đang xem…' : 'Xem buổi bị ảnh hưởng'}
        </Button>
      </form>
      {(error || read.error) && (
        <p role="alert" className="text-status-red">
          {error || mentorError(read.error)}
        </p>
      )}
      {preview && (
        <div className="space-y-5">
          <p
            role="status"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-mint/5 p-4 text-sm"
          >
            <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-mint" />
            Có {preview.affectedSessions.length} buổi bị ảnh hưởng.{' '}
            {preview.noticeDeadline && `Hạn gửi trước: ${mentorDate(preview.noticeDeadline)}.`}
          </p>
          {!preview.noticeEligible && (
            <p role="alert" className="rounded-xl bg-peach p-4">
              Khoảng nghỉ này không còn đủ thời gian báo trước. Hãy chọn ngày khác.
            </p>
          )}
          {preview.noticeEligible && preview.affectedSessions.length > 0 && (
            <>
              <div className="border-t border-line pt-6">
                <LeaveStepHeading
                  step={2}
                  title="Sắp xếp lịch dạy bù"
                  description={
                    period === 'FULL_DAY'
                      ? 'Nghỉ cả ngày: chọn ngày khác và giờ bù cho từng buổi. Ưu tiên giờ cũ nếu còn trống.'
                      : 'Chọn giờ bù cho từng buổi. Có thể bù cùng ngày, ngoài khoảng nghỉ và không trùng lịch.'
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 w-full whitespace-normal sm:w-auto"
                aria-expanded={showSchedule}
                aria-controls="leave-teaching-schedule"
                onClick={() => setShowSchedule(!showSchedule)}
              >
                <CalendarDays aria-hidden="true" className="size-4" />
                {showSchedule ? 'Ẩn lịch dạy' : 'Xem lịch dạy để chọn lịch bù'}
              </Button>
              {showSchedule && (
                <div id="leave-teaching-schedule">
                  <LeaveSchedule date={scheduleDate} onDateChange={setScheduleDate} />
                </div>
              )}
              <fieldset disabled={busy} className="space-y-3">
                {preview.affectedSessions.map((source) => (
                  <SessionMakeupSlot
                    key={source.sessionId}
                    source={source}
                    leave={{ fromDate, toDate, period, timeZone: preview.timeZone }}
                    mappings={sessions}
                    onDateChange={setScheduleDate}
                    onSelect={(mapping) =>
                      setSessions((current) => {
                        if (
                          mapping &&
                          Object.values(current).some(
                            (other) =>
                              other.sourceSessionId !== source.sessionId &&
                              overlaps(other, mapping),
                          )
                        )
                          return current;
                        const next = { ...current };
                        if (mapping) next[source.sessionId] = mapping;
                        else delete next[source.sessionId];
                        return next;
                      })
                    }
                  />
                ))}
              </fieldset>
              <p className="text-sm leading-6 text-muted">
                Nếu tuần này đã kín, bạn có thể chọn ngày ở tuần tiếp theo. Thời lượng buổi học được
                giữ nguyên; lịch sẽ được kiểm tra lại khi gửi và duyệt đơn.
              </p>
              <div className="border-t border-line pt-6">
                <LeaveStepHeading
                  step={3}
                  title="Hoàn tất và gửi đơn"
                  description="Thêm lý do để quản lý xem xét cùng lịch bù bạn đã chọn."
                />
              </div>
              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (fromDate < shiftDate(vietnamDate(), 2)) {
                    setError('Ngày bắt đầu nghỉ phải từ ngày hiện tại + 2 ngày trở đi.');
                    return;
                  }
                  const input = createLeaveInputSchema.safeParse({
                    fromDate,
                    toDate,
                    period,
                    reason,
                    sourceVersions: preview.sourceVersions,
                    sessionMappings: preview.affectedSessions.map(
                      (source) => sessions[source.sessionId],
                    ),
                  });
                  if (!input.success || !mappingsComplete || !preview.noticeEligible) {
                    setError('Điền đủ lý do và lịch bù cho mọi buổi bị ảnh hưởng.');
                    return;
                  }
                  setError('');
                  try {
                    const result = await create.mutateAsync({
                      path: 'mentor/leave-requests',
                      body: input.data,
                      idempotent: true,
                    });
                    props.onCreated(result.id);
                  } catch {
                    /* shown below */
                  }
                }}
              >
                <label className="block space-y-2 font-bold">
                  Lý do xin nghỉ
                  <Textarea
                    required
                    className="min-h-28 bg-canvas text-base"
                    placeholder="Nhập lý do xin nghỉ…"
                    maxLength={1000}
                    value={reason}
                    disabled={busy}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                {create.error && (
                  <p role="alert" className="text-status-red">
                    {mentorError(create.error)}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
                  <p className="max-w-sm text-xs leading-5 text-muted">
                    Lịch chỉ thay đổi sau khi đơn được quản lý duyệt.
                  </p>
                  <Button
                    type="submit"
                    disabled={
                      busy || !mappingsComplete || !preview.noticeEligible || !reason.trim()
                    }
                  >
                    <Send aria-hidden="true" className="size-4" />
                    {create.isPending ? 'Đang gửi…' : 'Gửi đơn xin nghỉ'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </section>
  );
}
