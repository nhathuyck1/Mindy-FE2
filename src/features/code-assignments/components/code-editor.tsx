'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

const PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };

/**
 * Dependency-free code editor (textarea + line numbers): Tab/Shift+Tab indent, auto-indent on Enter,
 * bracket/quote pairing. Kept behind this component so a richer editor can replace it later.
 */
export function CodeEditor(props: {
  value: string;
  onChange?: (value: string) => void;
  label: string;
  readOnly?: boolean;
  rows?: number;
  indent?: string;
  className?: string;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const indent = props.indent ?? '    ';
  const lines = Math.max(props.value.split('\n').length, props.rows ?? 16);

  function apply(next: string, start: number, end = start) {
    props.onChange?.(next);
    requestAnimationFrame(() => {
      area.current?.setSelectionRange(start, end);
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (props.readOnly) return;
    const el = event.currentTarget;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        const line = value.slice(lineStart);
        const remove = line.startsWith(indent)
          ? indent.length
          : (line.match(/^ {1,4}|^\t/)?.[0].length ?? 0);
        if (remove)
          apply(
            value.slice(0, lineStart) + value.slice(lineStart + remove),
            Math.max(lineStart, start - remove),
          );
        return;
      }
      apply(value.slice(0, start) + indent + value.slice(end), start + indent.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const current = value.slice(lineStart, start);
      const base = current.match(/^\s*/)?.[0] ?? '';
      const opens = /[{[(]\s*$/.test(current);
      const closes = /^\s*[}\])]/.test(value.slice(end));
      if (opens && closes) {
        const insert = `\n${base}${indent}\n${base}`;
        apply(
          value.slice(0, start) + insert + value.slice(end),
          start + base.length + indent.length + 1,
        );
        return;
      }
      const insert = `\n${base}${opens ? indent : ''}`;
      apply(value.slice(0, start) + insert + value.slice(end), start + insert.length);
      return;
    }
    const close = PAIRS[event.key];
    if (close && start === end) {
      if ((event.key === '"' || event.key === "'") && value[start] === event.key) {
        event.preventDefault();
        apply(value, start + 1);
        return;
      }
      event.preventDefault();
      apply(value.slice(0, start) + event.key + close + value.slice(end), start + 1);
      return;
    }
    if ([')', ']', '}'].includes(event.key) && value[start] === event.key && start === end) {
      event.preventDefault();
      apply(value, start + 1);
    }
  }

  return (
    <div
      className={cn(
        'flex overflow-hidden rounded-xl border border-line bg-canvas font-mono text-sm leading-6 focus-within:ring-[3px] focus-within:ring-ring/50',
        props.className,
      )}
    >
      <div
        ref={gutter}
        aria-hidden="true"
        className="min-w-12 select-none overflow-hidden border-r border-line bg-soft px-2 py-3 text-right text-muted-foreground"
      >
        {Array.from({ length: lines }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={area}
        aria-label={props.label}
        value={props.value}
        readOnly={props.readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        wrap="off"
        rows={props.rows ?? 16}
        onChange={(event) => props.onChange?.(event.target.value)}
        onKeyDown={onKeyDown}
        onScroll={(event) => {
          if (gutter.current) gutter.current.scrollTop = event.currentTarget.scrollTop;
        }}
        className="min-h-0 flex-1 resize-y whitespace-pre bg-transparent px-3 py-3 text-foreground outline-none"
      />
    </div>
  );
}
