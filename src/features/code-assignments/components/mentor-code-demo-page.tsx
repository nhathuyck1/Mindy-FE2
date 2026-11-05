'use client';

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import {
  ChevronDown,
  Code2,
  ExternalLink,
  FileText,
  Maximize2,
  Minimize2,
  PenLine,
  Play,
  RotateCcw,
  ArrowLeftToLine,
  GripVertical,
  MessageSquareCode,
} from 'lucide-react';
import { toast } from 'sonner';
import { useShellFocus } from '@/components/layout/shell-focus';
import { startCodeDrag } from '@/features/whiteboard/lib/code-board';
import { useSendCodeToChat } from '@/features/chat/components/use-send-code-to-chat';
import type { BoardBridge } from '@/features/whiteboard/components/whiteboard-workspace';
import { codeError, useCodeCommand, useCodeQuery } from '../api/code-queries';
import { formatValue, parseCustomArgs } from '../lib/code-format';
import {
  type CodeLanguageKey,
  type CodeProblem,
  mentorAuthoringSchema,
  type MentorAuthoring,
  type RunResult,
  runResultSchema,
} from '../schemas/code-contracts';
import {
  ActionButton,
  ActionGroup,
  BackLink,
  IdeBody,
  IdeHeader,
  IdePage,
  IdeTitle,
  PanelEmpty,
  StatusPill,
} from './code-chrome';
import { CodeEditor } from './code-editor';
import { Kbd, Panel, PanelTabs, type PanelTab, ToolButton } from './code-panel';
import { ProblemDescription, type ProblemView } from './code-problem-pane';
import { TestPanel, type TestPanelAssignment, type TestTab } from './code-test-panel';
import { type CodeThemeId, codeThemeScheme, CodeThemePicker, useCodeTheme } from './code-theme';
import { CodeMessage } from './code-ui';
import { ResizableSplit, useStoredRatio } from './resizable-split';
import { SessionBoardPanel } from '@/features/whiteboard/components/session-board-panel';
import type { CaseSelection } from './use-code-workspace';

/** Left panel tabs. "board" will host the session whiteboard next to the code. */
type DemoTab = 'problem' | 'board';
const languageName = (k: CodeLanguageKey) => (k === 'java21' ? 'Java' : 'JavaScript');

/**
 * "Mentor làm mẫu": the student compiler layout for a mentor to code live in class. The code is
 * a scratchpad kept in this browser only; nothing is submitted or graded.
 */
export function MentorCodeDemoPage(props: { assignmentId: string }) {
  useShellFocus();
  const [theme, setTheme] = useCodeTheme();
  const authoring = useCodeQuery(
    'MENTOR',
    `mentor/assignments/${props.assignmentId}/code`,
    mentorAuthoringSchema,
  );
  if (authoring.isPending)
    return (
      <div role="status" className="code-ide grid min-h-dvh place-items-center bg-soft/70">
        <span className="text-sm text-muted">Đang mở đề…</span>
      </div>
    );
  const data = authoring.data;
  if (authoring.error || !data)
    return (
      <div className="code-ide p-6">
        <CodeMessage tone="error">{codeError(authoring.error, 'Không mở được đề.')}</CodeMessage>
      </div>
    );
  if (!data.problem || !data.languages.length)
    return (
      <IdePage theme={theme}>
        <IdeHeader
          start={
            <>
              <BackLink href={`/mentor/assignments/${data.assignment.id}`} label="Về đề bài" />
              <IdeTitle>{data.assignment.title}</IdeTitle>
            </>
          }
        />
        <IdeBody>
          <Panel>
            <PanelEmpty icon={FileText} title="Đề chưa có nội dung">
              Soạn đề bài và hàm cần viết trước khi làm mẫu.
            </PanelEmpty>
          </Panel>
        </IdeBody>
      </IdePage>
    );
  return <DemoIde data={data} problem={data.problem} theme={theme} onTheme={setTheme} />;
}

type DemoView = Omit<ProblemView, 'samples'> & {
  samples: (ProblemView['samples'][number] & TestPanelAssignment['samples'][number])[];
};

function demoView(data: MentorAuthoring, problem: CodeProblem): DemoView {
  const samples = data.tests.filter((t) => t.visibility === 'SAMPLE');
  return {
    problem,
    samples: samples.map((t, i) => ({
      position: i + 1,
      inputArgs: t.inputArgs,
      display: problem.signature.params
        .map((p, j) => `${p.name} = ${formatValue(t.inputArgs[j])}`)
        .join(', '),
      expected: t.expected,
      explanationMd: t.explanationMd ?? null,
    })),
    hiddenTestCount: data.tests.length - samples.length,
  };
}

function reportSend(result: ReturnType<BoardBridge['addCode']>) {
  if (result === 'ok') toast.success('Đã gửi code lên bảng');
  else if (result === 'readonly') toast.error('Bạn đang chỉ có quyền xem bảng này.');
  else if (result === 'too-long') toast.error('Đoạn code quá dài (tối đa 5000 ký tự).');
  else if (result === 'busy') toast.error('Bảng đang đồng bộ, thử lại sau giây lát.');
  else toast.error('Chưa có code để gửi.');
}

const DESKTOP_QUERY = '(min-width: 1024px)';
function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
function isDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function storageKey(assignmentId: string, language: CodeLanguageKey) {
  return `mindy.code.demo.${assignmentId}.${language}`;
}
function readCode(assignmentId: string, language: CodeLanguageKey, fallback: string) {
  try {
    return window.localStorage.getItem(storageKey(assignmentId, language)) ?? fallback;
  } catch {
    return fallback;
  }
}

function DemoIde(props: {
  data: MentorAuthoring;
  problem: CodeProblem;
  theme: CodeThemeId;
  onTheme: (theme: CodeThemeId) => void;
}) {
  const { data, problem } = props;
  const id = data.assignment.id;
  const runner = useCodeCommand(runResultSchema);
  const view = demoView(data, problem);
  const [language, setLanguage] = useState<CodeLanguageKey>(
    data.languages[0]?.languageKey ?? 'javascript',
  );
  const starter = data.languages.find((l) => l.languageKey === language)?.starterCode ?? '';
  const [codes, setCodes] = useState<Partial<Record<CodeLanguageKey, string>>>({});
  const code = codes[language] ?? readCode(id, language, starter);
  const [tab, setTabState] = useState<DemoTab>('problem');
  // The board loads on first open, then stays mounted so its live connection and unsynced
  // strokes survive tab switches (BoardConnection.stop() drops pending changes).
  const [boardOpened, setBoardOpened] = useState(false);
  const [boardMounted, setBoardMounted] = useState(false);
  // The board is embedded only from lg up. Opened on a small screen, it mounts as soon as the
  // window grows to lg; once mounted it stays (shrinking only hides it) to keep the connection.
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, () => false);
  if (boardOpened && desktop && !boardMounted) setBoardMounted(true);
  const [bridge, setBridge] = useState<BoardBridge | null>(null);
  const [selection, setSelection] = useState('');
  const sendCodeToChat = useSendCodeToChat();
  // "Gửi lên bảng" pressed before the board was open: sent as soon as the board reports ready.
  const pendingSend = useRef<{ text: string; language: CodeLanguageKey } | null>(null);
  const onBoardReady = useCallback((next: BoardBridge | null) => {
    setBridge(next);
    const queued = pendingSend.current;
    if (next && queued) {
      pendingSend.current = null;
      reportSend(next.addCode(queued.text, queued.language));
    }
  }, []);
  // Opening the board widens the left column (~half the screen); back to the problem restores it.
  const [problemRatio, setProblemRatio] = useStoredRatio('mindy.demo.x', 0.42);
  const [boardRatio, setBoardRatio] = useStoredRatio('mindy.demo.board.x', 0.5);
  function setTab(next: DemoTab) {
    setTabState(next);
    if (next === 'board') setBoardOpened(true);
  }
  const [testTab, setTestTab] = useState<TestTab>('cases');
  const [testOpen, setTestOpen] = useState(true);
  const [zen, setZen] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [testCase, setTestCase] = useState<CaseSelection>(0);
  const [custom, setCustom] = useState<string[]>(() =>
    problem.signature.params.map((_, i) =>
      view.samples[0] ? formatValue(view.samples[0].inputArgs[i]) : '',
    ),
  );
  const [run, setRun] = useState<RunResult | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  function setCode(next: string) {
    setCodes((all) => ({ ...all, [language]: next }));
    try {
      window.localStorage.setItem(storageKey(id, language), next);
    } catch {
      // Storage can be unavailable; the scratchpad still works for this visit.
    }
  }

  async function doRun() {
    if (running || !code.trim()) return;
    setTestTab('result');
    setTestOpen(true);
    setRunError(null);
    let customArgs: unknown[] | undefined;
    if (testCase === 'custom') {
      const parsed = parseCustomArgs(problem.signature, custom);
      if ('error' in parsed) {
        setRun(null);
        setRunError(parsed.error);
        return;
      }
      customArgs = parsed.args;
    }
    setRunning(true);
    try {
      // Same judging as the student "Chạy thử"; works in draft and after publishing.
      setRun(
        await runner.mutateAsync({
          path: `mentor/assignments/${id}/code-runs`,
          body: { languageKey: language, sourceCode: code, ...(customArgs ? { customArgs } : {}) },
          timeoutMs: 95_000,
        }),
      );
      setRunCount((n) => n + 1);
    } catch (error) {
      setRun(null);
      setRunError(codeError(error, 'Chưa chạy được code.'));
    } finally {
      setRunning(false);
    }
  }

  const tabs: PanelTab<DemoTab>[] = [
    { id: 'problem', label: 'Đề bài', icon: FileText, tone: 'text-mint' },
    { id: 'board', label: 'Bảng vẽ', icon: PenLine, tone: 'text-coral' },
  ];
  const indent = language === 'java21' ? '    ' : '  ';
  const boardHref = `/whiteboards/${data.assignment.sessionId}?audience=mentor`;

  return (
    <IdePage
      theme={props.theme}
      onKeyDownCapture={(event) => {
        // Keys typed inside the board (e.g. Ctrl+Enter to finish a text box) belong to the board.
        if (event.target instanceof Element && event.target.closest('[data-whiteboard-root]'))
          return;
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          event.stopPropagation();
          void doRun();
        }
      }}
    >
      <IdeHeader
        start={
          <>
            <BackLink href={`/mentor/assignments/${id}`} label="Về đề bài" />
            <IdeTitle>{data.assignment.title}</IdeTitle>
            <StatusPill tone="coral">Mentor làm mẫu</StatusPill>
          </>
        }
        center={
          <ActionGroup>
            <ActionButton
              icon={Play}
              iconClassName="fill-current text-mint"
              onClick={() => void doRun()}
              busy={running}
              disabled={running || !code.trim()}
              title="Chạy thử với ví dụ (Ctrl/⌘ + Enter)"
            >
              {running ? 'Đang chạy…' : 'Chạy thử'}
            </ActionButton>
          </ActionGroup>
        }
        end={
          <span className="text-xs text-muted/70">
            Code chỉ lưu trên trình duyệt này, không chấm điểm
          </span>
        }
      />
      <IdeBody>
        <ResizableSplit
          direction="horizontal"
          storageKey="mindy.demo.x"
          defaultRatio={0.42}
          ratio={tab === 'board' ? boardRatio : problemRatio}
          onRatioChange={tab === 'board' ? setBoardRatio : setProblemRatio}
          minFirst={340}
          minSecond={460}
          collapse={zen ? 'first' : null}
          label="Kéo để đổi độ rộng đề bài và code"
          className="flex-1"
          first={
            <Panel label="Đề bài và bảng vẽ">
              <PanelTabs
                label="Nội dung"
                idPrefix="demo-left"
                tabs={tabs}
                value={tab}
                onChange={setTab}
                actions={
                  tab === 'board' && (
                    <a
                      href={boardHref}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Mở bảng vẽ toàn màn hình"
                      title="Mở bảng vẽ toàn màn hình (tab mới)"
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted/70 transition-colors hover:bg-soft hover:text-black"
                    >
                      <ExternalLink aria-hidden="true" className="size-3.75" />
                    </a>
                  )
                }
              />
              <div
                id="demo-left-panel"
                role="tabpanel"
                aria-labelledby={`demo-left-tab-${tab}`}
                className="relative min-h-0 flex-1"
              >
                <div
                  hidden={tab !== 'problem'}
                  className="code-ide-scroll animate-in fade-in-0 h-full overflow-y-auto duration-200"
                >
                  <ProblemDescription assignment={view} />
                </div>
                <div hidden={tab !== 'board'} className="h-full">
                  <div className="hidden h-full lg:block">
                    {boardMounted && (
                      <SessionBoardPanel
                        sessionId={data.assignment.sessionId}
                        embedded
                        active={tab === 'board'}
                        onReady={onBoardReady}
                      />
                    )}
                  </div>
                  <div className="h-full lg:hidden">
                    <PanelEmpty icon={PenLine} title="Bảng vẽ của buổi học">
                      <p>Màn hình nhỏ: mở bảng vẽ toàn màn hình để vẽ thoải mái.</p>
                      <a
                        href={boardHref}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-forest px-3.5 text-[13px] font-bold text-canvas transition-colors hover:bg-mint"
                      >
                        <ExternalLink aria-hidden="true" className="size-3.5" /> Mở bảng vẽ
                      </a>
                    </PanelEmpty>
                  </div>
                </div>
              </div>
            </Panel>
          }
          second={
            <ResizableSplit
              direction="vertical"
              storageKey="mindy.demo.y"
              defaultRatio={0.64}
              minFirst={180}
              minSecond={150}
              collapse={testOpen ? null : 'second'}
              collapsedSize={40}
              label="Kéo để đổi chiều cao khung code và kiểm thử"
              className="h-full"
              first={
                <section
                  aria-label="Code làm mẫu"
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
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as CodeLanguageKey)}
                        className="h-7 cursor-pointer appearance-none rounded-md bg-transparent py-0 pr-7 pl-2 text-[13px] font-bold text-ide-text transition-colors outline-none hover:bg-ide-raised focus-visible:ring-2 focus-visible:ring-mint"
                      >
                        {data.languages.map((l) => (
                          <option
                            key={l.languageKey}
                            value={l.languageKey}
                            className="bg-ide-deep text-ide-text"
                          >
                            {languageName(l.languageKey)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        aria-hidden="true"
                        className="pointer-events-none absolute right-2 size-3.5 text-ide-muted"
                      />
                    </label>
                    <span className="ml-auto" />
                    <span
                      draggable
                      onDragStart={(event) =>
                        startCodeDrag(event, selection.trim() ? selection : code, language)
                      }
                      title="Kéo thả vào bảng vẽ hoặc ô chat (đoạn đang chọn, hoặc cả file)"
                      className="hidden h-7 cursor-grab items-center gap-1 rounded-md px-2 text-[12.5px] font-bold text-ide-muted transition-colors select-none hover:bg-ide-raised hover:text-ide-text active:cursor-grabbing sm:inline-flex"
                    >
                      <GripVertical aria-hidden="true" className="size-3.5" />
                      Kéo code
                    </span>
                    <ToolButton
                      dark
                      label={selection.trim() ? 'Gửi đoạn đang chọn vào chat' : 'Gửi code vào chat'}
                      onClick={() => sendCodeToChat(selection.trim() ? selection : code, language)}
                    >
                      <MessageSquareCode aria-hidden="true" />
                    </ToolButton>
                    <button
                      type="button"
                      onClick={() => {
                        const text = selection.trim() ? selection : code;
                        if (tab !== 'board') setTab('board');
                        if (bridge) reportSend(bridge.addCode(text, language));
                        else pendingSend.current = { text, language };
                      }}
                      title="Gửi đoạn đang chọn (hoặc cả file) lên bảng vẽ. Có thể kéo đoạn đã chọn thả vào bảng."
                      className="hidden h-7 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-bold text-ide-muted transition-colors hover:bg-ide-raised hover:text-ide-text lg:inline-flex"
                    >
                      <ArrowLeftToLine aria-hidden="true" className="size-3.5" />
                      {selection.trim() ? 'Gửi đoạn chọn lên bảng' : 'Gửi lên bảng'}
                    </button>
                    <CodeThemePicker value={props.theme} onChange={props.onTheme} />
                    <ToolButton
                      dark
                      label="Khôi phục code mẫu"
                      onClick={() => setCode(starter)}
                      disabled={code === starter}
                    >
                      <RotateCcw aria-hidden="true" />
                    </ToolButton>
                    <span className="hidden lg:inline-flex">
                      <ToolButton
                        dark
                        label={zen ? 'Thu nhỏ khung code' : 'Phóng to khung code'}
                        pressed={zen}
                        onClick={() => setZen(!zen)}
                      >
                        {zen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
                      </ToolButton>
                    </span>
                  </div>
                  <div className="min-h-0 flex-1">
                    <CodeEditor
                      key={language}
                      fill
                      label={`Code làm mẫu ${languageName(language)}`}
                      value={code}
                      onChange={setCode}
                      language={language}
                      indent={indent}
                      onCursor={(line, column) => setCursor({ line, column })}
                      onSelectionChange={setSelection}
                      onDragCode={(event, selected) => startCodeDrag(event, selected, language)}
                    />
                  </div>
                  <div className="flex h-7 shrink-0 items-center gap-4 border-t border-ide-line bg-ide-deep px-3 text-[11.5px] text-ide-muted">
                    <span className="tabular-nums">
                      Dòng {cursor.line}, Cột {cursor.column}
                    </span>
                    <span className="ml-auto hidden items-center gap-1.5 md:inline-flex">
                      <Kbd>Ctrl</Kbd>
                      <Kbd>↵</Kbd> chạy thử
                    </span>
                  </div>
                </section>
              }
              second={
                <TestPanel
                  assignment={view}
                  ws={{
                    testCase,
                    setTestCase,
                    custom,
                    setCustom,
                    run,
                    runError,
                    running,
                    runCount,
                  }}
                  tab={testTab}
                  onTab={setTestTab}
                  open={testOpen}
                  onToggle={() => setTestOpen(!testOpen)}
                />
              }
            />
          }
        />
      </IdeBody>
    </IdePage>
  );
}
