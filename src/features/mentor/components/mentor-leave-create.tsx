'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
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
import { makeupMinDate, leavePeriods } from '../lib/leave-display';
import { hasOverlappingMakeupSlots, makeupSlotsOverlap } from '../lib/leave-makeup';
import { mentorDate } from './mentor-shared';
import { SessionMakeupSlot } from './mentor-leave-makeup-slot';
export function LeaveCreate(props: { onClose: () => void; onCreated: (id: string) => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 60_000);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, []);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [period, setPeriod] = useState('FULL_DAY');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<LeavePreview | null>(null);
  const [sessions, setSessions] = useState<Record<string, LeaveSessionMapping>>({});
  const [error, setError] = useState('');
  const read = useMentorCommand(leavePreviewSchema);
  const create = useMentorCommand(leaveRequestSchema);
  const busy = read.isPending || create.isPending;
  const resetPreview = () => {
    setPreview(null);
    setSessions({});
    setError('');
    read.reset();
    create.reset();
  };
  const minMakeupDate = (sourceStartsAt: string, currentTime: number) =>
    preview
      ? makeupMinDate(preview.asOf, preview.timeZone, currentTime, {
          period,
          toDate,
          sourceStartsAt,
        })
      : '';
  const hasCompleteMappings = (currentTime: number) =>
    preview &&
    preview.affectedSessions.length > 0 &&
    !hasOverlappingMakeupSlots(Object.values(sessions)) &&
    preview.affectedSessions.every((item) => {
      const mapping = sessions[item.sessionId];
      return (
        mapping &&
        mapping.targetDate >= minMakeupDate(item.startsAt, currentTime) &&
        Date.parse(mapping.startsAt) > Math.max(currentTime, Date.parse(preview.asOf))
      );
    });
  const mappingsComplete = hasCompleteMappings(now);
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
            required
            value={fromDate}
            disabled={busy}
            onChange={(e) => {
              setFromDate(e.target.value);
              resetPreview();
            }}
          />
        </label>
        <label className="min-w-0 space-y-2 text-sm font-bold">
          Nghỉ đến ngày
          <Input
            className="h-12"
            type="date"
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
          {read.isPending ? 'Đang kiểm tra…' : 'Kiểm tra lịch dạy'}
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
                  description="Mỗi buổi nghỉ có lịch bù riêng. Chọn ngày và giờ phù hợp cho từng buổi."
                />
              </div>
              <fieldset disabled={busy} className="space-y-4">
                <legend className="sr-only">Lịch dạy bù cho từng buổi nghỉ</legend>
                {preview.affectedSessions.map((source, index) => (
                  <SessionMakeupSlot
                    key={source.sessionId}
                    source={source}
                    index={index + 1}
                    minDate={minMakeupDate(source.startsAt, now)}
                    timeZone={preview.timeZone}
                    selection={sessions[source.sessionId]}
                    otherMappings={Object.values(sessions).filter(
                      (mapping) => mapping.sourceSessionId !== source.sessionId,
                    )}
                    onSelect={(mapping) =>
                      setSessions((current) => {
                        if (
                          mapping &&
                          Object.values(current).some(
                            (other) =>
                              other.sourceSessionId !== source.sessionId &&
                              makeupSlotsOverlap(mapping, other),
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
                  if (
                    !input.success ||
                    !hasCompleteMappings(Date.now()) ||
                    !preview.noticeEligible
                  ) {
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
