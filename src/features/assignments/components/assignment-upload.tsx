'use client';
import { useEffect, useRef, useState } from 'react';
import { Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest, ApiError } from '@/lib/api/client';
import { sessionSignal } from '@/lib/api/session-coordinator';
import { uploadAssignmentFile } from '../api/assignment-queries';
import * as dto from '../schemas/assignment-contracts';
import { ErrorNotice, FileDownload } from './assignment-ui';

export function AssignmentUpload(props: {
  path: string;
  instruction?: boolean;
  revision?: number;
  submissionVersion?: number;
  disabled?: boolean;
  onStart?: () => void;
  onBusyChange?: (busy: boolean) => void;
  onReady: (id: string) => Promise<void>;
}) {
  const controller = useRef<AbortController | null>(null);
  const lock = useRef(false);
  const completion = useRef<{ id: string; version: number; key: string } | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [file, setFile] = useState<dto.ZipSubmission['file']>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  useEffect(() => () => controller.current?.abort(), []);
  async function accept(
    result: dto.ZipSubmission['file'] & { status: string; errorCode: string | null },
  ) {
    if (!result) return;
    setWaiting(result.status === 'PROCESSING');
    if (result.status === 'READY') {
      setStatus('Tệp hợp lệ. Đang gắn vào bài…');
      await props.onReady(result.id);
      setFile(result);
      setStatus('Đã gắn tệp');
    } else if (result.status === 'FAILED')
      throw new ApiError(
        422,
        'FILE_FAILED',
        `Tệp không hợp lệ${result.errorCode ? ` (${result.errorCode})` : ''}. Chọn tệp khác.`,
      );
    else setStatus('Tệp đang được kiểm tra.');
  }
  async function upload(file: File) {
    if (lock.current || props.disabled) return;
    lock.current = true;
    setBusy(true);
    props.onBusyChange?.(true);
    completion.current = null;
    setError(null);
    setFile(null);
    setFileId(null);
    setWaiting(false);
    props.onStart?.();
    controller.current?.abort();
    controller.current = new AbortController();
    const signal = AbortSignal.any([sessionSignal(), controller.current.signal]);
    try {
      const input = {
        originalFilename: file.name,
        declaredMimeType:
          !props.instruction &&
          file.name.toLowerCase().endsWith('.zip') &&
          ['', 'application/zip', 'application/x-zip-compressed'].includes(file.type)
            ? 'application/zip'
            : file.type,
        declaredSizeBytes: file.size,
        ...(props.instruction
          ? { expectedRevision: props.revision }
          : { expectedVersion: props.submissionVersion }),
      };
      const body = (
        props.instruction ? dto.instructionUploadInputSchema : dto.zipUploadInputSchema
      ).parse(input);
      const result = await uploadAssignmentFile({
        path: props.path,
        file,
        body,
        signal,
        onFile: setFileId,
        onUploaded: (value) => {
          completion.current = value;
        },
        onStatus: setStatus,
      });
      signal.throwIfAborted();
      await accept(result);
    } catch (e) {
      if (!signal.aborted) {
        setError(e);
        setStatus('Chưa gắn tệp');
      }
    } finally {
      lock.current = false;
      props.onBusyChange?.(false);
      if (!signal.aborted) setBusy(false);
    }
  }
  return (
    <div className="min-w-0 space-y-3">
      <label
        className={`flex min-h-32 min-w-0 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-mint/40 bg-mint/5 p-5 text-center focus-within:ring-2 focus-within:ring-mint ${props.disabled || busy ? 'pointer-events-none opacity-60' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) void upload(file);
        }}
      >
        <Upload aria-hidden="true" className="size-6 text-mint" />
        <span className="font-bold">
          {props.instruction ? 'Thêm tệp đề bài' : 'Chọn hoặc kéo tệp ZIP vào đây'}
        </span>
        <span className="text-sm text-muted">
          {props.instruction ? 'PDF, DOCX, PNG, JPEG · tối đa 25 MB' : 'ZIP · tối đa 20 MB'}
        </span>
        <input
          type="file"
          className="sr-only"
          aria-label={props.instruction ? 'Chọn tệp đề bài' : 'Chọn tệp ZIP'}
          accept={props.instruction ? '.pdf,.docx,.png,.jpg,.jpeg' : '.zip,application/zip'}
          disabled={props.disabled || busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void upload(file);
          }}
        />
      </label>
      {status && (
        <p role="status" className="text-sm font-bold text-mint">
          {status}
        </p>
      )}
      <ErrorNotice error={error} />
      {busy && (
        <Button
          variant="outline"
          onClick={() => {
            controller.current?.abort();
            setBusy(false);
            setStatus('Đã hủy tải tệp');
            props.onBusyChange?.(false);
          }}
        >
          Hủy tải tệp
        </Button>
      )}
      {file && <FileDownload file={file} />}
      {fileId && !file && !busy && (
        <Button
          variant="outline"
          onClick={async () => {
            if (lock.current) return;
            lock.current = true;
            setBusy(true);
            setError(null);
            try {
              let result = await apiRequest({
                path: `assignment-files/${fileId}`,
                schema: dto.fileStatusSchema,
              });
              if (result.status === 'PENDING_UPLOAD' && completion.current) {
                result = await apiRequest({
                  path: `assignment-files/${fileId}/complete`,
                  method: 'POST',
                  body: { expectedVersion: completion.current.version },
                  schema: dto.fileStatusSchema,
                  idempotencyKey: completion.current.key,
                });
              }
              await accept(result);
            } catch (e) {
              setError(e);
            } finally {
              lock.current = false;
              setBusy(false);
            }
          }}
        >
          <RefreshCw size={16} />
          {waiting ? 'Kiểm tra lại tệp' : 'Kiểm tra trạng thái'}
        </Button>
      )}
    </div>
  );
}
