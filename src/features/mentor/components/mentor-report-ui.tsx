import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MentorProgressBar(props: {
  label: string;
  value: number | null;
  valueText: string;
  caption?: string;
  attention?: boolean;
}) {
  const known = props.value !== null && Number.isFinite(props.value);
  return (
    <div className="min-w-0 space-y-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
        <span className="font-medium text-muted">{props.label}</span>
        <span
          className={`font-extrabold tabular-nums ${props.attention ? 'text-headsup' : known ? 'text-forest' : 'text-muted'}`}
        >
          {props.valueText}
        </span>
      </div>
      <div
        role={known ? 'progressbar' : undefined}
        aria-label={known ? props.label : undefined}
        aria-valuemin={known ? 0 : undefined}
        aria-valuemax={known ? 100 : undefined}
        aria-valuenow={known ? (props.value ?? undefined) : undefined}
        aria-valuetext={known ? props.valueText : undefined}
        className={`h-2.5 overflow-hidden rounded-full ${known ? 'bg-mint/10' : 'border border-dashed border-line bg-soft/50'}`}
      >
        {known && (
          <div
            className={`h-full rounded-full ${props.attention ? 'bg-coral' : 'bg-mint'}`}
            style={{ width: `${Math.min(100, Math.max(0, props.value ?? 0))}%` }}
          />
        )}
      </div>
      {props.caption && <p className="text-xs leading-5 text-muted">{props.caption}</p>}
    </div>
  );
}

export function MentorStudentIdentity(props: { name: string; caption?: string }) {
  const initials = props.name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('');
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-mint/10 text-sm font-extrabold text-forest uppercase"
      >
        {initials || 'HV'}
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-extrabold break-words">{props.name}</h2>
        {props.caption && <p className="mt-1 text-xs leading-5 text-muted">{props.caption}</p>}
      </div>
    </div>
  );
}

export function MentorReportHeading(props: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold">{props.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{props.description}</p>
      </div>
      {props.children}
    </div>
  );
}

export function MentorReportAction(props: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      aria-label={props.label}
      onClick={props.onClick}
      className="shrink-0 text-mint"
    >
      Xem chi tiết
      <ArrowUpRight aria-hidden="true" className="size-4" />
    </Button>
  );
}
