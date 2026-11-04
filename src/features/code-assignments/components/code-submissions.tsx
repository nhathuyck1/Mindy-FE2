'use client';

import { useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { codeError, useCodeQuery } from '../api/code-queries';
import { formatValue, isPending, submissionStatusLabels, verdictLabels } from '../lib/code-format';
import {
  type CodeLanguageKey,
  submissionListSchema,
  submissionSchema,
  type Submission,
} from '../schemas/code-contracts';
import { CodeBlock, CodeMessage } from './code-ui';
import { CodeEditor } from './code-editor';

type Tone = 'good' | 'warn' | 'bad' | 'wait';

function toneOf(status: string, verdict: string | null): Tone {
  if (isPending(status)) return 'wait';
  if (status !== 'GRADED') return 'bad';
  if (verdict === 'ACCEPTED') return 'good';
  if (verdict === 'PARTIAL') return 'warn';
  return 'bad';
}
const toneText: Record<Tone, string> = {
  good: 'text-mint',
  warn: 'text-coral',
  bad: 'text-headsup',
  wait: 'text-muted',
};
function labelOf(s: { status: string; verdict: string | null }) {
  return s.status === 'GRADED' && s.verdict
    ? (verdictLabels[s.verdict] ?? s.verdict)
    : (submissionStatusLabels[s.status] ?? s.status);
}

const relative = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
function ago(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of steps)
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  return 'vừa xong';
}

/** "Lịch sử nộp" tab: a compact list, or one submission's verdict when selected. */
export function SubmissionHistory(props: {
  base: string;
  inFlight: string | null;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const list = useCodeQuery('STUDENT', `${props.base}/code-submissions`, submissionListSchema, {
    refetchInterval: (query) =>
      props.inFlight || query.state.data?.items.some((s) => isPending(s.status)) ? 1500 : false,
  });
  if (props.selected)
    return (
      <SubmissionDetail
        key={props.selected}
        id={props.selected}
        onBack={() => props.onSelect(null)}
      />
    );
  if (list.error)
    return (
      <div className="p-5">
        <CodeMessage tone="error">{codeError(list.error)}</CodeMessage>
      </div>
    );
  if (list.isPending)
    return (
      <div role="status" className="space-y-2 p-4">
        <span className="sr-only">Đang tải lịch sử nộp…</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-soft" />
        ))}
      </div>
    );
  if (!list.data.items.length)
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <Clock aria-hidden="true" className="size-8 text-line" />
        <p className="font-bold">Chưa nộp lần nào</p>
        <p className="max-w-64 text-sm text-muted/80">
          Chạy thử với các ví dụ, khi tự tin thì bấm Nộp bài để được chấm với test ẩn.
        </p>
      </div>
    );
  return (
    <ul className="divide-y divide-line px-2 py-2">
      {list.data.items.map((s, i) => {
        const tone = toneOf(s.status, s.verdict);
        return (
          <li
            key={s.id}
            className="animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both duration-300"
            style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
          >
            <button
              type="button"
              onClick={() => props.onSelect(s.id)}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-soft focus-visible:ring-2 focus-visible:ring-mint focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span
                  className={cn('flex items-center gap-1.5 text-sm font-extrabold', toneText[tone])}
                >
                  {tone === 'wait' && (
                    <span
                      aria-hidden="true"
                      className="size-1.5 animate-pulse rounded-full bg-current"
                    />
                  )}
                  {labelOf(s)}
                </span>
                <span className="block text-xs text-muted/75">
                  Lần {s.attemptNumber} · {ago(s.submittedAt)}
                  {!s.countsAsAttempt && ' · không tính lượt'}
                </span>
              </span>
              {s.score && (
                <span className="font-mono text-sm font-bold text-black/80 tabular-nums">
                  {s.score}
                </span>
              )}
              <ChevronRight
                aria-hidden="true"
                className="size-4 text-muted/40 transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Stat(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line px-3 py-2">
      <p className="text-[11px] font-bold tracking-wide text-muted/70 uppercase">{props.label}</p>
      <p className="font-mono text-sm font-bold text-black tabular-nums">{props.children}</p>
    </div>
  );
}

function SubmissionDetail(props: { id: string; onBack: () => void }) {
  const [pending, setPending] = useState(true);
  const detail = useCodeQuery('STUDENT', `me/code-submissions/${props.id}`, submissionSchema, {
    refetchInterval: pending ? 1500 : false,
  });
  const s: Submission | undefined = detail.data;
  if (s && pending !== isPending(s.status)) setPending(isPending(s.status));
  const tone = s ? toneOf(s.status, s.verdict) : 'wait';
  return (
    <div className="space-y-5 px-5 py-4 lg:px-6">
      <button
        type="button"
        onClick={props.onBack}
        className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] font-bold text-muted/80 transition-colors hover:bg-soft hover:text-black"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" /> Tất cả lần nộp
      </button>
      {!s ? (
        <p role="status" className="text-sm text-muted">
          Đang tải bài nộp…
        </p>
      ) : (
        <div className="animate-in fade-in-0 slide-in-from-bottom-1 space-y-5 duration-300">
          <header className="space-y-1">
            <p className={cn('text-2xl font-extrabold tracking-tight', toneText[tone])}>
              {labelOf(s)}
            </p>
            <p className="text-xs text-muted/80">
              Lần {s.attemptNumber} · {new Date(s.submittedAt).toLocaleString('vi-VN')}
              {s.runtimeVersion && ` · ${s.runtimeVersion}`}
              {!s.countsAsAttempt && ' · không tính lượt'}
            </p>
          </header>

          {isPending(s.status) && (
            <div role="status" className="space-y-2">
              <div className="relative h-1 overflow-hidden rounded-full bg-soft">
                <span className="absolute inset-y-0 w-1/3 animate-[code-progress_1.2s_ease-in-out_infinite] rounded-full bg-mint" />
              </div>
              <p className="text-sm text-muted">Đang chấm, kết quả sẽ tự cập nhật…</p>
            </div>
          )}
          {s.status === 'FAILED' && (
            <CodeMessage tone="error">Lỗi hệ thống khi chấm. Mentor sẽ chấm lại.</CodeMessage>
          )}
          {s.voidedReason && <CodeMessage tone="error">Bài bị huỷ: {s.voidedReason}</CodeMessage>}

          {(s.score || s.passedCount !== null) && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {s.score && <Stat label="Điểm">{`${s.score}/${s.maxScore} điểm`}</Stat>}
              {s.passedCount !== null && s.totalCount !== null && (
                <Stat label="Test đạt">{`${s.passedCount}/${s.totalCount}`}</Stat>
              )}
              {s.maxTimeMs !== null && <Stat label="Thời gian">{s.maxTimeMs} ms</Stat>}
              {s.maxMemoryKb !== null && (
                <Stat label="Bộ nhớ">{(s.maxMemoryKb / 1024).toFixed(1)} MB</Stat>
              )}
            </div>
          )}

          {s.compileOutput && s.verdict === 'COMPILE_ERROR' && (
            <CodeBlock label="Lỗi biên dịch" value={s.compileOutput} />
          )}

          {!!s.tests?.length && (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {s.tests.map((t) => {
                const ok = t.status === 'PASSED';
                return (
                  <li
                    key={t.position}
                    className="flex items-center gap-2 rounded-lg bg-soft/70 px-3 py-2 text-[13px]"
                  >
                    <span
                      className={cn(
                        'flex size-4.5 shrink-0 items-center justify-center rounded-full text-canvas',
                        ok ? 'bg-mint' : 'bg-headsup',
                      )}
                    >
                      {ok ? (
                        <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                      ) : (
                        <X aria-hidden="true" className="size-3" strokeWidth={3} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-bold">
                      {t.visibility === 'SAMPLE' ? `Ví dụ ${t.position}` : `Test ẩn ${t.position}`}
                      <span className="sr-only">: {verdictLabels[t.status] ?? t.status}</span>
                    </span>
                    {t.visibility === 'SAMPLE' && t.actual !== undefined && (
                      <span className="truncate font-mono text-xs text-muted/80">
                        → {formatValue(t.actual)}
                      </span>
                    )}
                    <span className="font-mono text-xs text-muted/70 tabular-nums">
                      {t.timeMs} ms
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {s.sourceCode && (
            <section className="space-y-2">
              <h3 className="text-sm font-extrabold">Code đã nộp</h3>
              <CodeEditor
                label="Code đã nộp"
                value={s.sourceCode}
                language={s.languageKey satisfies CodeLanguageKey}
                readOnly
                rows={Math.min(Math.max(s.sourceCode.split('\n').length, 4), 16)}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
