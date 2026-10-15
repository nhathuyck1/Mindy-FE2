import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

export function TableSkeleton(props: {
  rows?: number;
  columns?: number;
  label?: string;
  className?: string;
}) {
  const columns = Array.from({ length: props.columns ?? 7 }, (_, index) => index);
  const label = props.label ?? 'Đang tải dữ liệu…';
  const gridStyle = {
    gridTemplateColumns: `minmax(180px, 2fr) repeat(${columns.length - 1}, minmax(80px, 1fr))`,
  };
  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      aria-busy="true"
      className={cn('max-w-full overflow-hidden', props.className)}
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="min-w-160">
        <div
          className="grid h-12 items-center gap-6 border-y border-line bg-soft/45 px-6"
          style={gridStyle}
        >
          {columns.map((column) => (
            <Skeleton key={column} className="h-4 w-3/4" />
          ))}
        </div>
        {Array.from({ length: props.rows ?? 5 }, (_, row) => (
          <div
            key={row}
            className="grid h-19 items-center gap-6 border-b border-line/65 px-6 last:border-b-0"
            style={gridStyle}
          >
            {columns.map((column) =>
              column === 0 ? (
                <div key={column} className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ) : (
                <Skeleton key={column} className={cn('h-4', column % 2 ? 'w-3/4' : 'w-1/2')} />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton(props: { label?: string; className?: string }) {
  const label = props.label ?? 'Đang tải số liệu…';
  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      aria-busy="true"
      className={cn('rounded-2xl border border-line bg-canvas p-5 sm:p-6', props.className)}
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="size-9 rounded-xl" />
        </div>
        <Skeleton className="mt-3 h-10 w-20" />
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="size-4" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton(props: { label?: string; className?: string }) {
  const label = props.label ?? 'Đang tải biểu đồ…';
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={cn('flex h-64 items-end gap-4 p-6', props.className)}
    >
      <span className="sr-only">{label}</span>
      {[40, 65, 50, 85, 70, 95].map((height, index) => (
        <Skeleton
          key={index}
          aria-hidden="true"
          className="flex-1"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}
