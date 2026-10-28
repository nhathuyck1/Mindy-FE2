'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useMentorCommand, mentorError } from '../api/mentor-queries';
import { meetingInputSchema, meetingResponseSchema } from '../schemas/workspace-contracts';

export function MentorMeetingEditor(props: {
  sessionId: string;
  version: number;
  meetingUrl: string | null;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(props.meetingUrl ?? '');
  const [version] = useState(props.version);
  const [error, setError] = useState('');
  const command = useMentorCommand(meetingResponseSchema);
  return (
    <Modal
      title="Sửa link buổi học"
      onClose={() => {
        if (!command.isPending) props.onClose();
      }}
    >
      <form
        className="space-y-5 p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const input = meetingInputSchema.safeParse({
            expectedVersion: version,
            meetingUrl: url.trim() || null,
          });
          if (!input.success) {
            setError(
              'Nhập URL HTTP/HTTPS hợp lệ, tối đa 2048 ký tự, không chứa tên đăng nhập hoặc mật khẩu.',
            );
            return;
          }
          setError('');
          try {
            await command.mutateAsync({
              path: `mentor/class-sessions/${props.sessionId}/meeting-url`,
              method: 'PATCH',
              body: input.data,
            });
            props.onClose();
          } catch {
            /* shown below */
          }
        }}
      >
        <label className="block space-y-2 font-bold">
          Link học trực tuyến
          <Input
            className="h-12 bg-canvas"
            placeholder="https://meet.google.com/…"
            type="url"
            maxLength={2048}
            value={url}
            disabled={command.isPending}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        <p className="text-sm text-muted">
          Để trống để dùng link chung của lớp. Chỉ thay đổi buổi học này.
        </p>
        {(error || command.error) && <p role="alert">{error || mentorError(command.error)}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={command.isPending}
            onClick={props.onClose}
          >
            Đóng
          </Button>
          <Button type="submit" disabled={command.isPending || props.version !== version}>
            {command.isPending ? 'Đang lưu…' : 'Lưu link buổi học'}
          </Button>
        </div>
        {props.version !== version && (
          <p role="alert">Buổi học đã thay đổi. Đóng và mở lại form để dùng dữ liệu mới.</p>
        )}
      </form>
    </Modal>
  );
}
