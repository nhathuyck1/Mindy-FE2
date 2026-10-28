'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  Autoformat,
  BlockQuote,
  Bold,
  ClassicEditor,
  Code,
  CodeBlock,
  Essentials,
  GeneralHtmlSupport,
  Heading,
  HorizontalLine,
  Italic,
  Link,
  List,
  Paragraph,
  PasteFromOffice,
  RemoveFormat,
  SourceEditing,
  Strikethrough,
  Table,
  TableCaption,
  TableToolbar,
  Underline,
  type EditorConfig,
} from 'ckeditor5';
import vietnamese from 'ckeditor5/translations/vi.js';
import 'ckeditor5/ckeditor5.css';
import './article-editor.css';
import { ckeditorLicenseKey } from '@/lib/env.client';
import { ARTICLE_MAX_BYTES } from '@/lib/article-content';
import { Button } from './button';
import type { ArticleEditorProps } from './article-editor';

const config: EditorConfig = {
  licenseKey: ckeditorLicenseKey,
  language: 'vi',
  translations: [vietnamese],
  label: 'Nội dung bài viết',
  placeholder: 'Nhập nội dung bài viết…',
  plugins: [
    Essentials,
    Paragraph,
    Heading,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Link,
    List,
    BlockQuote,
    CodeBlock,
    HorizontalLine,
    Table,
    TableToolbar,
    TableCaption,
    Autoformat,
    PasteFromOffice,
    RemoveFormat,
    SourceEditing,
    GeneralHtmlSupport,
  ],
  toolbar: {
    items: [
      'undo',
      'redo',
      '|',
      'heading',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'link',
      'bulletedList',
      'numberedList',
      '|',
      'insertTable',
      'blockQuote',
      'code',
      'codeBlock',
      'horizontalLine',
      '|',
      'removeFormat',
      'sourceEditing',
    ],
    shouldNotGroupWhenFull: false,
  },
  heading: {
    options: [
      { model: 'paragraph', title: 'Đoạn văn', class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: 'Tiêu đề 1', class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: 'Tiêu đề 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: 'Tiêu đề 3', class: 'ck-heading_heading3' },
      { model: 'heading4', view: 'h4', title: 'Tiêu đề 4', class: 'ck-heading_heading4' },
      { model: 'heading5', view: 'h5', title: 'Tiêu đề 5', class: 'ck-heading_heading5' },
      { model: 'heading6', view: 'h6', title: 'Tiêu đề 6', class: 'ck-heading_heading6' },
    ],
  },
  link: { defaultProtocol: 'https://', allowedProtocols: ['http', 'https', 'mailto'] },
  table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'toggleTableCaption'] },
  // Keep legacy article elements and verified image IDs when reopening a draft.
  // Storage URLs, arbitrary styles and embeds are not part of the backend contract.
  htmlSupport: {
    allow: [
      {
        name: /^(h[1-6]|p|br|hr|strong|b|em|i|u|s|ul|ol|li|table|thead|tbody|tfoot|tr|th|td|caption|blockquote|code|pre|figure|figcaption)$/,
      },
      { name: 'a', attributes: ['href', 'title'] },
      { name: 'img', attributes: ['data-file-id', 'alt'] },
      { name: /^(th|td)$/, attributes: ['colspan', 'rowspan'] },
    ],
  },
};

export function ArticleEditorClient(props: ArticleEditorProps) {
  const descriptionId = useId();
  const editorRef = useRef<ClassicEditor | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const onReadyChange = props.onReadyChange;
  useEffect(() => () => onReadyChange(false), [onReadyChange]);
  const bytes = new TextEncoder().encode(props.value).byteLength;

  return (
    <div
      ref={setContainer}
      className="article-editor min-w-0 space-y-2"
      onInput={(event) => {
        // SourceEditing updates its textarea without emitting change:data until
        // getData() is called. Sync it so Save also works while source is open.
        if (
          event.target instanceof HTMLTextAreaElement &&
          event.target.closest('.ck-source-editing-area') &&
          editorRef.current
        ) {
          props.onChange(editorRef.current.getData());
        }
      }}
    >
      <p className="text-sm font-semibold">Nội dung bài viết</p>
      {failed ? (
        <div role="alert" className="rounded-xl border border-line p-4 text-sm">
          <p>Chưa tải được trình soạn thảo. Nội dung đang nhập được giữ lại.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            Thử lại trình soạn thảo
          </Button>
        </div>
      ) : container ? (
        <CKEditor
          key={attempt}
          editor={ClassicEditor}
          config={{
            ...config,
            // Keep floating inputs inside Radix's dialog focus boundary.
            ui: {
              overlayContainer: container.closest<HTMLElement>('[role="dialog"]') ?? container,
            },
          }}
          data={props.value}
          disabled={props.disabled}
          onReady={(editor) => {
            editorRef.current = editor;
            editor.editing.view.change((writer) => {
              const root = editor.editing.view.document.getRoot();
              if (root) {
                writer.setAttribute('aria-label', 'Nội dung bài viết', root);
                writer.setAttribute('aria-describedby', descriptionId, root);
                writer.setAttribute('aria-required', 'true', root);
              }
            });
            props.onReadyChange(true);
          }}
          onChange={(_event, editor) => props.onChange(editor.getData())}
          onError={() => {
            editorRef.current = null;
            props.onReadyChange(false);
            setFailed(true);
          }}
        />
      ) : null}
      <div id={descriptionId} className="flex flex-wrap justify-between gap-2 text-xs text-muted">
        <span>Định dạng trực tiếp hoặc dán nội dung từ Word. Tối đa 48 KiB.</span>
        <span className={bytes > ARTICLE_MAX_BYTES ? 'font-semibold text-headsup' : ''}>
          {(bytes / 1024).toFixed(1)} / 48 KiB
        </span>
      </div>
      {bytes > ARTICLE_MAX_BYTES && (
        <p role="alert" className="text-sm text-headsup">
          Bài viết vượt giới hạn 48 KiB. Vui lòng rút gọn trước khi lưu.
        </p>
      )}
    </div>
  );
}
