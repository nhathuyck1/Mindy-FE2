import type React from 'react';
import type { TokenKind } from '@/features/code-assignments/lib/code-highlight';
import type { CodeLanguageKey } from '@/features/code-assignments/schemas/code-contracts';
import type { BoardShape } from '../schemas/whiteboard-contracts';

/** Code blocks on the board (type "code"): layout shared by the canvas and the editor overlay. */

export const CODE_MAX_CHARS = 5000;
export const CODE_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
export const CODE_DEFAULT_FONT_SIZE = 14;

/**
 * Mindy dark editor colours as fixed hex: canvas rendering cannot read the CSS colour-mix tokens.
 * Mirrors the backend export palette (Mindy-BE whiteboards/domain/code-tokens.ts).
 */
export const CODE_PALETTE: Record<TokenKind | 'bg' | 'header' | 'muted' | 'border', string> = {
  bg: '#1a2726',
  header: '#142120',
  border: '#2c3d3b',
  muted: '#8aa19e',
  plain: '#e3ecea',
  keyword: '#ff9a74',
  control: '#e98bc4',
  string: '#9fdcb0',
  number: '#ffddae',
  literal: '#ff9566',
  function: '#8ec5f2',
  type: '#7fdcd0',
  property: '#c4d9ea',
  operator: '#b3c4c6',
  bracket: '#b3c4c6',
  comment: '#7f9895',
  doctag: '#ff9a74',
};

export function codeMetrics(fontSize: number) {
  return {
    pad: 14,
    header: Math.round(fontSize * 2),
    lineHeight: Math.round(fontSize * 1.55),
    charWidth: monoWidth(fontSize),
  };
}

let measure: CanvasRenderingContext2D | null = null;
const widths = new Map<number, number>();
/** Advance width of one monospace character at this size (falls back to 0.6em). */
export function monoWidth(fontSize: number): number {
  const known = widths.get(fontSize);
  if (known) return known;
  if (typeof document === 'undefined') return fontSize * 0.6;
  measure ??= document.createElement('canvas').getContext('2d');
  if (!measure) return fontSize * 0.6;
  measure.font = `${fontSize}px ${CODE_FONT}`;
  const width = measure.measureText('MMMMMMMMMM').width / 10 || fontSize * 0.6;
  widths.set(fontSize, width);
  return width;
}

/** A new code block sized to its content, centred on `center` (board coordinates). */
export function codeShape(
  text: string,
  language: CodeLanguageKey,
  center: { x: number; y: number },
): Extract<BoardShape, { type: 'code' }> {
  const fontSize = CODE_DEFAULT_FONT_SIZE;
  const m = codeMetrics(fontSize);
  const lines = text.split('\n');
  const longest = Math.max(12, ...lines.map((l) => l.length));
  const width = Math.round(Math.min(900, Math.max(260, longest * m.charWidth + m.pad * 2 + 8)));
  const height = Math.round(Math.min(10000, m.header + m.pad * 2 + lines.length * m.lineHeight));
  return {
    id: crypto.randomUUID(),
    type: 'code',
    x: Math.round(Math.max(-100000, Math.min(100000, center.x - width / 2))),
    y: Math.round(Math.max(-100000, Math.min(100000, center.y - height / 2))),
    width,
    height,
    color: '#1d5b57',
    text,
    fontSize,
    language,
  };
}

/** Tag for drags that start in the code editor, so the board knows the language. */
export const CODE_DRAG_TYPE = 'application/x-mindy-code';

/**
 * Starts a drag that carries code to the whiteboard or the chat composer: plain text plus the
 * language tag, with a visible preview card (the editor's own text is transparent, so the
 * browser's default drag image would be empty).
 */
export function startCodeDrag(event: React.DragEvent, text: string, language: CodeLanguageKey) {
  event.dataTransfer.setData('text/plain', text);
  event.dataTransfer.setData(CODE_DRAG_TYPE, language);
  event.dataTransfer.effectAllowed = 'copy';
  const card = document.createElement('div');
  const lines = text.split('\n');
  card.textContent =
    lines.slice(0, 4).join('\n') + (lines.length > 4 ? `\n… +${lines.length - 4} dòng` : '');
  Object.assign(card.style, {
    position: 'fixed',
    top: '-1000px',
    left: '-1000px',
    maxWidth: '320px',
    padding: '8px 12px',
    borderRadius: '10px',
    background: CODE_PALETTE.bg,
    color: CODE_PALETTE.plain,
    font: `12px/1.5 ${CODE_FONT}`,
    whiteSpace: 'pre',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,.25)',
  });
  document.body.appendChild(card);
  event.dataTransfer.setDragImage(card, 16, 16);
  setTimeout(() => card.remove(), 0);
}
