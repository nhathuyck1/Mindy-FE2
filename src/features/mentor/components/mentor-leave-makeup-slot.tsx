'use client';
import { useState } from 'react';
import { Clock3, Search, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useMentorCommand, mentorError } from '../api/mentor-queries';
import {
  leaveSlotsSchema,
  type LeavePreview,
  type LeaveSessionMapping,
} from '../schemas/leave-contracts';
import { leavePeriods } from '../lib/leave-display';
import { mentorDate } from './mentor-shared';
import {
  localClock,
  outsideLeave,
  overlaps,
  withinTeachingShift,
  type LeaveWindow,
} from '../lib/leave-makeup';
import { localDate } from '../lib/leave-display';
import { sessionTime } from '../lib/weekly-timetable';
export function SessionMakeupSlot(props: {
  source: LeavePreview['affectedSessions'][number];
  leave: LeaveWindow;
  mappings: Record<string, LeaveSessionMapping>;
  onSelect: (mapping: LeaveSessionMapping | null) => void;
  onDateChange: (date: string) => void;
}) {
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState<LeaveSessionMapping['targetPeriod']>('FULL_DAY');
  const selected = props.mappings[props.source.sessionId]?.startsAt ?? '';
  const slots = useMentorCommand(leaveSlotsSchema);
  const available = (slots.data?.slots ?? []).filter(
    (slot) =>
      withinTeachingShift(slot, props.leave.timeZone) &&
      outsideLeave(slot, props.leave) &&
      !Object.values(props.mappings).some(
        (mapping) => mapping.sourceSessionId !== props.source.sessionId && overlaps(slot, mapping),
      ),
  );
  const originalClock = localClock(props.source.startsAt, props.leave.timeZone);
  const ordered = [...available].sort(
    (a, b) =>
      Number(localClock(b.startsAt, props.leave.timeZone) === originalClock) -
        Number(localClock(a.startsAt, props.leave.timeZone) === originalClock) ||
      Date.parse(a.startsAt) - Date.parse(b.startsAt),
  );
  const blockedDate =
    props.leave.period === 'FULL_DAY' && date >= props.leave.fromDate && date <= props.leave.toDate;
  return (
    <div className="space-y-4 rounded-xl border border-line bg-canvas p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold">{props.source.title}</h3>
        {selected && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-mint">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            Đã chọn lịch bù
          </span>
        )}
      </div>
      <p className="text-sm text-muted">
        Lịch gốc: {mentorDate(props.source.startsAt)} – {sessionTime(props.source.endsAt)} ·{' '}
        {Math.round((Date.parse(props.source.endsAt) - Date.parse(props.source.startsAt)) / 60000)}{' '}
        phút
      </p>
      <form
        className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        onSubmit={async (event) => {
          event.preventDefault();
          props.onSelect(null);
          try {
            const result = await slots.mutateAsync({
              path: 'mentor/leave-requests/makeup-slots',
              body: {
                sourceSessionId: props.source.sessionId,
                targetDate: date,
                targetPeriod: period,
              },
            });
            const original = result.slots.find(
              (slot) =>
                localClock(slot.startsAt, props.leave.timeZone) === originalClock &&
                withinTeachingShift(slot, props.leave.timeZone) &&
                outsideLeave(slot, props.leave) &&
                !Object.values(props.mappings).some(
                  (mapping) =>
                    mapping.sourceSessionId !== props.source.sessionId && overlaps(slot, mapping),
                ),
            );
            if (original && result.sessionVersion === props.source.version) {
              props.onSelect({
                sourceSessionId: props.source.sessionId,
                targetDate: date,
                targetPeriod: period,
                ...original,
              });
            }
          } catch {
            /* shown below */
          }
        }}
      >
        <label className="min-w-0 space-y-2 text-sm font-bold">
          Ngày dạy bù
          <Input
            className="h-12"
            type="date"
            min={localDate(new Date().toISOString(), props.leave.timeZone)}
            required
            value={date}
            disabled={slots.isPending}
            onChange={(e) => {
              setDate(e.target.value);
              if (e.target.value) props.onDateChange(e.target.value);
              slots.reset();
              props.onSelect(null);
            }}
          />
        </label>
        <label className="min-w-0 space-y-2 text-sm font-bold">
          Tìm giờ trong
          <NativeSelect
            wrapperClassName="w-full"
            className="h-12"
            value={period}
            disabled={slots.isPending}
            onChange={(e) => {
              const value = e.target.value;
              if (
                value === 'MORNING' ||
                value === 'AFTERNOON' ||
                value === 'EVENING' ||
                value === 'FULL_DAY'
              )
                setPeriod(value);
              slots.reset();
              props.onSelect(null);
            }}
          >
            {Object.entries(leavePeriods).map(([key, title]) => (
              <NativeSelectOption key={key} value={key}>
                {title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <Button type="submit" variant="outline" disabled={slots.isPending || !date || blockedDate}>
          <Search aria-hidden="true" className="size-4" />
          {slots.isPending ? 'Đang tìm…' : 'Tìm giờ phù hợp'}
        </Button>
      </form>
      {blockedDate && (
        <p role="alert" className="text-status-red">
          Bạn nghỉ cả ngày này. Hãy chọn ngày bù ngoài khoảng ngày nghỉ.
        </p>
      )}
      {slots.error && (
        <p role="alert" className="text-status-red">
          {mentorError(slots.error)}
        </p>
      )}
      {slots.data && slots.data.sessionVersion !== props.source.version ? (
        <p role="alert">Buổi gốc đã thay đổi. Hãy tải lại xem trước đơn.</p>
      ) : (
        slots.data && (
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-bold">Chọn khung giờ theo ca học</legend>
            <p className="text-sm text-muted sm:col-span-2">
              Giữ thời lượng buổi gốc; khung giờ phải nằm trọn trong một ca học.
            </p>
            {ordered.length > 0 &&
              !ordered.some(
                (slot) => localClock(slot.startsAt, props.leave.timeZone) === originalClock,
              ) && (
                <p className="text-sm text-muted sm:col-span-2">
                  Giờ cũ không có trong các khung giờ phù hợp. Bạn có thể chọn giờ khác bên dưới
                  hoặc đổi ngày.
                </p>
              )}
            {ordered.length === 0 && (
              <p>Không có giờ phù hợp. Hãy chọn buổi khác hoặc ngày ở tuần tiếp theo.</p>
            )}
            {ordered.map((slot) => (
              <label
                key={slot.startsAt}
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${selected === slot.startsAt ? 'border-mint bg-mint/5 text-forest' : 'border-line hover:border-mint/40'}`}
              >
                <input
                  className="size-4 shrink-0 accent-mint"
                  type="radio"
                  name={`makeup-${props.source.sessionId}`}
                  value={slot.startsAt}
                  checked={selected === slot.startsAt}
                  onChange={() => {
                    props.onSelect({
                      sourceSessionId: props.source.sessionId,
                      targetDate: date,
                      targetPeriod: period,
                      ...slot,
                    });
                  }}
                />
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Clock3 aria-hidden="true" className="size-4 shrink-0" />
                  {sessionTime(slot.startsAt)} – {sessionTime(slot.endsAt)}
                  {localClock(slot.startsAt, props.leave.timeZone) === originalClock && (
                    <span className="text-xs text-muted">Giờ cũ</span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
        )
      )}
      {selected && props.mappings[props.source.sessionId] && (
        <p className="rounded-xl bg-mint/5 p-3 text-sm font-bold text-forest">
          Lịch bù: {mentorDate(selected)} –{' '}
          {sessionTime(props.mappings[props.source.sessionId].endsAt)}
        </p>
      )}
    </div>
  );
}
