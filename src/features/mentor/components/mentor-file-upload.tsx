'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mentorError, uploadMentorFile } from '../api/mentor-queries';
import type { ContentUnit } from '../schemas/mentor-contracts';

export function MentorFileUpload(props: {
  unit: ContentUnit;
  video?: boolean;
  disabled?: boolean;
  label: string;
  onReady: (id: string, filename: string, kind: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-line p-4">
      <label className="block text-sm font-bold">
        {props.label}
        <Input
          type="file"
          accept={props.video ? 'video/mp4' : undefined}
          className="mt-3"
          disabled={busy || props.disabled}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            if (!file.size || file.size > 209715200) {
              setError('Chọn file có dung lượng từ 1 byte đến 200 MiB.');
              return;
            }
            const abort = new AbortController();
            controller.current = abort;
            setBusy(true);
            props.onBusy(true);
            setError('');
            try {
              const result = await uploadMentorFile(file, props.unit, abort.signal, setMessage);
              if (!abort.signal.aborted) {
                props.onReady(result.id, result.originalFilename, result.kind ?? '');
                setMessage(`Đã kiểm tra: ${result.originalFilename}`);
              }
            } catch (error) {
              if (!abort.signal.aborted) setError(mentorError(error));
            } finally {
              if (!abort.signal.aborted) {
                setBusy(false);
                props.onBusy(false);
              }
            }
          }}
        />
      </label>
      <p className="text-xs leading-5 text-muted">
        Tối đa 200 MiB. File sẽ được kiểm tra trước khi gắn vào học liệu.
      </p>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      {busy && (
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => {
            controller.current?.abort();
            setBusy(false);
            props.onBusy(false);
            setMessage('Đã hủy upload.');
          }}
        >
          Hủy upload
        </Button>
      )}
    </div>
  );
}
