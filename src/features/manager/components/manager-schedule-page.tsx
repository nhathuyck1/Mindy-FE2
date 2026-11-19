import { CalendarDays } from 'lucide-react';
import { ManagerWeeklySchedule } from '@/features/operations/components/weekly-schedule-panel';

export function ManagerSchedulePage(props: { initialClassId?: string }) {
  return (
    <div className="space-y-6">
      <header className="admin-page-heading">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight">
            <CalendarDays aria-hidden="true" className="size-7 shrink-0 text-mint" />
            Lịch và khai giảng
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Chọn lớp để phân công dạy thay hoặc thiết lập lịch học hằng tuần.
          </p>
        </div>
      </header>
      <ManagerWeeklySchedule initialClassId={props.initialClassId} />
    </div>
  );
}
