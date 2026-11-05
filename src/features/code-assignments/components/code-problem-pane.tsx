'use client';

import { Cpu, EyeOff, Info, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatValue } from '../lib/code-format';
import type { StudentCodeAssignment } from '../schemas/code-contracts';
import { Statement } from './code-ui';

const difficulty = {
  EASY: { label: 'Dễ', className: 'bg-mint/10 text-mint' },
  MEDIUM: {
    label: 'Trung bình',
    className: 'bg-coral/12 text-[color-mix(in_oklab,var(--color-coral)_75%,var(--color-black))]',
  },
  HARD: { label: 'Khó', className: 'bg-headsup/10 text-headsup' },
} as const;

export function DifficultyPill(props: { value: StudentCodeAssignment['problem']['difficulty'] }) {
  if (!props.value) return null;
  const d = difficulty[props.value];
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-extrabold',
        d.className,
      )}
    >
      {d.label}
    </span>
  );
}

function Fact(props: { icon: typeof Cpu; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-soft px-2.5 text-xs font-bold text-muted">
      <props.icon aria-hidden="true" className="size-3.5 opacity-70" />
      {props.children}
    </span>
  );
}

/** What the problem page needs; the student view and the mentor's live preview both fit it. */
export type ProblemView = {
  problem: Pick<
    StudentCodeAssignment['problem'],
    | 'difficulty'
    | 'cpuTimeLimitMs'
    | 'memoryLimitMb'
    | 'signature'
    | 'statementMd'
    | 'constraintsMd'
  >;
  samples: Pick<
    StudentCodeAssignment['samples'][number],
    'position' | 'display' | 'expected' | 'explanationMd'
  >[];
  hiddenTestCount: number;
};

/** Statement, samples and constraints, laid out like an online judge problem page. */
export function ProblemDescription(props: { assignment: ProblemView; footnote?: boolean }) {
  const a = props.assignment;
  const sig = a.problem.signature;
  return (
    <article className="space-y-6 px-5 py-5 text-black lg:px-6">
      <div className="flex flex-wrap items-center gap-1.5">
        <DifficultyPill value={a.problem.difficulty} />
        <Fact icon={EyeOff}>{a.hiddenTestCount} test ẩn</Fact>
        <Fact icon={Timer}>{a.problem.cpuTimeLimitMs} ms</Fact>
        <Fact icon={Cpu}>{a.problem.memoryLimitMb} MB</Fact>
      </div>

      {a.problem.statementMd.trim() ? (
        <Statement text={a.problem.statementMd} className="text-[15px] leading-7" />
      ) : (
        <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted/60">
          Mô tả đề sẽ hiện ở đây.
        </p>
      )}

      <section aria-label="Hàm cần viết" className="space-y-2">
        <h3 className="text-sm font-extrabold">Hàm cần viết</h3>
        <p className="inline-flex max-w-full flex-wrap items-baseline overflow-hidden rounded-lg bg-ide px-3 py-2 font-mono text-[13px] leading-6 text-ide-text">
          <span className="text-syn-function">{sig.functionName}</span>
          <span className="text-syn-operator">(</span>
          {sig.params.map((p, i) => (
            <span key={p.name}>
              {p.name}
              <span className="text-syn-operator">: </span>
              <span className="text-syn-type">{p.type}</span>
              {i < sig.params.length - 1 && <span className="text-syn-operator">, </span>}
            </span>
          ))}
          <span className="text-syn-operator">)</span>
          <span className="px-1.5 text-syn-keyword">→</span>
          <span className="text-syn-type">{sig.returnType}</span>
        </p>
      </section>

      {a.samples.map((s) => (
        <section key={s.position} className="space-y-2">
          <h3 className="text-sm font-extrabold">Ví dụ {s.position}</h3>
          <div className="space-y-1 border-l-2 border-line pl-4 text-sm leading-6">
            <p>
              <span className="font-extrabold">Input: </span>
              <span className="font-mono text-[13px] text-black/80">{s.display}</span>
            </p>
            <p>
              <span className="font-extrabold">Output: </span>
              <span className="font-mono text-[13px] text-black/80">{formatValue(s.expected)}</span>
            </p>
            {s.explanationMd && (
              <div className="flex gap-1">
                <span className="shrink-0 font-extrabold">Giải thích:</span>
                <Statement text={s.explanationMd} className="text-black/80" />
              </div>
            )}
          </div>
        </section>
      ))}

      {a.problem.constraintsMd && (
        <section className="space-y-2">
          <h3 className="text-sm font-extrabold">Ràng buộc</h3>
          <ul className="space-y-1.5">
            {a.problem.constraintsMd
              .split('\n')
              .map((line) => line.replace(/^\s*[-*•]\s*/, '').trim())
              .filter(Boolean)
              .map((line, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-mint" />
                  <code className="rounded-md bg-soft px-1.5 py-0.5 font-mono text-[12.5px] text-black/85">
                    {line}
                  </code>
                </li>
              ))}
          </ul>
        </section>
      )}

      {props.footnote !== false && (
        <p className="flex gap-2 border-t border-line pt-4 text-xs leading-5 text-muted/80">
          <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          Điểm là lần nộp cao nhất. Lỗi biên dịch không tính lượt; bài bị mentor huỷ vẫn tính lượt.
          Test ẩn chỉ hiện trạng thái và thời gian chạy.
        </p>
      )}
    </article>
  );
}
