'use client';
import { useState } from 'react';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api/client';
import { useMentorCommand, useMentorQuery, mentorError } from '../api/mentor-queries';
import { teachingNoteInputSchema, teachingNoteSchema } from '../schemas/workspace-contracts';
import { MentorQueryState, mentorDate } from './mentor-shared';

function NoteEditor(props: {
  note: z.infer<typeof teachingNoteSchema>;
  latest: z.infer<typeof teachingNoteSchema>;
  canWrite: boolean;
  editableUntil: string | null;
}) {
  const [content, setContent] = useState(props.note.note?.content ?? '');
  const [nextSteps, setNextSteps] = useState(props.note.note?.nextSteps ?? '');
  const [version, setVersion] = useState(props.note.version);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const command = useMentorCommand(teachingNoteSchema);
  const conflict = props.latest.version !== version;
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaved('');
        setError('');
        if (
          !props.canWrite ||
          !props.editableUntil ||
          Date.parse(props.editableUntil) <= Date.now()
        ) {
          setBlocked(true);
          setError('Đã hết thời hạn sửa ghi chú. Bản nháp vẫn được giữ tại đây.');
          return;
        }
        const input = teachingNoteInputSchema.safeParse({
          expectedVersion: version,
          content,
          nextSteps,
        });
        if (!input.success) {
          setError('Nội dung tối đa 10.000 ký tự, việc tiếp theo tối đa 5.000 ký tự.');
          return;
        }
        try {
          const result = await command.mutateAsync({
            path: `class-sessions/${props.note.sessionId}/teaching-notes`,
            method: 'PUT',
            body: input.data,
            idempotent: true,
          });
          setVersion(result.version);
          setSaved('Đã lưu ghi chú giảng dạy.');
        } catch (cause) {
          if (
            cause instanceof ApiError &&
            ['TEACHING_NOTE_WINDOW_CLOSED', 'TEACHING_NOTE_STATE_CONFLICT'].includes(cause.code)
          )
            setBlocked(true);
        }
      }}
    >
      <p className="text-xs leading-6 text-muted">
        Ghi chú nội bộ cho người giảng dạy và quản lý.{' '}
        {props.editableUntil
          ? `Hạn sửa: ${mentorDate(props.editableUntil)}.`
          : 'Hiện chưa có thời hạn chỉnh sửa.'}
      </p>
      <label className="block space-y-2 font-bold">
        Nội dung đã dạy
        <Textarea
          aria-label="Nội dung đã dạy"
          className="min-h-36 bg-canvas text-base"
          placeholder="Tóm tắt kiến thức và hoạt động trong buổi học…"
          maxLength={10000}
          rows={6}
          value={content}
          readOnly={!props.canWrite || blocked}
          disabled={command.isPending}
          onChange={(e) => {
            setContent(e.target.value);
            setSaved('');
          }}
        />
      </label>
      <label className="block space-y-2 font-bold">
        Việc cần làm tiếp
        <Textarea
          aria-label="Việc cần làm tiếp"
          className="min-h-28 bg-canvas text-base"
          placeholder="Nội dung cần ôn tập hoặc chuẩn bị tiếp…"
          maxLength={5000}
          rows={4}
          value={nextSteps}
          readOnly={!props.canWrite || blocked}
          disabled={command.isPending}
          onChange={(e) => {
            setNextSteps(e.target.value);
            setSaved('');
          }}
        />
      </label>
      {conflict && (
        <div role="alert" className="space-y-3 rounded-xl bg-peach p-4">
          <p>
            Ghi chú đã thay đổi trên máy chủ. Bản nháp của bạn được giữ nguyên; hãy đối chiếu trước
            khi lưu.
          </p>
          <div className="space-y-2 rounded-lg bg-canvas p-3">
            <p className="font-bold">Nội dung hiện tại trên máy chủ</p>
            <p className="whitespace-pre-wrap break-words">
              {props.latest.note?.content || '(Trống)'}
            </p>
            <p className="whitespace-pre-wrap break-words">
              {props.latest.note?.nextSteps || '(Trống)'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setContent(props.latest.note?.content ?? '');
                setNextSteps(props.latest.note?.nextSteps ?? '');
                setVersion(props.latest.version);
                command.reset();
              }}
            >
              Dùng nội dung máy chủ
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setVersion(props.latest.version);
                command.reset();
              }}
            >
              Giữ bản nháp để lưu tiếp
            </Button>
          </div>
        </div>
      )}
      {(error || command.error) && (
        <p role="alert" className="text-status-red">
          {error || mentorError(command.error)}
        </p>
      )}
      {saved && (
        <p role="status" className="text-mint">
          {saved}
        </p>
      )}
      {props.canWrite && (
        <Button type="submit" disabled={command.isPending || conflict || blocked}>
          {command.isPending ? 'Đang lưu…' : 'Lưu ghi chú giảng dạy'}
        </Button>
      )}
      {!props.canWrite && (
        <p className="text-sm text-muted">
          Chỉ xem ghi chú. Người phụ trách buổi học có thể sửa trong thời hạn cho phép.
        </p>
      )}
    </form>
  );
}
export function MentorTeachingNotes(props: {
  sessionId: string;
  canWrite: boolean;
  editableUntil: string | null;
}) {
  const query = useMentorQuery(
    `class-sessions/${props.sessionId}/teaching-notes`,
    teachingNoteSchema,
  );
  return (
    <section className="mt-4 rounded-2xl border border-line bg-canvas p-5 sm:p-6">
      <h2 className="mb-5 text-xl font-bold">Ghi chú giảng dạy</h2>
      {query.data && query.error && (
        <p role="alert" className="mb-4 text-status-red">
          Chưa tải lại được ghi chú. Bản nháp được giữ nguyên.{' '}
          <Button variant="outline" onClick={() => query.refetch()}>
            Thử tải lại
          </Button>
        </p>
      )}
      <MentorQueryState
        pending={!query.data && query.isPending}
        error={!query.data ? query.error : null}
        retry={query.refetch}
      >
        {query.data && (
          <NoteEditor
            note={query.data}
            latest={query.data}
            canWrite={props.canWrite && !query.error}
            editableUntil={props.editableUntil}
          />
        )}
      </MentorQueryState>
    </section>
  );
}
