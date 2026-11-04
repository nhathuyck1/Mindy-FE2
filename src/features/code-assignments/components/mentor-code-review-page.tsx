'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { codeError, useCodeCommand, useCodeQuery } from '../api/code-queries';
import { formatValue, isPending } from '../lib/code-format';
import {
  codeSummarySchema,
  mentorSubmissionDetailSchema,
  mentorSubmissionPageSchema,
  mentorSubmissionSchema,
} from '../schemas/code-contracts';
import { CodeEditor } from './code-editor';
import { CodeBadge, CodeBlock, CodeMessage, CodeSection } from './code-ui';

export function MentorCodeReviewPage(props: { assignmentId: string }) {
  const [page, setPage] = useState(1);
  const [student, setStudent] = useState<string | null>(null);
  const base = `mentor/assignments/${props.assignmentId}`;
  const summary = useCodeQuery(
    'MENTOR',
    `${base}/code-summary?page=${page}&pageSize=20`,
    codeSummarySchema,
  );
  const submissions = useCodeQuery(
    'MENTOR',
    `${base}/code-submissions?page=1&pageSize=50${student ? `&studentId=${student}` : ''}`,
    mentorSubmissionPageSchema,
    { refetchInterval: 5000 },
  );
  const s = summary.data;
  return (
    <div className="space-y-6">
      <Link
        href={`/mentor/assignments/${props.assignmentId}`}
        className="text-link inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Đề bài
      </Link>
      <h1 className="section-title">Bài nộp của lớp</h1>
      {summary.error && <CodeMessage tone="error">{codeError(summary.error)}</CodeMessage>}
      {s && (
        <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Học viên', s.totals.students],
            ['Đã nộp', s.totals.submitted],
            ['Chưa nộp', s.totals.notSubmitted],
            ['Đúng hết', s.totals.accepted],
            ['Lỗi hệ thống', s.totals.failed],
            ['Điểm TB', s.totals.averageBestScore ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-line bg-canvas px-3 py-2">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-lg font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <CodeSection
        title="Học viên"
        description={`Điểm của bài = lần nộp cao nhất (tối đa ${s?.maxScore ?? ''}).`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-2">Học viên</th>
                <th className="p-2">Lượt</th>
                <th className="p-2">Điểm cao nhất</th>
                <th className="p-2">Lần gần nhất</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {s?.items.map((r) => (
                <tr key={r.studentId} className="border-t border-line">
                  <td className="p-2">
                    {r.displayName}
                    {r.enrollmentStatus !== 'ACTIVE' && (
                      <span className="text-xs text-muted-foreground"> (đã nghỉ)</span>
                    )}
                  </td>
                  <td className="p-2">
                    {r.attemptsUsed}/{s.maxAttempts}
                  </td>
                  <td className="p-2 font-bold">{r.bestScore ?? '—'}</td>
                  <td className="p-2">
                    <CodeBadge
                      value={r.latestStatus === 'GRADED' ? r.latestVerdict : r.latestStatus}
                    />
                    {r.failedCount > 0 && (
                      <span className="ml-2 text-xs text-headsup">
                        {r.failedCount} lỗi hệ thống
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {r.submissionCount > 0 && (
                      <Button size="sm" variant="outline" onClick={() => setStudent(r.studentId)}>
                        Xem bài
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {s && s.total > s.pageSize && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page * s.pageSize >= s.total}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
          </div>
        )}
      </CodeSection>
      <CodeSection
        title="Các lần nộp"
        actions={
          student && (
            <Button size="sm" variant="ghost" onClick={() => setStudent(null)}>
              Xem tất cả
            </Button>
          )
        }
      >
        <ul className="space-y-2">
          {submissions.data?.items.map((x) => (
            <li key={x.id}>
              <Link
                href={`/mentor/code-submissions/${x.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3 text-sm hover:bg-soft"
              >
                <span>
                  {x.displayName} · lần {x.attemptNumber} ·{' '}
                  {new Date(x.submittedAt).toLocaleString('vi-VN')}
                  {x.duplicateOfOtherStudent && (
                    <span className="ml-2 inline-flex items-center gap-1 text-headsup">
                      <Copy className="size-3" aria-hidden="true" /> trùng code học viên khác
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  {x.score && <b>{x.score}</b>}
                  <CodeBadge value={x.status === 'GRADED' ? x.verdict : x.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CodeSection>
    </div>
  );
}

export function MentorCodeSubmissionPage(props: { submissionId: string }) {
  const [pending, setPending] = useState(false);
  const detail = useCodeQuery(
    'MENTOR',
    `mentor/code-submissions/${props.submissionId}`,
    mentorSubmissionDetailSchema,
    {
      refetchInterval: pending ? 2000 : false,
    },
  );
  const command = useCodeCommand(mentorSubmissionSchema);
  const [voiding, setVoiding] = useState(false);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const s = detail.data;
  if (s && pending !== isPending(s.status)) setPending(isPending(s.status));
  if (detail.isPending) return <p role="status">Đang tải bài nộp…</p>;
  if (!s)
    return (
      <CodeMessage tone="error">{codeError(detail.error, 'Không mở được bài nộp.')}</CodeMessage>
    );
  async function act(action: 'rejudge' | 'void') {
    setNotice(null);
    try {
      await command.mutateAsync({
        path: `mentor/code-submissions/${props.submissionId}/${action}`,
        ...(action === 'void' ? { body: { reason } } : {}),
      });
      setVoiding(false);
      setNotice({
        tone: 'info',
        text: action === 'void' ? 'Đã huỷ bài nộp.' : 'Đã đưa bài vào hàng chấm lại.',
      });
    } catch (error) {
      setNotice({ tone: 'error', text: codeError(error) });
    }
  }
  return (
    <div className="space-y-6">
      <Link
        href={`/mentor/assignments/${s.assignmentId}/review`}
        className="text-link inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Bài nộp của lớp
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">
            Lần {s.attemptNumber} · {s.languageKey} ·{' '}
            {new Date(s.submittedAt).toLocaleString('vi-VN')}
          </p>
          <h1 className="section-title">{s.displayName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CodeBadge value={s.status} kind="status" />
          {s.verdict && <CodeBadge value={s.verdict} />}
          {s.score && (
            <b>
              {s.score}/{s.maxScore}
            </b>
          )}
        </div>
      </header>
      {s.duplicateOfOtherStudent && (
        <CodeMessage tone="error">Code trùng y hệt bài của học viên khác trong đề này.</CodeMessage>
      )}
      {s.voidedReason && <CodeMessage tone="error">Đã huỷ: {s.voidedReason}</CodeMessage>}
      {s.lastError && <CodeBlock label="Lỗi hệ thống gần nhất" value={s.lastError} />}
      <div className="flex flex-wrap gap-3">
        {s.status === 'FAILED' && (
          <Button onClick={() => act('rejudge')} disabled={command.isPending}>
            Chấm lại
          </Button>
        )}
        {s.status !== 'VOIDED' && (
          <Button variant="destructive" onClick={() => setVoiding(true)}>
            Huỷ bài nộp
          </Button>
        )}
      </div>
      {notice && <CodeMessage tone={notice.tone}>{notice.text}</CodeMessage>}
      <CodeSection title="Code">
        <CodeEditor
          label="Code học viên"
          value={s.sourceCode ?? ''}
          language={s.languageKey}
          readOnly
          rows={18}
        />
        {s.compileOutput && <CodeBlock label="Output biên dịch" value={s.compileOutput} />}
      </CodeSection>
      <CodeSection title="Kết quả từng test">
        <ul className="space-y-2">
          {s.mentorTests.map((t) => (
            <li key={t.position} className="space-y-1 rounded-xl border border-line p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  #{t.position} {t.visibility === 'SAMPLE' ? 'Ví dụ' : 'Ẩn'} · trọng số {t.weight} ·{' '}
                  {t.timeMs} ms · {Math.round(t.memoryKb / 1024)} MB
                </span>
                <CodeBadge value={t.status} />
              </div>
              <p className="font-mono text-xs">
                {formatValue(t.inputArgs)} → mong đợi {formatValue(t.expected)}
                {t.visibility === 'SAMPLE' && ` · nhận ${formatValue(t.actual)}`}
              </p>
              {t.console && <CodeBlock label="Console" value={t.console} />}
            </li>
          ))}
        </ul>
      </CodeSection>
      {voiding && (
        <Modal title="Huỷ bài nộp" onClose={() => setVoiding(false)}>
          <div className="space-y-3">
            <p className="text-sm">
              Bài bị huỷ vẫn tính lượt và không được tính điểm. Lý do sẽ hiện cho học viên.
            </p>
            <Input placeholder="Lý do" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setVoiding(false)}>
                Đóng
              </Button>
              <Button
                variant="destructive"
                disabled={!reason.trim() || command.isPending}
                onClick={() => act('void')}
              >
                Huỷ bài
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
