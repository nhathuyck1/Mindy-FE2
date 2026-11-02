'use client';

import { useState } from 'react';
import { Copy, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { useAuthoringActions } from '../api/code-authoring-actions';
import { codeError, useCodeQuery } from '../api/code-queries';
import { typeLabels } from '../lib/code-authoring';
import { signatureText } from '../lib/code-format';
import { codeTemplates } from '../lib/code-templates';
import { codeLibraryPageSchema, type MentorAuthoring } from '../schemas/code-contracts';
import { CodeBadge, CodeMessage } from './code-ui';

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
      className="space-y-4 rounded-2xl border border-mint/40 bg-soft p-5"
      aria-label="Bắt đầu nhanh"
    >
      <div>
        <h2 className="text-lg font-bold">Bắt đầu nhanh</h2>
        <p className="text-sm text-muted-foreground">
          Dùng một đề có sẵn hoặc bài bạn đã soạn trước đây rồi chỉnh lại. Bỏ qua nếu muốn soạn từ
          đầu.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={tab === 'templates' ? 'default' : 'outline'}
          aria-pressed={tab === 'templates'}
          onClick={() => setTab(tab === 'templates' ? null : 'templates')}
        >
          <Sparkles aria-hidden="true" /> Đề mẫu
        </Button>
        <Button
          type="button"
          variant={tab === 'library' ? 'default' : 'outline'}
          aria-pressed={tab === 'library'}
          onClick={() => setTab(tab === 'library' ? null : 'library')}
        >
          <Copy aria-hidden="true" /> Bài đã soạn
        </Button>
      </div>
      {tab === 'templates' && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {codeTemplates.map((t) => (
            <li
              key={t.key}
              className="flex flex-col gap-2 rounded-xl border border-line bg-canvas p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{t.title}</p>
                <span className="text-xs text-muted-foreground">
                  {difficultyLabels[t.difficulty]}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{t.statementMd}</p>
              <p className="font-mono text-xs break-all">{signatureText(t.signature)}</p>
              <p className="text-xs text-muted-foreground">
                {t.signature.params.map((p) => typeLabels[p.type]).join(', ')} →{' '}
                {typeLabels[t.signature.returnType]} · {t.inputs.length} test
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-auto self-start"
                disabled={busy}
                onClick={() => run(() => props.actions.applyTemplate(t, props.data, setProgress))}
              >
                Dùng đề này
              </Button>
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
      {progress && <CodeMessage>{progress}</CodeMessage>}
      {error && <CodeMessage tone="error">{error}</CodeMessage>}
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
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input.trim());
        }}
      >
        <Input
          aria-label="Tìm theo tên bài hoặc mã lớp"
          placeholder="Tìm theo tên bài hoặc mã lớp"
          value={input}
          maxLength={100}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button type="submit" variant="outline" aria-label="Tìm">
          <Search aria-hidden="true" />
        </Button>
      </form>
      {library.isPending && <p role="status">Đang tải…</p>}
      {library.error && (
        <CodeMessage tone="error">
          {codeError(library.error, 'Không tải được danh sách.')}
        </CodeMessage>
      )}
      {library.data && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có bài code nào bạn đã soạn.</p>
      )}
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.assignmentId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-3"
          >
            <div className="min-w-0">
              <p className="font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.classCode} · Buổi {item.sessionNumber} · {item.testCount} test ·{' '}
                {item.languages.map((l) => (l === 'java21' ? 'Java' : 'JavaScript')).join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CodeBadge value={item.status} kind="status" />
              <Button
                type="button"
                size="sm"
                disabled={props.disabled}
                onClick={() => props.onPick(item.assignmentId)}
              >
                Dùng lại
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Sao chép đề, hàm, test và lời giải mẫu vào bản nháp này (thay nội dung hiện có). Bạn vẫn cần
        kiểm tra lại trước khi giao.
      </p>
    </div>
  );
}
