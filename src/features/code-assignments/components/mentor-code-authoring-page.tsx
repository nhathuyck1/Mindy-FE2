'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Check,
  ClipboardList,
  Lock,
  Presentation,
  Save,
  Send,
  Settings2,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useShellFocus } from '@/components/layout/shell-focus';
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
} from '../lib/code-authoring';
import { blockerLabels } from '../lib/code-format';
import {
  assignmentSchema,
  mentorAuthoringSchema,
  type MentorAuthoring,
} from '../schemas/code-contracts';
import { Field, fieldClass, ProblemStep, StudentPreview } from './code-authoring-steps';
import {
  ActionButton,
  ActionGroup,
  BackLink,
  IdeBody,
  IdeHeader,
  IdePage,
  IdeTitle,
  StatusPill,
  Stepper,
} from './code-chrome';
import { Panel, PanelTabs } from './code-panel';
import { CodeQuickStart } from './code-quick-start';
import { CodeTestsStep } from './code-tests-step';
import { type CodeThemeId, useCodeTheme } from './code-theme';
import { CodeMessage } from './code-ui';
import { ResizableSplit } from './resizable-split';

/** The studio has three screens; the old "function" step now lives inside "problem". */
type StudioStep = 'problem' | 'tests' | 'publish';
const studioStep = (step: WizardStep): StudioStep => (step === 'function' ? 'problem' : step);
const studioStepFor = (blocker: string): StudioStep =>
  studioStep(blockerStep[blocker] ?? 'problem');

const statusPill = {
  DRAFT: { label: 'Bản nháp', tone: 'muted' },
  PUBLISHED: { label: 'Đã giao', tone: 'mint' },
  ARCHIVED: { label: 'Đã đóng', tone: 'headsup' },
} as const;

/**
 * Mentor authoring studio (Phase 7): Đề bài → Lời giải & test → Giao đề, in the same full-height
 * workspace as the student compiler. The reference solution produces every expected output.
 */
export function MentorCodeAuthoringPage(props: { assignmentId: string }) {
  useShellFocus();
  const [theme, setTheme] = useCodeTheme();
  const path = `mentor/assignments/${props.assignmentId}/code`;
  const authoring = useCodeQuery('MENTOR', path, mentorAuthoringSchema);
  if (authoring.isPending) return <StudioSkeleton />;
  if (authoring.error || !authoring.data)
    return (
      <div className="code-ide space-y-4 p-6">
        <CodeMessage tone="error">{codeError(authoring.error, 'Không mở được đề.')}</CodeMessage>
      </div>
    );
  return <Studio data={authoring.data} theme={theme} onTheme={setTheme} />;
}

function Studio(props: {
  data: MentorAuthoring;
  theme: CodeThemeId;
  onTheme: (theme: CodeThemeId) => void;
}) {
  const data = props.data;
  const actions = useAuthoringActions(data.assignment.id);
  const [step, setStep] = useState<StudioStep>(() => studioStep(firstOpenStep(data)));
  const [form, setForm] = useState<ProblemForm>(() => formFrom(data));
  // Bumped when content is replaced (template/import) so step components re-read the server state.
  const [generation, setGeneration] = useState(0);
  const [saving, setSaving] = useState(false);
  const frozen = data.assignment.status !== 'DRAFT';
  const done = stepDone(data);
  const dirty = JSON.stringify(form) !== JSON.stringify(formFrom(data));
  const status = statusPill[data.assignment.status];

  function replaced(next: MentorAuthoring) {
    setForm(formFrom(next));
    setGeneration((g) => g + 1);
    toast.success('Đã điền đề', { description: 'Xem lại từng bước rồi giao đề.' });
    setStep('problem');
  }

  /** Statement + signature are stored together; languages are replaced only when changed. */
  async function saveProblem(): Promise<boolean> {
    if (!form.statementMd.trim()) {
      toast.error('Nhập mô tả đề trước khi lưu.');
      return false;
    }
    const problems = formProblems(form);
    if (problems.length) {
      toast.error(problems[0] ?? 'Kiểm tra lại tab Hàm cần viết.');
      return false;
    }
    setSaving(true);
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
      toast.success('Đã lưu đề');
      return true;
    } catch (error) {
      toast.error(codeError(error, 'Chưa lưu được.'));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function goTo(next: StudioStep) {
    if (next === step) return;
    if (step === 'problem' && dirty && !(await saveProblem())) return;
    setStep(next);
  }

  const header = (end: React.ReactNode) => (
    <IdeHeader
      start={
        <>
          <BackLink href={`/mentor/sessions/${data.assignment.sessionId}`} label="Về buổi học" />
          <IdeTitle>{data.assignment.title}</IdeTitle>
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </>
      }
      center={
        frozen ? null : (
          <Stepper
            label="Các bước soạn đề"
            value={step}
            onChange={(s) => void goTo(s)}
            steps={[
              { id: 'problem', label: 'Đề bài', done: done.problem && done.function },
              { id: 'tests', label: 'Lời giải & test', done: done.tests },
              { id: 'publish', label: 'Giao đề', done: done.publish },
            ]}
          />
        )
      }
      end={end}
    />
  );

  if (frozen)
    return (
      <IdePage theme={props.theme}>
        {header(
          <ActionGroup>
            <Link
              href={`/mentor/assignments/${data.assignment.id}/demo`}
              title="Mở giao diện code như học viên để làm mẫu trên lớp"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold text-black transition-colors hover:bg-soft"
            >
              <Presentation aria-hidden="true" className="size-3.5 text-coral" /> Mentor làm mẫu
            </Link>
            <Link
              href={`/mentor/assignments/${data.assignment.id}/review`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-forest px-3.5 text-[13px] font-bold text-canvas transition-colors hover:bg-mint"
            >
              <Users aria-hidden="true" className="size-3.5" /> Xem bài nộp của lớp
            </Link>
          </ActionGroup>,
        )}
        <IdeBody>
          <ResizableSplit
            direction="horizontal"
            storageKey="mindy.studio.publish.x"
            defaultRatio={0.62}
            minFirst={420}
            minSecond={320}
            label="Kéo để đổi độ rộng xem trước và thiết lập"
            className="flex-1"
            first={<StudentPreview data={data} theme={props.theme} onTheme={props.onTheme} />}
            second={<AfterPublishPanel data={data} />}
          />
        </IdeBody>
      </IdePage>
    );

  const problemActions = (
    <>
      {dirty ? (
        <StatusPill tone="coral" pulse>
          Chưa lưu
        </StatusPill>
      ) : done.problem && done.function ? (
        <StatusPill tone="mint">Đã lưu</StatusPill>
      ) : null}
      <ActionGroup>
        <ActionButton
          icon={Save}
          onClick={() => void saveProblem()}
          busy={saving}
          disabled={saving || actions.pending || !dirty}
          title="Lưu đề (Ctrl/⌘ + S)"
        >
          Lưu
        </ActionButton>
        <ActionButton
          primary
          icon={ArrowRight}
          onClick={() => void goTo('tests')}
          disabled={saving || actions.pending}
        >
          Lời giải & test
        </ActionButton>
      </ActionGroup>
    </>
  );

  return (
    <IdePage
      theme={props.theme}
      onKeyDownCapture={(event) => {
        if (step === 'problem' && event.key === 's' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          if (dirty && !saving) void saveProblem();
        }
      }}
    >
      <div className={step === 'problem' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
        <ProblemStep
          form={form}
          setForm={setForm}
          data={data}
          disabled={saving || actions.pending}
          theme={props.theme}
          onTheme={props.onTheme}
          renderHeader={header}
          headerActions={problemActions}
          quickStart={<CodeQuickStart data={data} actions={actions} onApplied={replaced} />}
        />
      </div>
      <div className={step === 'tests' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
        <CodeTestsStep
          key={`${generation}-${data.languages.map((l) => l.languageKey).join()}-${JSON.stringify(data.problem?.signature)}`}
          data={data}
          actions={actions}
          disabled={actions.pending}
          theme={props.theme}
          onTheme={props.onTheme}
          renderHeader={header}
          onValidated={() => {}}
        />
      </div>
      <div className={step === 'publish' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
        <PublishStep
          data={data}
          header={header}
          onGo={(s) => void goTo(s)}
          theme={props.theme}
          onTheme={props.onTheme}
        />
      </div>
    </IdePage>
  );
}

function SettingsList(props: { data: MentorAuthoring }) {
  const a = props.data.assignment;
  const rows: [string, string][] = [
    ['Hạn nộp', a.dueAt ? new Date(a.dueAt).toLocaleString('vi-VN') : '—'],
    ['Số lượt nộp', String(a.maxAttempts)],
    ['Điểm tối đa', a.maxScore],
    [
      'Ngôn ngữ',
      props.data.languages
        .map((l) => (l.languageKey === 'java21' ? 'Java' : 'JavaScript'))
        .join(', ') || '—',
    ],
    [
      'Test',
      `${props.data.tests.filter((t) => t.visibility === 'SAMPLE').length} ví dụ · ${
        props.data.tests.filter((t) => t.visibility === 'HIDDEN').length
      } ẩn`,
    ],
  ];
  return (
    <dl className="divide-y divide-line rounded-xl ring-1 ring-line">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]"
        >
          <dt className="text-muted/75">{label}</dt>
          <dd className="text-right font-bold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Step "Giao đề": the student view on the left, settings + publish checklist on the right. */
function PublishStep(props: {
  data: MentorAuthoring;
  header: (end: React.ReactNode) => React.ReactNode;
  onGo: (step: StudioStep) => void;
  theme: CodeThemeId;
  onTheme: (theme: CodeThemeId) => void;
}) {
  const a = props.data.assignment;
  const command = useCodeCommand(assignmentSchema);
  const [confirm, setConfirm] = useState(false);
  const blockers = props.data.publishBlockers;

  async function publish() {
    setConfirm(false);
    try {
      await command.mutateAsync({
        path: `mentor/assignments/${a.id}/publish`,
        body: { expectedRevision: a.revision },
      });
      toast.success('Đã giao đề cho lớp', { description: 'Nội dung đề và test giờ đã được khoá.' });
    } catch (error) {
      toast.error(codeError(error, 'Chưa giao được đề.'));
    }
  }

  return (
    <>
      {props.header(
        <ActionGroup>
          <ActionButton
            primary
            icon={Send}
            onClick={() => setConfirm(true)}
            busy={command.isPending}
            disabled={command.isPending || blockers.length > 0}
            title={blockers.length ? 'Hoàn tất checklist trước khi giao' : 'Giao đề cho lớp'}
          >
            Giao đề
          </ActionButton>
        </ActionGroup>,
      )}
      <IdeBody>
        <ResizableSplit
          direction="horizontal"
          storageKey="mindy.studio.publish.x"
          defaultRatio={0.62}
          minFirst={420}
          minSecond={320}
          label="Kéo để đổi độ rộng xem trước và thiết lập"
          className="flex-1"
          first={<StudentPreview data={props.data} theme={props.theme} onTheme={props.onTheme} />}
          second={
            <Panel label="Giao đề">
              <PanelTabs
                label="Giao đề"
                idPrefix="studio-publish"
                value="checklist"
                onChange={() => {}}
                tabs={[
                  {
                    id: 'checklist',
                    label: 'Sẵn sàng giao',
                    icon: ClipboardList,
                    tone: 'text-mint',
                  },
                ]}
              />
              <div
                id="studio-publish-panel"
                role="tabpanel"
                aria-labelledby="studio-publish-tab-checklist"
                className="code-ide-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4"
              >
                {blockers.length === 0 ? (
                  <div className="animate-in fade-in-0 zoom-in-95 flex items-start gap-3 rounded-xl bg-mint/8 px-4 py-3 ring-1 ring-mint/25 duration-300">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mint text-canvas">
                      <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                    </span>
                    <div>
                      <p className="text-[14px] font-extrabold text-forest">Đề đã sẵn sàng</p>
                      <p className="text-[12.5px] text-muted/80">
                        Sau khi giao, nội dung đề và test sẽ bị khoá. Vẫn gia hạn hoặc tăng số lượt
                        được (có lý do).
                      </p>
                    </div>
                  </div>
                ) : (
                  <section className="space-y-2">
                    <h3 className="text-[12.5px] font-bold">
                      Còn {blockers.length} việc trước khi giao
                    </h3>
                    <ul className="space-y-1.5">
                      {blockers.map((b) => (
                        <li key={b}>
                          <button
                            type="button"
                            onClick={() => props.onGo(studioStepFor(b))}
                            className="group flex w-full items-center gap-2.5 rounded-lg bg-peach/60 px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-peach"
                          >
                            <span className="grid size-4.5 shrink-0 place-items-center rounded-full bg-canvas text-headsup ring-1 ring-headsup/30">
                              <X aria-hidden="true" className="size-2.5" strokeWidth={3} />
                            </span>
                            <span className="flex-1 font-bold">{blockerLabels[b] ?? b}</span>
                            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-forest">
                              Sửa
                              <ArrowRight
                                aria-hidden="true"
                                className="size-3 transition-transform group-hover:translate-x-0.5"
                              />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <section className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-[12.5px] font-bold">
                    <Settings2 aria-hidden="true" className="size-3.5 text-muted/60" /> Thiết lập
                  </h3>
                  <SettingsList data={props.data} />
                  <p className="text-[11.5px] text-muted/60">
                    Hạn nộp, số lượt và điểm đặt khi tạo bài ở trang buổi học.
                  </p>
                </section>
              </div>
            </Panel>
          }
        />
      </IdeBody>
      {confirm && (
        <Modal
          title="Giao đề cho lớp?"
          onClose={() => setConfirm(false)}
          contentClassName="assignment-workspace font-sans max-w-md sm:max-w-md"
        >
          <div className="space-y-5 p-5">
            <p className="text-[15px] leading-6">
              Học viên sẽ thấy đề ngay. Sau khi giao, nội dung đề, hàm và test sẽ bị khoá.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirm(false)}>
                Huỷ
              </Button>
              <Button onClick={() => void publish()}>
                <Send aria-hidden="true" /> Giao đề
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/** Published / archived: content is locked; deadline, attempts and closing stay editable. */
function AfterPublishPanel(props: { data: MentorAuthoring }) {
  const a = props.data.assignment;
  const command = useCodeCommand(assignmentSchema);
  const [extension, setExtension] = useState({
    dueAt: '',
    maxAttempts: String(a.maxAttempts),
    reason: '',
  });
  const [archiveReason, setArchiveReason] = useState('');
  async function post(action: string, body: Record<string, unknown>, ok: string) {
    try {
      await command.mutateAsync({
        path: `mentor/assignments/${a.id}/${action}`,
        body: { expectedRevision: a.revision, ...body },
      });
      toast.success(ok);
    } catch (error) {
      toast.error(codeError(error, 'Chưa thực hiện được.'));
    }
  }
  return (
    <Panel label="Sau khi giao đề">
      <PanelTabs
        label="Sau khi giao"
        idPrefix="studio-after"
        value="settings"
        onChange={() => {}}
        tabs={[{ id: 'settings', label: 'Sau khi giao', icon: Settings2, tone: 'text-mint' }]}
      />
      <div
        id="studio-after-panel"
        role="tabpanel"
        aria-labelledby="studio-after-tab-settings"
        className="code-ide-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4"
      >
        <p className="flex gap-2.5 rounded-lg bg-soft/80 px-3 py-2.5 text-[12.5px] leading-5 text-muted">
          <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-mint" />
          Đề đã {a.status === 'ARCHIVED' ? 'đóng' : 'giao'} nên nội dung bị khoá. Chỉ có thể gia
          hạn, tăng số lượt hoặc đóng bài.
        </p>
        <SettingsList data={props.data} />
        {a.status === 'PUBLISHED' && (
          <>
            <section className="space-y-3">
              <h3 className="text-[13.5px] font-extrabold">Gia hạn / thêm lượt</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Hạn mới" hint="giờ trên máy bạn">
                  <input
                    type="datetime-local"
                    value={extension.dueAt}
                    onChange={(e) => setExtension({ ...extension, dueAt: e.target.value })}
                    className={cn(fieldClass, 'h-9')}
                  />
                </Field>
                <Field label="Số lượt" hint={`${a.maxAttempts}–50`}>
                  <input
                    type="number"
                    min={a.maxAttempts}
                    max={50}
                    value={extension.maxAttempts}
                    onChange={(e) => setExtension({ ...extension, maxAttempts: e.target.value })}
                    className={cn(fieldClass, 'h-9 tabular-nums')}
                  />
                </Field>
              </div>
              <Field label="Lý do" hint="hiện trong lịch sử">
                <input
                  value={extension.reason}
                  placeholder="Ví dụ: lớp nghỉ lễ, cần thêm 2 ngày"
                  onChange={(e) => setExtension({ ...extension, reason: e.target.value })}
                  className={cn(fieldClass, 'h-9')}
                />
              </Field>
              <Button
                variant="outline"
                disabled={command.isPending || !extension.reason.trim()}
                onClick={() =>
                  void post(
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
            </section>
            <section className="space-y-3 border-t border-line pt-5">
              <h3 className="text-[13.5px] font-extrabold text-headsup">Đóng bài tập</h3>
              <Field label="Lý do đóng">
                <input
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className={cn(fieldClass, 'h-9')}
                />
              </Field>
              <Button
                variant="destructive"
                disabled={command.isPending || !archiveReason.trim()}
                onClick={() => void post('archive', { reason: archiveReason }, 'Đã đóng bài tập.')}
              >
                Đóng bài tập
              </Button>
            </section>
          </>
        )}
      </div>
    </Panel>
  );
}

function StudioSkeleton() {
  return (
    <div role="status" className="code-ide flex min-h-dvh flex-col gap-2 bg-soft/70 p-2.5 lg:h-dvh">
      <span className="sr-only">Đang tải đề…</span>
      <div className="flex h-11 items-center gap-3">
        <div className="size-9 animate-pulse rounded-lg bg-canvas" />
        <div className="h-4 w-48 animate-pulse rounded bg-canvas" />
        <div className="mx-auto h-9 w-80 animate-pulse rounded-xl bg-canvas" />
        <div className="hidden h-9 w-56 animate-pulse rounded-xl bg-canvas lg:block" />
      </div>
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-2">
        <div className="min-h-64 animate-pulse rounded-xl bg-canvas" />
        <div className="hidden animate-pulse rounded-xl bg-canvas lg:block" />
      </div>
    </div>
  );
}
