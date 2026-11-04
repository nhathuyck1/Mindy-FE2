'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { codeError, useCodeCommand, useCodeQuery } from '../api/code-queries';
import {
  formatValue,
  isPending,
  parseCustomArgs,
  signatureText,
  timeLeft,
} from '../lib/code-format';
import {
  codeDraftSchema,
  type CodeLanguageKey,
  runResultSchema,
  type RunResult,
  type StudentCodeAssignment,
  studentCodeAssignmentSchema,
  submissionListSchema,
  submissionSchema,
  type Submission,
} from '../schemas/code-contracts';
import { CodeEditor } from './code-editor';
import { CodeBadge, CodeBlock, CodeMessage, CodeSection, Statement } from './code-ui';

export function StudentCodePage(props: { assignmentId: string }) {
  const base = `me/assignments/${props.assignmentId}`;
  const view = useCodeQuery('STUDENT', `${base}/code`, studentCodeAssignmentSchema, {
    refetchInterval: (query) => (query.state.data?.inFlightSubmissionId ? 1500 : false),
  });
  const [language, setLanguage] = useState<CodeLanguageKey | null>(null);
  const lang = language ?? view.data?.languages[0]?.key ?? null;
  if (view.isPending) return <p role="status">Đang tải bài tập…</p>;
  if (view.error || !view.data)
    return (
      <CodeMessage tone="error">{codeError(view.error, 'Không mở được bài tập.')}</CodeMessage>
    );
  const a = view.data;
  return (
    <div className="space-y-6">
      <Link href="/user/assignments" className="text-link inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" aria-hidden="true" /> Bài tập lập trình
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="eyebrow">
            {a.problem.difficulty ?? 'Bài tập'} · {signatureText(a.problem.signature)}
          </p>
          <h1 className="section-title">{a.title}</h1>
        </div>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <Stat label="Hạn nộp" value={timeLeft(a.dueAt, new Date(a.serverNow))} />
          <Stat label="Lượt còn" value={`${a.attemptsRemaining}/${a.maxAttempts}`} />
          <Stat label="Điểm cao nhất" value={a.bestScore ? `${a.bestScore}/${a.maxScore}` : '—'} />
        </dl>
      </header>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <CodeSection title="Đề bài">
          <Statement text={a.problem.statementMd} />
          {a.problem.constraintsMd && (
            <div className="space-y-1">
              <h3 className="font-semibold">Ràng buộc</h3>
              <Statement text={a.problem.constraintsMd} />
            </div>
          )}
          {a.samples.map((s) => (
            <div key={s.position} className="space-y-2 rounded-xl bg-soft p-3 text-sm">
              <p className="font-semibold">Ví dụ {s.position}</p>
              <p className="font-mono text-xs">Input: {s.display}</p>
              <p className="font-mono text-xs">Output: {formatValue(s.expected)}</p>
              {s.explanationMd && <Statement text={s.explanationMd} />}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Có thêm {a.hiddenTestCount} test ẩn khi chấm. Giới hạn {a.problem.cpuTimeLimitMs} ms ·{' '}
            {a.problem.memoryLimitMb} MB. Lỗi biên dịch không tính lượt; bài bị mentor huỷ vẫn tính
            lượt.
          </p>
        </CodeSection>
        {lang && (
          <Workspace
            key={lang}
            base={base}
            assignment={a}
            language={lang}
            onLanguage={setLanguage}
            onChanged={() => view.refetch()}
          />
        )}
      </div>
      <History base={base} inFlight={a.inFlightSubmissionId} />
    </div>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-canvas px-3 py-2">
      <dt className="text-xs text-muted-foreground">{props.label}</dt>
      <dd className="font-bold">{props.value}</dd>
    </div>
  );
}

function Workspace(props: {
  base: string;
  assignment: StudentCodeAssignment;
  language: CodeLanguageKey;
  onLanguage: (key: CodeLanguageKey) => void;
  onChanged: () => void;
}) {
  const a = props.assignment;
  const draftPath = `${props.base}/code-drafts/${props.language}`;
  const draft = useCodeQuery('STUDENT', draftPath, codeDraftSchema);
  const [source, setSource] = useState<string | null>(null);
  const version = useRef<number | null>(null);
  const [saveState, setSaveState] = useState('');
  const [custom, setCustom] = useState<string[] | null>(null);
  const [run, setRun] = useState<RunResult | null>(null);
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const save = useCodeCommand(codeDraftSchema);
  const runner = useCodeCommand(runResultSchema);
  const submit = useCodeCommand(submissionSchema);
  const code = source ?? draft.data?.sourceCode ?? '';

  // Debounced autosave; conflicts ask for a reload instead of overwriting another tab's work.
  useEffect(() => {
    const expectedVersion = version.current ?? draft.data?.version;
    if (source === null || expectedVersion === undefined) return;
    const timer = setTimeout(async () => {
      try {
        setSaveState('Đang lưu…');
        const saved = await save.mutateAsync({
          path: draftPath,
          method: 'PUT',
          body: { sourceCode: source, expectedVersion },
        });
        version.current = saved.version;
        setSaveState('Đã lưu nháp');
      } catch (error) {
        setSaveState(codeError(error, 'Chưa lưu được nháp'));
      }
    }, 2000);
    return () => clearTimeout(timer);
    // `save` is stable per component; re-run only when the code changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, draftPath]);

  async function doRun() {
    setMessage(null);
    let customArgs: unknown[] | undefined;
    if (custom) {
      const parsed = parseCustomArgs(a.problem.signature, custom);
      if ('error' in parsed) return setMessage({ tone: 'error', text: parsed.error });
      customArgs = parsed.args;
    }
    try {
      setRun(
        await runner.mutateAsync({
          path: `${props.base}/code-runs`,
          body: {
            languageKey: props.language,
            sourceCode: code,
            ...(customArgs ? { customArgs } : {}),
          },
          timeoutMs: 95_000,
        }),
      );
    } catch (error) {
      setMessage({ tone: 'error', text: codeError(error, 'Chưa chạy được code.') });
    }
  }

  async function doSubmit() {
    setConfirm(false);
    setMessage(null);
    try {
      await submit.mutateAsync({
        path: `${props.base}/code-submissions`,
        body: { languageKey: props.language, sourceCode: code },
        idempotent: true,
      });
      setMessage({ tone: 'info', text: 'Đã nộp bài.' });
      props.onChanged();
    } catch (error) {
      setMessage({ tone: 'error', text: codeError(error, 'Chưa nộp được bài.') });
    }
  }

  return (
    <CodeSection
      title="Bài làm"
      actions={
        <label className="flex items-center gap-2 text-sm font-semibold">
          Ngôn ngữ
          <NativeSelect
            value={props.language}
            onChange={(e) => props.onLanguage(e.target.value as CodeLanguageKey)}
          >
            {a.languages.map((l) => (
              <NativeSelectOption key={l.key} value={l.key}>
                {l.displayName} ({l.runtimeVersion})
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      }
    >
      {draft.isPending ? (
        <p role="status">Đang tải bản nháp…</p>
      ) : (
        <CodeEditor
          label={`Code ${props.language}`}
          value={code}
          onChange={setSource}
          indent={props.language === 'java21' ? '    ' : '  '}
          rows={20}
        />
      )}
      <p className="text-xs text-muted-foreground" role="status">
        {saveState}
      </p>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={custom !== null}
            onChange={(e) =>
              setCustom(e.target.checked ? a.problem.signature.params.map(() => '') : null)
            }
          />
          Chạy với input tự nhập
        </label>
        {custom && (
          <div className="grid gap-2 sm:grid-cols-2">
            {a.problem.signature.params.map((p, i) => (
              <label key={p.name} className="space-y-1 text-sm">
                <span className="font-mono text-xs">
                  {p.name}: {p.type}
                </span>
                <Input
                  value={custom[i] ?? ''}
                  onChange={(e) => setCustom(custom.map((v, j) => (j === i ? e.target.value : v)))}
                  className="font-mono"
                />
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={doRun} disabled={runner.isPending || !code.trim()}>
          <Play aria-hidden="true" /> {runner.isPending ? 'Đang chạy…' : 'Chạy thử'}
        </Button>
        <Button
          onClick={() => setConfirm(true)}
          disabled={!a.canSubmit || submit.isPending || !code.trim()}
        >
          <Send aria-hidden="true" /> Nộp bài
        </Button>
        {!a.canSubmit && (
          <span className="self-center text-sm text-muted-foreground">
            {a.deadlinePassed
              ? 'Đã quá hạn nộp.'
              : a.inFlightSubmissionId
                ? 'Bài trước đang được chấm.'
                : a.attemptsRemaining === 0
                  ? 'Đã hết lượt nộp.'
                  : 'Bài tập đã đóng.'}
          </span>
        )}
      </div>
      {message && <CodeMessage tone={message.tone}>{message.text}</CodeMessage>}
      {run && <RunPanel result={run} />}
      {confirm && (
        <Modal title="Nộp bài?" onClose={() => setConfirm(false)}>
          <div className="space-y-4">
            <p>
              Bài nộp dùng 1 lượt ({a.attemptsRemaining} lượt còn lại). Điểm của bài là lần nộp cao
              nhất.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirm(false)}>
                Huỷ
              </Button>
              <Button onClick={doSubmit}>Nộp bài</Button>
            </div>
          </div>
        </Modal>
      )}
    </CodeSection>
  );
}

function RunPanel(props: { result: RunResult }) {
  const r = props.result;
  if (r.compileStatus !== 'OK')
    return (
      <CodeBlock
        label={r.compileStatus === 'TIMEOUT' ? 'Biên dịch quá lâu' : 'Lỗi biên dịch'}
        value={r.compileOutput}
      />
    );
  return (
    <div className="space-y-3">
      {r.tests.map((t, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-line p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">
              {t.kind === 'SAMPLE' ? `Ví dụ ${t.position}` : 'Input tự nhập'} · {t.timeMs} ms
            </span>
            <CodeBadge value={t.status} />
          </div>
          <p className="font-mono text-xs">Input: {t.display}</p>
          {t.kind === 'SAMPLE' && (
            <p className="font-mono text-xs">Mong đợi: {formatValue(t.expected)}</p>
          )}
          <p className="font-mono text-xs">Kết quả: {formatValue(t.actual)}</p>
          {t.console && <CodeBlock label="Console" value={t.console} />}
          {t.stderr && <CodeBlock label="Lỗi" value={t.stderr} />}
        </div>
      ))}
    </div>
  );
}

function History(props: { base: string; inFlight: string | null }) {
  const [selected, setSelected] = useState<string | null>(null);
  const list = useCodeQuery('STUDENT', `${props.base}/code-submissions`, submissionListSchema, {
    refetchInterval: (query) =>
      props.inFlight || query.state.data?.items.some((s) => isPending(s.status)) ? 1500 : false,
  });
  const id = selected ?? props.inFlight ?? list.data?.items[0]?.id ?? null;
  return (
    <CodeSection title="Lịch sử nộp bài">
      {list.error && <CodeMessage tone="error">{codeError(list.error)}</CodeMessage>}
      {list.data && !list.data.items.length && (
        <p className="text-sm text-muted-foreground">Chưa nộp lần nào.</p>
      )}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <ul className="space-y-2">
          {list.data?.items.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSelected(s.id)}
                aria-current={s.id === id}
                className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3 text-left text-sm hover:bg-soft aria-[current=true]:bg-soft"
              >
                <span>
                  Lần {s.attemptNumber} · {new Date(s.submittedAt).toLocaleString('vi-VN')}
                </span>
                <span className="flex items-center gap-2">
                  {s.score && <span className="font-bold">{s.score}</span>}
                  <CodeBadge value={s.status === 'GRADED' ? s.verdict : s.status} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        {id && <SubmissionDetail id={id} />}
      </div>
    </CodeSection>
  );
}

function SubmissionDetail(props: { id: string }) {
  const [pending, setPending] = useState(true);
  const detail = useCodeQuery('STUDENT', `me/code-submissions/${props.id}`, submissionSchema, {
    refetchInterval: pending ? 1500 : false,
  });
  const s: Submission | undefined = detail.data;
  if (s && pending !== isPending(s.status)) setPending(isPending(s.status));
  if (!s) return <p role="status">Đang tải bài nộp…</p>;
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <CodeBadge value={s.status} kind="status" />
        {s.verdict && <CodeBadge value={s.verdict} />}
        {s.score && (
          <span className="font-bold">
            {s.score}/{s.maxScore} điểm
          </span>
        )}
        {s.passedCount !== null && s.totalCount !== null && (
          <span>
            Đạt {s.passedCount}/{s.totalCount} test
          </span>
        )}
        {!s.countsAsAttempt && <span className="text-muted-foreground">Không tính lượt</span>}
      </div>
      {isPending(s.status) && <p role="status">Đang chấm, kết quả sẽ tự cập nhật…</p>}
      {s.status === 'FAILED' && (
        <CodeMessage tone="error">Lỗi hệ thống khi chấm. Mentor sẽ chấm lại.</CodeMessage>
      )}
      {s.voidedReason && <CodeMessage tone="error">Bài bị huỷ: {s.voidedReason}</CodeMessage>}
      {s.compileOutput && s.verdict === 'COMPILE_ERROR' && (
        <CodeBlock label="Lỗi biên dịch" value={s.compileOutput} />
      )}
      {s.tests?.map((t) => (
        <div
          key={t.position}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-soft px-3 py-2"
        >
          <span>
            {t.visibility === 'SAMPLE' ? `Ví dụ ${t.position}` : `Test ẩn ${t.position}`} ·{' '}
            {t.timeMs} ms
            {t.visibility === 'SAMPLE' && ` · kết quả ${formatValue(t.actual)}`}
          </span>
          <CodeBadge value={t.status} />
        </div>
      ))}
      {s.sourceCode && <CodeBlock label="Code đã nộp" value={s.sourceCode} />}
    </div>
  );
}
