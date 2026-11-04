'use client';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScheduleDatePicker } from '@/components/ui/schedule-date-picker';
import { shiftDate, weekStart, vietnamDate } from '@/lib/weekly-timetable';
export function ScheduleWeekControls(props: {
  monday: string;
  onSelect: (monday: string) => void;
}) {
  return (
    <section
      aria-label="Chọn tuần xem lịch"
      className="mb-4 rounded-xl border border-line bg-canvas px-4 py-3 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <ScheduleDatePicker key={props.monday} monday={props.monday} onSelect={props.onSelect} />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-lg px-3 text-[13px] border-0 shadow-sm"
            onClick={() => props.onSelect(shiftDate(props.monday, -7))}
          >
            <ChevronLeft className="size-4" />
            Tuần trước
          </Button>
          <Button
            className="h-9 rounded-lg px-3 text-[13px] shadow-sm"
            onClick={() => props.onSelect(weekStart(vietnamDate()))}
          >
            <CalendarCheck className="size-4" />
            Tuần hiện tại
          </Button>
          <Button
            variant="outline"
            className="h-9 rounded-lg px-3 text-[13px] border-0 shadow-sm"
            onClick={() => props.onSelect(shiftDate(props.monday, 7))}
          >
            Tuần sau
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
