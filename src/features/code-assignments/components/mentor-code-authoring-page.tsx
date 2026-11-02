'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthoringActions } from '../api/code-authoring-actions';
import { codeError, useCodeCommand, useCodeQuery } from '../api/code-queries';
import {
  blockerStep,
  firstOpenStep,
  formFrom,
  formProblems,
  type ProblemForm,
  problemBody,
  stepDone,
  type WizardStep,
  wizardSteps,
} from '../lib/code-authoring';
import { blockerLabels } from '../lib/code-format';
import {
  assignmentSchema,
  mentorAuthoringSchema,
  type MentorAuthoring,
} from '../schemas/code-contracts';
import { FunctionStep, ProblemStep, StudentPreview } from './code-authoring-steps';
import { CodeQuickStart } from './code-quick-start';
import { CodeTestsStep } from './code-tests-step';
import { CodeBadge, CodeMessage, CodeSection } from './code-ui';

type Notice = { tone: 'error' | 'info'; text: string } | null;

/**
 * Mentor authoring wizard (Phase 7): Đề bài → Hàm cần viết → Lời giải & test → Giao đề.
 * The reference solution produces every expected output; nothing is hand-computed.
 */
export function MentorCodeAuthoringPage(props: { assignmentId: string }) {
  const path = `mentor/assignments/${props.assignmentId}/code`;
  const authoring = useCodeQuery('MENTOR', path, mentorAuthoringSchema);
  if (authoring.isPending) return <p role="status">Đang tải đề…</p>;
  if (authoring.error || !authoring.data)
    return (
      <CodeMessage tone="error">{codeError(authoring.error, 'Không mở được đề.')}</CodeMessage>
    );
  return <Wizard data={authoring.data} />;
}

function Wizard(props: { data: MentorAuthoring }) {
  const data = props.data;
  const actions = useAuthoringActions(data.assignment.id);
  const [step, setStep] = useState<WizardStep>(() => firstOpenStep(data));
  const [form, setForm] = useState<ProblemForm>(() => formFrom(data));
  // Bumped when content is replaced (template/import) so step components re-read the server state.
  const [generation, setGeneration] = useState(0);
  const [notice, setNotice] = useState<Notice>(null);
  const frozen = data.assignment.status !== 'DRAFT';
  const done = stepDone(data);

  function replaced(next: MentorAuthoring) {
    setForm(formFrom(next));
    setGeneration((g) => g + 1);
    setNotice({ tone: 'info', text: 'Đã điền đề. Xem lại từng bước rồi giao đề.' });
    setStep('problem');
  }

  /** Steps 1–2 are stored together; languages are replaced only when the selection changed. */
  async function saveProblem(): Promise<boolean> {
    setNotice(null);
    const problems = formProblems(form);
    if (problems.length) {
      setNotice({ tone: 'error', text: problems[0] ?? '' });
      return false;
    }
    try {
      let r = await actions.put('code-problem', data.assignment.revision, problemBody(form));
      const current = r.languages.map((l) => l.languageKey);
      const same =
        current.length === form.languages.length &&
        form.languages.every((k) => current.includes(k));
      if (!same)
        r = await actions.put('code-languages', r.assignment.revision, {
          languages: form.languages.map((key) => {
            const kept = r.languages.find((l) => l.languageKey === key);
            return kept
              ? { languageKey: key, starterCode: kept.starterCode }
              : { languageKey: key };
          }),
        });
      setForm(formFrom(r));
      return true;
    } catch (error) {
      setNotice({ tone: 'error', text: codeError(error, 'Chưa lưu được.') });
      return false;
    }
  }

  async function next() {
    if (step === 'problem') {
      if (!form.statementMd.trim()) {
        setNotice({ tone: 'error', text: 'Nhập mô tả đề trước khi tiếp tục.' });
        return;
      }
      // A brand-new problem is first saved in step 2 (the signature is part of the same record).
      if (data.problem && !(await saveProblem())) return;
      setNotice(null);
      setStep('function');
    } else if (step === 'function') {
      if (await saveProblem()) setStep('tests');
    } else if (step === 'tests') {
      setStep('publish');
    }
  }

  const index = wizardSteps.findIndex((s) => s.key === step);
  return (
    <div className="space-y-6">
      <Link
        href={`/mentor/sessions/${data.assignment.sessionId}`}
        className="text-link inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Buổi học
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Bài tập lập trình</p>
          <h1 className="section-title">{data.assignment.title}</h1>
        </div>
        <CodeBadge value={data.assignment.status} kind="status" />
      </header>

      {frozen ? (
        <>
          <CodeMessage>
            Đề đã giao nên nội dung bị khoá. Chỉ có thể gia hạn, tăng số lượt hoặc đóng bài.
          </CodeMessage>
          <PublishPanel data={data} />
          <CodeSection title="Đề học viên đang thấy">
            <StudentPreview data={data} />
          </CodeSection>
        </>
      ) : (
        <>
          <nav aria-label="Các bước soạn đề">
            <ol className="grid gap-2 sm:grid-cols-4">
              {wizardSteps.map((s, i) => (
                <li key={s.key}>
                  <button
                    type="button"
                    aria-current={s.key === step ? 'step' : undefined}
                    onClick={() => setStep(s.key)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition',
                      s.key === step ? 'border-forest bg-soft' : 'border-line hover:bg-soft/60',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold',
                        done[s.key] ? 'bg-mint text-canvas' : 'bg-line text-forest',
                      )}
                    >
                      {done[s.key] ? <Check className="size-4" aria-label="Đã xong" /> : i + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{s.title}</span>
                      <span className="block text-xs text-muted-foreground">{s.hint}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          {step === 'problem' && !data.problem && (
            <CodeQuickStart data={data} actions={actions} onApplied={replaced} />
          )}
          {step === 'problem' && (
            <ProblemStep form={form} setForm={setForm} disabled={actions.pending} />
          )}
          {step === 'function' && (
            <FunctionStep form={form} setForm={setForm} data={data} disabled={actions.pending} />
          )}
          {step === 'tests' && (
            <CodeTestsStep
              key={`${generation}-${data.languages.map((l) => l.languageKey).join()}-${JSON.stringify(data.problem?.signature)}`}
              data={data}
              actions={actions}
              disabled={actions.pending}
              onValidated={() => setNotice({ tone: 'info', text: 'Sẵn sàng giao đề.' })}
            />
          )}
          {step === 'publish' && <PublishStep data={data} onGo={setStep} />}

          {notice && <CodeMessage tone={notice.tone}>{notice.text}</CodeMessage>}
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={index === 0 || actions.pending}
              onClick={() => setStep(wizardSteps[index - 1]?.key ?? 'problem')}
            >
              Quay lại
            </Button>
            {step !== 'publish' && (
              <Button type="button" disabled={actions.pending} onClick={next}>
                {step === 'function' ? 'Lưu & tiếp tục' : 'Tiếp tục'}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Step 4 — student preview, settings and the publish checklist. */
function PublishStep(props: { data: MentorAuthoring; onGo: (step: WizardStep) => void }) {
  const a = props.data.assignment;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <CodeSection title="Xem trước: học viên sẽ thấy">
        <StudentPreview data={props.data} />
      </CodeSection>
      <div className="space-y-6">
        <CodeSection title="Thiết lập">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Hạn nộp</dt>
            <dd>{a.dueAt ? new Date(a.dueAt).toLocaleString('vi-VN') : '—'}</dd>
            <dt className="text-muted-foreground">Số lượt nộp</dt>
            <dd>{a.maxAttempts}</dd>
            <dt className="text-muted-foreground">Điểm tối đa</dt>
            <dd>{a.maxScore}</dd>
            <dt className="text-muted-foreground">Ngôn ngữ</dt>
            <dd>
              {props.data.languages
                .map((l) => (l.languageKey === 'java21' ? 'Java' : 'JavaScript'))
                .join(', ') || '—'}
            </dd>
          </dl>
          <p className="text-xs text-muted-foreground">
            Sau khi giao vẫn gia hạn hoặc tăng số lượt được (có lý do).
          </p>
        </CodeSection>
        <PublishPanel data={props.data} onGo={props.onGo} />
      </div>
    </div>
  );
}

function PublishPanel(props: { data: MentorAuthoring; onGo?: (step: WizardStep) => void }) {
  const a = props.data.assignment;
  const command = useCodeCommand(assignmentSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const [extension, setExtension] = useState({
    dueAt: '',
    maxAttempts: String(a.maxAttempts),
    reason: '',
  });
  const [archiveReason, setArchiveReason] = useState('');
  async function post(action: string, body: Record<string, unknown>, ok: string) {
    setNotice(null);
    try {
      await command.mutateAsync({
        path: `mentor/assignments/${a.id}/${action}`,
        body: { expectedRevision: a.revision, ...body },
      });
      setNotice({ tone: 'info', text: ok });
    } catch (error) {
      setNotice({ tone: 'error', text: codeError(error, 'Chưa thực hiện được.') });
    }
  }
  return (
    <CodeSection title={a.status === 'DRAFT' ? 'Giao đề' : 'Sau khi giao đề'}>
      {a.status === 'DRAFT' ? (
        <div className="space-y-3">
          {props.data.publishBlockers.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {props.data.publishBlockers.map((b) => (
                <li key={b} className="flex items-center justify-between gap-2">
                  <span>{blockerLabels[b] ?? b}</span>
                  {props.onGo && blockerStep[b] && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => props.onGo?.(blockerStep[b] ?? 'problem')}
                    >
                      Sửa
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <CodeMessage>Đề đã sẵn sàng. Sau khi giao, nội dung đề và test sẽ bị khoá.</CodeMessage>
          )}
          <Button
            disabled={command.isPending || props.data.publishBlockers.length > 0}
            onClick={() => post('publish', {}, 'Đã giao đề cho lớp.')}
          >
            Giao đề
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <Button asChild>
            <Link href={`/mentor/assignments/${a.id}/review`}>Xem bài nộp của lớp</Link>
          </Button>
          {a.status === 'PUBLISHED' && (
            <>
              <div className="space-y-2">
                <p className="font-semibold">Gia hạn / thêm lượt</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input
                    type="datetime-local"
                    aria-label="Hạn mới"
                    value={extension.dueAt}
                    onChange={(e) => setExtension({ ...extension, dueAt: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={a.maxAttempts}
                    max={50}
                    aria-label="Số lượt"
                    value={extension.maxAttempts}
                    onChange={(e) => setExtension({ ...extension, maxAttempts: e.target.value })}
                  />
                  <Input
                    placeholder="Lý do"
                    value={extension.reason}
                    onChange={(e) => setExtension({ ...extension, reason: e.target.value })}
                  />
                </div>
                <Button
                  variant="outline"
                  disabled={command.isPending || !extension.reason.trim()}
                  onClick={() =>
                    post(
                      'code-extension',
                      {
                        ...(extension.dueAt
                          ? { dueAt: new Date(extension.dueAt).toISOString() }
                          : {}),
                        ...(Number(extension.maxAttempts) !== a.maxAttempts
                          ? { maxAttempts: Number(extension.maxAttempts) }
                          : {}),
                        reason: extension.reason,
                      },
                      'Đã cập nhật hạn nộp / số lượt.',
                    )
                  }
                >
                  Lưu thay đổi
                </Button>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Đóng bài tập</p>
                <Input
                  placeholder="Lý do đóng"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                />
                <Button
                  variant="destructive"
                  disabled={command.isPending || !archiveReason.trim()}
                  onClick={() => post('archive', { reason: archiveReason }, 'Đã đóng bài tập.')}
                >
                  Đóng bài tập
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      {notice && <CodeMessage tone={notice.tone}>{notice.text}</CodeMessage>}
    </CodeSection>
  );
}
