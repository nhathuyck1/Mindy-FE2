'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  CloudUpload,
  Code2,
  FileText,
  History,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Ticket,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useUserShellFocus } from '@/components/layout/user-shell';
import { cn } from '@/lib/utils';
import { codeError, useCodeQuery } from '../api/code-queries';
import { timeLeft } from '../lib/code-format';
import {
  type CodeLanguageKey,
  type StudentCodeAssignment,
  studentCodeAssignmentSchema,
} from '../schemas/code-contracts';
import { CodeEditor } from './code-editor';
import { Kbd, Panel, PanelTabs, TabCount, ToolButton, type PanelTab } from './code-panel';
import { DifficultyPill, ProblemDescription } from './code-problem-pane';
import { SubmissionHistory } from './code-submissions';
import { TestPanel, type TestTab } from './code-test-panel';
import { type CodeThemeId, codeThemeScheme, CodeThemePicker, useCodeTheme } from './code-theme';
import { CodeMessage } from './code-ui';
import { ResizableSplit } from './resizable-split';
import { type CodeWorkspace, type SaveState, useCodeWorkspace } from './use-code-workspace';

/** Left panel tabs. A shared mentor whiteboard can be added here as another entry later. */
type ProblemTab = 'problem' | 'history';

export function StudentCodePage(props: { assignmentId: string }) {
  useUserShellFocus();
  const base = `me/assignments/${props.assignmentId}`;
  const view = useCodeQuery('STUDENT', `${base}/code`, studentCodeAssignmentSchema, {
    refetchInterval: (query) => (query.state.data?.inFlightSubmissionId ? 1500 : false),
  });
  const [language, setLanguage] = useState<CodeLanguageKey | null>(null);
  const [tab, setTab] = useState<ProblemTab>('problem');
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'problem' | 'code'>('problem');
  const [theme, setTheme] = useCodeTheme();
  const lang = language ?? view.data?.languages[0]?.key ?? null;

  if (view.isPending) return <IdeSkeleton />;
  if (view.error || !view.data)
    return (
      <div className="space-y-4 p-6">
        <BackLink />
        <CodeMessage tone="error">{codeError(view.error, 'Không mở được bài tập.')}</CodeMessage>
      </div>
    );
  if (!lang) return null;
  return (
    <CodeIde
      key={lang}
      base={base}
      assignment={view.data}
      language={lang}
      onLanguage={setLanguage}
      onChanged={() => view.refetch()}
      tab={tab}
      onTab={setTab}
      selected={selected}
      onSelect={setSelected}
      mobileView={mobileView}
      onMobileView={setMobileView}
      theme={theme}
      onTheme={setTheme}
    />
  );
}

function BackLink() {
  return (
    <Link
      href="/user/assignments"
      aria-label="Về danh sách bài tập lập trình"
      title="Bài tập lập trình"
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-black transition-colors hover:bg-canvas hover:text-mint"
    >
      <ArrowLeft aria-hidden="true" className="size-4.5" />
    </Link>
  );
}

function CodeIde(props: {
  base: string;
  assignment: StudentCodeAssignment;
  language: CodeLanguageKey;
  onLanguage: (key: CodeLanguageKey) => void;
  onChanged: () => void;
  tab: ProblemTab;
  onTab: (tab: ProblemTab) => void;
  selected: string | null;
  onSelect: (id: string | null) => void;
  mobileView: 'problem' | 'code';
  onMobileView: (view: 'problem' | 'code') => void;
  theme: CodeThemeId;
  onTheme: (theme: CodeThemeId) => void;
}) {
  const a = props.assignment;
  const [zen, setZen] = useState(false);
  const [testOpen, setTestOpen] = useState(true);
  const [testTab, setTestTab] = useState<TestTab>('cases');
  const [confirm, setConfirm] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const ws = useCodeWorkspace({
    base: props.base,
    assignment: a,
    language: props.language,
    onSubmitted: (id) => {
      toast.success('Đã nộp bài', {
        description: 'Đang chấm với test ẩn, kết quả sẽ tự cập nhật.',
      });
      setZen(false);
      props.onTab('history');
      props.onSelect(id);
      props.onMobileView('problem');
      props.onChanged();
    },
    onSubmitError: (message) => toast.error(message),
  });
  const canSubmit = a.canSubmit && !ws.submitting && Boolean(ws.code.trim());
  const blocked = a.canSubmit
    ? null
    : a.deadlinePassed
      ? 'Đã quá hạn nộp'
      : a.inFlightSubmissionId
        ? null
        : a.attemptsRemaining === 0
          ? 'Đã hết lượt nộp'
          : 'Bài tập đã đóng';

  function runAndShow() {
    setTestTab('result');
    setTestOpen(true);
    void ws.doRun();
  }
  function onShortcut(event: React.KeyboardEvent) {
    if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey) {
      if (canSubmit) setConfirm(true);
    } else runAndShow();
  }

  const problemTabs: PanelTab<ProblemTab>[] = [
    { id: 'problem', label: 'Đề bài', icon: FileText, tone: 'text-mint' },
    {
      id: 'history',
      label: 'Lịch sử nộp',
      icon: History,
      tone: 'text-coral',
      badge: <TabCount value={a.attemptsUsed} />,
    },
  ];

  return (
    <div
      data-code-theme={props.theme}
      className="code-ide flex min-h-dvh flex-col bg-soft/70 lg:h-dvh lg:min-h-0"
      onKeyDownCapture={onShortcut}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-2.5 py-2 lg:grid lg:h-14 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:py-0">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <BackLink />
          <span aria-hidden="true" className="h-5 w-px bg-line" />
          <h1 className="min-w-0 truncate text-[15px] font-extrabold text-black">{a.title}</h1>
          <span className="hidden shrink-0 sm:inline-flex">
            <DifficultyPill value={a.problem.difficulty} />
          </span>
        </div>

        <div className="order-last flex w-full items-center justify-between gap-2 lg:order-none lg:w-auto lg:justify-center">
          <div className="flex items-center gap-1 rounded-xl bg-canvas p-1 shadow-[0_1px_2px] shadow-forest/10 ring-1 ring-line">
            <button
              type="button"
              onClick={runAndShow}
              disabled={ws.running || !ws.code.trim()}
              title="Chạy thử với ví dụ (Ctrl/⌘ + Enter)"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold text-black transition-colors duration-150 outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-50"
            >
              {ws.running ? (
                <Loader2 aria-hidden="true" className="size-3.5 animate-spin text-mint" />
              ) : (
                <Play aria-hidden="true" className="size-3.5 fill-current text-mint" />
              )}
              {ws.running ? 'Đang chạy…' : 'Chạy thử'}
            </button>
            <button
              type="button"
              onClick={() => setConfirm(true)}
              disabled={!canSubmit}
              title={blocked ?? 'Nộp bài để chấm với test ẩn (Ctrl/⌘ + Shift + Enter)'}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-forest px-3.5 text-[13px] font-bold text-canvas transition-[background-color,transform] duration-150 outline-none hover:bg-mint focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-1 active:scale-[0.97] disabled:bg-forest/45"
            >
              {ws.submitting ? (
                <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              ) : (
                <CloudUpload aria-hidden="true" className="size-3.5" />
              )}
              Nộp bài
            </button>
          </div>
          {a.inFlightSubmissionId ? (
            <button
              type="button"
              onClick={() => {
                props.onTab('history');
                props.onSelect(a.inFlightSubmissionId);
                props.onMobileView('problem');
              }}
              className="animate-in fade-in-0 slide-in-from-left-1 inline-flex h-7 items-center gap-1.5 rounded-full bg-canvas px-2.5 text-xs font-bold text-forest ring-1 ring-line duration-300"
            >
              <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-coral" />
              Đang chấm…
            </button>
          ) : (
            blocked && <span className="text-xs font-bold text-headsup">{blocked}</span>
          )}
        </div>

        <dl className="flex flex-wrap items-center gap-1.5 lg:flex-nowrap lg:justify-end">
          <Meta
            icon={Clock}
            label="Hạn nộp"
            value={timeLeft(a.dueAt, new Date(a.serverNow))}
            tone={
              a.deadlinePassed
                ? 'bad'
                : new Date(a.dueAt).getTime() - new Date(a.serverNow).getTime() < 86_400_000
                  ? 'warn'
                  : null
            }
          />
          <Meta icon={Ticket} label="Lượt còn" value={`${a.attemptsRemaining}/${a.maxAttempts}`} />
          <Meta
            icon={Trophy}
            label="Điểm cao nhất"
            value={a.bestScore ? `${a.bestScore}/${a.maxScore}` : '—'}
          />
        </dl>
      </header>

      <MobileSwitch value={props.mobileView} onChange={props.onMobileView} />

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 lg:px-2.5 lg:pb-2.5">
        <ResizableSplit
          direction="horizontal"
          storageKey="mindy.code.split.x"
          defaultRatio={0.42}
          minFirst={340}
          minSecond={460}
          collapse={zen ? 'first' : null}
          label="Kéo để đổi độ rộng đề bài và code"
          className="flex-1"
          firstClassName={cn(props.mobileView !== 'problem' && 'max-lg:hidden')}
          secondClassName={cn(props.mobileView !== 'code' && 'max-lg:hidden')}
          first={
            <Panel label="Đề bài và lịch sử nộp">
              <PanelTabs
                label="Nội dung bài"
                idPrefix="code-problem"
                tabs={problemTabs}
                value={props.tab}
                onChange={props.onTab}
              />
              <div
                id="code-problem-panel"
                role="tabpanel"
                aria-labelledby={`code-problem-tab-${props.tab}`}
                className="relative min-h-0 flex-1"
              >
                <div
                  hidden={props.tab !== 'problem'}
                  className="code-ide-scroll animate-in fade-in-0 h-full overflow-y-auto duration-200"
                >
                  <ProblemDescription assignment={a} />
                </div>
                <div
                  hidden={props.tab !== 'history'}
                  className="code-ide-scroll animate-in fade-in-0 h-full overflow-y-auto duration-200"
                >
                  <SubmissionHistory
                    base={props.base}
                    inFlight={a.inFlightSubmissionId}
                    selected={props.selected}
                    onSelect={props.onSelect}
                  />
                </div>
              </div>
            </Panel>
          }
          second={
            <ResizableSplit
              direction="vertical"
              storageKey="mindy.code.split.y"
              defaultRatio={0.64}
              minFirst={180}
              minSecond={150}
              collapse={testOpen ? null : 'second'}
              collapsedSize={40}
              label="Kéo để đổi chiều cao khung code và kiểm thử"
              className="h-full"
              first={
                <EditorPane
                  assignment={a}
                  ws={ws}
                  language={props.language}
                  onLanguage={props.onLanguage}
                  zen={zen}
                  onZen={() => setZen(!zen)}
                  onReset={() => setConfirmReset(true)}
                  cursor={cursor}
                  onCursor={(line, column) => setCursor({ line, column })}
                  theme={props.theme}
                  onTheme={props.onTheme}
                />
              }
              second={
                <TestPanel
                  assignment={a}
                  ws={ws}
                  tab={testTab}
                  onTab={setTestTab}
                  open={testOpen}
                  onToggle={() => setTestOpen(!testOpen)}
                />
              }
            />
          }
        />
      </div>

      {confirm && (
        <Modal
          title="Nộp bài?"
          onClose={() => setConfirm(false)}
          contentClassName="assignment-workspace font-sans max-w-md sm:max-w-md"
        >
          <div className="space-y-5 p-5">
            <p className="text-[15px] leading-6">
              Bài nộp dùng 1 lượt (còn <strong>{a.attemptsRemaining}</strong> lượt). Điểm của bài là
              lần nộp cao nhất.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirm(false)}>
                Huỷ
              </Button>
              <Button
                onClick={() => {
                  setConfirm(false);
                  void ws.doSubmit();
                }}
              >
                <CloudUpload aria-hidden="true" /> Nộp bài
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {confirmReset && (
        <Modal
          title="Khôi phục code mẫu?"
          onClose={() => setConfirmReset(false)}
          contentClassName="assignment-workspace font-sans max-w-md sm:max-w-md"
        >
          <div className="space-y-5 p-5">
            <p className="text-[15px] leading-6">
              Code hiện tại sẽ được thay bằng code mẫu ban đầu. Bạn vẫn có thể hoàn tác bằng Ctrl/⌘
              + Z ngay sau đó.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmReset(false)}>
                Huỷ
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmReset(false);
                  ws.resetToStarter();
                }}
              >
                Khôi phục
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Meta(props: {
  icon: typeof Clock;
  label: string;
  value: string;
  tone?: 'warn' | 'bad' | null;
}) {
  return (
    <div
      title={props.label}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] ring-1 transition-colors',
        props.tone === 'bad'
          ? 'bg-peach text-headsup ring-headsup/25'
          : props.tone === 'warn'
            ? 'bg-peach text-black ring-coral/30'
            : 'bg-canvas text-black ring-line',
      )}
    >
      <dt className="sr-only">{props.label}</dt>
      <props.icon
        aria-hidden="true"
        className={cn('size-3.5', props.tone ? 'text-current' : 'text-muted/60')}
      />
      <dd className="font-bold whitespace-nowrap tabular-nums">{props.value}</dd>
    </div>
  );
}

function MobileSwitch(props: {
  value: 'problem' | 'code';
  onChange: (value: 'problem' | 'code') => void;
}) {
  return (
    <div className="px-2 pb-2 lg:hidden">
      <div
        role="tablist"
        aria-label="Chế độ xem"
        className="relative grid grid-cols-2 rounded-xl bg-canvas p-1 ring-1 ring-line"
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-forest transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            props.value === 'code' && 'translate-x-full',
          )}
        />
        {(
          [
            ['problem', 'Đề bài', FileText],
            ['code', 'Code', Code2],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={props.value === id}
            onClick={() => props.onChange(id)}
            className={cn(
              'relative z-10 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-bold transition-colors duration-300',
              props.value === id ? 'text-canvas' : 'text-muted/80',
            )}
          >
            <Icon aria-hidden="true" className="size-4" /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SaveIndicator(props: { state: SaveState }) {
  const s = props.state;
  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs transition-opacity duration-300',
        s.kind === 'error' ? 'text-syn-literal' : 'text-ide-muted',
        s.kind === 'idle' && 'opacity-0',
      )}
    >
      {s.kind === 'saving' && (
        <>
          <Loader2 aria-hidden="true" className="size-3 animate-spin" />
          Đang lưu…
        </>
      )}
      {s.kind === 'saved' && (
        <>
          <span aria-hidden="true" className="size-1.5 rounded-full bg-syn-string" />
          <span>Đã lưu nháp</span>
        </>
      )}
      {s.kind === 'error' && s.text}
    </span>
  );
}

function EditorPane(props: {
  assignment: StudentCodeAssignment;
  ws: CodeWorkspace;
  language: CodeLanguageKey;
  onLanguage: (key: CodeLanguageKey) => void;
  zen: boolean;
  onZen: () => void;
  onReset: () => void;
  cursor: { line: number; column: number };
  onCursor: (line: number, column: number) => void;
  theme: CodeThemeId;
  onTheme: (theme: CodeThemeId) => void;
}) {
  const a = props.assignment;
  const current = a.languages.find((l) => l.key === props.language);
  const indent = props.language === 'java21' ? '    ' : '  ';
  return (
    <section
      aria-label="Bài làm"
      style={{ colorScheme: codeThemeScheme(props.theme) }}
      className="flex h-[min(70dvh,36rem)] min-h-0 flex-col overflow-hidden rounded-xl bg-ide shadow-[0_1px_3px] shadow-forest/20 ring-1 ring-ide-line lg:h-full"
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-ide-line bg-ide-deep pr-1.5 pl-3">
        <Code2 aria-hidden="true" className="size-4 text-syn-string" />
        <span className="text-[13px] font-bold text-ide-text">Code</span>
        <span aria-hidden="true" className="mx-1 h-4 w-px bg-ide-line" />
        <label className="relative inline-flex items-center">
          <span className="sr-only">Ngôn ngữ</span>
          <select
            value={props.language}
            onChange={(e) => props.onLanguage(e.target.value as CodeLanguageKey)}
            className="h-7 cursor-pointer appearance-none rounded-md bg-transparent py-0 pr-7 pl-2 text-[13px] font-bold text-ide-text transition-colors outline-none hover:bg-ide-raised focus-visible:ring-2 focus-visible:ring-mint"
          >
            {a.languages.map((l) => (
              <option key={l.key} value={l.key} className="bg-ide-deep text-ide-text">
                {l.displayName} ({l.runtimeVersion})
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-2 size-3.5 text-ide-muted"
          />
        </label>
        <span className="ml-auto" />
        <SaveIndicator state={props.ws.saveState} />
        <CodeThemePicker value={props.theme} onChange={props.onTheme} />
        <ToolButton
          dark
          label="Khôi phục code mẫu"
          onClick={props.onReset}
          disabled={!props.ws.canReset}
        >
          <RotateCcw aria-hidden="true" />
        </ToolButton>
        <span className="hidden lg:inline-flex">
          <ToolButton
            dark
            label={props.zen ? 'Thu nhỏ khung code' : 'Phóng to khung code'}
            pressed={props.zen}
            onClick={props.onZen}
          >
            {props.zen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </ToolButton>
        </span>
      </div>
      <div className="min-h-0 flex-1">
        {props.ws.draftLoading ? (
          <div role="status" className="space-y-2.5 px-14 py-4">
            <span className="sr-only">Đang tải bản nháp…</span>
            {[48, 64, 36, 56].map((w) => (
              <div
                key={w}
                className="h-3 animate-pulse rounded bg-ide-raised"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : (
          <CodeEditor
            fill
            label={`Code ${props.language}`}
            value={props.ws.code}
            onChange={props.ws.setCode}
            language={props.language}
            indent={indent}
            onCursor={props.onCursor}
          />
        )}
      </div>
      <div className="flex h-7 shrink-0 items-center gap-4 border-t border-ide-line bg-ide-deep px-3 text-[11.5px] text-ide-muted">
        <span className="tabular-nums">
          Dòng {props.cursor.line}, Cột {props.cursor.column}
        </span>
        <span className="hidden sm:inline">Thụt lề: {indent.length} dấu cách</span>
        <span className="ml-auto hidden items-center gap-1.5 md:inline-flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>↵</Kbd> chạy thử
          <span className="mx-1 opacity-40">·</span>
          <Kbd>Ctrl</Kbd>
          <Kbd>/</Kbd> chú thích
        </span>
        <span className="hidden xl:inline">{current?.runtimeVersion}</span>
      </div>
    </section>
  );
}

function IdeSkeleton() {
  return (
    <div role="status" className="flex min-h-dvh flex-col gap-2 bg-soft/70 p-2.5 lg:h-dvh">
      <span className="sr-only">Đang tải bài tập…</span>
      <div className="flex h-11 items-center gap-3">
        <div className="size-9 animate-pulse rounded-lg bg-canvas" />
        <div className="h-4 w-48 animate-pulse rounded bg-canvas" />
        <div className="mx-auto h-9 w-48 animate-pulse rounded-xl bg-canvas" />
        <div className="hidden h-8 w-64 animate-pulse rounded-lg bg-canvas lg:block" />
      </div>
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[42%_1fr]">
        <div className="animate-pulse rounded-xl bg-canvas" />
        <div className="grid min-h-0 gap-2 lg:grid-rows-[64%_1fr]">
          <div className="min-h-64 animate-pulse rounded-xl bg-ide" />
          <div className="hidden animate-pulse rounded-xl bg-canvas lg:block" />
        </div>
      </div>
    </div>
  );
}
