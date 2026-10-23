'use client';

import dynamic from 'next/dynamic';

export type ArticleEditorProps = {
  value: string;
  disabled?: boolean;
  onChange: (html: string) => void;
  onReadyChange: (ready: boolean) => void;
};

export const ArticleEditor = dynamic<ArticleEditorProps>(
  () => import('./article-editor-client').then((module) => module.ArticleEditorClient),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="rounded-xl border border-line p-4 text-sm text-muted">
        Đang tải trình soạn thảo…
      </p>
    ),
  },
);
