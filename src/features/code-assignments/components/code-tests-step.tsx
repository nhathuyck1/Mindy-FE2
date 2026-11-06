'use client';

import { useState } from 'react';
import {
  Check,
  ChevronDown,
  ClipboardPaste,
  Code2,
  FlaskConical,
  ListChecks,
  Maximize2,
  Minimize2,
  Play,
  Plus,
  ShieldCheck,
  SquareTerminal,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { useAuthoringActions } from '../api/code-authoring-actions';
import { codeError } from '../api/code-queries';
import {
  bulkExample,
  formatCell,
  generatedStatusLabels,
  parseBulk,
  parseCell,
  typeLabels,
} from '../lib/code-authoring';
import { example, formatValue } from '../lib/code-format';
import type {
  CodeLanguageKey,
  CodeSignature,
  CodeValueType,
  MentorAuthoring,
} from '../schemas/code-contracts';
import { ActionButton, ActionGroup, IdeBody, PanelEmpty, StatusPill } from './code-chrome';
import { CodeEditor } from './code-editor';
import { Kbd, Panel, PanelTabs, TabCount, ToolButton } from './code-panel';
import { type CodeThemeId, codeThemeScheme, CodeThemePicker } from './code-theme';
import { ResizableSplit } from './resizable-split';

/** One editable test row. `expected` is only ever filled by running the reference solution. */
interface Row {
  key: string;
  cells: string[];
  sample: boolean;
  weight: string;
  explanation: string;
  expected?: { value: unknown };
  /** Inputs or reference changed since `expected` was produced. */
  stale: boolean;
  error?: string;
  detail?: string;
}

type RowState = 'ok' | 'stale' | 'error' | 'empty';
const rowState = (r: Row): RowState =>
  r.error ? 'error' : r.expected ? (r.stale ? 'stale' : 'ok') : 'empty';
const stateDot: Record<RowState, string> = {
  ok: 'bg-mint',
  stale: 'bg-coral',
  error: 'bg-headsup',
  empty: 'bg-line',
};

let rowSeq = 0;
const newKey = () => `row-${++rowSeq}`;
const languageName = (k: CodeLanguageKey) => (k === 'java21' ? 'Java' : 'JavaScript');
const GENERATING = 'Đang chạy lời giải mẫu…';

function rowsFrom(data: MentorAuthoring): Row[] {
  const params = data.problem?.signature.params ?? [];
  return data.tests.map((t) => ({
    key: newKey(),
    cells: params.map((p, i) => formatCell(p.type, t.inputArgs[i])),
    sample: t.visibility === 'SAMPLE',
    weight: String(t.weight),
    explanation: t.explanationMd ?? '',
    expected: { value: t.expected },
    stale: false,
  }));
}

function sourcesFrom(data: MentorAuthoring): Record<string, string> {
  const refs = new Map(data.references.map((r) => [r.languageKey, r.sourceCode]));
  return Object.fromEntries(
    data.languages.map((l) => [l.languageKey, refs.get(l.languageKey) ?? l.starterCode]),
  );
}

type RunSummary =
  { kind: 'compile'; output: string } | { kind: 'done'; ok: number; failed: number; at: number };

/**
 * Step "Lời giải & test" — laid out like the student workspace: tests on the left, the reference
 * solution in a dark editor on the right, run results below it. The reference is the source of
 * truth: the runner computes every expected output, then the table is saved and validated.
 */
export function CodeTestsStep(props: {
  data: MentorAuthoring;
  actions: ReturnType<typeof useAuthoringActions>;
  disabled: boolean;
  theme: CodeThemeId;
  onTheme: (theme: CodeThemeId) => void;
  renderHeader: (actions: React.ReactNode) => React.ReactNode;
  onValidated: () => void;
}) {
  const signature = props.data.problem?.signature;
  if (!signature)
    return (
      <>
        {props.renderHeader(null)}
        <IdeBody>
          <Panel>
            <PanelEmpty icon={Code2} title="Chưa có hàm cần viết">
              Hoàn tất bước Đề bài (tên hàm, tham số, ngôn ngữ) rồi lưu trước khi viết lời giải và
              test.
            </PanelEmpty>
          </Panel>
        </IdeBody>
      </>
    );
  return <TestsWorkbench {...props} signature={signature} />;
}

function TestsWorkbench(props: Parameters<typeof CodeTestsStep>[0] & { signature: CodeSignature }) {
  const { data, actions, signature } = props;
  const languages = data.languages.map((l) => l.languageKey);
  const [primary, setPrimary] = useState<CodeLanguageKey>(
    () =>
      data.references.find((r) => languages.includes(r.languageKey))?.languageKey ??
      (languages.includes('javascript') ? 'javascript' : (languages[0] ?? 'javascript')),
  );
  const [sources, setSources] = useState(() => sourcesFrom(data));
  const [rows, setRows] = useState<Row[]>(() =>
    data.tests.length
      ? rowsFrom(data)
      : Array.from({ length: 3 }, (_, i) => ({
          key: newKey(),
          cells: signature.params.map(() => ''),
          sample: i < 2,
          weight: '1',
          explanation: '',
          stale: true,
        })),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'sample' | 'hidden'>('all');
  const [bulk, setBulk] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [busy, setBusy] = useState('');
  const [run, setRun] = useState<RunSummary | null>(null);
  const [resultTab, setResultTab] = useState<'run' | 'check'>('run');
  const [resultOpen, setResultOpen] = useState(true);
  const [zen, setZen] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const saved = new Map(data.references.map((r) => [r.languageKey, r]));

  const params = signature.params;
  const perTest = data.problem?.scoringMode === 'PER_TEST';
  const validated = data.validatedRevision === data.assignment.revision;
  const samples = rows.filter((r) => r.sample).length;
  const hidden = rows.length - samples;
  const ready = rows.length > 0 && rows.every((r) => r.expected && !r.stale && !r.error);
  const working = props.disabled || Boolean(busy);
  const visible = rows.filter((r) => filter === 'all' || r.sample === (filter === 'sample'));

  const update = (key: string, change: Partial<Row>, invalidate = false) =>
    setRows((all) =>
      all.map((r) =>
        r.key === key
          ? { ...r, ...change, ...(invalidate ? { stale: true, error: undefined } : {}) }
          : r,
      ),
    );

  function parsedInputs(): unknown[][] | null {
    let ok = true;
    const inputs: unknown[][] = [];
    const next = rows.map((row) => {
      const args: unknown[] = [];
      for (const [i, param] of params.entries()) {
        const cell = parseCell(param.type, row.cells[i] ?? '');
        if ('error' in cell) {
          ok = false;
          return { ...row, error: `${param.name}: ${cell.error}`, detail: undefined };
        }
        args.push(cell.value);
      }
      inputs.push(args);
      return row;
    });
    setRows(next);
    return ok ? inputs : null;
  }

  async function generate() {
    if (working) return;
    setResultTab('run');
    setResultOpen(true);
    const inputs = parsedInputs();
    if (!inputs) return void toast.error('Sửa các ô báo đỏ trước khi chạy.');
    if (!sources[primary]?.trim()) return void toast.error('Viết lời giải mẫu trước.');
    setBusy(GENERATING);
    try {
      const result = await actions.generate(primary, sources[primary] ?? '', inputs);
      if (result.compileStatus !== 'OK') {
        setRun({
          kind: 'compile',
          output: result.compileOutput || 'Lời giải mẫu không biên dịch được.',
        });
        return;
      }
      setRows((all) =>
        all.map((row, i) => {
          const out = result.outputs[i];
          if (!out) return row;
          return out.status === 'OK'
            ? {
                ...row,
                expected: { value: out.expected },
                stale: false,
                error: undefined,
                detail: undefined,
              }
            : {
                ...row,
                expected: undefined,
                stale: false,
                error: generatedStatusLabels[out.status] ?? out.status,
                detail:
                  [out.stderr, out.console].filter(Boolean).join('\n').slice(0, 600) || undefined,
              };
        }),
      );
      const failed = result.outputs.filter((o) => o.status !== 'OK').length;
      setRun({ kind: 'done', ok: result.outputs.length - failed, failed, at: Date.now() });
    } catch (error) {
      toast.error(codeError(error, 'Chưa chạy được lời giải.'));
    } finally {
      setBusy('');
    }
  }

  async function saveAndValidate() {
    if (working) return;
    setResultTab('check');
    setResultOpen(true);
    const inputs = parsedInputs();
    if (!inputs || !ready)
      return void toast.error('Bấm "Chạy lời giải" để có kết quả cho mọi test trước.');
    if (!samples || !hidden) return void toast.error('Cần ít nhất 1 test ví dụ và 1 test ẩn.');
    try {
      let revision = data.assignment.revision;
      setBusy('Đang lưu lời giải mẫu…');
      for (const lang of languages) {
        const source = sources[lang]?.trim() ? (sources[lang] ?? '') : '';
        const starter = data.languages.find((l) => l.languageKey === lang)?.starterCode;
        const changed = source !== (saved.get(lang)?.sourceCode ?? '');
        // Only the primary language is required; others are saved when the mentor wrote them.
        if (changed && source && (lang === primary || source !== starter))
          revision = (await actions.put(`code-reference/${lang}`, revision, { sourceCode: source }))
            .assignment.revision;
      }
      setBusy('Đang lưu test…');
      revision = (
        await actions.put('code-tests', revision, {
          tests: rows.map((row, i) => ({
            visibility: row.sample ? 'SAMPLE' : 'HIDDEN',
            inputArgs: inputs[i],
            expected: row.expected?.value,
            ...(perTest ? { weight: Number(row.weight) || 1 } : {}),
            ...(row.sample && row.explanation.trim()
              ? { explanationMd: row.explanation.trim() }
              : {}),
          })),
        })
      ).assignment.revision;
      setBusy('Đang kiểm tra đề với lời giải mẫu…');
      const result = await actions.validate(revision);
      if (result.validated) {
        toast.success('Đề đã được kiểm tra', {
          description: 'Lời giải mẫu đạt toàn bộ test. Có thể sang bước Giao đề.',
        });
        props.onValidated();
      } else {
        const failed = result.results
          .map((r) => `${languageName(r.languageKey)}: ${r.passed}/${r.total}`)
          .join(', ');
        toast.error(`Lời giải mẫu chưa đạt hết test (${failed}).`);
      }
    } catch (error) {
      toast.error(codeError(error, 'Chưa lưu được.'));
    } finally {
      setBusy('');
    }
  }

  function addRow() {
    const key = newKey();
    setRows((all) => [
      ...all,
      {
        key,
        cells: params.map(() => ''),
        sample: filter === 'sample' || (filter === 'all' && all.filter((r) => r.sample).length < 2),
        weight: '1',
        explanation: '',
        stale: true,
      },
    ]);
    setSelected(key);
  }

  function addBulk() {
    if (bulk === null) return;
    const parsed = parseBulk(signature, bulk);
    if ('error' in parsed) return setBulkError(parsed.error);
    const keep = rows.filter((r) => r.cells.some((c) => c.trim()));
    if (keep.length + parsed.rows.length > 30) return setBulkError('Tổng số test vượt quá 30.');
    const added: Row[] = parsed.rows.map((args, i) => ({
      key: newKey(),
      cells: params.map((p, j) => formatCell(p.type, args[j])),
      sample: keep.filter((r) => r.sample).length + i < 2,
      weight: '1',
      explanation: '',
      stale: true,
    }));
    setRows([...keep, ...added]);
    setBulk(null);
    setBulkError('');
    toast.success(`Đã thêm ${added.length} test`, {
      description: 'Bấm Chạy lời giải để có kết quả.',
    });
  }

  function onShortcut(event: React.KeyboardEvent) {
    if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
    event.preventDefault();
    event.stopPropagation();
    void (event.shiftKey ? saveAndValidate() : generate());
  }

  const headerActions = (
    <>
      {validated ? (
        <StatusPill tone="mint">Đã kiểm tra</StatusPill>
      ) : ready ? (
        <StatusPill tone="coral">Chưa lưu</StatusPill>
      ) : null}
      <ActionGroup>
        <ActionButton
          icon={Play}
          iconClassName="fill-current text-mint"
          onClick={generate}
          busy={busy === GENERATING}
          disabled={working}
          title="Chạy lời giải mẫu để tính kết quả mọi test (Ctrl/⌘ + Enter)"
        >
          Chạy lời giải
        </ActionButton>
        <ActionButton
          primary
          icon={ShieldCheck}
          onClick={saveAndValidate}
          busy={Boolean(busy) && busy !== GENERATING}
          disabled={working || !ready || samples === 0 || hidden === 0}
          title="Lưu lời giải, test và kiểm tra lại toàn bộ (Ctrl/⌘ + Shift + Enter)"
        >
          Lưu & kiểm tra
        </ActionButton>
      </ActionGroup>
    </>
  );

  const checklist = [
    { ok: samples > 0, text: 'Có ít nhất 1 test ví dụ (hiện trong đề)' },
    { ok: hidden > 0, text: 'Có ít nhất 1 test ẩn (dùng để chấm)' },
    { ok: ready, text: 'Mọi test đã có kết quả từ lời giải mẫu' },
    { ok: validated, text: 'Đã lưu & kiểm tra phiên bản hiện tại' },
  ];

  const testsPanel = (
    <Panel label="Test">
      <PanelTabs
        label="Lọc test"
        idPrefix="studio-tests"
        value={filter}
        onChange={setFilter}
        tabs={[
          {
            id: 'all',
            label: 'Tất cả',
            icon: ListChecks,
            tone: 'text-mint',
            badge: <TabCount value={rows.length} />,
          },
          {
            id: 'sample',
            label: 'Ví dụ',
            icon: FlaskConical,
            tone: 'text-mint',
            badge: <TabCount value={samples} />,
          },
          {
            id: 'hidden',
            label: 'Ẩn',
            icon: ShieldCheck,
            tone: 'text-coral',
            badge: <TabCount value={hidden} />,
          },
        ]}
      />
      <div
        id="studio-tests-panel"
        role="tabpanel"
        aria-labelledby={`studio-tests-tab-${filter}`}
        className="code-ide-scroll min-h-0 flex-1 overflow-y-auto"
      >
        <p className="px-4 pt-3 text-xs leading-5 text-muted/75">
          Số <code className="font-mono text-black">5</code> · đúng/sai{' '}
          <code className="font-mono text-black">true</code> · chuỗi gõ thẳng{' '}
          <code className="font-mono text-black">hello</code> · mảng{' '}
          <code className="font-mono text-black">[1, 2]</code> · ma trận{' '}
          <code className="font-mono text-black">[[1, 2], [3, 4]]</code>
        </p>
        {visible.length === 0 ? (
          <PanelEmpty icon={FlaskConical} title="Chưa có test nào ở đây">
            Bấm Thêm test hoặc dán nhiều test một lúc.
          </PanelEmpty>
        ) : (
          <ol className="space-y-1.5 p-2">
            {visible.map((row) => (
              <TestRow
                key={row.key}
                row={row}
                index={rows.indexOf(row)}
                params={params}
                returnType={signature.returnType}
                perTest={perTest}
                selected={selected === row.key}
                disabled={working}
                onSelect={() => setSelected(row.key)}
                onChange={(change, invalidate) => update(row.key, change, invalidate)}
                onRemove={() => setRows((all) => all.filter((r) => r.key !== row.key))}
              />
            ))}
          </ol>
        )}
      </div>
      {bulk !== null && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 space-y-2 border-t border-line bg-soft/60 p-3 duration-200">
          <label className="block space-y-1.5">
            <span className="block text-xs font-bold text-muted/80">
              Mỗi dòng một test, dạng{' '}
              <code className="font-mono text-black">{bulkExample(signature)}</code>
            </span>
            <textarea
              rows={4}
              value={bulk}
              spellCheck={false}
              onChange={(e) => {
                setBulk(e.target.value);
                setBulkError('');
              }}
              className="w-full resize-y rounded-lg border border-line bg-canvas px-3 py-2 font-mono text-[13px] outline-none focus:border-mint"
            />
          </label>
          {bulkError && (
            <p role="alert" className="text-xs font-bold text-headsup">
              {bulkError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <SmallButton onClick={() => setBulk(null)}>Huỷ</SmallButton>
            <SmallButton primary onClick={addBulk}>
              Thêm vào bảng
            </SmallButton>
          </div>
        </div>
      )}
      <div className="flex shrink-0 items-center gap-1 border-t border-line px-2 py-1.5">
        <SmallButton onClick={addRow} disabled={rows.length >= 30 || working}>
          <Plus aria-hidden="true" className="size-3.5" /> Thêm test
        </SmallButton>
        <SmallButton
          onClick={() => setBulk(bulk === null ? '' : null)}
          disabled={working}
          pressed={bulk !== null}
        >
          <ClipboardPaste aria-hidden="true" className="size-3.5" /> Dán nhiều test
        </SmallButton>
        <span className="ml-auto pr-1 text-xs text-muted/70 tabular-nums">
          {rows.length}/30 test
        </span>
      </div>
    </Panel>
  );

  const editorPane = (
    <section
      aria-label="Lời giải mẫu"
      style={{ colorScheme: codeThemeScheme(props.theme) }}
      className="flex h-[min(70dvh,34rem)] min-h-0 flex-col overflow-hidden rounded-xl bg-ide shadow-[0_1px_3px] shadow-forest/20 ring-1 ring-ide-line lg:h-full"
    >
      <div className="flex h-10 shrink-0 items-center gap-1.5 border-b border-ide-line bg-ide-deep pr-1.5 pl-3">
        <Code2 aria-hidden="true" className="size-4 text-syn-string" />
        <span className="mr-1 text-[13px] font-bold whitespace-nowrap text-ide-text">
          Lời giải mẫu
        </span>
        <span aria-hidden="true" className="mx-1 h-4 w-px bg-ide-line" />
        <div role="tablist" aria-label="Ngôn ngữ lời giải" className="flex gap-0.5">
          {languages.map((lang) => (
            <button
              key={lang}
              type="button"
              role="tab"
              aria-selected={lang === primary}
              onClick={() => setPrimary(lang)}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-bold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-mint',
                lang === primary
                  ? 'bg-ide-raised text-ide-text'
                  : 'text-ide-muted hover:text-ide-text',
              )}
            >
              {languageName(lang)}
              {saved.get(lang) && (
                <Check aria-label="đã lưu" className="size-3 text-syn-string" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
        <span className="ml-auto" />
        <CodeThemePicker value={props.theme} onChange={props.onTheme} />
        <span className="hidden lg:inline-flex">
          <ToolButton
            dark
            label={zen ? 'Thu nhỏ khung lời giải' : 'Phóng to khung lời giải'}
            pressed={zen}
            onClick={() => setZen(!zen)}
          >
            {zen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </ToolButton>
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor
          fill
          label={`Lời giải mẫu ${languageName(primary)}`}
          value={sources[primary] ?? ''}
          language={primary}
          indent={primary === 'java21' ? '    ' : '  '}
          readOnly={props.disabled}
          onCursor={(line, column) => setCursor({ line, column })}
          onChange={(value) => {
            setSources((s) => ({ ...s, [primary]: value }));
            setRows((all) => all.map((r) => (r.expected ? { ...r, stale: true } : r)));
          }}
        />
      </div>
      <div className="flex h-7 shrink-0 items-center gap-4 border-t border-ide-line bg-ide-deep px-3 text-[11.5px] text-ide-muted">
        <span className="tabular-nums">
          Dòng {cursor.line}, Cột {cursor.column}
        </span>
        {languages.length > 1 && (
          <span className="hidden truncate sm:inline">
            Kết quả test lấy từ {languageName(primary)}; ngôn ngữ còn lại là tuỳ chọn.
          </span>
        )}
        <span className="ml-auto hidden items-center gap-1.5 md:inline-flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>↵</Kbd> chạy lời giải
        </span>
      </div>
    </section>
  );

  const resultPanel = (
    <Panel>
      <PanelTabs
        label="Kết quả"
        idPrefix="studio-result"
        value={resultTab}
        onChange={(tab) => {
          setResultTab(tab);
          if (!resultOpen) setResultOpen(true);
        }}
        tabs={[
          {
            id: 'run',
            label: 'Kết quả chạy',
            icon: SquareTerminal,
            tone: 'text-coral',
            badge: busy ? (
              <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-coral" />
            ) : null,
          },
          { id: 'check', label: 'Kiểm tra đề', icon: ShieldCheck, tone: 'text-mint' },
        ]}
        actions={
          <span className="hidden lg:inline-flex">
            <ToolButton
              label={resultOpen ? 'Thu gọn khung kết quả' : 'Mở khung kết quả'}
              onClick={() => setResultOpen(!resultOpen)}
            >
              <ChevronDown
                aria-hidden="true"
                className={cn('transition-transform duration-300', !resultOpen && 'rotate-180')}
              />
            </ToolButton>
          </span>
        }
      />
      <div
        id="studio-result-panel"
        role="tabpanel"
        aria-labelledby={`studio-result-tab-${resultTab}`}
        className="code-ide-scroll min-h-0 flex-1 overflow-y-auto"
      >
        {busy ? (
          <div role="status" className="space-y-3 px-4 py-4">
            <p className="flex items-center gap-2 text-sm font-bold text-muted">
              <span className="size-1.5 animate-pulse rounded-full bg-mint" /> {busy}
            </p>
            {[70, 45, 85].map((w) => (
              <div
                key={w}
                className="h-8 animate-pulse rounded-lg bg-soft"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : resultTab === 'run' ? (
          <RunResult
            run={run}
            rows={rows}
            onPick={(key) => {
              setFilter('all');
              setSelected(key);
            }}
          />
        ) : (
          <div className="animate-in fade-in-0 space-y-4 px-4 py-3 duration-200">
            <ul className="space-y-2">
              {checklist.map((c) => (
                <li key={c.text} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={cn(
                      'grid size-4.5 shrink-0 place-items-center rounded-full transition-colors duration-300',
                      c.ok ? 'bg-mint text-canvas' : 'bg-soft text-muted ring-1 ring-line',
                    )}
                  >
                    {c.ok ? (
                      <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                    ) : (
                      <X aria-hidden="true" className="size-2.5" strokeWidth={3} />
                    )}
                  </span>
                  <span className={c.ok ? 'text-black' : 'text-muted/80'}>
                    {c.text}
                    <span className="sr-only">{c.ok ? ': đạt' : ': chưa đạt'}</span>
                  </span>
                </li>
              ))}
            </ul>
            {data.references.some((r) => r.lastValidation) && (
              <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                {data.references.map((r) =>
                  r.lastValidation ? (
                    <span
                      key={r.languageKey}
                      className={cn(
                        'inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-bold',
                        r.lastValidation.passed === r.lastValidation.total
                          ? 'bg-mint/10 text-mint'
                          : 'bg-headsup/10 text-headsup',
                      )}
                    >
                      {languageName(r.languageKey)} đạt {r.lastValidation.passed}/
                      {r.lastValidation.total} test
                    </span>
                  ) : null,
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );

  return (
    <>
      {props.renderHeader(headerActions)}
      <IdeBody>
        <div className="flex min-h-0 flex-1 flex-col" onKeyDownCapture={onShortcut}>
          <ResizableSplit
            direction="horizontal"
            storageKey="mindy.studio.tests.x"
            defaultRatio={0.46}
            minFirst={380}
            minSecond={440}
            collapse={zen ? 'first' : null}
            label="Kéo để đổi độ rộng bảng test và lời giải"
            className="flex-1"
            first={testsPanel}
            second={
              <ResizableSplit
                direction="vertical"
                storageKey="mindy.studio.tests.y"
                defaultRatio={0.62}
                minFirst={180}
                minSecond={150}
                collapse={resultOpen ? null : 'second'}
                collapsedSize={40}
                label="Kéo để đổi chiều cao lời giải và kết quả"
                className="h-full"
                first={editorPane}
                second={resultPanel}
              />
            }
          />
        </div>
      </IdeBody>
    </>
  );
}

function SmallButton(props: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      aria-pressed={props.pressed}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-bold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-45',
        props.primary
          ? 'bg-forest text-canvas hover:bg-mint'
          : 'text-black hover:bg-soft aria-pressed:bg-soft',
      )}
    >
      {props.children}
    </button>
  );
}

const fieldClass =
  'h-8 w-full rounded-lg border border-transparent bg-soft/80 px-2.5 text-[13px] text-black transition-colors outline-none placeholder:text-muted/35 hover:border-line focus:border-mint focus:bg-canvas disabled:opacity-60';

function TestRow(props: {
  row: Row;
  index: number;
  params: CodeSignature['params'];
  returnType: CodeValueType;
  perTest: boolean;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onChange: (change: Partial<Row>, invalidate?: boolean) => void;
  onRemove: () => void;
}) {
  const { row } = props;
  const state = rowState(row);
  return (
    <li
      onFocusCapture={props.onSelect}
      onPointerDown={props.onSelect}
      className={cn(
        'group animate-in fade-in-0 slide-in-from-bottom-1 rounded-xl border px-3 py-2.5 transition-[border-color,background-color,box-shadow] duration-200',
        props.selected
          ? 'border-mint/50 bg-canvas shadow-[0_1px_3px] shadow-forest/10'
          : state === 'error'
            ? 'border-headsup/30 bg-peach/40'
            : 'border-transparent hover:border-line hover:bg-soft/40',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            'size-2 shrink-0 rounded-full transition-colors duration-300',
            stateDot[state],
          )}
        />
        <span className="text-[13px] font-extrabold">Test {props.index + 1}</span>
        <div
          role="group"
          aria-label={`Loại test ${props.index + 1}`}
          className="ml-1 inline-flex rounded-md bg-soft p-0.5"
        >
          {[
            { value: true, label: 'Ví dụ' },
            { value: false, label: 'Ẩn' },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={row.sample === o.value}
              disabled={props.disabled}
              onClick={() => props.onChange({ sample: o.value })}
              className={cn(
                'rounded px-2 py-0.5 text-[11.5px] font-bold transition-colors duration-150',
                row.sample === o.value
                  ? 'bg-canvas text-black shadow-[0_1px_1px] shadow-forest/10'
                  : 'text-muted/70 hover:text-black',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <span className="ml-auto" />
        <button
          type="button"
          aria-label={`Xoá test ${props.index + 1}`}
          disabled={props.disabled}
          onClick={props.onRemove}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted/50 opacity-0 transition-all duration-150 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-peach hover:text-headsup focus-visible:opacity-100 max-lg:opacity-100"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
        </button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
        {props.params.map((param, i) => (
          <label key={param.name} className="block min-w-0 space-y-1">
            <span className="flex items-baseline gap-1.5 text-[11.5px]">
              <span className="font-mono font-bold text-black">{param.name}</span>
              <span className="truncate text-muted/60">{typeLabels[param.type]}</span>
            </span>
            <input
              value={row.cells[i] ?? ''}
              placeholder={param.type === 'string' ? 'abc' : example(param.type)}
              disabled={props.disabled}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) =>
                props.onChange(
                  { cells: row.cells.map((c, j) => (j === i ? e.target.value : c)) },
                  true,
                )
              }
              className={cn(fieldClass, 'font-mono')}
            />
          </label>
        ))}
        <div className="min-w-0 space-y-1">
          <span className="flex items-baseline gap-1.5 text-[11.5px]">
            <span className="font-bold text-black">Kết quả</span>
            <span className="truncate text-muted/60">{typeLabels[props.returnType]}</span>
          </span>
          <p
            className={cn(
              'flex h-8 items-center truncate rounded-lg px-2.5 text-[13px] transition-colors duration-300',
              state === 'ok' && 'bg-mint/8 font-mono text-forest',
              state === 'stale' && 'bg-coral/10 text-xs font-bold text-black/70',
              state === 'empty' && 'border border-dashed border-line text-xs text-muted/60',
              state === 'error' && 'bg-headsup/10 text-xs font-bold text-headsup',
            )}
          >
            {state === 'ok'
              ? formatValue(row.expected?.value)
              : state === 'stale'
                ? 'Cần chạy lại'
                : state === 'error'
                  ? 'Lỗi khi chạy'
                  : 'Chưa chạy'}
          </p>
        </div>
      </div>
      {props.selected && (props.perTest || row.sample || row.error) && (
        <div className="animate-in fade-in-0 slide-in-from-top-1 mt-2.5 space-y-2 border-t border-line pt-2.5 duration-200">
          {row.error && (
            <p role="alert" className="text-xs font-bold text-headsup">
              {row.error}
            </p>
          )}
          {row.detail && (
            <pre className="code-ide-dark-scroll max-h-40 overflow-auto rounded-lg bg-ide p-2.5 font-mono text-xs leading-5 whitespace-pre-wrap text-syn-literal">
              {row.detail}
            </pre>
          )}
          <div className="grid gap-2 sm:grid-cols-[7rem_1fr]">
            {props.perTest && (
              <label className="block space-y-1">
                <span className="block text-[11.5px] font-bold">Trọng số</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={row.weight}
                  disabled={props.disabled}
                  onChange={(e) => props.onChange({ weight: e.target.value })}
                  className={fieldClass}
                />
              </label>
            )}
            {row.sample && (
              <label className="block space-y-1 sm:col-start-2">
                <span className="block text-[11.5px] font-bold">
                  Giải thích cho ví dụ (tuỳ chọn)
                </span>
                <input
                  maxLength={5000}
                  value={row.explanation}
                  disabled={props.disabled}
                  placeholder="Vì 2 + 7 = 9 nên trả về [0, 1]"
                  onChange={(e) => props.onChange({ explanation: e.target.value })}
                  className={fieldClass}
                />
              </label>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function RunResult(props: { run: RunSummary | null; rows: Row[]; onPick: (key: string) => void }) {
  const { run } = props;
  if (!run)
    return (
      <PanelEmpty icon={Play} title="Chưa chạy lời giải">
        Bấm <b className="text-black">Chạy lời giải</b> hoặc <Kbd>Ctrl</Kbd> <Kbd>↵</Kbd>, máy sẽ
        tính kết quả cho mọi test từ lời giải mẫu.
      </PanelEmpty>
    );
  if (run.kind === 'compile')
    return (
      <section
        aria-label="Lỗi biên dịch"
        className="animate-in fade-in-0 space-y-3 px-4 py-3 duration-200"
      >
        <p className="text-lg font-extrabold text-headsup">Lỗi biên dịch</p>
        <pre className="code-ide-dark-scroll max-h-64 overflow-auto rounded-lg bg-ide p-3 font-mono text-xs leading-5 whitespace-pre-wrap text-syn-literal">
          {run.output}
        </pre>
      </section>
    );
  return (
    <section aria-label="Kết quả chạy lời giải" className="space-y-3 px-4 py-3">
      <p className="flex flex-wrap items-baseline gap-x-3">
        <span
          key={run.at}
          className={cn(
            'animate-in fade-in-0 zoom-in-95 text-lg font-extrabold duration-300',
            run.failed ? 'text-headsup' : 'text-mint',
          )}
        >
          {run.failed ? `${run.failed} test bị lỗi` : 'Đã có kết quả cho mọi test'}
        </span>
        <span className="text-xs text-muted/70">
          {run.ok}/{run.ok + run.failed} test chạy được
        </span>
      </p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {props.rows.map((row, i) => {
          const state = rowState(row);
          return (
            <li key={row.key}>
              <button
                type="button"
                onClick={() => props.onPick(row.key)}
                className="flex w-full items-center gap-2 rounded-lg bg-soft/70 px-3 py-2 text-left text-[13px] transition-colors hover:bg-soft"
              >
                <span
                  aria-hidden="true"
                  className={cn('size-1.5 shrink-0 rounded-full', stateDot[state])}
                />
                <span className="font-bold">Test {i + 1}</span>
                <span className="text-xs text-muted/60">{row.sample ? 'ví dụ' : 'ẩn'}</span>
                <span
                  className={cn(
                    'ml-auto truncate text-xs',
                    state === 'error' ? 'font-bold text-headsup' : 'font-mono text-black/75',
                  )}
                >
                  {state === 'ok'
                    ? formatValue(row.expected?.value)
                    : state === 'error'
                      ? row.error
                      : state === 'stale'
                        ? 'cần chạy lại'
                        : '—'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
