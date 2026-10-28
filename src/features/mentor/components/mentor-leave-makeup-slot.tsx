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
export function SessionMakeupSlot(props: {
  source: LeavePreview['affectedSessions'][number];
  onSelect: (mapping: LeaveSessionMapping | null) => void;
}) {
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState('MORNING');
  const [selected, setSelected] = useState('');
  const slots = useMentorCommand(leaveSlotsSchema);
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
        Buổi gốc: {mentorDate(props.source.startsAt)} – {mentorDate(props.source.endsAt)}
      </p>
      <form
        className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        onSubmit={async (event) => {
          event.preventDefault();
          setSelected('');
          props.onSelect(null);
          try {
            await slots.mutateAsync({
              path: 'mentor/leave-requests/makeup-slots',
              body: {
                sourceSessionId: props.source.sessionId,
                targetDate: date,
                targetPeriod: period,
              },
            });
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
            required
            value={date}
            disabled={slots.isPending}
            onChange={(e) => {
              setDate(e.target.value);
              slots.reset();
              setSelected('');
              props.onSelect(null);
            }}
          />
        </label>
        <label className="min-w-0 space-y-2 text-sm font-bold">
          Buổi dạy bù
          <NativeSelect
            wrapperClassName="w-full"
            className="h-12"
            value={period}
            disabled={slots.isPending}
            onChange={(e) => {
              setPeriod(e.target.value);
              slots.reset();
              setSelected('');
              props.onSelect(null);
            }}
          >
            {Object.entries(leavePeriods)
              .filter(([key]) => key !== 'FULL_DAY')
              .map(([key, title]) => (
                <NativeSelectOption key={key} value={key}>
                  {title}
                </NativeSelectOption>
              ))}
          </NativeSelect>
        </label>
        <Button type="submit" variant="outline" disabled={slots.isPending || !date}>
          <Search aria-hidden="true" className="size-4" />
          {slots.isPending ? 'Đang tìm…' : 'Tìm giờ phù hợp'}
        </Button>
      </form>
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
            <legend className="mb-2 text-sm font-bold">Chọn khung giờ</legend>
            {slots.data.slots.length === 0 && (
              <p>Không có giờ phù hợp. Hãy chọn ngày hoặc buổi khác.</p>
            )}
            {slots.data.slots.map((slot) => (
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
                    setSelected(slot.startsAt);
                    props.onSelect({
                      sourceSessionId: props.source.sessionId,
                      targetDate: date,
                      targetPeriod:
                        period === 'AFTERNOON'
                          ? 'AFTERNOON'
                          : period === 'EVENING'
                            ? 'EVENING'
                            : 'MORNING',
                      ...slot,
                    });
                  }}
                />
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Clock3 aria-hidden="true" className="size-4 shrink-0" />
                  {mentorDate(slot.startsAt)} –{' '}
                  {new Intl.DateTimeFormat('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(slot.endsAt))}
                </span>
              </label>
            ))}
          </fieldset>
        )
      )}
    </div>
  );
}
