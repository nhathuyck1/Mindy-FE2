'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CodeThemeId } from './code-theme';

/**
 * Shared chrome of every code screen (student workspace, mentor studio, review): full-height
 * page, 56px header with three zones, action group and status chips.
 */
export function IdePage(props: {
  theme: CodeThemeId;
  children: React.ReactNode;
  onKeyDownCapture?: (event: React.KeyboardEvent) => void;
}) {
  return (
    <div
      data-code-theme={props.theme}
      onKeyDownCapture={props.onKeyDownCapture}
      className="code-ide flex min-h-dvh flex-col bg-soft/70 text-black lg:h-dvh lg:min-h-0"
    >
      {props.children}
    </div>
  );
}

export function IdeHeader(props: {
  start: React.ReactNode;
  center?: React.ReactNode;
  end?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-2.5 py-2 lg:grid lg:h-14 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:py-0">
      <div className="flex min-w-0 flex-1 items-center gap-2">{props.start}</div>
      <div className="order-last flex w-full flex-wrap items-center justify-between gap-2 lg:order-none lg:w-auto lg:justify-center">
        {props.center}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 lg:flex-nowrap lg:justify-end">
        {props.end}
      </div>
    </header>
  );
}

/** Main area under the header; panes go inside. */
export function IdeBody(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 lg:px-2.5 lg:pb-2.5">
      {props.children}
    </div>
  );
}

export function BackLink(props: { href: string; label: string }) {
  return (
    <>
      <Link
        href={props.href}
        aria-label={props.label}
        title={props.label}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-black transition-colors hover:bg-canvas hover:text-mint"
      >
        <ArrowLeft aria-hidden="true" className="size-4.5" />
      </Link>
      <span aria-hidden="true" className="h-5 w-px shrink-0 bg-line" />
    </>
  );
}

export function IdeTitle(props: { children: React.ReactNode }) {
  return (
    <h1 className="min-w-0 truncate text-[15px] font-extrabold text-black">{props.children}</h1>
  );
}

/** White pill holding the main actions (Run / Submit, Generate / Validate…). */
export function ActionGroup(props: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-canvas p-1 shadow-[0_1px_2px] shadow-forest/10 ring-1 ring-line">
      {props.children}
    </div>
  );
}

export function ActionButton(props: {
  icon: LucideIcon;
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  busy?: boolean;
  disabled?: boolean;
  title?: string;
  iconClassName?: string;
}) {
  const Icon = props.busy ? Loader2 : props.icon;
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold whitespace-nowrap transition-[background-color,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-mint active:scale-[0.97]',
        props.primary
          ? 'bg-forest px-3.5 text-canvas hover:bg-mint focus-visible:ring-offset-1 disabled:bg-forest/45'
          : 'text-black hover:bg-soft disabled:opacity-50',
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'size-3.5',
          props.busy && 'animate-spin',
          !props.primary && (props.iconClassName ?? 'text-mint'),
        )}
      />
      {props.children}
    </button>
  );
}

export function MetaChip(props: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: 'warn' | 'bad' | 'good' | null;
}) {
  return (
    <div
      title={props.label}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] ring-1 transition-colors',
        props.tone === 'bad'
          ? 'bg-peach text-headsup ring-headsup/25'
          : props.tone === 'warn'
            ? 'bg-peach text-black ring-coral/30'
            : props.tone === 'good'
              ? 'bg-canvas text-mint ring-mint/30'
              : 'bg-canvas text-black ring-line',
      )}
    >
      <dt className="sr-only">{props.label}</dt>
      <props.icon
        aria-hidden="true"
        className={cn('size-3.5', props.tone ? 'text-current' : 'text-muted/60')}
      />
      <dd className="font-bold whitespace-nowrap tabular-nums">{props.value}</dd>
    </div>
  );
}

/** Compact step switcher with a sliding highlight (mentor authoring studio). */
export function Stepper<T extends string>(props: {
  steps: { id: T; label: string; done: boolean }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  const index = Math.max(
    0,
    props.steps.findIndex((s) => s.id === props.value),
  );
  return (
    <nav aria-label={props.label}>
      <ol
        className="relative grid rounded-xl bg-canvas p-1 shadow-[0_1px_2px] shadow-forest/10 ring-1 ring-line"
        style={{ gridTemplateColumns: `repeat(${props.steps.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 rounded-lg bg-forest transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: `calc((100% - 8px) / ${props.steps.length})`,
            transform: `translateX(${index * 100}%)`,
          }}
        />
        {props.steps.map((s, i) => {
          const active = s.id === props.value;
          return (
            <li key={s.id} className="relative z-10">
              <button
                type="button"
                aria-current={active ? 'step' : undefined}
                title={s.label}
                aria-label={s.done ? `${s.label} (đã xong)` : s.label}
                onClick={() => props.onChange(s.id)}
                className={cn(
                  'flex h-8 w-full items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-bold whitespace-nowrap transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-mint',
                  active ? 'text-canvas' : 'text-muted/80 hover:text-black',
                )}
              >
                <span
                  className={cn(
                    'grid size-4.5 shrink-0 place-items-center rounded-full text-[10.5px] font-extrabold transition-colors duration-300',
                    s.done
                      ? active
                        ? 'bg-canvas text-forest'
                        : 'bg-mint text-canvas'
                      : active
                        ? 'bg-canvas/20 text-canvas'
                        : 'bg-soft text-muted ring-1 ring-line',
                  )}
                >
                  {s.done ? (
                    <Check aria-hidden="true" className="size-3" strokeWidth={3.5} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="lg:max-xl:hidden">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Small round pill for statuses in headers (Bản nháp, Đã giao, Chưa lưu…). */
export function StatusPill(props: {
  children: React.ReactNode;
  tone?: 'mint' | 'coral' | 'muted' | 'headsup';
  pulse?: boolean;
}) {
  const tone = props.tone ?? 'muted';
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-extrabold',
        tone === 'mint' && 'bg-mint/10 text-mint',
        tone === 'coral' && 'bg-coral/12 text-black',
        tone === 'headsup' && 'bg-headsup/10 text-headsup',
        tone === 'muted' && 'bg-canvas text-muted ring-1 ring-line',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 rounded-full',
          tone === 'mint' && 'bg-mint',
          tone === 'coral' && 'bg-coral',
          tone === 'headsup' && 'bg-headsup',
          tone === 'muted' && 'bg-muted/50',
          props.pulse && 'animate-pulse',
        )}
      />
      {props.children}
    </span>
  );
}

/** Empty / placeholder state inside a panel. */
export function PanelEmpty(props: { icon: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <props.icon aria-hidden="true" className="size-7 text-line" />
      <p className="font-bold">{props.title}</p>
      {props.children && <div className="max-w-72 text-sm text-muted/75">{props.children}</div>}
    </div>
  );
}
