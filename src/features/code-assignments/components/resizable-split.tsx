'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/** A split ratio remembered per browser, for parents that control `ResizableSplit`. */
export function useStoredRatio(key: string, fallback: number) {
  const [ratio, setRatio] = useState(() =>
    typeof window === 'undefined' ? fallback : readRatio(key, fallback),
  );
  function change(next: number) {
    setRatio(next);
    try {
      window.localStorage.setItem(key, next.toFixed(4));
    } catch {
      // Storage can be unavailable (private mode); the split still works for this visit.
    }
  }
  return [ratio, change] as const;
}

function readRatio(key: string, fallback: number) {
  try {
    const stored = Number(window.localStorage.getItem(key));
    return stored > 0 && stored < 1 ? stored : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Two panes with a draggable divider (pointer + arrow keys, double-click resets). The ratio is
 * remembered per browser. Below `lg` the panes simply stack and the divider is hidden.
 */
export function ResizableSplit(props: {
  direction: 'horizontal' | 'vertical';
  storageKey: string;
  defaultRatio: number;
  minFirst: number;
  minSecond: number;
  /** Collapse a pane: `first` hides it entirely, `second` shrinks it to `collapsedSize` px. */
  collapse?: 'first' | 'second' | null;
  collapsedSize?: number;
  label: string;
  first: React.ReactNode;
  second: React.ReactNode;
  className?: string;
  /** Controlled ratio (0–1). The parent keeps and stores it; changes animate without remounting. */
  ratio?: number;
  onRatioChange?: (ratio: number) => void;
  firstClassName?: string;
  secondClassName?: string;
}) {
  const horizontal = props.direction === 'horizontal';
  const box = useRef<HTMLDivElement>(null);
  const [ownRatio, setOwnRatio] = useState(() =>
    typeof window === 'undefined'
      ? props.defaultRatio
      : readRatio(props.storageKey, props.defaultRatio),
  );
  const [dragging, setDragging] = useState(false);
  const controlled = props.ratio !== undefined;
  const ratio = props.ratio ?? ownRatio;
  function setRatio(next: number) {
    if (controlled) props.onRatioChange?.(next);
    else setOwnRatio(next);
  }

  function clamp(next: number) {
    const size = horizontal ? box.current?.clientWidth : box.current?.clientHeight;
    if (!size) return next;
    const min = props.minFirst / size;
    const max = 1 - props.minSecond / size;
    return Math.min(Math.max(next, min), Math.max(min, max));
  }
  function commit(next: number) {
    const value = clamp(next);
    setRatio(value);
    if (controlled) return;
    try {
      window.localStorage.setItem(props.storageKey, value.toFixed(4));
    } catch {
      // Storage can be unavailable (private mode); the split still works for this visit.
    }
  }
  function fromPointer(event: React.PointerEvent) {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return ratio;
    return horizontal
      ? (event.clientX - rect.left) / rect.width
      : (event.clientY - rect.top) / rect.height;
  }

  const collapsedSize = props.collapsedSize ?? 0;
  const basis =
    props.collapse === 'first'
      ? '0%'
      : props.collapse === 'second'
        ? `calc(100% - ${collapsedSize + 8}px)`
        : `calc(${(ratio * 100).toFixed(3)}% - 4px)`;

  return (
    <div
      ref={box}
      data-dragging={dragging}
      className={cn(
        'flex min-h-0 min-w-0 flex-col gap-2 lg:gap-0',
        horizontal ? 'lg:flex-row' : 'lg:flex-col',
        props.className,
      )}
      style={{ '--split': basis } as React.CSSProperties}
    >
      <div
        className={cn(
          'min-h-0 min-w-0 lg:shrink-0 lg:grow-0 lg:basis-(--split) lg:transition-[flex-basis] lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)]',
          dragging && 'lg:transition-none',
          props.collapse === 'first' && 'lg:invisible lg:overflow-hidden',
          props.firstClassName,
        )}
        inert={props.collapse === 'first' ? true : undefined}
      >
        {props.first}
      </div>
      <div
        role="separator"
        tabIndex={props.collapse ? -1 : 0}
        aria-label={props.label}
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        hidden={props.collapse === 'first'}
        onPointerDown={(event) => {
          if (props.collapse) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (dragging) setRatio(clamp(fromPointer(event)));
        }}
        onPointerUp={(event) => {
          if (!dragging) return;
          setDragging(false);
          commit(fromPointer(event));
        }}
        onDoubleClick={() => commit(props.defaultRatio)}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.02;
          const keys: Record<string, number> = horizontal
            ? { ArrowLeft: -step, ArrowRight: step }
            : { ArrowUp: -step, ArrowDown: step };
          if (event.key in keys) {
            event.preventDefault();
            commit(ratio + keys[event.key]);
          } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            commit(event.key === 'Home' ? 0 : 1);
          }
        }}
        className={cn(
          'group relative hidden shrink-0 touch-none items-center justify-center outline-none lg:flex',
          horizontal ? 'w-2 cursor-col-resize' : 'h-2 cursor-row-resize',
          props.collapse && 'pointer-events-none',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'rounded-full bg-transparent transition-all duration-200 group-hover:bg-mint/60 group-focus-visible:bg-mint',
            horizontal ? 'h-10 w-0.5 group-hover:h-16' : 'h-0.5 w-10 group-hover:w-16',
            dragging && (horizontal ? 'h-full bg-mint' : 'w-full bg-mint'),
          )}
        />
      </div>
      <div className={cn('min-h-0 min-w-0 lg:flex-1', props.secondClassName)}>{props.second}</div>
    </div>
  );
}
