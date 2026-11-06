'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { submissionStatusLabels, verdictLabels } from '../lib/code-format';

const good = new Set(['ACCEPTED', 'PASSED', 'COMPLETED', 'GRADED', 'PUBLISHED']);
const warn = new Set(['PARTIAL', 'QUEUED', 'RUNNING', 'DRAFT']);

export function CodeBadge(props: {
  value: string | null | undefined;
  kind?: 'verdict' | 'status';
}) {
  if (!props.value) return null;
  const label =
    (props.kind === 'status' ? submissionStatusLabels : verdictLabels)[props.value] ??
    verdictLabels[props.value] ??
    submissionStatusLabels[props.value] ??
    props.value;
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold',
        good.has(props.value)
          ? 'border-mint/40 bg-soft text-forest'
          : warn.has(props.value)
            ? 'border-coral/40 bg-peach text-forest'
            : 'border-headsup/40 bg-peach text-headsup',
      )}
    >
      {label}
    </Badge>
  );
}

export function CodeBlock(props: { label?: string; value: string; className?: string }) {
  return (
    <div className={cn('space-y-1', props.className)}>
      {props.label && <p className="text-xs font-semibold text-muted-foreground">{props.label}</p>}
      <pre className="max-h-64 overflow-auto rounded-lg border border-line bg-soft p-3 font-mono text-xs whitespace-pre-wrap break-all">
        {props.value || '—'}
      </pre>
    </div>
  );
}

export function CodeSection(props: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-canvas p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{props.title}</h2>
          {props.description && (
            <p className="text-sm text-muted-foreground">{props.description}</p>
          )}
        </div>
        {props.actions}
      </div>
      {props.children}
    </section>
  );
}

export function CodeMessage(props: { tone?: 'error' | 'info'; children: React.ReactNode }) {
  return (
    <p
      role={props.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg px-3 py-2 text-sm',
        props.tone === 'error' ? 'bg-peach text-headsup' : 'bg-soft text-forest',
      )}
    >
      {props.children}
    </p>
  );
}

/** Plain-text statement rendering (no HTML injection); paragraphs and `code` spans only. */
export function Statement(props: { text: string; className?: string }) {
  return (
    <div className={cn('space-y-2 text-sm leading-6', props.className)}>
      {props.text.split(/\n{2,}/).map((block, i) =>
        block.startsWith('```') ? (
          <pre
            key={i}
            className="overflow-auto rounded-lg bg-soft p-3 font-mono text-xs whitespace-pre"
          >
            {block.replace(/^```\w*\n?|```$/g, '')}
          </pre>
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {block.split(/(`[^`]+`)/).map((part, j) =>
              part.startsWith('`') && part.endsWith('`') ? (
                <code key={j} className="rounded bg-soft px-1 font-mono text-xs">
                  {part.slice(1, -1)}
                </code>
              ) : (
                part
              ),
            )}
          </p>
        ),
      )}
    </div>
  );
}
