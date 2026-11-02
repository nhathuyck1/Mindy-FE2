'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useCodeCommand } from '../api/code-queries';
import { type ProblemForm, formProblems, typeLabels } from '../lib/code-authoring';
import { formatValue, signatureText } from '../lib/code-format';
import {
  type CodeSignature,
  type CodeValueType,
  codeValueTypes,
  type MentorAuthoring,
  starterPreviewSchema,
} from '../schemas/code-contracts';
import { CodeBlock, CodeMessage, CodeSection, Statement } from './code-ui';

type SetForm = (update: (form: ProblemForm) => ProblemForm) => void;

/** Step 1 — statement with live preview. */
export function ProblemStep(props: { form: ProblemForm; setForm: SetForm; disabled: boolean }) {
  const { form, setForm } = props;
  return (
    <CodeSection
      title="Đề bài"
      description="Viết như khi giảng: bài toán, ví dụ minh hoạ bằng lời. Dùng `code` cho tên biến và ``` cho khối code."
    >
      <fieldset disabled={props.disabled} className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block space-y-1 text-sm font-semibold">
            Mô tả đề
            <Textarea
              rows={10}
              value={form.statementMd}
              maxLength={50000}
              placeholder="Cho mảng số nguyên `nums` và số `target`. Trả về chỉ số hai phần tử có tổng bằng `target`."
              onChange={(e) => setForm((f) => ({ ...f, statementMd: e.target.value }))}
            />
          </label>
          <label className="block space-y-1 text-sm font-semibold">
            Ràng buộc (tuỳ chọn)
            <Textarea
              rows={3}
              value={form.constraintsMd}
              maxLength={5000}
              placeholder="2 ≤ nums.length ≤ 10^4"
              onChange={(e) => setForm((f) => ({ ...f, constraintsMd: e.target.value }))}
            />
          </label>
          <label className="block max-w-56 space-y-1 text-sm font-semibold">
            Độ khó
            <NativeSelect
              value={form.difficulty}
              onChange={(e) =>
                setForm((f) => ({ ...f, difficulty: e.target.value as ProblemForm['difficulty'] }))
              }
            >
              <NativeSelectOption value="">Chưa chọn</NativeSelectOption>
              <NativeSelectOption value="EASY">Dễ</NativeSelectOption>
              <NativeSelectOption value="MEDIUM">Vừa</NativeSelectOption>
              <NativeSelectOption value="HARD">Khó</NativeSelectOption>
            </NativeSelect>
          </label>
        </div>
        <div className="space-y-2 rounded-xl border border-line p-4">
          <p className="text-xs font-semibold text-muted-foreground">Học viên sẽ thấy</p>
          {form.statementMd.trim() ? (
            <Statement text={form.statementMd} />
          ) : (
            <p className="text-sm text-muted-foreground">Bản xem trước hiện ở đây.</p>
          )}
          {form.constraintsMd.trim() && (
            <div className="border-t border-line pt-2">
              <p className="text-xs font-semibold">Ràng buộc</p>
              <Statement text={form.constraintsMd} />
            </div>
          )}
        </div>
      </fieldset>
    </CodeSection>
  );
}

/** Step 2 — function signature (friendly type names), languages, advanced settings. */
export function FunctionStep(props: {
  form: ProblemForm;
  setForm: SetForm;
  data: MentorAuthoring;
  disabled: boolean;
}) {
  const { form, setForm } = props;
  const sig = form.signature;
  const setSig = (next: CodeSignature) => setForm((f) => ({ ...f, signature: next }));
  const problems = formProblems(form);
  const hasTests = props.data.tests.length > 0;
  return (
    <CodeSection
      title="Hàm cần viết"
      description="Học viên chỉ viết thân hàm. Hệ thống tự đọc input, gọi hàm và so kết quả."
    >
      <fieldset disabled={props.disabled} className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block space-y-1 text-sm font-semibold">
              Tên hàm
              <Input
                className="font-mono"
                value={sig.functionName}
                maxLength={40}
                onChange={(e) => setSig({ ...sig, functionName: e.target.value })}
              />
            </label>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Tham số đầu vào</p>
              {sig.params.map((param, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <Input
                    aria-label={`Tên tham số ${i + 1}`}
                    className="w-36 font-mono"
                    value={param.name}
                    maxLength={40}
                    onChange={(e) =>
                      setSig({
                        ...sig,
                        params: sig.params.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <TypeSelect
                    label={`Kiểu tham số ${param.name}`}
                    value={param.type}
                    onChange={(type) =>
                      setSig({
                        ...sig,
                        params: sig.params.map((x, j) => (j === i ? { ...x, type } : x)),
                      })
                    }
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Xoá tham số ${param.name}`}
                    disabled={sig.params.length === 1}
                    onClick={() => setSig({ ...sig, params: sig.params.filter((_, j) => j !== i) })}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={sig.params.length >= 6}
                onClick={() =>
                  setSig({
                    ...sig,
                    params: [...sig.params, { name: nextName(sig), type: 'int' }],
                  })
                }
              >
                <Plus aria-hidden="true" /> Thêm tham số
              </Button>
            </div>
            <label className="block space-y-1 text-sm font-semibold">
              Kết quả trả về
              <TypeSelect
                label="Kiểu kết quả"
                value={sig.returnType}
                onChange={(returnType) => setSig({ ...sig, returnType })}
              />
            </label>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Ngôn ngữ cho học viên</p>
              {props.data.availableLanguages.map((l) => (
                <label key={l.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.languages.includes(l.key)}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        languages: e.target.checked
                          ? [...f.languages, l.key]
                          : f.languages.filter((k) => k !== l.key),
                      }))
                    }
                  />
                  {l.displayName} ({l.runtimeVersion})
                </label>
              ))}
            </div>
          </div>
          <StarterPreview
            signature={sig}
            languages={form.languages}
            valid={problems.length === 0}
          />
        </div>
        <details className="group rounded-xl border border-line p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
            Nâng cao (đã có mặc định phù hợp)
            <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-sm font-semibold">
              So sánh kết quả
              <NativeSelect
                value={form.compareMode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    compareMode: e.target.value as ProblemForm['compareMode'],
                  }))
                }
              >
                <NativeSelectOption value="EXACT">Giống hệt (mặc định)</NativeSelectOption>
                <NativeSelectOption value="FLOAT">Số thực, cho phép sai số</NativeSelectOption>
                <NativeSelectOption value="UNORDERED">Mảng không xét thứ tự</NativeSelectOption>
              </NativeSelect>
            </label>
            {form.compareMode === 'FLOAT' && (
              <label className="space-y-1 text-sm font-semibold">
                Sai số cho phép
                <Input
                  inputMode="decimal"
                  value={form.floatEpsilon}
                  onChange={(e) => setForm((f) => ({ ...f, floatEpsilon: e.target.value }))}
                />
              </label>
            )}
            <label className="space-y-1 text-sm font-semibold">
              Cách tính điểm
              <NativeSelect
                value={form.scoringMode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    scoringMode: e.target.value as ProblemForm['scoringMode'],
                  }))
                }
              >
                <NativeSelectOption value="PER_TEST">
                  Theo số test đúng (mặc định)
                </NativeSelectOption>
                <NativeSelectOption value="ALL_OR_NOTHING">Đúng hết mới có điểm</NativeSelectOption>
              </NativeSelect>
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Thời gian mỗi test (ms)
              <Input
                type="number"
                min={100}
                max={10000}
                value={form.cpuTimeLimitMs}
                onChange={(e) => setForm((f) => ({ ...f, cpuTimeLimitMs: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Bộ nhớ (MB)
              <Input
                type="number"
                min={64}
                max={512}
                value={form.memoryLimitMb}
                onChange={(e) => setForm((f) => ({ ...f, memoryLimitMb: e.target.value }))}
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Java được tự cộng thêm thời gian khởi động. Giữ mặc định nếu không chắc.
          </p>
        </details>
        {hasTests && (
          <CodeMessage>
            Đề đã có {props.data.tests.length} test. Đổi kiểu tham số/kết quả sẽ bị chặn nếu test cũ
            không còn đúng kiểu; khi đó xoá test ở bước 3 trước.
          </CodeMessage>
        )}
        {problems.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-headsup" role="alert">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </fieldset>
    </CodeSection>
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
}) {
  return (
    <NativeSelect
      aria-label={props.label}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value as CodeValueType)}
    >
      {codeValueTypes.map((t) => (
        <NativeSelectOption key={t} value={t}>
          {typeLabels[t]} ({t})
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

/** Live starter code from the server generator, exactly what students get. */
function StarterPreview(props: { signature: CodeSignature; languages: string[]; valid: boolean }) {
  const preview = useCodeCommand(starterPreviewSchema);
  const [starter, setStarter] = useState<{ javascript: string; java21: string } | null>(null);
  const key = JSON.stringify(props.signature);
  const { mutateAsync } = preview;
  useEffect(() => {
    if (!props.valid) return;
    const timer = setTimeout(() => {
      mutateAsync({ path: 'mentor/code-signatures/preview', body: { signature: JSON.parse(key) } })
        .then(setStarter)
        .catch(() => setStarter(null));
    }, 500);
    return () => clearTimeout(timer);
  }, [key, props.valid, mutateAsync]);
  return (
    <div className="space-y-3 rounded-xl border border-line p-4">
      <p className="text-xs font-semibold text-muted-foreground">Code khởi đầu học viên nhận</p>
      <p className="font-mono text-xs break-all">{signatureText(props.signature)}</p>
      {!props.valid && <p className="text-sm text-muted-foreground">Sửa lỗi tên để xem trước.</p>}
      {props.valid &&
        starter &&
        props.languages.map((lang) => (
          <CodeBlock
            key={lang}
            label={lang === 'java21' ? 'Java' : 'JavaScript'}
            value={lang === 'java21' ? starter.java21 : starter.javascript}
          />
        ))}
    </div>
  );
}

/** Read-only view of the problem as the student sees it (step 4 and published assignments). */
export function StudentPreview(props: { data: MentorAuthoring }) {
  const p = props.data.problem;
  if (!p) return <p className="text-sm text-muted-foreground">Chưa có đề.</p>;
  const samples = props.data.tests.filter((t) => t.visibility === 'SAMPLE');
  const hidden = props.data.tests.length - samples.length;
  const starter = props.data.languages[0];
  return (
    <div className="space-y-4">
      <Statement text={p.statementMd} />
      {p.constraintsMd.trim() && (
        <div>
          <p className="text-sm font-semibold">Ràng buộc</p>
          <Statement text={p.constraintsMd} />
        </div>
      )}
      <p className="font-mono text-sm break-all">{signatureText(p.signature)}</p>
      {samples.map((t, i) => (
        <div key={t.id} className="rounded-xl bg-soft p-3 text-sm">
          <p className="font-semibold">Ví dụ {i + 1}</p>
          <p className="font-mono text-xs break-all">
            {p.signature.params
              .map((param, j) => `${param.name} = ${formatValue(t.inputArgs[j])}`)
              .join(', ')}
          </p>
          <p className="font-mono text-xs break-all">Kết quả: {formatValue(t.expected)}</p>
          {t.explanationMd && (
            <p className="mt-1 text-xs text-muted-foreground">{t.explanationMd}</p>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        {hidden} test ẩn (học viên chỉ thấy đúng/sai và thời gian) · {p.cpuTimeLimitMs} ms ·{' '}
        {p.memoryLimitMb} MB
      </p>
      {starter && (
        <CodeBlock
          label={`Code khởi đầu (${starter.languageKey === 'java21' ? 'Java' : 'JavaScript'})`}
          value={starter.starterCode}
        />
      )}
    </div>
  );
}
