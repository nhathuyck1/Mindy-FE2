'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { codeError, useCodeCommand, useCodeQuery } from '../api/code-queries';
import { assignmentPageSchema, assignmentSchema } from '../schemas/code-contracts';
import { CodeBadge, CodeMessage, CodeSection } from './code-ui';

/** "Bài tập code" block on the mentor session page: list + create a CODE draft. */
export function MentorSessionAssignments(props: { sessionId: string; readonly?: boolean }) {
  const router = useRouter();
  const list = useCodeQuery(
    'MENTOR',
    `mentor/class-sessions/${props.sessionId}/assignments?pageSize=50&type=CODE`,
    assignmentPageSchema,
  );
  const create = useCodeCommand(assignmentSchema);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', maxScore: '10', maxAttempts: '10', dueAt: '' });
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!form.dueAt) return setError('Chọn hạn nộp.');
    try {
      const a = await create.mutateAsync({
        path: `mentor/class-sessions/${props.sessionId}/assignments`,
        body: {
          purpose: 'HOMEWORK',
          type: 'CODE',
          title: form.title.trim(),
          maxScore: form.maxScore,
          maxAttempts: Number(form.maxAttempts),
          dueAt: new Date(form.dueAt).toISOString(),
        },
      });
      router.push(`/mentor/assignments/${a.id}`);
    } catch (e) {
      setError(codeError(e, 'Chưa tạo được bài tập.'));
    }
  }

  return (
    <CodeSection
      title="Bài tập code"
      description="Bài tập lập trình (JavaScript/Java) chấm tự động cho buổi học này."
      actions={
        !props.readonly && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" /> Tạo bài code
          </Button>
        )
      }
    >
      {list.isPending && <p role="status">Đang tải…</p>}
      {list.error && <CodeMessage tone="error">{codeError(list.error)}</CodeMessage>}
      {list.data && !list.data.items.length && (
        <p className="text-sm text-muted-foreground">Chưa có bài tập code.</p>
      )}
      <ul className="space-y-2">
        {list.data?.items.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3"
          >
            <div>
              <p className="font-semibold">{a.title}</p>
              <p className="text-xs text-muted-foreground">
                Hạn {a.dueAt ? new Date(a.dueAt).toLocaleString('vi-VN') : '—'} · {a.maxAttempts}{' '}
                lượt · {a.maxScore} điểm
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CodeBadge value={a.status} kind="status" />
              <Button asChild size="sm" variant="outline">
                <Link href={`/mentor/assignments/${a.id}`}>
                  {a.status === 'DRAFT' ? 'Soạn đề' : 'Xem đề'}
                </Link>
              </Button>
              {a.status !== 'DRAFT' && (
                <Button asChild size="sm">
                  <Link href={`/mentor/assignments/${a.id}/review`}>Bài nộp</Link>
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {open && (
        <Modal title="Tạo bài tập code" onClose={() => setOpen(false)}>
          <form className="space-y-3" onSubmit={submit}>
            <label className="block space-y-1 text-sm font-semibold">
              Tên bài
              <Input
                required
                maxLength={250}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm font-semibold">
                Điểm tối đa
                <Input
                  required
                  inputMode="decimal"
                  pattern="^(0|[1-9]\d{0,5})(\.\d{1,2})?$"
                  value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                />
              </label>
              <label className="space-y-1 text-sm font-semibold">
                Số lần nộp (1–50)
                <Input
                  required
                  type="number"
                  min={1}
                  max={50}
                  value={form.maxAttempts}
                  onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })}
                />
              </label>
            </div>
            <label className="block space-y-1 text-sm font-semibold">
              Hạn nộp
              <Input
                required
                type="datetime-local"
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
              />
            </label>
            {error && <CodeMessage tone="error">{error}</CodeMessage>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={create.isPending}>
                Tạo và soạn đề
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </CodeSection>
  );
}
