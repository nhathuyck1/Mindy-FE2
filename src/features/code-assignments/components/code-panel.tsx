'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PanelTab<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
  /** Tailwind text colour for the icon, e.g. `text-mint`. */
  tone?: string;
  badge?: React.ReactNode;
};

/** Light card used for the problem and test panels of the code workspace. */
export function Panel(props: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <section
      aria-label={props.label}
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-canvas shadow-[0_1px_2px] shadow-forest/5',
        props.className,
      )}
    >
      {props.children}
    </section>
  );
}

/**
 * Tab strip with a sliding highlight. New tabs (e.g. a shared whiteboard) are added by passing
 * another entry in `tabs`; the panel content is chosen by the caller from `value`.
 */
export function PanelTabs<T extends string>(props: {
  tabs: PanelTab<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  idPrefix: string;
  actions?: React.ReactNode;
  tone?: 'light' | 'dark';
}) {
  const list = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const dark = props.tone === 'dark';

  useLayoutEffect(() => {
    const measure = () => {
      const active = list.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (active) setPill({ left: active.offsetLeft, width: active.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (list.current) observer.observe(list.current);
    return () => observer.disconnect();
  }, [props.value, props.tabs.length]);

  function onKeyDown(event: React.KeyboardEvent) {
    const index = props.tabs.findIndex((t) => t.id === props.value);
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = props.tabs[(index + delta + props.tabs.length) % props.tabs.length];
    props.onChange(next.id);
    list.current?.querySelector<HTMLElement>(`#${props.idPrefix}-tab-${next.id}`)?.focus();
  }

  return (
    <div
      className={cn(
        'flex h-10 shrink-0 items-center justify-between gap-2 border-b px-1.5',
        dark ? 'border-ide-line bg-ide-deep' : 'border-line bg-soft/60',
      )}
    >
      <div
        ref={list}
        role="tablist"
        aria-label={props.label}
        onKeyDown={onKeyDown}
        className="relative flex min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]"
      >
        {pill && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-1/2 h-7 -translate-y-1/2 rounded-md transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              dark
                ? 'bg-ide-raised'
                : 'bg-canvas shadow-[0_1px_2px] shadow-forest/10 ring-1 ring-line',
            )}
            style={{ left: pill.left, width: pill.width }}
          />
        )}
        {props.tabs.map((tab) => {
          const selected = tab.id === props.value;
          return (
            <button
              key={tab.id}
              id={`${props.idPrefix}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${props.idPrefix}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => props.onChange(tab.id)}
              className={cn(
                'relative z-10 inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-bold whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-mint',
                dark
                  ? selected
                    ? 'text-ide-text'
                    : 'text-ide-muted hover:text-ide-text'
                  : selected
                    ? 'text-black'
                    : 'text-muted/70 hover:text-black',
              )}
            >
              <tab.icon
                aria-hidden="true"
                className={cn(
                  'size-3.5 transition-colors',
                  selected ? (tab.tone ?? 'text-mint') : 'opacity-70',
                )}
              />
              {tab.label}
              {tab.badge}
            </button>
          );
        })}
      </div>
      {props.actions && <div className="flex shrink-0 items-center gap-0.5">{props.actions}</div>}
    </div>
  );
}

/** Small round count bubble for tab labels. */
export function TabCount(props: { value: number }) {
  if (!props.value) return null;
  return (
    <span className="min-w-4.5 rounded-full bg-soft px-1.5 text-center text-[11px] leading-4.5 font-extrabold text-forest tabular-nums">
      {props.value}
    </span>
  );
}

export function Kbd(props: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-4.5 min-w-4.5 items-center justify-center rounded border border-current/20 px-1 font-sans text-[10.5px] leading-none font-bold opacity-80',
        props.className,
      )}
    >
      {props.children}
    </kbd>
  );
}

/** Icon-only toolbar button with a native tooltip. */
export function ToolButton(props: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  dark?: boolean;
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      aria-pressed={props.pressed}
      disabled={props.disabled}
      onClick={props.onClick}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded-md transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-40 [&_svg]:size-3.75',
        props.dark
          ? 'text-ide-muted hover:bg-ide-raised hover:text-ide-text'
          : 'text-muted/70 hover:bg-soft hover:text-black',
      )}
    >
      {props.children}
    </button>
  );
}
