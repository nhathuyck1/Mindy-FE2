'use client';

import { useState } from 'react';
import { ArrowRight, Copy, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { useAuthoringActions } from '../api/code-authoring-actions';
import { codeError, useCodeQuery } from '../api/code-queries';
import { codeTemplates } from '../lib/code-templates';
import { codeLibraryPageSchema, type MentorAuthoring } from '../schemas/code-contracts';
import { fieldClass } from './code-authoring-steps';

const difficultyLabels = { EASY: 'Dễ', MEDIUM: 'Vừa', HARD: 'Khó' } as const;

/** "Bắt đầu nhanh": start from a ready-made problem or reuse one the mentor wrote before. */
export function CodeQuickStart(props: {
  data: MentorAuthoring;
  actions: ReturnType<typeof useAuthoringActions>;
  onApplied: (next: MentorAuthoring) => void;
}) {
  const [tab, setTab] = useState<'templates' | 'library' | null>(null);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const busy = Boolean(progress);

  async function run(task: () => Promise<MentorAuthoring>) {
    setError('');
    try {
      props.onApplied(await task());
    } catch (e) {
      setError(
        e instanceof Error && !('code' in e) ? e.message : codeError(e, 'Chưa áp dụng được.'),
      );
    } finally {
      setProgress('');
    }
  }

  return (
    <section
      aria-label="Bắt đầu nhanh"
      className="mx-4 mt-4 overflow-hidden rounded-xl bg-mint/6 ring-1 ring-mint/25"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-canvas text-mint ring-1 ring-mint/25">
          <Sparkles aria-hidden="true" className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-extrabold">Bắt đầu nhanh</p>
          <p className="text-[12.5px] text-muted/75">
            Dùng đề có sẵn hoặc bài bạn đã soạn rồi chỉnh lại.
            {props.data.problem && ' Nội dung hiện có sẽ bị thay thế.'}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {(
              [
                ['templates', 'Đề mẫu', Sparkles],
                ['library', 'Bài đã soạn', Copy],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                aria-pressed={tab === id}
                onClick={() => setTab(tab === id ? null : id)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold ring-1 transition-all duration-200',
                  tab === id
                    ? 'bg-forest text-canvas ring-forest'
                    : 'bg-canvas text-black ring-line hover:ring-mint/50',
                )}
              >
                <Icon aria-hidden="true" className="size-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {tab === 'templates' && (
        <ul className="animate-in fade-in-0 slide-in-from-top-1 grid gap-2 border-t border-mint/20 p-3 duration-200 sm:grid-cols-2">
          {codeTemplates.map((t) => (
            <li key={t.key}>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => props.actions.applyTemplate(t, props.data, setProgress))}
                className="group flex h-full w-full flex-col gap-1 rounded-lg bg-canvas p-3 text-left ring-1 ring-line transition-all duration-200 hover:ring-mint/60 disabled:opacity-50"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-extrabold">{t.title}</span>
                  <span className="shrink-0 text-[11px] font-bold text-muted/60">
                    {difficultyLabels[t.difficulty]}
                  </span>
                </span>
                <span className="line-clamp-2 text-[12px] text-muted/75">{t.statementMd}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[12px] font-bold text-mint">
                  Dùng đề này
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {tab === 'library' && (
        <LibraryList
          currentId={props.data.assignment.id}
          disabled={busy}
          onPick={(id) => {
            setProgress('Đang sao chép đề…');
            return run(() => props.actions.importFrom(props.data.assignment.revision, id));
          }}
        />
      )}
      {progress && (
        <p
          role="status"
          className="flex items-center gap-2 border-t border-mint/20 px-4 py-2.5 text-[12.5px] font-bold"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-mint" /> {progress}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="border-t border-mint/20 px-4 py-2.5 text-[12.5px] font-bold text-headsup"
        >
          {error}
        </p>
      )}
    </section>
  );
}

function LibraryList(props: {
  currentId: string;
  disabled: boolean;
  onPick: (id: string) => void;
}) {
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const query = new URLSearchParams({ pageSize: '20', ...(q ? { q } : {}) });
  const library = useCodeQuery('MENTOR', `mentor/code-library?${query}`, codeLibraryPageSchema);
  const items = library.data?.items.filter((i) => i.assignmentId !== props.currentId) ?? [];
  return (
    <div className="animate-in fade-in-0 slide-in-from-top-1 space-y-2 border-t border-mint/20 p-3 duration-200">
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input.trim());
        }}
      >
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted/50"
        />
        <input
          aria-label="Tìm theo tên bài hoặc mã lớp"
          placeholder="Tìm theo tên bài hoặc mã lớp, Enter để tìm"
          value={input}
          maxLength={100}
          onChange={(e) => setInput(e.target.value)}
          className={cn(fieldClass, 'h-9 bg-canvas pl-8 ring-1 ring-line')}
        />
      </form>
      {library.isPending && (
        <div role="status" className="space-y-1.5">
          <span className="sr-only">Đang tải…</span>
          {[0, 1].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-canvas" />
          ))}
        </div>
      )}
      {library.error && (
        <p role="alert" className="text-[12.5px] font-bold text-headsup">
          {codeError(library.error, 'Không tải được danh sách.')}
        </p>
      )}
      {library.data && items.length === 0 && (
        <p className="px-1 py-2 text-[12.5px] text-muted/70">Chưa có bài code nào bạn đã soạn.</p>
      )}
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.assignmentId}>
            <button
              type="button"
              disabled={props.disabled}
              onClick={() => props.onPick(item.assignmentId)}
              className="group flex w-full items-center gap-3 rounded-lg bg-canvas px-3 py-2 text-left ring-1 ring-line transition-all duration-200 hover:ring-mint/60 disabled:opacity-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-extrabold">{item.title}</span>
                <span className="block truncate text-[11.5px] text-muted/70">
                  {item.classCode} · Buổi {item.sessionNumber} · {item.testCount} test ·{' '}
                  {item.languages.map((l) => (l === 'java21' ? 'Java' : 'JavaScript')).join(', ')}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-mint">
                Dùng lại
                <ArrowRight
                  aria-hidden="true"
                  className="size-3 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="px-1 text-[11.5px] text-muted/60">
        Sao chép đề, hàm, test và lời giải mẫu vào bản nháp này (thay nội dung hiện có). Bạn vẫn cần
        kiểm tra lại trước khi giao.
      </p>
    </div>
  );
}
