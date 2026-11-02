import type {
  CodeLanguageKey,
  CodeSignature,
  CodeValueType,
  MentorAuthoring,
} from '../schemas/code-contracts';
import { example } from './code-format';

/** Pure helpers for the mentor authoring wizard (Phase 7). No React, unit tested. */

export const typeLabels: Record<CodeValueType, string> = {
  int: 'Số nguyên',
  long: 'Số nguyên lớn',
  double: 'Số thực',
  boolean: 'Đúng / sai',
  string: 'Chuỗi',
  'int[]': 'Mảng số nguyên',
  'long[]': 'Mảng số nguyên lớn',
  'double[]': 'Mảng số thực',
  'boolean[]': 'Mảng đúng / sai',
  'string[]': 'Mảng chuỗi',
  'int[][]': 'Ma trận số nguyên',
  'string[][]': 'Ma trận chuỗi',
};

const INT_MIN = -(2 ** 31);
const INT_MAX = 2 ** 31 - 1;

/** Mirrors the server type check (code-signature.ts) so cells turn red before saving. */
export function matchesType(type: CodeValueType, value: unknown): boolean {
  if (type.endsWith('[]')) {
    const inner = type.slice(0, -2) as CodeValueType;
    return Array.isArray(value) && value.every((v) => matchesType(inner, v));
  }
  switch (type) {
    case 'int':
      return (
        Number.isInteger(value) && (value as number) >= INT_MIN && (value as number) <= INT_MAX
      );
    case 'long':
      return Number.isSafeInteger(value);
    case 'double':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'string':
      return typeof value === 'string';
    default:
      return false;
  }
}

/**
 * Reads one table cell. Strings may be typed without quotes (`hello`); everything else is JSON
 * (`5`, `true`, `[1,2,3]`, `[["a","b"]]`). Returns a Vietnamese error instead of throwing.
 */
export function parseCell(
  type: CodeValueType,
  text: string,
): { value: unknown } | { error: string } {
  const raw = text.trim();
  if (type === 'string' && !raw.startsWith('"')) return { value: text };
  if (!raw) return { error: `Nhập ${typeLabels[type].toLowerCase()}, ví dụ ${example(type)}` };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { error: `Cần ${typeLabels[type].toLowerCase()}, ví dụ ${example(type)}` };
  }
  return matchesType(type, value)
    ? { value }
    : { error: `Cần ${typeLabels[type].toLowerCase()}, ví dụ ${example(type)}` };
}

/** Inverse of parseCell: plain strings stay unquoted when that round-trips safely. */
export function formatCell(type: CodeValueType, value: unknown): string {
  if (
    type === 'string' &&
    typeof value === 'string' &&
    value.length > 0 &&
    value === value.trim() &&
    !value.startsWith('"') &&
    !value.includes('\n')
  )
    return value;
  return value === undefined ? '' : JSON.stringify(value);
}

/**
 * Bulk paste: one test per line, written as a JSON array of arguments, e.g. `[[2,7,11,15], 9]`.
 * A function with a single parameter also accepts the bare value (`[1,2,3]` or `hello`).
 */
export function parseBulk(
  signature: CodeSignature,
  text: string,
): { rows: unknown[][] } | { error: string } {
  const rows: unknown[][] = [];
  const lines = text.split('\n');
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    const single = signature.params.length === 1 ? signature.params[0] : undefined;
    let args: unknown;
    try {
      args = JSON.parse(line);
    } catch {
      if (single?.type === 'string') args = [line];
      else return { error: `Dòng ${index + 1}: không đọc được, ví dụ ${bulkExample(signature)}` };
    }
    if (single && !(Array.isArray(args) && args.length === 1 && matchesType(single.type, args[0])))
      args = [args];
    if (
      !Array.isArray(args) ||
      args.length !== signature.params.length ||
      signature.params.some((p, i) => !matchesType(p.type, (args as unknown[])[i]))
    )
      return {
        error: `Dòng ${index + 1}: sai số lượng hoặc kiểu tham số, ví dụ ${bulkExample(signature)}`,
      };
    rows.push(args);
  }
  if (!rows.length) return { error: 'Chưa có dòng nào.' };
  if (rows.length > 30) return { error: 'Tối đa 30 test.' };
  return { rows };
}

export function bulkExample(signature: CodeSignature): string {
  return `[${signature.params.map((p) => example(p.type)).join(', ')}]`;
}

export type WizardStep = 'problem' | 'function' | 'tests' | 'publish';

export const wizardSteps: { key: WizardStep; title: string; hint: string }[] = [
  { key: 'problem', title: 'Đề bài', hint: 'Mô tả bài toán cho học viên' },
  { key: 'function', title: 'Hàm cần viết', hint: 'Tên hàm, tham số, ngôn ngữ' },
  { key: 'tests', title: 'Lời giải & test', hint: 'Máy chạy lời giải để ra kết quả' },
  { key: 'publish', title: 'Giao đề', hint: 'Xem trước và giao cho lớp' },
];

/** Which steps are complete, from the saved authoring state (server is the source of truth). */
export function stepDone(data: MentorAuthoring): Record<WizardStep, boolean> {
  const p = data.problem;
  const samples = data.tests.filter((t) => t.visibility === 'SAMPLE').length;
  const hidden = data.tests.length - samples;
  return {
    problem: Boolean(p?.statementMd.trim()),
    function: Boolean(p) && data.languages.length > 0,
    tests:
      samples > 0 &&
      hidden > 0 &&
      data.references.length > 0 &&
      data.validatedRevision === data.assignment.revision,
    publish: data.assignment.status !== 'DRAFT',
  };
}

/** Step where the mentor should continue (first incomplete one). */
export function firstOpenStep(data: MentorAuthoring): WizardStep {
  const done = stepDone(data);
  return wizardSteps.find((s) => !done[s.key])?.key ?? 'publish';
}

/** Step that fixes a publish blocker, for "Sửa" links in the checklist. */
export const blockerStep: Record<string, WizardStep> = {
  CODE_PROBLEM_REQUIRED: 'problem',
  CODE_STATEMENT_REQUIRED: 'problem',
  CODE_LANGUAGES_REQUIRED: 'function',
  CODE_SAMPLE_TEST_REQUIRED: 'tests',
  CODE_HIDDEN_TEST_REQUIRED: 'tests',
  CODE_REFERENCE_REQUIRED: 'tests',
  CODE_REFERENCE_NOT_VALIDATED: 'tests',
};

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]{0,39}$/;
/** Same list as the server (JS + Java keywords and names used by the generated drivers). */
const RESERVED = new Set(
  (
    'abstract arguments assert await boolean break byte case catch char class const continue debugger default delete do ' +
    'double else enum eval export extends false final finally float for function goto if implements import in instanceof ' +
    'int interface let long native new null package private protected public return short static strictfp super switch ' +
    'synchronized this throw throws transient true try typeof var void volatile while with yield undefined NaN Infinity ' +
    'Main Solution MindyJson main require process module exports String Object System Math'
  ).split(' '),
);

/** Client-side check of names; the server re-validates with its own rules. */
export function signatureProblems(signature: CodeSignature): string[] {
  const problems: string[] = [];
  const names = [signature.functionName, ...signature.params.map((p) => p.name)];
  for (const name of names)
    if (!IDENTIFIER.test(name) || RESERVED.has(name))
      problems.push(`"${name}" không dùng được làm tên (chỉ chữ, số, _; không trùng từ khoá).`);
  if (new Set(names).size !== names.length)
    problems.push('Tên hàm và tên tham số không được trùng nhau.');
  return problems;
}

/** Editable state of steps 1–2 (saved together: the server stores statement + signature in one row). */
export interface ProblemForm {
  statementMd: string;
  constraintsMd: string;
  difficulty: '' | 'EASY' | 'MEDIUM' | 'HARD';
  signature: CodeSignature;
  languages: CodeLanguageKey[];
  compareMode: 'EXACT' | 'FLOAT' | 'UNORDERED';
  floatEpsilon: string;
  scoringMode: 'PER_TEST' | 'ALL_OR_NOTHING';
  cpuTimeLimitMs: string;
  memoryLimitMb: string;
}

export const defaultSignature: CodeSignature = {
  functionName: 'solve',
  params: [{ name: 'nums', type: 'int[]' }],
  returnType: 'int',
};

/** Sensible defaults: one language (JavaScript), exact comparison, score per test, 1 s / 256 MB. */
export function formFrom(data: MentorAuthoring): ProblemForm {
  const p = data.problem;
  return {
    statementMd: p?.statementMd ?? '',
    constraintsMd: p?.constraintsMd ?? '',
    difficulty: p?.difficulty ?? '',
    signature: p?.signature ?? defaultSignature,
    languages: data.languages.length ? data.languages.map((l) => l.languageKey) : ['javascript'],
    compareMode: p?.compareMode ?? 'EXACT',
    floatEpsilon: String(p?.floatEpsilon ?? '0.000001'),
    scoringMode: p?.scoringMode ?? 'PER_TEST',
    cpuTimeLimitMs: String(p?.cpuTimeLimitMs ?? 1000),
    memoryLimitMb: String(p?.memoryLimitMb ?? 256),
  };
}

export function formProblems(form: ProblemForm): string[] {
  const problems = signatureProblems(form.signature);
  const cpu = Number(form.cpuTimeLimitMs);
  const memory = Number(form.memoryLimitMb);
  const epsilon = Number(form.floatEpsilon);
  if (!Number.isInteger(cpu) || cpu < 100 || cpu > 10000)
    problems.push('Giới hạn thời gian phải từ 100 đến 10000 ms.');
  if (!Number.isInteger(memory) || memory < 64 || memory > 512)
    problems.push('Giới hạn bộ nhớ phải từ 64 đến 512 MB.');
  if (form.compareMode === 'FLOAT' && !(epsilon >= 1e-10 && epsilon <= 0.1))
    problems.push('Sai số phải trong khoảng 1e-10 đến 0.1.');
  if (!form.languages.length) problems.push('Chọn ít nhất một ngôn ngữ.');
  return problems;
}

/** Body of PUT code-problem (without expectedRevision). */
export function problemBody(form: ProblemForm) {
  return {
    statementMd: form.statementMd,
    constraintsMd: form.constraintsMd,
    difficulty: form.difficulty || null,
    signature: form.signature,
    compareMode: form.compareMode,
    floatEpsilon: form.compareMode === 'FLOAT' ? Number(form.floatEpsilon) : null,
    scoringMode: form.scoringMode,
    cpuTimeLimitMs: Number(form.cpuTimeLimitMs),
    memoryLimitMb: Number(form.memoryLimitMb),
  };
}

/** Human label for a generated-output problem. */
export const generatedStatusLabels: Record<string, string> = {
  TIME_LIMIT: 'Lời giải chạy quá thời gian',
  MEMORY_LIMIT: 'Lời giải dùng quá bộ nhớ',
  RUNTIME_ERROR: 'Lời giải bị lỗi khi chạy',
  OUTPUT_LIMIT: 'Lời giải in quá nhiều',
  NO_RESULT: 'Lời giải không trả về kết quả',
  INVALID_RETURN: 'Kết quả không đúng kiểu trả về',
};
