'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api/client';
import { useMaterial } from '../api/learning-queries';
import {
  fileAccessSchema,
  type MaterialDetail,
  type MaterialFile,
  safeResourceUrl,
} from '../schemas/learning-contracts';
import { LearningState } from './learning-state';

async function accessFile(
  classId: string,
  materialId: string,
  fileId: string,
  revision: number,
  signal?: AbortSignal,
) {
  const result = await apiRequest({
    path: `me/classes/${classId}/materials/${materialId}/files/${fileId}/access`,
    method: 'POST',
    schema: fileAccessSchema,
    signal,
  });
  if (
    result.materialId !== materialId ||
    result.fileId !== fileId ||
    result.revision !== revision ||
    Date.parse(result.expiresAt) <= Date.now()
  )
    throw new Error('Tài liệu đã thay đổi. Vui lòng mở lại nội dung.');
  return result;
}

function ArticleBody(props: { material: MaterialDetail }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const controller = new AbortController();
    const source = new DOMParser().parseFromString(props.material.contentHtml ?? '', 'text/html');
    const allowed = new Set([
      'P',
      'H1',
      'H2',
      'H3',
      'H4',
      'H5',
      'H6',
      'STRONG',
      'EM',
      'B',
      'I',
      'U',
      'S',
      'UL',
      'OL',
      'LI',
      'BLOCKQUOTE',
      'PRE',
      'CODE',
      'BR',
      'HR',
      'TABLE',
      'THEAD',
      'TBODY',
      'TR',
      'TH',
      'TD',
      'A',
      'IMG',
      'FIGURE',
      'FIGCAPTION',
      'SPAN',
      'DIV',
      'SUB',
      'SUP',
    ]);
    const images: { element: HTMLImageElement; fileId: string }[] = [];
    function copy(node: Node): Node {
      if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? '');
      const fragment = document.createDocumentFragment();
      if (!(node instanceof Element)) return fragment;
      if (
        ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'FORM', 'INPUT'].includes(
          node.tagName,
        )
      )
        return fragment;
      const target = allowed.has(node.tagName)
        ? document.createElement(node.tagName.toLowerCase())
        : fragment;
      if (target instanceof HTMLAnchorElement) {
        const url = safeResourceUrl.safeParse(node.getAttribute('href'));
        if (url.success) {
          target.href = url.data;
          target.target = '_blank';
          target.rel = 'noopener noreferrer';
          target.referrerPolicy = 'no-referrer';
        }
      }
      if (target instanceof HTMLImageElement) {
        target.alt = node.getAttribute('alt') || 'Hình minh họa bài học';
        target.referrerPolicy = 'no-referrer';
        const fileId = node.getAttribute('data-file-id');
        if (fileId && props.material.inlineImages.some((file) => file.id === fileId))
          images.push({ element: target, fileId });
      }
      for (const child of node.childNodes) target.appendChild(copy(child));
      return target;
    }
    host.replaceChildren(...Array.from(source.body.childNodes, copy));
    void Promise.all(
      images.map(async ({ element, fileId }) => {
        const signed = await accessFile(
          props.material.classId,
          props.material.id,
          fileId,
          props.material.revision,
          controller.signal,
        );
        if (!controller.signal.aborted) element.src = signed.url;
      }),
    ).catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => {
      controller.abort();
      host.replaceChildren();
    };
  }, [props.material, attempt]);
  return (
    <>
      <div ref={ref} className="learning-article" />
      {error && (
        <div className="mt-5 text-sm" role="alert">
          Chưa thể tải ảnh minh họa.
          <Button
            variant="outline"
            className="ml-2"
            onClick={() => {
              setError(false);
              setAttempt(attempt + 1);
            }}
          >
            Tải lại ảnh
          </Button>
        </div>
      )}
    </>
  );
}

function FileViewer(props: { material: MaterialDetail; file: MaterialFile; attachment?: boolean }) {
  const [signed, setSigned] = useState<{ url: string; expiresAt: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const [error, setError] = useState<unknown>();
  const media = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const position = useRef({ time: 0, playing: false });
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!signed) return;
    const timer = setTimeout(
      () => {
        setLinkExpired(true);
        if (props.attachment || !['VIDEO', 'AUDIO'].includes(props.file.kind)) setSigned(null);
      },
      Math.max(0, Date.parse(signed.expiresAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [signed, props.attachment, props.file.kind]);
  async function open() {
    if (media.current)
      position.current = { time: media.current.currentTime, playing: !media.current.paused };
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setPending(true);
    setError(undefined);
    try {
      const result = await accessFile(
        props.material.classId,
        props.material.id,
        props.file.id,
        props.material.revision,
        abort.signal,
      );
      if (!abort.signal.aborted) {
        setSigned(result);
        setLinkExpired(false);
      }
    } catch (reason) {
      if (!abort.signal.aborted) {
        setSigned(null);
        setError(reason);
      }
    } finally {
      if (!abort.signal.aborted) setPending(false);
    }
  }
  const restore = () => {
    if (media.current) {
      media.current.currentTime = position.current.time;
      if (position.current.playing) void media.current.play().catch(() => undefined);
    }
  };
  return (
    <div className="space-y-4 rounded-xl border border-line bg-soft/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 break-all text-sm font-semibold">
          <FileText aria-hidden="true" className="size-5 shrink-0 text-mint" />
          {props.file.originalFilename}
        </p>
        <Button variant="outline" disabled={pending} onClick={() => void open()}>
          {signed ? <RefreshCw aria-hidden="true" /> : <Download aria-hidden="true" />}
          {pending
            ? 'Đang mở…'
            : signed
              ? 'Làm mới liên kết'
              : props.attachment
                ? 'Chuẩn bị tải tệp'
                : 'Mở nội dung'}
        </Button>
      </div>
      {error ? <LearningState error={error} retry={() => void open()} /> : null}
      {signed && (
        <>
          {!props.attachment && props.file.kind === 'VIDEO' && (
            <video
              ref={media}
              src={signed.url}
              controls
              playsInline
              preload="metadata"
              onLoadedMetadata={restore}
              onError={() => setError(new Error('Liên kết video cần làm mới.'))}
              className="aspect-video w-full rounded-lg bg-forest"
              aria-label={props.material.title}
            />
          )}
          {!props.attachment && props.file.kind === 'AUDIO' && (
            <audio
              ref={media}
              src={signed.url}
              controls
              onLoadedMetadata={restore}
              onError={() => setError(new Error('Liên kết cần làm mới.'))}
              className="w-full"
              aria-label={props.material.title}
            />
          )}
          {!props.attachment && props.file.kind === 'PDF' && (
            <iframe
              title={props.material.title}
              src={signed.url}
              referrerPolicy="no-referrer"
              sandbox="allow-same-origin allow-downloads"
              className="h-[65vh] w-full rounded-lg border border-line bg-canvas"
            />
          )}
          {/* Private images are short-lived signed resources, unsuitable for the Next image optimizer. */}
          {!props.attachment && props.file.kind === 'IMAGE' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signed.url}
              alt={props.material.title}
              referrerPolicy="no-referrer"
              className="mx-auto max-h-[65vh] max-w-full object-contain"
            />
          )}
          {!linkExpired && (
            <a
              href={signed.url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="text-link font-semibold"
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              {props.attachment ? 'Tải tệp đính kèm' : 'Mở tệp ở tab mới'}
            </a>
          )}
        </>
      )}
    </div>
  );
}

export function MaterialViewer(props: { classId: string; materialId: string; unitId: string }) {
  const query = useMaterial(props.classId, props.materialId);
  if (query.isPending) return <LearningState>Đang tải nội dung học…</LearningState>;
  if (query.isError)
    return <LearningState error={query.error} retry={() => void query.refetch()} />;
  const item = query.data;
  if (item.classId !== props.classId || item.classUnitId !== props.unitId)
    return <LearningState>Nội dung không thuộc chương này.</LearningState>;
  return (
    <article>
      <p className="eyebrow font-bold text-mint">
        {item.contentType === 'ARTICLE'
          ? 'Bài đọc'
          : item.contentType === 'VIDEO'
            ? 'Video bài học'
            : 'Tài liệu'}
      </p>
      <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{item.title}</h2>
      {item.description && (
        <p className="mt-4 whitespace-pre-wrap text-muted">{item.description}</p>
      )}
      <div className="mt-7">
        {item.contentType === 'ARTICLE' ? (
          <ArticleBody key={item.id + ':' + item.revision} material={item} />
        ) : item.file ? (
          <FileViewer key={item.id + ':' + item.revision} material={item} file={item.file} />
        ) : (
          <LearningState>Tệp nội dung chưa khả dụng.</LearningState>
        )}
      </div>
      {!!item.attachments.length && (
        <section className="mt-8 space-y-3" aria-label="Tệp đính kèm">
          <h3 className="text-lg font-bold">Tệp đính kèm</h3>
          {item.attachments.map((file) => (
            <FileViewer
              key={item.id + ':' + item.revision + ':' + file.id}
              material={item}
              file={file}
              attachment
            />
          ))}
        </section>
      )}
    </article>
  );
}
