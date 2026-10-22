import { CalendarDays, Check, Clock3, CircleCheck, CircleX, Undo2 } from 'lucide-react';
import { leaveStatuses } from '../lib/leave-display';

export function LeaveStatusBadge(props: { status: string }) {
  const Icon =
    props.status === 'APPROVED'
      ? CircleCheck
      : props.status === 'REJECTED'
        ? CircleX
        : props.status === 'WITHDRAWN'
          ? Undo2
          : Clock3;
  const tone =
    props.status === 'APPROVED'
      ? 'bg-mint/10 text-forest'
      : props.status === 'REJECTED'
        ? 'bg-coral/10 text-headsup'
        : props.status === 'PENDING'
          ? 'bg-coral/10 text-forest'
          : 'bg-soft text-muted';
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${tone}`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {leaveStatuses[props.status] ?? props.status}
    </span>
  );
}

export function LeaveSteps(props: { current: number }) {
  return (
    <ol
      aria-label="Các bước tạo đơn"
      className="grid grid-cols-3 gap-2 rounded-xl bg-soft/60 p-3 sm:p-4"
    >
      {['Khoảng nghỉ', 'Lịch dạy bù', 'Gửi đơn'].map((label, index) => {
        const step = index + 1;
        return (
          <li
            key={label}
            aria-current={props.current === step ? 'step' : undefined}
            className={`flex min-w-0 flex-col items-center gap-2 text-center text-xs font-bold sm:flex-row sm:text-sm ${props.current >= step ? 'text-forest' : 'text-muted'}`}
          >
            <span
              aria-hidden="true"
              className={`grid size-7 shrink-0 place-items-center rounded-full ${props.current >= step ? 'bg-mint text-white' : 'border border-line bg-canvas'}`}
            >
              {props.current > step ? <Check className="size-4" /> : step}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function LeaveStepHeading(props: { step: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-lg border border-mint/15 bg-mint/5 text-sm font-extrabold text-mint"
      >
        {props.step}
      </span>
      <div>
        <h3 className="text-base font-extrabold">{props.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{props.description}</p>
      </div>
    </div>
  );
}

export function LeaveDateIcon() {
  return (
    <span
      aria-hidden="true"
      className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint/8 text-mint"
    >
      <CalendarDays className="size-5" />
    </span>
  );
}
