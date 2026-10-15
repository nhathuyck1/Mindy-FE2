import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Decorative spinner; LoadingOverlay announces the loading text.
export function Spinner(props: { className?: string }) {
  return (
    <LoaderCircle
      aria-hidden="true"
      data-slot="spinner"
      className={cn(
        'size-4 shrink-0 animate-spin motion-reduce:animate-[spin_1.6s_linear_infinite]',
        props.className,
      )}
    />
  );
}

// Page and modal loading: dims and blurs what is behind, then shows a centered spinner.
// Tables keep their own skeleton instead.
export function LoadingOverlay(props: { label: string; scope: 'page' | 'modal' }) {
  const overlay = (
    <div
      role="status"
      aria-label={props.label}
      aria-live="polite"
      aria-busy="true"
      data-slot="loading-overlay"
      className={cn(
        'grid place-items-center bg-canvas/60 backdrop-blur-sm',
        props.scope === 'page' ? 'fixed inset-0 z-40' : 'absolute inset-0 z-10 rounded-[inherit]',
      )}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-canvas px-6 py-5 shadow-lg shadow-forest/10">
        <Spinner className="size-8 text-mint" />
        <p className="text-sm font-bold text-muted">{props.label}</p>
      </div>
    </div>
  );
  return props.scope === 'page' ? overlay : <div className="relative min-h-48">{overlay}</div>;
}
