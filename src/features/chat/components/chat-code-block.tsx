'use client';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { tokenLines } from '@/features/code-assignments/lib/code-highlight';
import { syntaxClass } from '@/features/code-assignments/components/code-editor';
import type { ChatCodeLanguage } from '../lib/chat-code';

/** A fenced code block inside a chat message: dark, coloured like the editor, copyable. */
export function ChatCodeBlock(props: {
  code: string;
  language: ChatCodeLanguage | null;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <figure className="my-1.5 overflow-hidden rounded-xl bg-ide text-ide-text ring-1 ring-ide-line">
      <figcaption className="flex h-8 items-center justify-between gap-2 border-b border-ide-line bg-ide-deep pr-1 pl-3 text-[11.5px] font-bold text-ide-muted">
        <span>
          {props.language === 'java21' ? 'Java' : props.language ? 'JavaScript' : props.label}
        </span>
        <button
          type="button"
          aria-label={copied ? 'Đã chép code' : 'Chép code'}
          title={copied ? 'Đã chép' : 'Chép code'}
          onClick={() => {
            void navigator.clipboard?.writeText(props.code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-ide-raised hover:text-ide-text"
        >
          {copied ? (
            <Check aria-hidden="true" className="size-3.5 text-syn-string" />
          ) : (
            <Copy aria-hidden="true" className="size-3.5" />
          )}
        </button>
      </figcaption>
      <pre className="code-ide-dark-scroll max-h-72 overflow-auto px-3 py-2 font-mono text-[12.5px] leading-5 whitespace-pre">
        {props.language
          ? tokenLines(props.code, props.language).map((line, i) => (
              <div key={i}>
                {line.map((t, j) => (
                  <span key={j} className={syntaxClass[t.kind]}>
                    {t.text}
                  </span>
                ))}
                {!line.length && '\n'}
              </div>
            ))
          : props.code}
      </pre>
    </figure>
  );
}
