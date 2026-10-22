'use client';
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Paperclip, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  checkManagerFile,
  fileValidationError,
  managerFileAccept,
  managerFileInput,
  uploadManagerFile,
  type ManagerFileStatus,
} from '../api/manager-upload';
import { managerError } from '../api/manager-queries';
import { ManagerFileCard, type ManagerUploadedFile } from './manager-file-card';

export function ManagerFileUpload(props: {
  courseUnitId: string;
  label: string;
  disabled: boolean;
  video?: boolean;
  compact?: boolean;
  value?: ManagerUploadedFile | null;
  onBusy: (value: boolean) => void;
  onPending: (value: boolean) => void;
  onReady: (file: ManagerUploadedFile) => void;
  onSelect?: () => void;
}) {
  const controller = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<ManagerFileStatus | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cancelled, setCancelled] = useState(false);
  const [declaration, setDeclaration] = useState<ReturnType<typeof managerFileInput> | null>(null);
  const [dragging, setDragging] = useState(false);
  const onPending = props.onPending;
  const onBusy = props.onBusy;
  const disabled = props.disabled || (busy && !pending) || !props.courseUnitId;
  useEffect(
    () => () => {
      controller.current?.abort();
      onPending(false);
      onBusy(false);
    },
    [onPending, onBusy],
  );

  function remember(file: ManagerFileStatus) {
    if (['PROCESSING', 'PENDING_UPLOAD'].includes(file.status)) {
      setPending(file);
      onPending(true);
      onBusy(false);
    }
  }
  function receive(file: ManagerFileStatus) {
    const failure = fileValidationError(file);
    if (failure) {
      setPending(null);
      onPending(false);
      setMessage('');
      setError(failure);
      return;
    }
    if (file.status !== 'READY') {
      remember(file);
      setMessage('Tệp đã tải lên, máy chủ vẫn đang kiểm tra. Bạn có thể kiểm tra lại sau.');
      return;
    }
    setPending(null);
    onPending(false);
    if (!file.kind) {
      setError('Chưa xác nhận được định dạng tệp. Vui lòng chọn lại.');
      setMessage('');
      return;
    }
    props.onReady({
      id: file.id,
      name: file.originalFilename,
      kind: file.kind,
      sizeBytes: file.sizeBytes ?? file.declaredSizeBytes,
    });
    setDeclaration(null);
    setMessage('');
  }
  async function run(
    operation: (signal: AbortSignal) => Promise<ManagerFileStatus>,
    transferring = false,
  ) {
    const abort = new AbortController();
    controller.current?.abort();
    controller.current = abort;
    setBusy(true);
    onBusy(transferring);
    setError('');
    setCancelled(false);
    try {
      const file = await operation(abort.signal);
      if (!abort.signal.aborted) receive(file);
    } catch (failure) {
      if (!abort.signal.aborted) {
        setMessage('');
        setError(managerError(failure));
      }
    } finally {
      if (!abort.signal.aborted) {
        setBusy(false);
        onBusy(false);
      }
    }
  }
  async function selectFile(file: File) {
    if (disabled) return;
    props.onSelect?.();
    setPending(null);
    onPending(false);
    setDeclaration(null);
    setMessage('');
    await run((signal) => {
      setDeclaration(managerFileInput(file, props.courseUnitId));
      return uploadManagerFile(
        file,
        props.courseUnitId,
        signal,
        (next) => {
          setMessage(
            next === 'Đang tạo phiên tải lên…'
              ? 'Đang chuẩn bị tệp…'
              : next.startsWith('Đã gửi tệp')
                ? 'Đang kiểm tra tệp…'
                : next,
          );
        },
        remember,
      );
    }, true);
  }
  const choosing = () => input.current?.click();
  const limit = props.video ? 'MP4 · Tối đa 200 MB' : 'Tối đa 25 MB mỗi tệp · MP4 tối đa 200 MB';
  return (
    <section
      aria-label={`${props.label} - tải lên`}
      className="min-w-0 space-y-3"
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        )
          setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files[0];
        if (file && !disabled) void selectFile(file);
      }}
    >
      <input
        ref={input}
        type="file"
        aria-label={props.label}
        tabIndex={-1}
        accept={props.video ? '.mp4' : managerFileAccept}
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void selectFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        aria-label={
          props.compact
            ? 'Thêm tệp đính kèm'
            : props.video
              ? 'Chọn video để tải lên'
              : 'Chọn tệp để tải lên'
        }
        disabled={disabled}
        onClick={choosing}
        className={`h-auto w-full flex-wrap justify-center gap-3 rounded-xl border-2 border-dashed whitespace-normal text-mint shadow-none ${props.compact ? 'px-4 py-4' : 'px-5 py-6'} ${dragging ? 'border-mint bg-mint/10' : 'border-mint/40 bg-mint/5 hover:border-mint hover:bg-mint/10'}`}
      >
        {props.compact ? (
          <Paperclip aria-hidden="true" className="size-5" />
        ) : (
          <Upload aria-hidden="true" className="size-6" />
        )}
        <span className="min-w-0 text-center">
          <span className="block text-[16px] leading-6 font-semibold">
            {props.video ? 'Kéo thả video MP4 vào đây' : 'Kéo thả tài liệu vào đây'}
          </span>
          <span className="mt-1 block text-[14px] leading-6 font-normal text-muted">
            {!props.courseUnitId
              ? 'Chọn khóa học và học phần trước'
              : `hoặc nhấn để chọn tệp · ${limit}`}
          </span>
        </span>
      </Button>
      {props.value && !declaration ? (
        <ManagerFileCard
          file={props.value}
          action={
            <Button
              type="button"
              variant="outline"
              className="border-line bg-canvas text-forest"
              disabled={disabled}
              onClick={choosing}
            >
              Thay tệp
            </Button>
          }
        />
      ) : declaration ? (
        <ManagerFileCard
          file={{ name: declaration.originalFilename, sizeBytes: declaration.declaredSizeBytes }}
          state={error ? 'failed' : busy ? 'uploading' : cancelled ? 'cancelled' : 'pending'}
          message={error || message}
          action={
            <>
              {(!busy || pending) && (
                <Button type="button" variant="outline" disabled={disabled} onClick={choosing}>
                  Chọn tệp khác
                </Button>
              )}
              {pending && !busy && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={props.disabled}
                  onClick={() =>
                    run((signal) => checkManagerFile(pending.id, props.courseUnitId, signal))
                  }
                >
                  Kiểm tra lại
                </Button>
              )}
              {busy ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    controller.current?.abort();
                    setBusy(false);
                    onBusy(false);
                    if (pending)
                      setMessage(
                        'Đã dừng kiểm tra tự động. Tệp vẫn được xử lý; bạn có thể kiểm tra lại sau.',
                      );
                    else {
                      setCancelled(true);
                      setMessage('Bạn có thể chọn tệp khác để tiếp tục.');
                    }
                  }}
                >
                  {pending ? 'Dừng kiểm tra tự động' : 'Hủy tải lên'}
                </Button>
              ) : (
                pending && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={props.disabled}
                    onClick={() => {
                      setPending(null);
                      onPending(false);
                      setDeclaration(null);
                      setMessage('');
                      setError('');
                    }}
                  >
                    Bỏ tệp đang chờ
                  </Button>
                )
              )}
            </>
          }
        />
      ) : null}
      {error && !declaration && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-status-red/30 bg-status-red/5 p-4 text-sm leading-6 text-status-red"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold">Tải lên thất bại</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        </div>
      )}
    </section>
  );
}
