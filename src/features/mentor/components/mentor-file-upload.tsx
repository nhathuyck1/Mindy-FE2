'use client';

import { useEffect, useRef, useState } from 'react';
import { Paperclip, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mentorError, uploadMentorFile } from '../api/mentor-queries';
import type { ContentUnit } from '../schemas/mentor-contracts';
import { MentorUploadFileCard, type MentorUploadFile } from './mentor-upload-file-card';

type UploadAttempt = { file: File; state: 'uploading' | 'failed' | 'cancelled'; message: string };

export function MentorFileUpload(props: {
  unit: ContentUnit;
  video?: boolean;
  disabled?: boolean;
  compact?: boolean;
  label: string;
  value?: MentorUploadFile | null;
  onSelect?: () => void;
  onReady: (id: string, filename: string, kind: string, sizeBytes: number) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [attempt, setAttempt] = useState<UploadAttempt | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const busy = attempt?.state === 'uploading';
  const disabled = Boolean(props.disabled || busy);
  useEffect(() => () => controller.current?.abort(), []);

  async function selectFile(file: File) {
    if (props.disabled || controller.current) return;
    props.onSelect?.();
    if (!file.size || file.size > 209715200) {
      setAttempt({
        file,
        state: 'failed',
        message: 'Chọn tệp có dung lượng từ 1 byte đến 200 MiB.',
      });
      return;
    }
    const abort = new AbortController();
    controller.current = abort;
    setAttempt({ file, state: 'uploading', message: 'Đang chuẩn bị tệp…' });
    props.onBusy(true);
    try {
      const result = await uploadMentorFile(file, props.unit, abort.signal, (message) => {
        if (abort.signal.aborted) return;
        const displayMessage =
          message === 'Đang tạo phiên upload…'
            ? 'Đang chuẩn bị tệp…'
            : message.replace('file', 'tệp');
        setAttempt({ file, state: 'uploading', message: displayMessage });
      });
      if (abort.signal.aborted) return;
      if (props.video && result.kind !== 'VIDEO') throw new Error('Chọn tệp video MP4 hợp lệ.');
      props.onReady(
        result.id,
        result.originalFilename,
        result.kind ?? '',
        result.sizeBytes ?? result.declaredSizeBytes,
      );
      setAttempt(null);
    } catch (error) {
      if (!abort.signal.aborted) setAttempt({ file, state: 'failed', message: mentorError(error) });
    } finally {
      if (controller.current === abort) {
        controller.current = null;
        props.onBusy(false);
      }
    }
  }

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
      <p className="text-[16px] leading-6 font-semibold">{props.label}</p>
      <input
        ref={input}
        type="file"
        aria-label={props.label}
        tabIndex={-1}
        accept={props.video ? '.mp4,video/mp4' : undefined}
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
        aria-label={`Chọn tệp: ${props.label}`}
        disabled={disabled}
        onClick={() => input.current?.click()}
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
            hoặc nhấn để chọn tệp · Tối đa 200 MiB
          </span>
        </span>
      </Button>
      {attempt ? (
        <MentorUploadFileCard
          file={{ name: attempt.file.name, sizeBytes: attempt.file.size }}
          state={attempt.state}
          message={attempt.message}
          action={
            busy ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  controller.current?.abort();
                  controller.current = null;
                  props.onBusy(false);
                  setAttempt({
                    ...attempt,
                    state: 'cancelled',
                    message: 'Bạn có thể chọn tệp khác hoặc thử tải lại.',
                  });
                }}
              >
                Hủy tải lên
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={props.disabled}
                onClick={() => void selectFile(attempt.file)}
              >
                Thử lại
              </Button>
            )
          }
        />
      ) : props.value ? (
        <MentorUploadFileCard file={props.value} state="ready" />
      ) : null}
    </section>
  );
}
