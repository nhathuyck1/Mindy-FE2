'use client';

import { useState } from 'react';
import { CheckCircle2, ClipboardPaste, Play, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import type { CodeLanguageKey, MentorAuthoring } from '../schemas/code-contracts';
import { CodeEditor } from './code-editor';
import { CodeBadge, CodeBlock, CodeMessage, CodeSection } from './code-ui';

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

let rowSeq = 0;
const newKey = () => `row-${++rowSeq}`;

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

/**
 * Step 3 — the reference solution is the source of truth: the mentor types inputs, the runner
 * computes expected outputs from the reference, then the whole table is saved and validated.
 */
export function CodeTestsStep(props: {
  data: MentorAuthoring;
  actions: ReturnType<typeof useAuthoringActions>;
  disabled: boolean;
  onValidated: () => void;
}) {
  const { data, actions } = props;
  const signature = data.problem?.signature;
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
          cells: (signature?.params ?? []).map(() => ''),
          sample: i < 2,
          weight: '1',
          explanation: '',
          stale: true,
        })),
  );
  const [bulk, setBulk] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const [compile, setCompile] = useState('');
  const [busy, setBusy] = useState('');
  const saved = new Map(data.references.map((r) => [r.languageKey, r]));

  if (!signature)
    return (
      <CodeSection title="Lời giải & test">
        <CodeMessage tone="error">Hoàn tất bước Hàm cần viết trước.</CodeMessage>
      </CodeSection>
    );
  const params = signature.params;
  const perTest = data.problem?.scoringMode === 'PER_TEST';
  const validated = data.validatedRevision === data.assignment.revision;
  const samples = rows.filter((r) => r.sample).length;
  const hidden = rows.length - samples;
  const ready = rows.length > 0 && rows.every((r) => r.expected && !r.stale && !r.error);

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
    setNotice(null);
    setCompile('');
    const inputs = parsedInputs();
    if (!inputs) return setNotice({ tone: 'error', text: 'Sửa các ô báo đỏ trước khi chạy.' });
    if (!sources[primary]?.trim())
      return setNotice({ tone: 'error', text: 'Viết lời giải mẫu trước.' });
    setBusy('Đang chạy lời giải mẫu…');
    try {
      const result = await actions.generate(primary, sources[primary] ?? '', inputs);
      if (result.compileStatus !== 'OK') {
        setCompile(result.compileOutput || 'Lời giải mẫu không biên dịch được.');
        setNotice({ tone: 'error', text: 'Lời giải mẫu bị lỗi biên dịch / cú pháp.' });
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
      setNotice(
        failed
          ? { tone: 'error', text: `${failed} test chưa có kết quả, xem dòng báo đỏ.` }
          : {
              tone: 'info',
              text: 'Đã điền kết quả từ lời giải mẫu. Kiểm tra lại rồi bấm Lưu & kiểm tra.',
            },
      );
    } catch (error) {
      setNotice({ tone: 'error', text: codeError(error, 'Chưa chạy được lời giải.') });
    } finally {
      setBusy('');
    }
  }

  async function saveAndValidate() {
    setNotice(null);
    const inputs = parsedInputs();
    if (!inputs || !ready)
      return setNotice({
        tone: 'error',
        text: 'Bấm "Chạy lời giải" để có kết quả cho mọi test trước.',
      });
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
        setNotice({ tone: 'info', text: 'Đề đã được kiểm tra: lời giải mẫu đạt toàn bộ test.' });
        props.onValidated();
      } else {
        const failed = result.results
          .map(
            (r) => `${r.languageKey === 'java21' ? 'Java' : 'JavaScript'}: ${r.passed}/${r.total}`,
          )
          .join(', ');
        setNotice({ tone: 'error', text: `Lời giải mẫu chưa đạt hết test (${failed}).` });
      }
    } catch (error) {
      setNotice({ tone: 'error', text: codeError(error, 'Chưa lưu được.') });
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-6">
      <CodeSection
        title="Lời giải mẫu"
        description="Chỉ cần một lời giải đúng. Hệ thống dùng nó để tính kết quả mong đợi cho mọi test."
      >
        <fieldset disabled={props.disabled} className="space-y-3">
          {languages.length > 1 && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Ngôn ngữ lời giải">
              {languages.map((lang) => (
                <Button
                  key={lang}
                  type="button"
                  role="tab"
                  aria-selected={lang === primary}
                  size="sm"
                  variant={lang === primary ? 'default' : 'outline'}
                  onClick={() => setPrimary(lang)}
                >
                  {lang === 'java21' ? 'Java' : 'JavaScript'}
                  {saved.get(lang) ? ' ✓' : ''}
                </Button>
              ))}
            </div>
          )}
          <CodeEditor
            label={`Lời giải mẫu ${primary === 'java21' ? 'Java' : 'JavaScript'}`}
            value={sources[primary] ?? ''}
            language={primary}
            indent={primary === 'java21' ? '    ' : '  '}
            onChange={(value) => {
              setSources((s) => ({ ...s, [primary]: value }));
              setRows((all) => all.map((r) => (r.expected ? { ...r, stale: true } : r)));
            }}
            rows={12}
          />
          {languages.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Kết quả test lấy từ ngôn ngữ đang chọn. Lời giải ngôn ngữ còn lại là tuỳ chọn; nếu có,
              hệ thống kiểm tra nó cũng đạt mọi test.
            </p>
          )}
          {compile && <CodeBlock label="Lỗi biên dịch" value={compile} />}
        </fieldset>
      </CodeSection>

      <CodeSection
        title="Test"
        description="Nhập input; kết quả do lời giải mẫu tạo ra. Test ví dụ hiện trong đề, test ẩn dùng để chấm."
        actions={
          <span className="text-sm text-muted-foreground">
            {samples} ví dụ · {hidden} ẩn · tối đa 30
          </span>
        }
      >
        <fieldset disabled={props.disabled} className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Cách nhập: số <code className="font-mono">5</code>, đúng/sai{' '}
            <code className="font-mono">true</code>, chuỗi gõ thẳng (
            <code className="font-mono">hello</code>), mảng{' '}
            <code className="font-mono">[1, 2, 3]</code>, ma trận{' '}
            <code className="font-mono">[[1, 2], [3, 4]]</code>.
          </p>
          <ol className="space-y-3">
            {rows.map((row, index) => (
              <li
                key={row.key}
                className={`space-y-3 rounded-xl border p-3 ${row.error ? 'border-headsup/50 bg-peach/40' : 'border-line'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Test {index + 1}</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="inline-flex rounded-lg border border-line p-0.5"
                      role="group"
                      aria-label={`Loại test ${index + 1}`}
                    >
                      {[
                        { value: true, label: 'Ví dụ' },
                        { value: false, label: 'Ẩn' },
                      ].map((o) => (
                        <button
                          key={o.label}
                          type="button"
                          aria-pressed={row.sample === o.value}
                          className={`rounded-md px-3 py-1 text-xs font-semibold ${row.sample === o.value ? 'bg-forest text-canvas' : 'text-forest'}`}
                          onClick={() => update(row.key, { sample: o.value })}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Xoá test ${index + 1}`}
                      onClick={() => setRows((all) => all.filter((r) => r.key !== row.key))}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {params.map((param, i) => (
                    <label key={param.name} className="space-y-1 text-xs">
                      <span className="font-semibold">
                        <span className="font-mono">{param.name}</span> · {typeLabels[param.type]}
                      </span>
                      <Input
                        className="font-mono"
                        placeholder={param.type === 'string' ? 'abc' : example(param.type)}
                        value={row.cells[i] ?? ''}
                        onChange={(e) =>
                          update(
                            row.key,
                            { cells: row.cells.map((c, j) => (j === i ? e.target.value : c)) },
                            true,
                          )
                        }
                      />
                    </label>
                  ))}
                  <div className="space-y-1 text-xs">
                    <span className="font-semibold">
                      Kết quả mong đợi · {typeLabels[signature.returnType]}
                    </span>
                    <p
                      className={`min-h-9 rounded-md border px-3 py-2 font-mono break-all ${row.expected && !row.stale ? 'border-mint/40 bg-soft' : 'border-dashed border-line text-muted-foreground'}`}
                    >
                      {row.expected && !row.stale
                        ? formatValue(row.expected.value)
                        : row.expected
                          ? 'Cần chạy lại lời giải'
                          : 'Chưa có — bấm Chạy lời giải'}
                    </p>
                  </div>
                </div>
                {(perTest || row.sample) && (
                  <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
                    {perTest && (
                      <label className="space-y-1 text-xs">
                        <span className="font-semibold">Trọng số</span>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={row.weight}
                          onChange={(e) => update(row.key, { weight: e.target.value })}
                        />
                      </label>
                    )}
                    {row.sample && (
                      <label className="space-y-1 text-xs">
                        <span className="font-semibold">Giải thích cho ví dụ (tuỳ chọn)</span>
                        <Input
                          maxLength={5000}
                          value={row.explanation}
                          onChange={(e) => update(row.key, { explanation: e.target.value })}
                        />
                      </label>
                    )}
                  </div>
                )}
                {row.error && (
                  <p role="alert" className="text-sm text-headsup">
                    {row.error}
                  </p>
                )}
                {row.detail && <CodeBlock value={row.detail} />}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={rows.length >= 30}
              onClick={() =>
                setRows((all) => [
                  ...all,
                  {
                    key: newKey(),
                    cells: params.map(() => ''),
                    sample: all.filter((r) => r.sample).length < 2,
                    weight: '1',
                    explanation: '',
                    stale: true,
                  },
                ])
              }
            >
              <Plus aria-hidden="true" /> Thêm test
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulk(bulk === null ? '' : null)}
            >
              <ClipboardPaste aria-hidden="true" /> Dán nhiều test
            </Button>
          </div>
          {bulk !== null && (
            <div className="space-y-2 rounded-xl bg-soft p-3">
              <label className="block space-y-1 text-sm font-semibold">
                Mỗi dòng một test, dạng {bulkExample(signature)}
                <Textarea
                  rows={5}
                  className="font-mono"
                  value={bulk}
                  onChange={(e) => setBulk(e.target.value)}
                />
              </label>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const parsed = parseBulk(signature, bulk);
                  if ('error' in parsed) return setNotice({ tone: 'error', text: parsed.error });
                  const keep = rows.filter((r) => r.cells.some((c) => c.trim()));
                  if (keep.length + parsed.rows.length > 30)
                    return setNotice({ tone: 'error', text: 'Tổng số test vượt quá 30.' });
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
                  setNotice({
                    tone: 'info',
                    text: `Đã thêm ${added.length} test. Bấm Chạy lời giải để có kết quả.`,
                  });
                }}
              >
                Thêm vào bảng
              </Button>
            </div>
          )}
        </fieldset>
      </CodeSection>

      <div className="sticky bottom-0 z-10 space-y-2 rounded-2xl border border-line bg-canvas/95 p-4 shadow-sm backdrop-blur">
        {samples === 0 && rows.length > 0 && (
          <CodeMessage>Cần ít nhất 1 test ví dụ để học viên hiểu đề.</CodeMessage>
        )}
        {hidden === 0 && rows.length > 0 && (
          <CodeMessage>Cần ít nhất 1 test ẩn để chấm điểm.</CodeMessage>
        )}
        {notice && <CodeMessage tone={notice.tone}>{notice.text}</CodeMessage>}
        {busy && <CodeMessage>{busy}</CodeMessage>}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={props.disabled || Boolean(busy)}
            onClick={generate}
          >
            <Play aria-hidden="true" /> Chạy lời giải
          </Button>
          <Button
            type="button"
            disabled={props.disabled || Boolean(busy) || !ready || samples === 0 || hidden === 0}
            onClick={saveAndValidate}
          >
            Lưu & kiểm tra
          </Button>
          {validated && (
            <span className="inline-flex items-center gap-1 text-sm text-mint">
              <CheckCircle2 className="size-4" aria-hidden="true" /> Đã kiểm tra phiên bản này
            </span>
          )}
          {data.references.map((r) =>
            r.lastValidation ? (
              <span key={r.languageKey} className="inline-flex items-center gap-1 text-xs">
                {r.languageKey === 'java21' ? 'Java' : 'JS'} {r.lastValidation.passed}/
                {r.lastValidation.total}
                <CodeBadge
                  value={
                    r.lastValidation.passed === r.lastValidation.total ? 'PASSED' : 'WRONG_ANSWER'
                  }
                />
              </span>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}
