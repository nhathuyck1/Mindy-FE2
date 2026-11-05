'use client';
import { useState } from 'react';
import { CalendarDays, Clock3, Search, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useMentorCommand, mentorError } from '../api/mentor-queries';
import {
  leaveSlotsSchema,
  leaveSlotsInputSchema,
  type LeavePreview,
  type LeaveSessionMapping,
} from '../schemas/leave-contracts';
import { leaveClock, leavePeriods } from '../lib/leave-display';
import { makeupSlotsOverlap } from '../lib/leave-makeup';
export function SessionMakeupSlot(props: {
  source: LeavePreview['affectedSessions'][number];
  index: number;
  minDate: string;
  timeZone: string;
  selection?: LeaveSessionMapping;
  otherMappings: readonly LeaveSessionMapping[];
  onSelect: (mapping: LeaveSessionMapping | null) => void;
}) {
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState<LeaveSessionMapping['targetPeriod']>('FULL_DAY');
  const selected = props.selection?.startsAt ?? '';
  const slots = useMentorCommand(leaveSlotsSchema);
  const duration = Math.round(
    (Date.parse(props.source.endsAt) - Date.parse(props.source.startsAt)) / 60000,
  );
  const dateInvalid = Boolean(date && date < props.minDate);
  const selectedSlot = slots.data?.slots.find((slot) => slot.startsAt === selected);
  return (
    <section
      aria-label={`Lịch bù: ${props.source.title}`}
      className="min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <p className="flex items-center gap-2 text-xs font-bold text-muted">
          <span className="grid size-6 place-items-center rounded-md bg-mint/10 text-mint">
            {props.index}
          </span>
          Buổi nghỉ
        </p>
        {selected && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-mint">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            Đã chọn lịch bù
          </span>
        )}
      </header>
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="min-w-0 space-y-4 border-b border-line bg-soft/35 p-4 lg:border-r lg:border-b-0 sm:p-5">
          <h4 className="text-base leading-6 font-extrabold wrap-anywhere">{props.source.title}</h4>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-muted">
              <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-mint" />
              <time dateTime={props.source.startsAt}>
                {new Intl.DateTimeFormat('vi-VN', {
                  timeZone: props.timeZone,
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }).format(new Date(props.source.startsAt))}
              </time>
            </p>
            <p className="flex flex-wrap items-center gap-2 font-bold">
              <Clock3 aria-hidden="true" className="size-4 shrink-0 text-mint" />
              {leaveClock(props.source.startsAt, props.timeZone)} –{' '}
              {leaveClock(props.source.endsAt, props.timeZone)}
              <span className="font-normal text-muted">· {duration} phút</span>
            </p>
          </div>
          <p className="text-xs leading-5 text-muted">
            Chọn lịch bù riêng cho buổi này, giữ thời lượng {duration} phút.
          </p>
        </div>
        <div className="min-w-0 space-y-4 p-4 sm:p-5">
          <form
            className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const input = leaveSlotsInputSchema.safeParse({
                sourceSessionId: props.source.sessionId,
                targetDate: date,
                targetPeriod: period,
              });
              if (dateInvalid || !input.success) return;
              props.onSelect(null);
              try {
                await slots.mutateAsync({
                  path: 'mentor/leave-requests/makeup-slots',
                  body: input.data,
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
                min={props.minDate}
                aria-invalid={dateInvalid || undefined}
                required
                value={date}
                disabled={slots.isPending}
                onChange={(e) => {
                  setDate(e.target.value);
                  slots.reset();
                  props.onSelect(null);
                }}
              />
            </label>
            <label className="min-w-0 space-y-2 text-sm font-bold">
              Buổi dạy bù
              <NativeSelect
                aria-label="Buổi dạy bù"
                wrapperClassName="w-full"
                className="h-12"
                value={period}
                disabled={slots.isPending}
                onChange={(e) => {
                  const value = leaveSlotsInputSchema.shape.targetPeriod.safeParse(e.target.value);
                  if (!value.success) return;
                  setPeriod(value.data);
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
            <Button
              type="submit"
              variant="outline"
              className="h-11 sm:col-span-2 sm:justify-self-start"
              disabled={slots.isPending || !date || dateInvalid}
            >
              <Search aria-hidden="true" className="size-4" />
              {slots.isPending ? 'Đang tìm…' : 'Tìm giờ phù hợp'}
            </Button>
          </form>
          {dateInvalid && (
            <p role="alert" className="text-sm text-status-red">
              Ngày dạy bù phải từ {props.minDate.split('-').reverse().join('/')} trở đi.
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
              <fieldset className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto p-0.5 [scrollbar-width:none] sm:grid-cols-2 [&::-webkit-scrollbar]:hidden">
                <legend className="mb-2 text-sm font-bold">Chọn khung giờ</legend>
                {slots.data.slots.length === 0 && (
                  <p className="col-span-2 text-sm text-muted">
                    Không có giờ phù hợp. Hãy chọn ngày hoặc buổi khác.
                  </p>
                )}
                {slots.data.slots.map((slot) => {
                  const conflict = props.otherMappings.some((other) =>
                    makeupSlotsOverlap(slot, other),
                  );
                  return (
                    <label
                      key={slot.startsAt}
                      className={`flex min-h-12 items-center gap-2 rounded-lg border p-2.5 text-sm font-semibold transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-mint ${conflict ? 'cursor-not-allowed border-line bg-soft/50 text-muted' : selected === slot.startsAt ? 'cursor-pointer border-mint bg-mint/5 text-forest' : 'cursor-pointer border-line hover:border-mint/40'}`}
                    >
                      <input
                        className="size-4 shrink-0 accent-mint"
                        type="radio"
                        name={`makeup-${props.source.sessionId}`}
                        value={slot.startsAt}
                        checked={selected === slot.startsAt}
                        disabled={conflict}
                        onChange={() => {
                          if (conflict) return;
                          props.onSelect({
                            sourceSessionId: props.source.sessionId,
                            targetDate: date,
                            targetPeriod: period,
                            ...slot,
                          });
                        }}
                      />
                      <span className="min-w-0 tabular-nums">
                        {leaveClock(slot.startsAt, props.timeZone)} –{' '}
                        {leaveClock(slot.endsAt, props.timeZone)}
                        {conflict && (
                          <span className="mt-1 block text-xs font-normal">
                            Trùng lịch bù buổi khác
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            )
          )}
          {selectedSlot && (
            <p className="rounded-lg bg-mint/5 px-3 py-2 text-sm text-forest" role="status">
              Lịch bù:{' '}
              {new Intl.DateTimeFormat('vi-VN', {
                timeZone: props.timeZone,
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).format(new Date(selectedSlot.startsAt))}
              {' · '}
              {leaveClock(selectedSlot.startsAt, props.timeZone)} –{' '}
              {leaveClock(selectedSlot.endsAt, props.timeZone)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
