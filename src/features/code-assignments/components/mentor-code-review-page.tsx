'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  History,
  ListChecks,
  RotateCcw,
  Search,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useShellFocus } from '@/components/layout/shell-focus';
import { cn } from '@/lib/utils';
import { codeError, useCodeCommand, useCodeQuery } from '../api/code-queries';
import { formatValue, isPending, submissionStatusLabels, verdictLabels } from '../lib/code-format';
import {
  codeSummarySchema,
  mentorSubmissionDetailSchema,
  mentorSubmissionPageSchema,
  mentorSubmissionSchema,
  type MentorSubmission,
} from '../schemas/code-contracts';
import { fieldClass } from './code-authoring-steps';
import {
  BackLink,
  IdeBody,
  IdeHeader,
  IdePage,
  IdeTitle,
  MetaChip,
  PanelEmpty,
  StatusPill,
} from './code-chrome';
import { CodeEditor } from './code-editor';
import { Panel, PanelTabs, TabCount, ToolButton } from './code-panel';
import { type CodeThemeId, codeThemeScheme, CodeThemePicker, useCodeTheme } from './code-theme';
import { CodeMessage } from './code-ui';
import { ResizableSplit } from './resizable-split';

type Tone = 'good' | 'warn' | 'bad' | 'wait' | 'none';
function toneOf(status: string | null, verdict: string | null): Tone {
  if (!status) return 'none';
  if (isPending(status)) return 'wait';
  if (status !== 'GRADED') return 'bad';
  return verdict === 'ACCEPTED' ? 'good' : verdict === 'PARTIAL' ? 'warn' : 'bad';
}
const toneText: Record<Tone, string> = {
  good: 'text-mint',
  warn: 'text-coral',
  bad: 'text-headsup',
  wait: 'text-muted',
  none: 'text-muted/60',
};
const toneDot: Record<Tone, string> = {
  good: 'bg-mint',
  warn: 'bg-coral',
  bad: 'bg-headsup',
  wait: 'bg-muted/40 animate-pulse',
  none: 'bg-line',
};
function labelOf(status: string | null, verdict: string | null) {
  if (!status) return 'Chưa nộp';
  return status === 'GRADED' && verdict
    ? (verdictLabels[verdict] ?? verdict)
    : (submissionStatusLabels[status] ?? status);
}
const languageName = (k: string) => (k === 'java21' ? 'Java' : 'JavaScript');
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

/** Class submissions: students on the left, the selected submission (code + tests) on the right. */
export function MentorCodeReviewPage(props: { assignmentId: string }) {
  useShellFocus();
  const [theme, setTheme] = useCodeTheme();
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'students' | 'all'>('students');
  const [student, setStudent] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const base = `mentor/assignments/${props.assignmentId}`;
  const summary = useCodeQuery(
    'MENTOR',
    `${base}/code-summary?page=${page}&pageSize=20`,
    codeSummarySchema,
  );
  const byStudent = tab === 'students' && student;
  const submissions = useCodeQuery(
    'MENTOR',
    `${base}/code-submissions?page=1&pageSize=50${byStudent ? `&studentId=${student}` : ''}`,
    mentorSubmissionPageSchema,
    { refetchInterval: 5000 },
  );
  const s = summary.data;
  const needle = q.trim().toLowerCase();
  const rows = s?.items.filter((r) => r.displayName.toLowerCase().includes(needle)) ?? [];
  const selectedRow = s?.items.find((r) => r.studentId === student);
  const attempts = byStudent ? (submissions.data?.items ?? []) : [];
  const currentId =
    picked ?? (byStudent ? (selectedRow?.bestSubmissionId ?? attempts[0]?.id ?? null) : null);

  return (
    <IdePage theme={theme}>
      <IdeHeader
        start={
          <>
            <BackLink href={`/mentor/assignments/${props.assignmentId}`} label="Về đề bài" />
            <IdeTitle>Bài nộp của lớp</IdeTitle>
          </>
        }
        end={
          s && (
            <dl className="flex flex-wrap items-center gap-1.5">
              <MetaChip
                icon={Users}
                label="Đã nộp"
                value={`${s.totals.submitted}/${s.totals.students} đã nộp`}
              />
              <MetaChip
                icon={Check}
                label="Đúng hết"
                value={`${s.totals.accepted} đúng hết`}
                tone={s.totals.accepted ? 'good' : null}
              />
              <MetaChip
                icon={Trophy}
                label="Điểm trung bình"
                value={`TB ${s.totals.averageBestScore ?? '—'}/${s.maxScore}`}
              />
              {s.totals.failed > 0 && (
                <MetaChip
                  icon={AlertTriangle}
                  label="Lỗi hệ thống"
                  value={`${s.totals.failed} lỗi hệ thống`}
                  tone="bad"
                />
              )}
            </dl>
          )
        }
      />
      <IdeBody>
        <ResizableSplit
          direction="horizontal"
          storageKey="mindy.review.x"
          defaultRatio={0.34}
          minFirst={300}
          minSecond={460}
          label="Kéo để đổi độ rộng danh sách và bài nộp"
          className="flex-1"
          first={
            <Panel label="Học viên và lần nộp">
              <PanelTabs
                label="Danh sách"
                idPrefix="review-list"
                value={tab}
                onChange={(next) => {
                  setTab(next);
                  setPicked(null);
                }}
                tabs={[
                  {
                    id: 'students',
                    label: 'Học viên',
                    icon: Users,
                    tone: 'text-mint',
                    badge: <TabCount value={s?.total ?? 0} />,
                  },
                  { id: 'all', label: 'Tất cả lần nộp', icon: History, tone: 'text-coral' },
                ]}
              />
              <div
                id="review-list-panel"
                role="tabpanel"
                aria-labelledby={`review-list-tab-${tab}`}
                className="code-ide-scroll min-h-0 flex-1 overflow-y-auto"
              >
                {summary.error && (
                  <div className="p-4">
                    <CodeMessage tone="error">{codeError(summary.error)}</CodeMessage>
                  </div>
                )}
                {tab === 'students' ? (
                  <>
                    <div className="relative px-3 pt-3">
                      <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-2.75 left-6 size-3.5 text-muted/50"
                      />
                      <input
                        aria-label="Tìm học viên"
                        placeholder="Tìm học viên"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className={cn(fieldClass, 'h-9 pl-8')}
                      />
                    </div>
                    {!s ? (
                      <ListSkeleton />
                    ) : rows.length === 0 ? (
                      <PanelEmpty icon={Users} title="Không có học viên phù hợp" />
                    ) : (
                      <ul className="space-y-0.5 p-2">
                        {rows.map((r, i) => {
                          const tone = toneOf(r.latestStatus, r.latestVerdict);
                          const active = r.studentId === student;
                          return (
                            <li
                              key={r.studentId}
                              className="animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both duration-300"
                              style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                            >
                              <button
                                type="button"
                                aria-current={active}
                                onClick={() => {
                                  setStudent(r.studentId);
                                  setPicked(null);
                                }}
                                className={cn(
                                  'group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-mint',
                                  active ? 'bg-soft ring-1 ring-line' : 'hover:bg-soft/60',
                                )}
                              >
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    'grid size-8 shrink-0 place-items-center rounded-full text-[11.5px] font-extrabold transition-colors',
                                    active ? 'bg-forest text-canvas' : 'bg-mint/10 text-forest',
                                  )}
                                >
                                  {initials(r.displayName)}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[13.5px] font-bold">
                                    {r.displayName}
                                    {r.enrollmentStatus && r.enrollmentStatus !== 'ACTIVE' && (
                                      <span className="font-normal text-muted/60"> · đã nghỉ</span>
                                    )}
                                  </span>
                                  <span
                                    className={cn(
                                      'flex items-center gap-1.5 text-[12px] font-bold',
                                      toneText[tone],
                                    )}
                                  >
                                    <span
                                      aria-hidden="true"
                                      className={cn('size-1.5 rounded-full', toneDot[tone])}
                                    />
                                    {labelOf(r.latestStatus, r.latestVerdict)}
                                    <span className="font-normal text-muted/60">
                                      · {r.attemptsUsed}/{s.maxAttempts} lượt
                                    </span>
                                    {r.failedCount > 0 && (
                                      <span className="text-headsup">· {r.failedCount} lỗi</span>
                                    )}
                                  </span>
                                </span>
                                <span className="font-mono text-[13px] font-bold tabular-nums">
                                  {r.bestScore ?? <span className="text-muted/40">—</span>}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <SubmissionList
                    items={submissions.data?.items}
                    current={currentId}
                    onPick={(id) => setPicked(id)}
                  />
                )}
              </div>
              {tab === 'students' && s && s.total > s.pageSize && (
                <div className="flex shrink-0 items-center justify-between border-t border-line px-2 py-1.5 text-xs text-muted/70">
                  <ToolButton
                    label="Trang trước"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft aria-hidden="true" />
                  </ToolButton>
                  <span className="tabular-nums">
                    Trang {page}/{Math.ceil(s.total / s.pageSize)}
                  </span>
                  <ToolButton
                    label="Trang sau"
                    disabled={page * s.pageSize >= s.total}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight aria-hidden="true" />
                  </ToolButton>
                </div>
              )}
            </Panel>
          }
          second={
            currentId ? (
              <SubmissionViewer
                key={currentId}
                submissionId={currentId}
                attempts={attempts}
                onPickAttempt={setPicked}
                theme={theme}
                onTheme={setTheme}
              />
            ) : (
              <Panel>
                <PanelEmpty
                  icon={Code2}
                  title={tab === 'students' ? 'Chọn một học viên' : 'Chọn một lần nộp'}
                >
                  {tab === 'students' && selectedRow && selectedRow.submissionCount === 0
                    ? 'Học viên này chưa nộp bài.'
                    : 'Code, kết quả từng test và thao tác chấm lại sẽ hiện ở đây.'}
                </PanelEmpty>
              </Panel>
            )
          }
        />
      </IdeBody>
    </IdePage>
  );
}

function ListSkeleton() {
  return (
    <div role="status" className="space-y-1.5 p-3">
      <span className="sr-only">Đang tải…</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-soft" />
      ))}
    </div>
  );
}

function SubmissionList(props: {
  items: MentorSubmission[] | undefined;
  current: string | null;
  onPick: (id: string) => void;
}) {
  if (!props.items) return <ListSkeleton />;
  if (!props.items.length) return <PanelEmpty icon={History} title="Chưa có lần nộp nào" />;
  return (
    <ul className="space-y-0.5 p-2">
      {props.items.map((x) => {
        const tone = toneOf(x.status, x.verdict);
        return (
          <li key={x.id}>
            <button
              type="button"
              aria-current={x.id === props.current}
              onClick={() => props.onPick(x.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                x.id === props.current ? 'bg-soft ring-1 ring-line' : 'hover:bg-soft/60',
              )}
            >
              <span
                aria-hidden="true"
                className={cn('size-2 shrink-0 rounded-full', toneDot[tone])}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold">{x.displayName}</span>
                <span className="block truncate text-[12px] text-muted/70">
                  Lần {x.attemptNumber} · {new Date(x.submittedAt).toLocaleString('vi-VN')}
                </span>
              </span>
              {x.duplicateOfOtherStudent && (
                <Copy aria-label="Trùng code học viên khác" className="size-3.5 text-headsup" />
              )}
              <span className={cn('text-[12px] font-bold', toneText[tone])}>
                {labelOf(x.status, x.verdict)}
              </span>
              {x.score && (
                <span className="font-mono text-[13px] font-bold tabular-nums">{x.score}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * One submission: code in the dark editor, verdict and per-test results below, rejudge / void in
 * the toolbar. Used inside the review page and on its own route.
 */
export function SubmissionViewer(props: {
  submissionId: string;
  attempts?: MentorSubmission[];
  onPickAttempt?: (id: string) => void;
  theme: CodeThemeId;
  onTheme: (theme: CodeThemeId) => void;
}) {
  const [pending, setPending] = useState(false);
  const detail = useCodeQuery(
    'MENTOR',
    `mentor/code-submissions/${props.submissionId}`,
    mentorSubmissionDetailSchema,
    { refetchInterval: pending ? 2000 : false },
  );
  const command = useCodeCommand(mentorSubmissionSchema);
  const [voiding, setVoiding] = useState(false);
  const [reason, setReason] = useState('');
  const [openTest, setOpenTest] = useState<number | null>(null);
  const s = detail.data;
  if (s && pending !== isPending(s.status)) setPending(isPending(s.status));

  async function act(action: 'rejudge' | 'void') {
    try {
      await command.mutateAsync({
        path: `mentor/code-submissions/${props.submissionId}/${action}`,
        ...(action === 'void' ? { body: { reason } } : {}),
      });
      setVoiding(false);
      toast.success(action === 'void' ? 'Đã huỷ bài nộp' : 'Đã đưa bài vào hàng chấm lại');
    } catch (error) {
      toast.error(codeError(error));
    }
  }

  if (!s)
    return (
      <Panel>
        {detail.error ? (
          <div className="p-5">
            <CodeMessage tone="error">
              {codeError(detail.error, 'Không mở được bài nộp.')}
            </CodeMessage>
          </div>
        ) : (
          <ListSkeleton />
        )}
      </Panel>
    );

  const tone = toneOf(s.status, s.verdict);
  const passed = s.mentorTests.filter((t) => t.status === 'PASSED').length;

  return (
    <ResizableSplit
      direction="vertical"
      storageKey="mindy.review.y"
      defaultRatio={0.58}
      minFirst={200}
      minSecond={160}
      label="Kéo để đổi chiều cao code và kết quả"
      className="h-full"
      first={
        <section
          aria-label={`Code của ${s.displayName}`}
          style={{ colorScheme: codeThemeScheme(props.theme) }}
          className="flex h-[min(70dvh,34rem)] min-h-0 flex-col overflow-hidden rounded-xl bg-ide shadow-[0_1px_3px] shadow-forest/20 ring-1 ring-ide-line lg:h-full"
        >
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-ide-line bg-ide-deep pr-1.5 pl-3">
            <Code2 aria-hidden="true" className="size-4 shrink-0 text-syn-string" />
            <span className="truncate text-[13px] font-bold text-ide-text">{s.displayName}</span>
            <span className="hidden shrink-0 text-[12px] text-ide-muted sm:inline">
              {languageName(s.languageKey)} · {new Date(s.submittedAt).toLocaleString('vi-VN')}
            </span>
            <span className="ml-auto" />
            {s.status === 'FAILED' && (
              <button
                type="button"
                onClick={() => void act('rejudge')}
                disabled={command.isPending}
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-ide-raised px-2.5 text-[12.5px] font-bold text-ide-text transition-colors hover:text-syn-string disabled:opacity-50"
              >
                <RotateCcw aria-hidden="true" className="size-3.5" /> Chấm lại
              </button>
            )}
            {s.status !== 'VOIDED' && (
              <button
                type="button"
                onClick={() => setVoiding(true)}
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-bold text-ide-muted transition-colors hover:bg-ide-raised hover:text-syn-literal"
              >
                <X aria-hidden="true" className="size-3.5" /> Huỷ bài
              </button>
            )}
            <CodeThemePicker value={props.theme} onChange={props.onTheme} />
          </div>
          {props.attempts && props.attempts.length > 1 && (
            <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-ide-line bg-ide-deep px-2 py-1.5 [scrollbar-width:none]">
              {props.attempts.map((x) => {
                const t = toneOf(x.status, x.verdict);
                return (
                  <button
                    key={x.id}
                    type="button"
                    aria-pressed={x.id === props.submissionId}
                    onClick={() => props.onPickAttempt?.(x.id)}
                    className={cn(
                      'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-bold transition-colors',
                      x.id === props.submissionId
                        ? 'bg-ide-raised text-ide-text'
                        : 'text-ide-muted hover:text-ide-text',
                    )}
                  >
                    <span aria-hidden="true" className={cn('size-1.5 rounded-full', toneDot[t])} />
                    Lần {x.attemptNumber}
                    {x.score && <span className="font-mono opacity-80">{x.score}</span>}
                  </button>
                );
              })}
            </div>
          )}
          <div className="min-h-0 flex-1">
            <CodeEditor
              fill
              readOnly
              label="Code học viên"
              value={s.sourceCode ?? ''}
              language={s.languageKey}
              indent={s.languageKey === 'java21' ? '    ' : '  '}
            />
          </div>
        </section>
      }
      second={
        <Panel label="Kết quả chấm">
          <PanelTabs
            label="Kết quả"
            idPrefix="review-result"
            value="tests"
            onChange={() => {}}
            tabs={[
              {
                id: 'tests',
                label: 'Kết quả từng test',
                icon: ListChecks,
                tone: 'text-mint',
                badge: <TabCount value={s.mentorTests.length} />,
              },
            ]}
          />
          <div
            id="review-result-panel"
            role="tabpanel"
            aria-labelledby="review-result-tab-tests"
            className="code-ide-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                key={`${s.status}-${s.verdict}`}
                className={cn(
                  'animate-in fade-in-0 zoom-in-95 text-xl font-extrabold duration-300',
                  toneText[tone],
                )}
              >
                {labelOf(s.status, s.verdict)}
              </span>
              {s.score && (
                <span className="font-mono text-sm font-bold tabular-nums">
                  {s.score}/{s.maxScore} điểm
                </span>
              )}
              {s.mentorTests.length > 0 && (
                <span className="text-xs text-muted/70">
                  Đạt {passed}/{s.mentorTests.length} test · Lần {s.attemptNumber}
                </span>
              )}
              {!s.countsAsAttempt && <StatusPill>Không tính lượt</StatusPill>}
            </div>
            {isPending(s.status) && (
              <div role="status" className="space-y-1.5">
                <div className="relative h-1 overflow-hidden rounded-full bg-soft">
                  <span className="absolute inset-y-0 w-1/3 animate-[code-progress_1.2s_ease-in-out_infinite] rounded-full bg-mint" />
                </div>
                <p className="text-xs text-muted">Đang chấm, kết quả sẽ tự cập nhật…</p>
              </div>
            )}
            {s.duplicateOfOtherStudent && (
              <p className="flex items-center gap-2 rounded-lg bg-headsup/8 px-3 py-2 text-[12.5px] font-bold text-headsup">
                <Copy aria-hidden="true" className="size-3.5" /> Code trùng y hệt bài của học viên
                khác trong đề này.
              </p>
            )}
            {s.voidedReason && (
              <p className="rounded-lg bg-peach px-3 py-2 text-[12.5px] font-bold text-headsup">
                Đã huỷ: {s.voidedReason}
              </p>
            )}
            {s.lastError && (
              <pre className="code-ide-dark-scroll max-h-40 overflow-auto rounded-lg bg-ide p-3 font-mono text-xs leading-5 whitespace-pre-wrap text-syn-literal">
                {s.lastError}
              </pre>
            )}
            {s.compileOutput && (
              <div className="space-y-1.5">
                <p className="text-[12.5px] font-bold">Output biên dịch</p>
                <pre className="code-ide-dark-scroll max-h-48 overflow-auto rounded-lg bg-ide p-3 font-mono text-xs leading-5 whitespace-pre-wrap text-syn-literal">
                  {s.compileOutput}
                </pre>
              </div>
            )}
            <ul className="space-y-1">
              {s.mentorTests.map((t) => {
                const ok = t.status === 'PASSED';
                const open = openTest === t.position;
                return (
                  <li key={t.position} className="rounded-lg bg-soft/60">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenTest(open ? null : t.position)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px]"
                    >
                      <span
                        className={cn(
                          'grid size-4.5 shrink-0 place-items-center rounded-full text-canvas',
                          ok ? 'bg-mint' : 'bg-headsup',
                        )}
                      >
                        {ok ? (
                          <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                        ) : (
                          <X aria-hidden="true" className="size-3" strokeWidth={3} />
                        )}
                      </span>
                      <span className="font-bold">
                        #{t.position} {t.visibility === 'SAMPLE' ? 'Ví dụ' : 'Ẩn'}
                      </span>
                      <span className={cn('text-xs font-bold', ok ? 'text-mint' : 'text-headsup')}>
                        {verdictLabels[t.status] ?? t.status}
                      </span>
                      <span className="ml-auto font-mono text-xs text-muted/70 tabular-nums">
                        {t.timeMs} ms · {Math.round(t.memoryKb / 1024)} MB · ×{t.weight}
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className={cn(
                          'size-3.5 text-muted/50 transition-transform duration-200',
                          open && 'rotate-90',
                        )}
                      />
                    </button>
                    {open && (
                      <div className="animate-in fade-in-0 slide-in-from-top-1 space-y-1.5 px-3 pb-3 font-mono text-xs duration-200">
                        <p className="break-all">
                          <span className="font-sans font-bold text-muted/70">Input </span>
                          {formatValue(t.inputArgs)}
                        </p>
                        <p className="break-all">
                          <span className="font-sans font-bold text-muted/70">Mong đợi </span>
                          {formatValue(t.expected)}
                        </p>
                        {t.actual !== undefined && (
                          <p className={cn('break-all', !ok && 'text-headsup')}>
                            <span className="font-sans font-bold text-muted/70">Nhận </span>
                            {formatValue(t.actual)}
                          </p>
                        )}
                        {t.console && (
                          <pre className="max-h-32 overflow-auto rounded-md bg-canvas p-2 whitespace-pre-wrap ring-1 ring-line">
                            {t.console}
                          </pre>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          {voiding && (
            <Modal
              title="Huỷ bài nộp"
              onClose={() => setVoiding(false)}
              contentClassName="assignment-workspace font-sans max-w-md sm:max-w-md"
            >
              <div className="space-y-4 p-5">
                <p className="text-[15px] leading-6">
                  Bài bị huỷ vẫn tính lượt và không được tính điểm. Lý do sẽ hiện cho học viên.
                </p>
                <input
                  aria-label="Lý do huỷ"
                  placeholder="Lý do"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={cn(fieldClass, 'h-10')}
                />
                <div className="flex flex-wrap justify-end gap-3">
                  <Button variant="outline" onClick={() => setVoiding(false)}>
                    Đóng
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={!reason.trim() || command.isPending}
                    onClick={() => void act('void')}
                  >
                    Huỷ bài
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </Panel>
      }
    />
  );
}

/** Stand-alone route for one submission (links from notifications and the list). */
export function MentorCodeSubmissionPage(props: { submissionId: string }) {
  useShellFocus();
  const [theme, setTheme] = useCodeTheme();
  const detail = useCodeQuery(
    'MENTOR',
    `mentor/code-submissions/${props.submissionId}`,
    mentorSubmissionDetailSchema,
  );
  const s = detail.data;
  return (
    <IdePage theme={theme}>
      <IdeHeader
        start={
          <>
            <BackLink
              href={s ? `/mentor/assignments/${s.assignmentId}/review` : '/mentor'}
              label="Về bài nộp của lớp"
            />
            <IdeTitle>{s ? `${s.displayName} · Lần ${s.attemptNumber}` : 'Bài nộp'}</IdeTitle>
          </>
        }
      />
      <IdeBody>
        <SubmissionViewer submissionId={props.submissionId} theme={theme} onTheme={setTheme} />
      </IdeBody>
    </IdePage>
  );
}
