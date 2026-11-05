'use client';

import { useState } from 'react';
import { ChevronDown, FlaskConical, PenLine, Play, SquareTerminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { example, formatValue, verdictLabels } from '../lib/code-format';
import type { RunResult, StudentCodeAssignment } from '../schemas/code-contracts';
import { Kbd, Panel, PanelTabs, ToolButton } from './code-panel';
import type { CodeWorkspace } from './use-code-workspace';

export type TestTab = 'cases' | 'result';

/** What the test panel needs; the student workspace and the mentor demo both provide it. */
export type TestPanelAssignment = {
  samples: Pick<StudentCodeAssignment['samples'][number], 'position' | 'inputArgs'>[];
  problem: { signature: StudentCodeAssignment['problem']['signature'] };
};
export type TestPanelWorkspace = Pick<
  CodeWorkspace,
  'testCase' | 'setTestCase' | 'custom' | 'setCustom' | 'run' | 'runError' | 'running' | 'runCount'
>;

function CaseChip(props: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: 'good' | 'bad' | null;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.selected}
      onClick={props.onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-mint',
        props.selected
          ? 'bg-soft text-black ring-1 ring-line'
          : 'text-muted/75 hover:bg-soft/70 hover:text-black',
      )}
    >
      {props.tone && (
        <span
          aria-hidden="true"
          className={cn('size-1.5 rounded-full', props.tone === 'good' ? 'bg-mint' : 'bg-headsup')}
        />
      )}
      {props.children}
    </button>
  );
}

function Field(props: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-bold text-muted/75">{props.label}</div>
      <div className="min-h-10 rounded-lg bg-soft/80 px-3 py-2 font-mono text-[13px] leading-6 break-all whitespace-pre-wrap text-black">
        {props.children}
      </div>
    </div>
  );
}

function Cases(props: { assignment: TestPanelAssignment; ws: TestPanelWorkspace }) {
  const a = props.assignment;
  const { testCase, setTestCase, custom, setCustom } = props.ws;
  const sample = typeof testCase === 'number' ? a.samples[testCase] : null;
  return (
    <div className="space-y-4 px-4 py-3">
      <div className="flex flex-wrap items-center gap-1">
        {a.samples.map((s, i) => (
          <CaseChip key={s.position} selected={testCase === i} onClick={() => setTestCase(i)}>
            Ví dụ {s.position}
          </CaseChip>
        ))}
        <CaseChip selected={testCase === 'custom'} onClick={() => setTestCase('custom')}>
          <PenLine aria-hidden="true" className="size-3.5" /> Tự nhập
        </CaseChip>
      </div>
      <div
        key={String(testCase)}
        className="animate-in fade-in-0 slide-in-from-bottom-1 space-y-3 duration-200"
      >
        {sample &&
          a.problem.signature.params.map((p, i) => (
            <Field key={p.name} label={`${p.name} =`}>
              {formatValue(sample.inputArgs[i])}
            </Field>
          ))}
        {testCase === 'custom' &&
          a.problem.signature.params.map((p, i) => (
            <label key={p.name} className="block space-y-1.5">
              <span className="block text-xs font-bold text-muted/75">
                <span className="font-mono text-black">{p.name}</span>
                <span className="font-mono">: {p.type}</span>
              </span>
              <input
                value={custom[i] ?? ''}
                placeholder={example(p.type)}
                onChange={(e) => setCustom(custom.map((v, j) => (j === i ? e.target.value : v)))}
                spellCheck={false}
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-transparent bg-soft/80 px-3 font-mono text-[13px] text-black transition-colors outline-none placeholder:text-muted/40 hover:border-line focus:border-mint focus:bg-canvas"
              />
            </label>
          ))}
        <p className="text-xs text-muted/70">
          {testCase === 'custom'
            ? 'Mỗi tham số nhập dạng JSON, ví dụ [1,2] hoặc "abc". Chạy thử sẽ chỉ chạy input này.'
            : 'Chạy thử sẽ chạy tất cả ví dụ.'}
        </p>
      </div>
    </div>
  );
}

function headline(r: RunResult) {
  if (r.compileStatus !== 'OK')
    return {
      text: r.compileStatus === 'TIMEOUT' ? 'Biên dịch quá lâu' : 'Lỗi biên dịch',
      tone: 'bad' as const,
    };
  const samples = r.tests.filter((t) => t.kind === 'SAMPLE');
  if (!samples.length) {
    const t = r.tests[0];
    return t && t.status !== 'COMPLETED'
      ? { text: verdictLabels[t.status] ?? t.status, tone: 'bad' as const }
      : { text: 'Đã chạy', tone: 'good' as const };
  }
  const passed = samples.filter((t) => t.status === 'PASSED').length;
  return passed === samples.length
    ? { text: 'Đạt hết ví dụ', tone: 'good' as const }
    : {
        text: verdictLabels[samples.find((t) => t.status !== 'PASSED')?.status ?? ''] ?? 'Chưa đạt',
        tone: 'bad' as const,
      };
}

function Result(props: { ws: TestPanelWorkspace }) {
  const { run, runError, running } = props.ws;
  const [picked, setPicked] = useState(0);
  if (running)
    return (
      <div role="status" className="space-y-3 px-4 py-4">
        <p className="flex items-center gap-2 text-sm font-bold text-muted">
          <span className="size-1.5 animate-pulse rounded-full bg-mint" /> Đang chạy…
        </p>
        {[70, 45, 85].map((w) => (
          <div
            key={w}
            className="h-9 animate-pulse rounded-lg bg-soft"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    );
  if (runError)
    return (
      <p role="alert" className="m-4 rounded-lg bg-peach px-3 py-2 text-sm font-bold text-headsup">
        {runError}
      </p>
    );
  if (!run)
    return (
      <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted/70">
        <Play aria-hidden="true" className="size-6 text-line" />
        <p>
          Bấm <span className="font-bold text-black">Chạy thử</span> hoặc <Kbd>Ctrl</Kbd>{' '}
          <Kbd>↵</Kbd> để xem kết quả.
        </p>
      </div>
    );
  const head = headline(run);
  const test = run.tests[Math.min(picked, run.tests.length - 1)];
  return (
    <section aria-label="Kết quả chạy thử" className="space-y-4 px-4 py-3">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={cn(
            'animate-in fade-in-0 zoom-in-95 text-lg font-extrabold duration-300',
            head.tone === 'good' ? 'text-mint' : 'text-headsup',
          )}
        >
          {head.text}
        </span>
        <span className="text-xs text-muted/70">
          {run.runtimeVersion}
          {run.compileStatus === 'OK' && ` · ${Math.max(0, ...run.tests.map((t) => t.timeMs))} ms`}
        </span>
      </p>
      {run.compileStatus !== 'OK' ? (
        <pre className="code-ide-dark-scroll max-h-64 overflow-auto rounded-lg bg-ide p-3 font-mono text-xs leading-5 whitespace-pre-wrap text-syn-literal">
          {run.compileOutput || '—'}
        </pre>
      ) : (
        <>
          {run.tests.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {run.tests.map((t, i) => (
                <CaseChip
                  key={i}
                  selected={i === picked}
                  onClick={() => setPicked(i)}
                  tone={t.status === 'PASSED' || t.status === 'COMPLETED' ? 'good' : 'bad'}
                >
                  {t.kind === 'SAMPLE' ? `Ví dụ ${t.position}` : 'Tự nhập'}
                </CaseChip>
              ))}
            </div>
          )}
          {test && (
            <div key={picked} className="animate-in fade-in-0 space-y-3 duration-200">
              <Field label="Input">{test.display}</Field>
              <Field label="Kết quả">
                <span
                  className={
                    test.status === 'PASSED' || test.status === 'COMPLETED' ? '' : 'text-headsup'
                  }
                >
                  {formatValue(test.actual) || '—'}
                </span>
              </Field>
              {test.kind === 'SAMPLE' && (
                <Field label="Mong đợi">{formatValue(test.expected)}</Field>
              )}
              {test.console && <Field label="Console">{test.console}</Field>}
              {test.stderr && (
                <Field label="Lỗi">
                  <span className="text-headsup">{test.stderr}</span>
                </Field>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function TestPanel(props: {
  assignment: TestPanelAssignment;
  ws: TestPanelWorkspace;
  tab: TestTab;
  onTab: (tab: TestTab) => void;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Panel>
      <PanelTabs
        label="Kiểm thử"
        idPrefix="code-tests"
        value={props.tab}
        onChange={(tab) => {
          props.onTab(tab);
          if (!props.open) props.onToggle();
        }}
        tabs={[
          { id: 'cases', label: 'Testcase', icon: FlaskConical, tone: 'text-mint' },
          {
            id: 'result',
            label: 'Kết quả',
            icon: SquareTerminal,
            tone: 'text-coral',
            badge: props.ws.running ? (
              <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-coral" />
            ) : null,
          },
        ]}
        actions={
          <span className="hidden lg:inline-flex">
            <ToolButton
              label={props.open ? 'Thu gọn khung kiểm thử' : 'Mở khung kiểm thử'}
              onClick={props.onToggle}
            >
              <ChevronDown
                aria-hidden="true"
                className={cn('transition-transform duration-300', !props.open && 'rotate-180')}
              />
            </ToolButton>
          </span>
        }
      />
      <div
        id="code-tests-panel"
        role="tabpanel"
        aria-labelledby={`code-tests-tab-${props.tab}`}
        className="code-ide-scroll min-h-0 flex-1 overflow-y-auto"
      >
        <div hidden={props.tab !== 'cases'}>
          <Cases assignment={props.assignment} ws={props.ws} />
        </div>
        <div hidden={props.tab !== 'result'} className="h-full">
          <Result key={props.ws.runCount} ws={props.ws} />
        </div>
      </div>
    </Panel>
  );
}
