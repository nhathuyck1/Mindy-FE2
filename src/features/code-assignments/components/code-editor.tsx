'use client';

import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { matchBracket, tokenize, type TokenKind } from '../lib/code-highlight';
import type { CodeLanguageKey } from '../schemas/code-contracts';

const LINE = 22;
const PAD = 10;
const PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
};

const tokenClass: Record<TokenKind, string> = {
  keyword: 'text-syn-keyword',
  control: 'text-syn-control',
  string: 'text-syn-string',
  number: 'text-syn-number',
  literal: 'text-syn-literal',
  function: 'text-syn-function',
  type: 'text-syn-type',
  property: 'text-syn-property',
  comment: 'text-syn-comment italic',
  doctag: 'text-syn-keyword italic',
  operator: 'text-syn-operator',
  bracket: 'text-syn-operator',
  plain: '',
};

export type CodeEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  label: string;
  readOnly?: boolean;
  /** Visible height in lines when not filling its parent. */
  rows?: number;
  indent?: string;
  language?: CodeLanguageKey;
  /** Stretch to the parent's height (the parent must have a definite height). */
  fill?: boolean;
  className?: string;
  onCursor?: (line: number, column: number) => void;
  /** Selected text whenever the selection changes ('' when nothing is selected). */
  onSelectionChange?: (text: string) => void;
  /** Extra drag data for selections dragged out of the editor (e.g. onto the whiteboard). */
  dragData?: Record<string, string>;
};

/** Replace a range through the browser's editing pipeline so native undo/redo keeps working. */
function replace(
  el: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string,
  caret: number,
  caretEnd = caret,
) {
  el.focus();
  el.setSelectionRange(start, end);
  const ok = text
    ? document.execCommand('insertText', false, text)
    : start === end || document.execCommand('delete');
  if (!ok) {
    el.setRangeText(text, start, end, 'end');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  el.setSelectionRange(caret, caretEnd);
}

/**
 * Dependency-free dark code editor: a transparent textarea over a syntax-coloured layer.
 * Tab/Shift+Tab (multi-line), auto-indent, bracket/quote pairing, Ctrl/⌘+/ comments,
 * bracket matching and an active-line highlight. Native undo/redo is preserved.
 */
export function CodeEditor(props: CodeEditorProps) {
  const area = useRef<HTMLTextAreaElement>(null);
  const layer = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const activeLine = useRef<HTMLDivElement>(null);
  const [caret, setCaret] = useState<{ offset: number; line: number } | null>(null);
  const indent = props.indent ?? '    ';
  const language = props.language ?? 'javascript';
  const tokens = useMemo(() => tokenize(props.value, language), [props.value, language]);
  const lines = props.value.split('\n').length;
  const match = caret ? matchBracket(tokens, caret.offset) : null;

  function syncScroll() {
    const el = area.current;
    if (!el) return;
    const { scrollTop: top, scrollLeft: left } = el;
    if (layer.current) layer.current.style.transform = `translate(${-left}px, ${-top}px)`;
    if (gutter.current) gutter.current.style.transform = `translateY(${-top}px)`;
    if (activeLine.current) activeLine.current.style.transform = `translateY(${-top}px)`;
  }

  function trackCaret() {
    const el = area.current;
    if (!el) return;
    const offset = el.selectionStart;
    const before = el.value.slice(0, offset);
    const line = before.split('\n').length;
    const column = offset - before.lastIndexOf('\n');
    setCaret((c) => (c?.offset === offset && c.line === line ? c : { offset, line }));
    props.onCursor?.(line, column);
    props.onSelectionChange?.(el.value.slice(el.selectionStart, el.selectionEnd));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (props.readOnly) return;
    const el = event.currentTarget;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const mod = event.metaKey || event.ctrlKey;

    if (event.key === 'Tab' && !mod && !event.altKey) {
      event.preventDefault();
      const multi = value.slice(start, end).includes('\n');
      if (!multi && !event.shiftKey) {
        replace(el, start, end, indent, start + indent.length);
        return;
      }
      // Indent / outdent every selected line.
      const blockEnd = end > start && value[end - 1] === '\n' ? end - 1 : end;
      const lineEnd = value.indexOf('\n', blockEnd);
      const block = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
      const rows = block.split('\n');
      const next = rows
        .map((row) =>
          event.shiftKey
            ? row.slice(
                row.startsWith(indent)
                  ? indent.length
                  : (row.match(/^ {1,4}|^\t/)?.[0].length ?? 0),
              )
            : indent + row,
        )
        .join('\n');
      const firstShift = event.shiftKey
        ? -(rows[0].length - (next.split('\n')[0]?.length ?? 0))
        : indent.length;
      replace(
        el,
        lineStart,
        lineStart + block.length,
        next,
        multi ? lineStart : Math.max(lineStart, start + firstShift),
        multi ? lineStart + next.length : Math.max(lineStart, start + firstShift),
      );
      return;
    }

    if (mod && event.key === '/') {
      event.preventDefault();
      const lineEnd = value.indexOf('\n', end);
      const block = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
      const rows = block.split('\n');
      const commented = rows.filter((r) => r.trim()).every((r) => /^\s*\/\//.test(r));
      const next = rows
        .map((r) =>
          commented ? r.replace(/^(\s*)\/\/ ?/, '$1') : r.trim() ? r.replace(/^(\s*)/, '$1// ') : r,
        )
        .join('\n');
      const delta = next.length - block.length;
      replace(
        el,
        lineStart,
        lineStart + block.length,
        next,
        Math.max(lineStart, start + (commented ? -3 : 3)),
        end + delta,
      );
      return;
    }

    if (event.key === 'Enter' && !mod && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      const current = value.slice(lineStart, start);
      const base = current.match(/^\s*/)?.[0] ?? '';
      const opens = /[{[(]\s*$/.test(current);
      const closes = /^\s*[}\])]/.test(value.slice(end));
      if (opens && closes) {
        const insert = `\n${base}${indent}\n${base}`;
        replace(el, start, end, insert, start + base.length + indent.length + 1);
        return;
      }
      const insert = `\n${base}${opens ? indent : ''}`;
      replace(el, start, end, insert, start + insert.length);
      return;
    }

    if (event.key === 'Backspace' && start === end && start > 0) {
      const prev = value[start - 1];
      if (PAIRS[prev] && value[start] === PAIRS[prev]) {
        event.preventDefault();
        replace(el, start - 1, start + 1, '', start - 1);
        return;
      }
      // Remove one indent level when the caret sits in leading whitespace.
      const head = value.slice(lineStart, start);
      if (head.length >= indent.length && /^\s+$/.test(head) && head.endsWith(indent)) {
        event.preventDefault();
        replace(el, start - indent.length, start, '', start - indent.length);
        return;
      }
    }

    if (mod || event.altKey) return;
    const close = PAIRS[event.key];
    if (close) {
      const quote = close === event.key;
      if (quote && start === end && value[start] === event.key) {
        event.preventDefault();
        el.setSelectionRange(start + 1, start + 1);
        trackCaret();
        return;
      }
      // Quotes only pair when not typed right after a word character.
      if (quote && start === end && /[\w$]/.test(value[start - 1] ?? '')) return;
      event.preventDefault();
      const selected = value.slice(start, end);
      replace(el, start, end, event.key + selected + close, start + 1, start + 1 + selected.length);
      return;
    }
    if ([')', ']', '}'].includes(event.key) && start === end && value[start] === event.key) {
      event.preventDefault();
      el.setSelectionRange(start + 1, start + 1);
      trackCaret();
      return;
    }
    // Typing a closing brace on a blank line snaps it back one indent level.
    if (event.key === '}' && start === end) {
      const head = value.slice(lineStart, start);
      if (/^\s+$/.test(head) && head.endsWith(indent)) {
        event.preventDefault();
        replace(el, start - indent.length, start, '}', start - indent.length + 1);
      }
    }
  }

  return (
    <div
      className={cn(
        'relative flex overflow-hidden bg-ide font-mono text-[13.5px] text-ide-text [font-variant-ligatures:none]',
        props.fill ? 'h-full min-h-0' : 'rounded-xl border border-ide-line',
        props.className,
      )}
      style={props.fill ? undefined : { height: (props.rows ?? 16) * LINE + PAD * 2 }}
    >
      <div
        aria-hidden="true"
        className="relative w-12 shrink-0 overflow-hidden text-right text-ide-muted select-none"
      >
        <div
          ref={gutter}
          className="pr-3 will-change-transform"
          style={{ paddingTop: PAD, lineHeight: `${LINE}px` }}
        >
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={cn(
                'tabular-nums transition-colors duration-150',
                caret?.line === i + 1 ? 'text-ide-text' : 'opacity-60',
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div ref={activeLine} aria-hidden="true" className="pointer-events-none absolute inset-0">
          {caret && !props.readOnly && (
            <div
              className="absolute inset-x-0 bg-ide-active transition-[top] duration-100 ease-out"
              style={{ top: PAD + (caret.line - 1) * LINE, height: LINE }}
            />
          )}
        </div>
        <pre
          ref={layer}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 m-0 min-w-full whitespace-pre will-change-transform"
          style={{
            padding: `${PAD}px 24px ${PAD}px 4px`,
            lineHeight: `${LINE}px`,
            tabSize: indent.length,
          }}
        >
          {tokens.map((t) => {
            const matched = match && (t.from === match[0] || t.from === match[1]);
            return (
              <span
                key={t.from}
                className={cn(
                  tokenClass[t.kind],
                  matched && 'rounded-[3px] bg-mint/30 text-ide-text outline outline-mint/70',
                )}
              >
                {t.text}
              </span>
            );
          })}
          {'\n'}
        </pre>
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
          onChange={(event) => {
            props.onChange?.(event.target.value);
            trackCaret();
          }}
          onKeyDown={onKeyDown}
          onSelect={trackCaret}
          onFocus={trackCaret}
          onBlur={() => setCaret(null)}
          onScroll={syncScroll}
          onDragStart={(event) => {
            if (!props.dragData) return;
            for (const [type, value] of Object.entries(props.dragData))
              event.dataTransfer.setData(type, value);
            event.dataTransfer.effectAllowed = 'copyMove';
          }}
          className="code-ide-dark-scroll absolute inset-0 m-0 size-full resize-none overflow-auto border-0 bg-transparent whitespace-pre text-transparent caret-coral outline-none selection:bg-mint/35 selection:text-transparent [-webkit-text-fill-color:transparent]"
          style={{
            padding: `${PAD}px 24px ${PAD}px 4px`,
            lineHeight: `${LINE}px`,
            tabSize: indent.length,
          }}
        />
      </div>
    </div>
  );
}
