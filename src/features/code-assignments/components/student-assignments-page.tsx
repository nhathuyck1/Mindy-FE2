'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Code2 } from 'lucide-react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useMyCourses } from '@/features/user/api/user-queries';
import { codeError, useCodeQuery } from '../api/code-queries';
import { timeLeft } from '../lib/code-format';
import { assignmentPageSchema } from '../schemas/code-contracts';
import { CodeBadge, CodeMessage } from './code-ui';

export function StudentAssignmentsPage() {
  const classes = useMyCourses(1, 'current');
  const active = classes.data?.items.filter((c) => c.enrollmentStatus === 'ACTIVE') ?? [];
  const [chosen, setChosen] = useState('');
  const classId = chosen || active[0]?.classId || '';
  const assignments = useCodeQuery(
    'STUDENT',
    `me/classes/${classId}/assignments?pageSize=50&type=CODE`,
    assignmentPageSchema,
    { enabled: Boolean(classId) },
  );
  const now = new Date();
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="eyebrow">Bài tập</p>
        <h1 className="section-title">Bài tập lập trình</h1>
        <p className="text-muted-foreground">Bài tập code mentor giao sau mỗi buổi học.</p>
      </header>
      {classes.isPending && <p role="status">Đang tải lớp học…</p>}
      {classes.error && <CodeMessage tone="error">{codeError(classes.error)}</CodeMessage>}
      {classes.data && !active.length && (
        <CodeMessage>Bạn chưa có lớp đang học nên chưa có bài tập.</CodeMessage>
      )}
      {active.length > 1 && (
        <label className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          Lớp
          <NativeSelect value={classId} onChange={(e) => setChosen(e.target.value)}>
            {active.map((c) => (
              <NativeSelectOption key={c.classId} value={c.classId}>
                {c.className} · {c.courseTitle}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      )}
      {assignments.isPending && classId && <p role="status">Đang tải bài tập…</p>}
      {assignments.error && <CodeMessage tone="error">{codeError(assignments.error)}</CodeMessage>}
      {assignments.data && !assignments.data.items.length && (
        <CodeMessage>Lớp này chưa có bài tập lập trình nào.</CodeMessage>
      )}
      <ul className="grid gap-3">
        {assignments.data?.items.map((a) => (
          <li key={a.id}>
            <Link
              href={`/user/assignments/${a.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-canvas p-4 hover:bg-soft focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span className="flex items-center gap-3">
                <Code2 className="size-5 text-mint" aria-hidden="true" />
                <span>
                  <span className="block font-bold">{a.title}</span>
                  <span className="text-sm text-muted-foreground">
                    Tối đa {a.maxScore} điểm · {a.maxAttempts} lần nộp
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-2 text-sm">
                {a.status === 'ARCHIVED' ? (
                  <CodeBadge value="ARCHIVED" kind="status" />
                ) : (
                  a.dueAt && <span className="text-muted-foreground">{timeLeft(a.dueAt, now)}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
