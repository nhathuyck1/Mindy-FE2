'use client';

import { useEffect, useRef, useState } from 'react';
import { Braces, Code2, Eye, FileText, Info, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCodeCommand } from '../api/code-queries';
import { type ProblemForm, formProblems, typeLabels } from '../lib/code-authoring';
import { formatValue } from '../lib/code-format';
import {
  type CodeLanguageKey,
  type CodeSignature,
  type CodeValueType,
  codeValueTypes,
  type MentorAuthoring,
  starterPreviewSchema,
} from '../schemas/code-contracts';
import { IdeBody, PanelEmpty } from './code-chrome';
import { CodeEditor } from './code-editor';
import { Panel, PanelTabs } from './code-panel';
import { ProblemDescription, type ProblemView } from './code-problem-pane';
import { type CodeThemeId, codeThemeScheme, CodeThemePicker } from './code-theme';
import { ResizableSplit } from './resizable-split';

type SetForm = (update: (form: ProblemForm) => ProblemForm) => void;
const languageName = (k: CodeLanguageKey) => (k === 'java21' ? 'Java' : 'JavaScript');

export const fieldClass =
  'w-full rounded-lg border border-transparent bg-soft/80 px-3 text-[13.5px] text-black transition-colors outline-none placeholder:text-muted/40 hover:border-line focus:border-mint focus:bg-canvas disabled:opacity-60';

export function Field(props: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-bold text-black">{props.label}</span>
        {props.hint && <span className="text-[11.5px] text-muted/60">{props.hint}</span>}
      </span>
      {props.children}
    </label>
  );
}

function Segmented<T extends string>(props: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={props.label} className="inline-flex rounded-lg bg-soft p-1">
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={props.value === o.value}
          disabled={props.disabled}
          onClick={() => props.onChange(o.value)}
          className={cn(
            'h-7 rounded-md px-3 text-[13px] font-bold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-mint',
            props.value === o.value
              ? 'bg-canvas text-black shadow-[0_1px_2px] shadow-forest/10'
              : 'text-muted/70 hover:text-black',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Wrap the textarea selection with markdown markers, keeping native undo. */
function wrapSelection(el: HTMLTextAreaElement | null, before: string, after: string) {
  if (!el) return;
  const { selectionStart: start, selectionEnd: end, value } = el;
  const text = before + value.slice(start, end) + after;
  el.focus();
  el.setSelectionRange(start, end);
  if (!document.execCommand('insertText', false, text)) {
    el.setRangeText(text, start, end, 'end');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  el.setSelectionRange(start + before.length, start + text.length - after.length);
}

/** Live preview data from the unsaved form plus the saved sample tests. */
export function previewView(form: ProblemForm, data: MentorAuthoring): ProblemView {
  const params = form.signature.params;
  const samples = data.tests.filter((t) => t.visibility === 'SAMPLE');
  return {
    problem: {
      statementMd: form.statementMd,
      constraintsMd: form.constraintsMd,
      difficulty: form.difficulty || null,
      signature: form.signature,
      cpuTimeLimitMs: Number(form.cpuTimeLimitMs) || 0,
      memoryLimitMb: Number(form.memoryLimitMb) || 0,
    },
    samples: samples.map((t, i) => ({
      position: i + 1,
      display: params.map((p, j) => `${p.name} = ${formatValue(t.inputArgs[j])}`).join(', '),
      expected: t.expected,
      explanationMd: t.explanationMd ?? null,
    })),
    hiddenTestCount: data.tests.length - samples.length,
  };
}

type FormTab = 'statement' | 'function' | 'advanced';
type PreviewTab = 'student' | 'starter';

/**
 * Step "Đề bài" (statement + function signature, saved together): form on the left, the exact
 * student view and the generated starter code on the right.
 */
export function ProblemStep(props: {
  form: ProblemForm;
  setForm: SetForm;
  data: MentorAuthoring;
  disabled: boolean;
  theme: CodeThemeId;
  onTheme: (theme: CodeThemeId) => void;
  quickStart: React.ReactNode;
  renderHeader: (actions: React.ReactNode) => React.ReactNode;
  headerActions: React.ReactNode;
}) {
  const { form, setForm } = props;
  const [tab, setTab] = useState<FormTab>('statement');
  const [preview, setPreview] = useState<PreviewTab>('student');
  const problems = formProblems(form);
  const fnErrors = problems.length > 0;

  return (
    <>
      {props.renderHeader(props.headerActions)}
      <IdeBody>
        <ResizableSplit
          direction="horizontal"
          storageKey="mindy.studio.problem.x"
          defaultRatio={0.5}
          minFirst={380}
          minSecond={380}
          label="Kéo để đổi độ rộng phần soạn đề và xem trước"
          className="flex-1"
          first={
            <Panel label="Soạn đề">
              <PanelTabs
                label="Phần soạn"
                idPrefix="studio-form"
                value={tab}
                onChange={(next) => {
                  setTab(next);
                  if (next === 'function') setPreview('starter');
                  if (next === 'statement') setPreview('student');
                }}
                tabs={[
                  { id: 'statement', label: 'Đề bài', icon: FileText, tone: 'text-mint' },
                  {
                    id: 'function',
                    label: 'Hàm cần viết',
                    icon: Braces,
                    tone: 'text-coral',
                    badge: fnErrors ? (
                      <span aria-label="có lỗi" className="size-1.5 rounded-full bg-headsup" />
                    ) : null,
                  },
                  { id: 'advanced', label: 'Nâng cao', icon: SlidersHorizontal },
                ]}
              />
              <div
                id="studio-form-panel"
                role="tabpanel"
                aria-labelledby={`studio-form-tab-${tab}`}
                className="code-ide-scroll min-h-0 flex-1 overflow-y-auto"
              >
                <div hidden={tab !== 'statement'} className="animate-in fade-in-0 duration-200">
                  {props.quickStart}
                  <StatementForm form={form} setForm={setForm} disabled={props.disabled} />
                </div>
                <div hidden={tab !== 'function'} className="animate-in fade-in-0 duration-200">
                  <FunctionForm
                    form={form}
                    setForm={setForm}
                    data={props.data}
                    disabled={props.disabled}
                    problems={problems}
                  />
                </div>
                <div hidden={tab !== 'advanced'} className="animate-in fade-in-0 duration-200">
                  <AdvancedForm form={form} setForm={setForm} disabled={props.disabled} />
                </div>
              </div>
            </Panel>
          }
          second={
            <Panel label="Xem trước">
              <PanelTabs
                label="Xem trước"
                idPrefix="studio-preview"
                value={preview}
                onChange={setPreview}
                tabs={[
                  { id: 'student', label: 'Học viên sẽ thấy', icon: Eye, tone: 'text-mint' },
                  { id: 'starter', label: 'Code khởi đầu', icon: Code2, tone: 'text-coral' },
                ]}
              />
              <div
                id="studio-preview-panel"
                role="tabpanel"
                aria-labelledby={`studio-preview-tab-${preview}`}
                className="relative min-h-0 flex-1"
              >
                <div
                  hidden={preview !== 'student'}
                  className="code-ide-scroll animate-in fade-in-0 h-full overflow-y-auto duration-200"
                >
                  <ProblemDescription assignment={previewView(form, props.data)} footnote={false} />
                </div>
                <div
                  hidden={preview !== 'starter'}
                  className="animate-in fade-in-0 h-full duration-200"
                >
                  <StarterPreview
                    signature={form.signature}
                    languages={form.languages}
                    valid={!fnErrors}
                    theme={props.theme}
                    onTheme={props.onTheme}
                  />
                </div>
              </div>
            </Panel>
          }
        />
      </IdeBody>
    </>
  );
}

function StatementForm(props: { form: ProblemForm; setForm: SetForm; disabled: boolean }) {
  const { form, setForm } = props;
  const statement = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="space-y-5 px-5 py-4">
      <div className="space-y-1.5">
        <div className="flex items-end justify-between gap-3">
          <label htmlFor="studio-statement" className="text-[12.5px] font-bold text-black">
            Mô tả đề
          </label>
          <div className="flex items-center gap-0.5" aria-label="Định dạng nhanh">
            <MarkButton
              onClick={() => wrapSelection(statement.current, '`', '`')}
              label="Mã trong dòng"
            >
              <code className="font-mono text-[12px]">`a`</code>
            </MarkButton>
            <MarkButton
              onClick={() => wrapSelection(statement.current, '\n\n```\n', '\n```\n\n')}
              label="Khối code"
            >
              <code className="font-mono text-[12px]">```</code>
            </MarkButton>
          </div>
        </div>
        <textarea
          id="studio-statement"
          ref={statement}
          rows={11}
          value={form.statementMd}
          maxLength={50000}
          disabled={props.disabled}
          placeholder="Cho mảng số nguyên `nums` và số `target`. Trả về chỉ số hai phần tử có tổng bằng `target`."
          onChange={(e) => setForm((f) => ({ ...f, statementMd: e.target.value }))}
          className={cn(fieldClass, 'min-h-48 resize-y py-2.5 leading-6')}
        />
        <p className="text-[11.5px] text-muted/60">
          Viết như khi giảng. Dùng `code` cho tên biến và ``` cho khối code. Bỏ trống một dòng để
          xuống đoạn.
        </p>
      </div>
      <Field label="Ràng buộc" hint="Mỗi dòng một ràng buộc · tuỳ chọn">
        <textarea
          rows={3}
          value={form.constraintsMd}
          maxLength={5000}
          disabled={props.disabled}
          placeholder={'2 ≤ nums.length ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9'}
          onChange={(e) => setForm((f) => ({ ...f, constraintsMd: e.target.value }))}
          className={cn(fieldClass, 'resize-y py-2.5 font-mono text-[13px] leading-6')}
        />
      </Field>
      <div className="space-y-1.5">
        <span className="block text-[12.5px] font-bold text-black">Độ khó</span>
        <Segmented
          label="Độ khó"
          value={form.difficulty}
          disabled={props.disabled}
          onChange={(difficulty) => setForm((f) => ({ ...f, difficulty }))}
          options={[
            { value: '', label: 'Chưa chọn' },
            { value: 'EASY', label: 'Dễ' },
            { value: 'MEDIUM', label: 'Vừa' },
            { value: 'HARD', label: 'Khó' },
          ]}
        />
      </div>
    </div>
  );
}

function MarkButton(props: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={props.label}
      title={props.label}
      className="inline-flex h-7 min-w-8 items-center justify-center rounded-md px-1.5 text-muted/80 transition-colors hover:bg-soft hover:text-black"
    >
      {props.children}
    </button>
  );
}

function nextName(sig: CodeSignature): string {
  const used = new Set(sig.params.map((p) => p.name));
  for (const name of ['a', 'b', 'c', 'k', 'x', 'y', 'n', 'm', 's', 't'])
    if (!used.has(name) && name !== sig.functionName) return name;
  return `p${sig.params.length + 1}`;
}

function TypeSelect(props: {
  label: string;
  value: CodeValueType;
  onChange: (value: CodeValueType) => void;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label={props.label}
      value={props.value}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e.target.value as CodeValueType)}
      className={cn(fieldClass, 'h-9 cursor-pointer pr-8')}
    >
      {codeValueTypes.map((t) => (
        <option key={t} value={t}>
          {typeLabels[t]} ({t})
        </option>
      ))}
    </select>
  );
}

function FunctionForm(props: {
  form: ProblemForm;
  setForm: SetForm;
  data: MentorAuthoring;
  disabled: boolean;
  problems: string[];
}) {
  const { form, setForm } = props;
  const sig = form.signature;
  const setSig = (next: CodeSignature) => setForm((f) => ({ ...f, signature: next }));
  return (
    <div className="space-y-5 px-5 py-4">
      <p className="flex gap-2 rounded-lg bg-soft/70 px-3 py-2.5 text-[12.5px] leading-5 text-muted">
        <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-mint" />
        Học viên chỉ viết thân hàm. Hệ thống tự đọc input, gọi hàm và so kết quả.
      </p>
      <Field label="Tên hàm">
        <input
          value={sig.functionName}
          maxLength={40}
          disabled={props.disabled}
          spellCheck={false}
          onChange={(e) => setSig({ ...sig, functionName: e.target.value })}
          className={cn(fieldClass, 'h-9 font-mono')}
        />
      </Field>
      <div className="space-y-1.5">
        <span className="flex items-baseline justify-between">
          <span className="text-[12.5px] font-bold text-black">Tham số đầu vào</span>
          <span className="text-[11.5px] text-muted/60">{sig.params.length}/6</span>
        </span>
        <ol className="space-y-1.5">
          {sig.params.map((param, i) => (
            <li
              key={i}
              className="animate-in fade-in-0 slide-in-from-top-1 grid grid-cols-[1.5rem_minmax(0,8rem)_minmax(0,1fr)_2rem] items-center gap-2 duration-200"
            >
              <span className="text-center text-xs font-bold text-muted/50 tabular-nums">
                {i + 1}
              </span>
              <input
                aria-label={`Tên tham số ${i + 1}`}
                value={param.name}
                maxLength={40}
                disabled={props.disabled}
                spellCheck={false}
                onChange={(e) =>
                  setSig({
                    ...sig,
                    params: sig.params.map((x, j) =>
                      j === i ? { ...x, name: e.target.value } : x,
                    ),
                  })
                }
                className={cn(fieldClass, 'h-9 font-mono')}
              />
              <TypeSelect
                label={`Kiểu tham số ${param.name}`}
                value={param.type}
                disabled={props.disabled}
                onChange={(type) =>
                  setSig({
                    ...sig,
                    params: sig.params.map((x, j) => (j === i ? { ...x, type } : x)),
                  })
                }
              />
              <button
                type="button"
                aria-label={`Xoá tham số ${param.name}`}
                disabled={sig.params.length === 1 || props.disabled}
                onClick={() => setSig({ ...sig, params: sig.params.filter((_, j) => j !== i) })}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted/50 transition-colors hover:bg-peach hover:text-headsup disabled:pointer-events-none disabled:opacity-30"
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          disabled={sig.params.length >= 6 || props.disabled}
          onClick={() =>
            setSig({ ...sig, params: [...sig.params, { name: nextName(sig), type: 'int' }] })
          }
          className="ml-8 inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-bold text-black transition-colors hover:bg-soft disabled:opacity-40"
        >
          <Plus aria-hidden="true" className="size-3.5 text-mint" /> Thêm tham số
        </button>
      </div>
      <Field label="Kết quả trả về">
        <TypeSelect
          label="Kiểu kết quả"
          value={sig.returnType}
          disabled={props.disabled}
          onChange={(returnType) => setSig({ ...sig, returnType })}
        />
      </Field>
      <div className="space-y-1.5">
        <span className="block text-[12.5px] font-bold text-black">Ngôn ngữ cho học viên</span>
        <div className="flex flex-wrap gap-2">
          {props.data.availableLanguages.map((l) => {
            const on = form.languages.includes(l.key);
            return (
              <button
                key={l.key}
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={props.disabled}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    languages: on
                      ? f.languages.filter((k) => k !== l.key)
                      : [...f.languages, l.key],
                  }))
                }
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] font-bold ring-1 transition-all duration-200',
                  on
                    ? 'bg-mint/10 text-forest ring-mint/50'
                    : 'bg-canvas text-muted/80 ring-line hover:text-black',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'grid size-4 place-items-center rounded border transition-colors',
                    on ? 'border-mint bg-mint' : 'border-line bg-canvas',
                  )}
                >
                  {on && <span className="size-1.5 rounded-sm bg-canvas" />}
                </span>
                {l.displayName}
                <span className="font-semibold text-muted/60">{l.runtimeVersion}</span>
              </button>
            );
          })}
        </div>
      </div>
      {props.data.tests.length > 0 && (
        <p className="rounded-lg bg-peach/70 px-3 py-2.5 text-[12.5px] leading-5">
          Đề đã có {props.data.tests.length} test. Đổi kiểu tham số/kết quả sẽ bị chặn nếu test cũ
          không còn đúng kiểu; khi đó xoá test ở bước Lời giải & test trước.
        </p>
      )}
      {props.problems.length > 0 && (
        <ul
          role="alert"
          className="space-y-1 rounded-lg bg-headsup/8 px-3 py-2.5 text-[12.5px] text-headsup"
        >
          {props.problems.map((p) => (
            <li key={p}>• {p}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdvancedForm(props: { form: ProblemForm; setForm: SetForm; disabled: boolean }) {
  const { form, setForm } = props;
  return (
    <div className="space-y-5 px-5 py-4">
      <p className="text-[12.5px] text-muted/70">
        Đã có mặc định phù hợp. Java được tự cộng thêm thời gian khởi động.
      </p>
      <Field label="So sánh kết quả">
        <select
          value={form.compareMode}
          disabled={props.disabled}
          onChange={(e) =>
            setForm((f) => ({ ...f, compareMode: e.target.value as ProblemForm['compareMode'] }))
          }
          className={cn(fieldClass, 'h-9 cursor-pointer')}
        >
          <option value="EXACT">Giống hệt (mặc định)</option>
          <option value="FLOAT">Số thực, cho phép sai số</option>
          <option value="UNORDERED">Mảng không xét thứ tự</option>
        </select>
      </Field>
      {form.compareMode === 'FLOAT' && (
        <Field label="Sai số cho phép" hint="1e-10 đến 0.1">
          <input
            inputMode="decimal"
            value={form.floatEpsilon}
            disabled={props.disabled}
            onChange={(e) => setForm((f) => ({ ...f, floatEpsilon: e.target.value }))}
            className={cn(fieldClass, 'h-9 font-mono')}
          />
        </Field>
      )}
      <div className="space-y-1.5">
        <span className="block text-[12.5px] font-bold text-black">Cách tính điểm</span>
        <Segmented
          label="Cách tính điểm"
          value={form.scoringMode}
          disabled={props.disabled}
          onChange={(scoringMode) => setForm((f) => ({ ...f, scoringMode }))}
          options={[
            { value: 'PER_TEST', label: 'Theo số test đúng' },
            { value: 'ALL_OR_NOTHING', label: 'Đúng hết mới có điểm' },
          ]}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Thời gian mỗi test" hint="ms">
          <input
            type="number"
            min={100}
            max={10000}
            value={form.cpuTimeLimitMs}
            disabled={props.disabled}
            onChange={(e) => setForm((f) => ({ ...f, cpuTimeLimitMs: e.target.value }))}
            className={cn(fieldClass, 'h-9 tabular-nums')}
          />
        </Field>
        <Field label="Bộ nhớ" hint="MB">
          <input
            type="number"
            min={64}
            max={512}
            value={form.memoryLimitMb}
            disabled={props.disabled}
            onChange={(e) => setForm((f) => ({ ...f, memoryLimitMb: e.target.value }))}
            className={cn(fieldClass, 'h-9 tabular-nums')}
          />
        </Field>
      </div>
    </div>
  );
}

/** Live starter code from the server generator, exactly what students get. */
function StarterPreview(props: {
  signature: CodeSignature;
  languages: CodeLanguageKey[];
  valid: boolean;
  theme: CodeThemeId;
  onTheme: (theme: CodeThemeId) => void;
}) {
  const preview = useCodeCommand(starterPreviewSchema);
  const [starter, setStarter] = useState<{ javascript: string; java21: string } | null>(null);
  const [picked, setPicked] = useState<CodeLanguageKey | null>(null);
  const lang =
    picked && props.languages.includes(picked) ? picked : (props.languages[0] ?? 'javascript');
  const key = JSON.stringify(props.signature);
  const { mutateAsync } = preview;
  useEffect(() => {
    if (!props.valid) return;
    const timer = setTimeout(() => {
      mutateAsync({ path: 'mentor/code-signatures/preview', body: { signature: JSON.parse(key) } })
        .then(setStarter)
        .catch(() => setStarter(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [key, props.valid, mutateAsync]);
  return (
    <div
      style={{ colorScheme: codeThemeScheme(props.theme) }}
      className="flex h-full min-h-72 flex-col bg-ide"
    >
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-ide-line bg-ide-deep px-2">
        {props.languages.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={l === lang}
            onClick={() => setPicked(l)}
            className={cn(
              'inline-flex h-7 items-center rounded-md px-2.5 text-[13px] font-bold transition-colors duration-150',
              l === lang ? 'bg-ide-raised text-ide-text' : 'text-ide-muted hover:text-ide-text',
            )}
          >
            {languageName(l)}
          </button>
        ))}
        <span className="ml-auto" />
        {preview.isPending && (
          <span
            className="mr-1 size-1.5 animate-pulse rounded-full bg-syn-string"
            aria-label="Đang cập nhật"
          />
        )}
        <CodeThemePicker value={props.theme} onChange={props.onTheme} />
      </div>
      <div className="min-h-0 flex-1">
        {!props.valid ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ide-muted">
            Sửa lỗi ở tab Hàm cần viết để xem code khởi đầu.
          </div>
        ) : !props.languages.length ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ide-muted">
            Chọn ít nhất một ngôn ngữ.
          </div>
        ) : starter ? (
          <CodeEditor
            fill
            readOnly
            label={`Code khởi đầu ${languageName(lang)}`}
            value={lang === 'java21' ? starter.java21 : starter.javascript}
            language={lang}
            indent={lang === 'java21' ? '    ' : '  '}
          />
        ) : (
          <div role="status" className="space-y-2.5 px-14 py-4">
            <span className="sr-only">Đang tạo code khởi đầu…</span>
            {[52, 70, 38].map((w) => (
              <div
                key={w}
                className="h-3 animate-pulse rounded bg-ide-raised"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Saved problem as students see it: statement panel plus the starter code (publish step). */
export function StudentPreview(props: {
  data: MentorAuthoring;
  theme: CodeThemeId;
  onTheme: (theme: CodeThemeId) => void;
}) {
  const p = props.data.problem;
  const [lang, setLang] = useState<CodeLanguageKey | null>(null);
  if (!p)
    return (
      <Panel>
        <PanelEmpty icon={FileText} title="Chưa có đề">
          Soạn đề ở bước Đề bài trước.
        </PanelEmpty>
      </Panel>
    );
  const samples = props.data.tests.filter((t) => t.visibility === 'SAMPLE');
  const view: ProblemView = {
    problem: p,
    samples: samples.map((t, i) => ({
      position: i + 1,
      display: p.signature.params
        .map((param, j) => `${param.name} = ${formatValue(t.inputArgs[j])}`)
        .join(', '),
      expected: t.expected,
      explanationMd: t.explanationMd ?? null,
    })),
    hiddenTestCount: props.data.tests.length - samples.length,
  };
  const current =
    props.data.languages.find((l) => l.languageKey === lang) ?? props.data.languages[0];
  return (
    <ResizableSplit
      direction="vertical"
      storageKey="mindy.studio.preview.y"
      defaultRatio={0.6}
      minFirst={200}
      minSecond={140}
      label="Kéo để đổi chiều cao đề và code khởi đầu"
      className="h-full"
      first={
        <Panel label="Học viên sẽ thấy">
          <PanelTabs
            label="Xem trước"
            idPrefix="studio-final"
            value="student"
            onChange={() => {}}
            tabs={[{ id: 'student', label: 'Học viên sẽ thấy', icon: Eye, tone: 'text-mint' }]}
          />
          <div
            id="studio-final-panel"
            role="tabpanel"
            aria-labelledby="studio-final-tab-student"
            className="code-ide-scroll min-h-0 flex-1 overflow-y-auto"
          >
            <ProblemDescription assignment={view} />
          </div>
        </Panel>
      }
      second={
        <section
          aria-label="Code khởi đầu"
          style={{ colorScheme: codeThemeScheme(props.theme) }}
          className="flex h-72 min-h-0 flex-col overflow-hidden rounded-xl bg-ide ring-1 ring-ide-line lg:h-full"
        >
          <div className="flex h-10 shrink-0 items-center gap-1 border-b border-ide-line bg-ide-deep pr-1.5 pl-3">
            <Code2 aria-hidden="true" className="size-4 text-syn-string" />
            <span className="mr-2 text-[13px] font-bold text-ide-text">Code khởi đầu</span>
            {props.data.languages.map((l) => (
              <button
                key={l.languageKey}
                type="button"
                aria-pressed={l.languageKey === current?.languageKey}
                onClick={() => setLang(l.languageKey)}
                className={cn(
                  'inline-flex h-7 items-center rounded-md px-2.5 text-[13px] font-bold transition-colors',
                  l.languageKey === current?.languageKey
                    ? 'bg-ide-raised text-ide-text'
                    : 'text-ide-muted hover:text-ide-text',
                )}
              >
                {languageName(l.languageKey)}
              </button>
            ))}
            <span className="ml-auto" />
            <CodeThemePicker value={props.theme} onChange={props.onTheme} />
          </div>
          <div className="min-h-0 flex-1">
            {current && (
              <CodeEditor
                fill
                readOnly
                label="Code khởi đầu"
                value={current.starterCode}
                language={current.languageKey}
                indent={current.languageKey === 'java21' ? '    ' : '  '}
              />
            )}
          </div>
        </section>
      }
    />
  );
}
