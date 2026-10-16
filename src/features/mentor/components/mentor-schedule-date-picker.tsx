'use client';

import { useId, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { calendarDate, parseCalendarDate, weekStart } from '../lib/weekly-timetable';

export function MentorScheduleDatePicker(props: {
  monday: string;
  onSelect: (monday: string) => void;
}) {
  const [draft, setDraft] = useState(() => calendarDate(props.monday));
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const id = useId();
  function commit() {
    const date = parseCalendarDate(draft);
    setError(!date);
    if (date) props.onSelect(weekStart(date));
  }
  return (
    <div className="w-full min-w-0 sm:w-48">
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-muted">
        Chọn ngày
      </label>
      <div className="relative">
        <Input
          id={id}
          aria-label="Chọn ngày (dd/mm/yyyy)"
          placeholder="dd/mm/yyyy"
          inputMode="numeric"
          maxLength={10}
          value={draft}
          aria-invalid={error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-9 rounded-lg pr-11 text-[13px]"
          onChange={(event) => {
            setDraft(event.target.value);
            setError(false);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 size-9"
              aria-label="Mở lịch chọn ngày"
            >
              <CalendarDays className="size-4 text-mint" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-64 max-w-[calc(100vw-2rem)] border-line bg-canvas p-4"
          >
            <label className="block text-sm font-bold">
              Ngày trong tuần
              <Input
                aria-label="Ngày trong lịch"
                type="date"
                min="0002-01-01"
                max="9998-12-31"
                defaultValue={props.monday}
                className="mt-2 min-w-0"
                onChange={(event) => {
                  const date = event.target.value;
                  if (parseCalendarDate(calendarDate(date))) {
                    setDraft(calendarDate(date));
                    setError(false);
                    setOpen(false);
                    props.onSelect(weekStart(date));
                  }
                }}
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-muted">Chọn ngày để xem tuần chứa ngày đó.</p>
          </PopoverContent>
        </Popover>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-status-red">
          Nhập ngày hợp lệ theo dd/mm/yyyy.
        </p>
      )}
    </div>
  );
}
