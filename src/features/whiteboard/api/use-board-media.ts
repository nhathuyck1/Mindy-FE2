'use client';
import { useEffect, useRef, useState } from 'react';
import { apiRequest, ApiError } from '@/lib/api/client';
import { sessionSignal } from '@/lib/api/session-coordinator';
import {
  boardAccessSchema,
  boardAssetIntentSchema,
  boardAssetStatusSchema,
  boardExportSchema,
  type BoardMetadata,
} from '../schemas/whiteboard-contracts';
import type { BoardView } from '../lib/board-shapes';

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    signal.addEventListener('abort', abort, { once: true });
  });
interface UploadAttempt {
  file: File;
  pages?: number[];
  key: string;
  completeKey: string;
  id?: string;
}
interface ExportAttempt {
  key: string;
  body: {
    format: 'PNG' | 'PDF';
    scope: 'CONTENT' | 'VIEWPORT';
    expectedEpoch: string;
    viewport?: { x: number; y: number; width: number; height: number; scale: number };
  };
  id?: string;
}
export interface ReadyBoardImage {
  id: string;
  width: number;
  height: number;
}
export function useBoardMedia(boardId: string) {
  const lifetime = useRef<AbortController | null>(null),
    upload = useRef<UploadAttempt | null>(null),
    exportJob = useRef<ExportAttempt | null>(null);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [ready, setReady] = useState<ReadyBoardImage[]>([]),
    [retry, setRetry] = useState<'upload' | 'export' | null>(null);
  useEffect(() => {
    lifetime.current = new AbortController();
    return () => {
      lifetime.current?.abort();
      upload.current = null;
      exportJob.current = null;
    };
  }, []);
  const getSignal = () =>
    AbortSignal.any([sessionSignal(), lifetime.current?.signal ?? AbortSignal.abort()]);
  async function uploadFile(file?: File, pages?: number[]) {
    if (busy) return;
    if (file) {
      if (file.size > 10485760) {
        setMessage('Tệp tối đa 10 MiB.');
        return;
      }
      upload.current = { file, pages, key: crypto.randomUUID(), completeKey: crypto.randomUUID() };
      setReady([]);
    }
    const attempt = upload.current;
    if (!attempt) return;
    const signal = getSignal();
    setBusy(true);
    setRetry(null);
    setMessage('Đang tải và kiểm tra tệp…');
    try {
      const mime =
        attempt.file.type ||
        (/\.pdf$/i.test(attempt.file.name)
          ? 'application/pdf'
          : /\.jpe?g$/i.test(attempt.file.name)
            ? 'image/jpeg'
            : 'image/png');
      let current = attempt.id
        ? await apiRequest({
            path: `whiteboards/${boardId}/assets/${attempt.id}`,
            schema: boardAssetStatusSchema,
            signal,
          })
        : null;
      if (!current || current.status === 'PENDING_UPLOAD') {
        const intent = await apiRequest({
          path: `whiteboards/${boardId}/assets`,
          method: 'POST',
          idempotencyKey: attempt.key,
          body: {
            filename: attempt.file.name || 'clipboard.png',
            mimeType: mime,
            sizeBytes: attempt.file.size,
            ...(attempt.pages ? { pages: attempt.pages } : {}),
          },
          schema: boardAssetIntentSchema,
          signal,
        });
        attempt.id = intent.id;
        const result = await fetch(intent.putUrl, {
          method: 'PUT',
          headers: { 'Content-Type': mime },
          credentials: 'omit',
          body: attempt.file,
          signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
        });
        if (!result.ok) throw new Error('Storage upload failed');
        current = await apiRequest({
          path: `whiteboards/${boardId}/assets/${intent.id}/complete`,
          method: 'POST',
          body: {},
          idempotencyKey: attempt.completeKey,
          schema: boardAssetStatusSchema,
          signal,
        });
      }
      const deadline = Date.now() + 90000;
      while (current.status === 'PROCESSING' && Date.now() < deadline) {
        await wait(2000, signal);
        current = await apiRequest({
          path: `whiteboards/${boardId}/assets/${attempt.id}`,
          schema: boardAssetStatusSchema,
          signal,
        });
      }
      signal.throwIfAborted();
      if (current.status === 'READY' && current.width && current.height) {
        setReady([{ id: current.id, width: current.width, height: current.height }]);
        setMessage('Ảnh đã sẵn sàng.');
        upload.current = null;
      } else if (current.status === 'IMPORTED' && current.assets) {
        setReady(current.assets);
        setMessage('Các trang PDF đã sẵn sàng.');
        upload.current = null;
      } else if (current.status === 'PROCESSING') {
        setMessage('Tệp vẫn đang được kiểm tra. Bạn có thể kiểm tra lại.');
        setRetry('upload');
      } else {
        setMessage('Tệp không hợp lệ hoặc không còn khả dụng. Hãy chọn tệp khác.');
        upload.current = null;
      }
    } catch (e) {
      if (!signal.aborted) {
        setMessage(
          e instanceof ApiError && e.code === 'BOARD_PDF_DISABLED'
            ? 'PDF chưa được mở. Bạn có thể dùng ảnh PNG hoặc JPEG.'
            : 'Chưa hoàn tất tải tệp. Thử lại để kiểm tra đúng thao tác này.',
        );
        setRetry('upload');
      }
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }
  async function exportFile(
    board?: BoardMetadata,
    format: 'PNG' | 'PDF' = 'PNG',
    scope: 'CONTENT' | 'VIEWPORT' = 'CONTENT',
    view?: BoardView,
    size?: { width: number; height: number },
  ) {
    if (busy) return;
    if (board) {
      exportJob.current = {
        key: crypto.randomUUID(),
        body: {
          format,
          scope,
          expectedEpoch: board.epoch,
          ...(scope === 'VIEWPORT' && view && size
            ? {
                viewport: {
                  x: -view.x / view.scale,
                  y: -view.y / view.scale,
                  width: size.width / view.scale,
                  height: size.height / view.scale,
                  scale: view.scale,
                },
              }
            : {}),
        },
      };
    }
    const attempt = exportJob.current;
    if (!attempt) return;
    const signal = getSignal();
    setBusy(true);
    setRetry(null);
    setMessage('Đang chuẩn bị file xuất…');
    try {
      let job = await apiRequest({
        path: attempt.id
          ? `whiteboards/${boardId}/exports/${attempt.id}`
          : `whiteboards/${boardId}/exports`,
        method: attempt.id ? 'GET' : 'POST',
        ...(attempt.id ? {} : { body: attempt.body, idempotencyKey: attempt.key }),
        schema: boardExportSchema,
        signal,
      });
      attempt.id = job.id;
      const deadline = Date.now() + 90000;
      while (['QUEUED', 'RUNNING'].includes(job.status) && Date.now() < deadline) {
        await wait(1500, signal);
        job = await apiRequest({
          path: `whiteboards/${boardId}/exports/${job.id}`,
          schema: boardExportSchema,
          signal,
        });
      }
      if (job.status === 'COMPLETED') {
        const access = await apiRequest({
          path: `whiteboards/${boardId}/exports/${job.id}/access`,
          method: 'POST',
          schema: boardAccessSchema,
          signal,
        });
        signal.throwIfAborted();
        const link = document.createElement('a');
        link.href = access.url;
        link.download = `bang-ve.${job.format.toLowerCase()}`;
        link.rel = 'noopener noreferrer';
        link.click();
        setMessage('File đã sẵn sàng để tải.');
        setRetry('export');
      } else if (job.status === 'FAILED') {
        setMessage('Chưa xuất được file. Hãy chọn vùng nhỏ hơn và thử lại.');
        exportJob.current = null;
      } else {
        setMessage('File vẫn đang được chuẩn bị. Bạn có thể kiểm tra lại.');
        setRetry('export');
      }
    } catch (e) {
      if (!signal.aborted) {
        setMessage(
          e instanceof ApiError && e.code === 'BOARD_EXPORT_TOO_LARGE'
            ? 'Vùng xuất quá lớn. Hãy chọn vùng đang xem nhỏ hơn.'
            : e instanceof ApiError && e.code === 'BOARD_PDF_DISABLED'
              ? 'PDF chưa được mở. Bạn có thể xuất PNG.'
              : 'Chưa nhận được kết quả xuất. Kiểm tra lại đúng tác vụ này.',
        );
        setRetry('export');
      }
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }
  return {
    busy,
    message,
    ready,
    retry,
    uploadFile,
    exportFile,
    clearReady: () => setReady([]),
    cancel: () => {
      lifetime.current?.abort();
      lifetime.current = new AbortController();
      setBusy(false);
      setMessage('Đã dừng chờ. Tác vụ trên hệ thống có thể vẫn tiếp tục.');
      setRetry(upload.current ? 'upload' : exportJob.current ? 'export' : null);
    },
  };
}
