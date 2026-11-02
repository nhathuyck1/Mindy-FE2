'use client';
import { MentorCodeAuthoringPage } from '@/features/code-assignments/components/mentor-code-authoring-page';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { workspaceSchema } from '@/features/mentor/schemas/workspace-contracts';
import { sessionContextSchema } from '@/features/mentor/schemas/mentor-contracts';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest, ApiError } from '@/lib/api/client';
import { useAssignmentCommand, useAssignmentQuery } from '../api/assignment-queries';
import * as dto from '../schemas/assignment-contracts';
import {
  AssignmentHeading,
  AssignmentMeta,
  QueryState,
  ErrorNotice,
  Confirm,
  FileDownload,
  assignmentRootClass,
  fieldClass,
  panelClass,
} from './assignment-ui';
import { AssignmentMetadataEditor, toDateInput } from './assignment-metadata-form';
import { QuizQuestionEditor } from './quiz-question-editor';
import { AssignmentUpload } from './assignment-upload';
import { AssignmentHistory, AssignmentRoster } from './assignment-reports';

export function MentorAssignmentPage(props: { assignmentId: string }) {
  const valid = dto.uuid.safeParse(props.assignmentId).success;
  const query = useAssignmentQuery(
    `mentor/assignments/${props.assignmentId}`,
    dto.mentorAssignmentSchema,
    valid,
    'MENTOR',
  );
  const [editor, setEditor] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    action: 'publish' | 'archive' | 'delete';
    revision: number;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const command = useAssignmentCommand(dto.mentorAssignmentSchema.nullable());
  const router = useRouter();
  const a = query.data;
  const context = useAssignmentQuery(
    `class-sessions/${a?.sessionId}/context`,
    sessionContextSchema,
    !!a && a.type !== 'CODE',
    'MENTOR',
  );
  const workspace = useAssignmentQuery(
    `mentor/classes/${context.data?.session.classId}`,
    workspaceSchema,
    !!context.data,
    'MENTOR',
  );
  const canAuthor =
    !!workspace.data && !workspace.data.readonly && context.data?.session.status !== 'CANCELLED';
  async function refresh() {
    const result = await query.refetch();
    if (result.isSuccess) {
      setBlocked(false);
      setError(null);
      setConfirm(null);
    }
  }
  if (!valid) return <p>Không tìm thấy bài tập.</p>;
  if (a?.type === 'CODE') return <MentorCodeAuthoringPage assignmentId={props.assignmentId} />;
  return (
    <div className={assignmentRootClass}>
      <AssignmentHeading
        title={a?.title ?? 'Bài tập'}
        back={
          context.data
            ? `/mentor/classes/${context.data.session.classId}?tab=assignments`
            : '/mentor/classes'
        }
        backLabel="Bài tập của lớp"
      >
        <Button variant="outline" disabled={command.isPending} onClick={refresh}>
          Tải lại bài tập
        </Button>
      </AssignmentHeading>
      <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>
        {a && (
          <>
            <AssignmentMeta item={a} />
            <ErrorNotice error={error} />
            {(context.error || workspace.error) && (
              <div className="space-y-3">
                <ErrorNotice error={context.error ?? workspace.error} />
                <Button
                  variant="outline"
                  onClick={() => {
                    void context.refetch();
                    void workspace.refetch();
                  }}
                >
                  Kiểm tra lại quyền
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {a.status === 'DRAFT' && !editor && canAuthor && (
                <>
                  <Button variant="outline" onClick={() => setEditor('metadata')}>
                    Sửa thông tin
                  </Button>
                  {a.type === 'QUIZ' && (
                    <Button variant="outline" onClick={() => setEditor('questions')}>
                      Soạn câu hỏi
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    disabled={!a.capabilities.instructionFilesEnabled}
                    onClick={() => setEditor('files')}
                  >
                    Tệp đề bài
                  </Button>
                  <Button
                    disabled={blocked || (a.type === 'ZIP' && !a.capabilities.zipMutationsEnabled)}
                    onClick={() => {
                      setReason('');
                      setConfirm({ action: 'publish', revision: a.revision });
                    }}
                  >
                    Xuất bản
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={blocked}
                    onClick={() => setConfirm({ action: 'delete', revision: a.revision })}
                  >
                    Xóa bản nháp
                  </Button>
                </>
              )}
              {a.status === 'PUBLISHED' && !editor && canAuthor && (
                <>
                  <Button
                    variant="outline"
                    disabled={blocked}
                    onClick={() => {
                      setReason('');
                      setConfirm({ action: 'archive', revision: a.revision });
                    }}
                  >
                    Lưu trữ bài
                  </Button>
                  {a.type === 'ZIP' && (
                    <Button
                      variant="outline"
                      disabled={!a.capabilities.zipMutationsEnabled}
                      onClick={() => setEditor('extend')}
                    >
                      Gia hạn / thêm lượt
                    </Button>
                  )}
                </>
              )}
              {editor && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditor(null);
                    void refresh();
                  }}
                >
                  Đóng trình sửa
                </Button>
              )}
            </div>
            {editor === 'metadata' && (
              <AssignmentMetadataEditor
                item={a}
                onSaved={() => {
                  setEditor(null);
                  void refresh();
                }}
              />
            )}
            {editor === 'questions' && (
              <QuizQuestionEditor item={a} onSaved={() => void query.refetch()} />
            )}
            {editor === 'files' && (
              <InstructionEditor item={a} onSaved={() => void query.refetch()} />
            )}
            {editor === 'extend' && (
              <ExtendForm
                item={a}
                onSaved={() => {
                  setEditor(null);
                  void refresh();
                }}
              />
            )}
            {!editor && (
              <>
                {a.instructionFiles.length > 0 && (
                  <section className={`${panelClass} space-y-3`}>
                    <h2 className="text-xl font-extrabold">Tệp đề bài</h2>
                    {a.instructionFiles.map((file) => (
                      <FileDownload key={file.id} file={file} />
                    ))}
                  </section>
                )}
                {a.type === 'QUIZ' && (
                  <QuizQuestionEditor
                    key={`${a.id}-${a.revision}`}
                    item={a}
                    readonly
                    onSaved={() => undefined}
                  />
                )}
                <AssignmentHistory
                  assignmentId={a.id}
                  mentor
                  type={a.type}
                  rosterAllowed={workspace.data?.capabilities.readClassRoster}
                />
                {workspace.data?.capabilities.readClassRoster && (
                  <AssignmentRoster assignmentId={a.id} />
                )}
              </>
            )}
            {confirm && (
              <Confirm
                title={
                  confirm.action === 'publish'
                    ? 'Xuất bản bài tập?'
                    : confirm.action === 'archive'
                      ? 'Lưu trữ bài tập?'
                      : 'Xóa bản nháp?'
                }
                busy={command.isPending}
                error={error}
                disabled={
                  blocked ||
                  a.revision !== confirm.revision ||
                  (confirm.action === 'archive' && !reason.trim())
                }
                onClose={() => setConfirm(null)}
                onConfirm={async () => {
                  if (command.isPending || blocked) return;
                  try {
                    const body =
                      confirm.action === 'archive'
                        ? dto.archiveInputSchema.parse({
                            expectedRevision: confirm.revision,
                            reason,
                          })
                        : dto.revisionInputSchema.parse({ expectedRevision: confirm.revision });
                    await command.mutateAsync({
                      path: `mentor/assignments/${a.id}${confirm.action === 'delete' ? '' : `/${confirm.action}`}`,
                      method: confirm.action === 'delete' ? 'DELETE' : 'POST',
                      body,
                    });
                    if (confirm.action === 'delete') router.push('/mentor/classes');
                    else await refresh();
                    setConfirm(null);
                  } catch (e) {
                    setError(e);
                    if (!(e instanceof z.ZodError)) setBlocked(true);
                  }
                }}
              >
                <p>
                  {confirm.action === 'publish'
                    ? 'Nội dung và tệp đề sẽ được khóa. Học viên có thể bắt đầu làm bài.'
                    : confirm.action === 'archive'
                      ? 'Các lượt đang làm sẽ bị hủy. Bài đã nộp vẫn được giữ. Không thể mở lại bài đã lưu trữ.'
                      : 'Bản nháp này sẽ bị xóa.'}
                </p>
                {confirm.action === 'publish' && (
                  <p className="font-bold">
                    {a.title}
                    {a.type === 'QUIZ' ? ` · ${a.questions?.length ?? 0} câu hỏi` : ''}
                  </p>
                )}
                {confirm.action === 'archive' && (
                  <label className={fieldClass}>
                    Lý do
                    <Textarea
                      maxLength={2000}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                )}
                {blocked && (
                  <Button variant="outline" onClick={refresh}>
                    Tải lại để kiểm tra
                  </Button>
                )}
              </Confirm>
            )}
          </>
        )}
      </QueryState>
    </div>
  );
}
function InstructionEditor(props: { item: dto.Assignment; onSaved: () => unknown }) {
  const [files, setFiles] = useState(props.item.instructionFiles);
  const [uploading, setUploading] = useState(false);
  const [revision, setRevision] = useState(props.item.revision);
  const [error, setError] = useState<unknown>(null);
  const [blocked, setBlocked] = useState(false);
  const command = useAssignmentCommand(dto.instructionsResponseSchema);
  async function save(next = files) {
    try {
      const result = await command.mutateAsync({
        path: `mentor/assignments/${props.item.id}/instruction-files`,
        method: 'PUT',
        body: dto.instructionInputSchema.parse({
          expectedRevision: revision,
          fileIds: next.map((f) => f.id),
        }),
        receipt: true,
      });
      setFiles(result.instructionFiles);
      setRevision(result.revision);
      setError(null);
      props.onSaved();
    } catch (e) {
      setError(e);
      setBlocked(true);
      throw e;
    }
  }
  return (
    <section className={`${panelClass} space-y-5`}>
      <h2 className="text-xl font-extrabold">
        Tệp đề bài <span className="text-base text-muted">({files.length}/5)</span>
      </h2>
      {files.map((file, i) => (
        <div key={file.id} className="space-y-2">
          <FileDownload file={file} />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={blocked || command.isPending || uploading || i === 0}
              onClick={() => {
                const next = [...files];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                setFiles(next);
              }}
            >
              Đưa lên
            </Button>
            <Button
              variant="ghost"
              disabled={blocked || command.isPending || uploading}
              onClick={() => setFiles(files.filter((f) => f.id !== file.id))}
            >
              Gỡ tệp
            </Button>
          </div>
        </div>
      ))}
      <AssignmentUpload
        path={`mentor/assignments/${props.item.id}/instruction-upload-intents`}
        instruction
        revision={revision}
        onBusyChange={setUploading}
        disabled={
          blocked ||
          command.isPending ||
          files.length >= 5 ||
          !props.item.capabilities.instructionFilesEnabled
        }
        onReady={async (id) => {
          const file = await apiRequest({
            path: `assignment-files/${id}`,
            schema: dto.fileStatusSchema,
          });
          await save([...files, { ...file, position: files.length }]);
        }}
      />
      <ErrorNotice error={error} />
      <Button
        disabled={blocked || command.isPending || uploading}
        onClick={() => {
          void save().catch(() => undefined);
        }}
      >
        Lưu thứ tự và tệp đề
      </Button>
    </section>
  );
}
function ExtendForm(props: { item: dto.Assignment; onSaved: () => void }) {
  const command = useAssignmentCommand(dto.extensionSchema);
  const [error, setError] = useState<unknown>(null);
  const [blocked, setBlocked] = useState(false);
  return (
    <form
      className={`${panelClass} space-y-5`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (command.isPending || blocked) return;
        const form = new FormData(e.currentTarget);
        try {
          const date = String(form.get('dueAt') ?? '');
          const attempts = Number(form.get('maxAttempts'));
          const dueAt = date ? `${date}:00+07:00` : undefined;
          if (
            (dueAt && Date.parse(dueAt) < Date.parse(props.item.dueAt ?? '')) ||
            attempts < props.item.maxAttempts ||
            ((!dueAt || Date.parse(dueAt) <= Date.parse(props.item.dueAt ?? '')) &&
              attempts <= props.item.maxAttempts)
          )
            throw new ApiError(
              422,
              'INVALID_EXTENSION',
              'Hạn hoặc số lượt mới phải tăng, không được giảm.',
            );
          const body = dto.extendInputSchema.parse({
            expectedRevision: props.item.revision,
            dueAt,
            maxAttempts: attempts,
            reason: form.get('reason'),
          });
          await command.mutateAsync({
            path: `mentor/assignments/${props.item.id}/extend`,
            body,
            receipt: true,
          });
          props.onSaved();
        } catch (e) {
          setError(e);
          if (
            !(e instanceof z.ZodError) &&
            (!(e instanceof ApiError) || e.status === 409 || e.status >= 500)
          )
            setBlocked(true);
        }
      }}
    >
      <h2 className="text-xl font-extrabold">Gia hạn bài tập</h2>
      <fieldset disabled={command.isPending || blocked} className="grid gap-5 sm:grid-cols-2">
        <label className={fieldClass}>
          Hạn nộp mới
          <Input type="datetime-local" name="dueAt" defaultValue={toDateInput(props.item.dueAt)} />
        </label>
        <label className={fieldClass}>
          Số lượt tối đa
          <Input
            type="number"
            name="maxAttempts"
            min={props.item.maxAttempts}
            max={10}
            defaultValue={props.item.maxAttempts}
            required
          />
        </label>
        <label className={`${fieldClass} sm:col-span-2`}>
          Lý do
          <Textarea name="reason" required maxLength={2000} />
        </label>
      </fieldset>
      <ErrorNotice error={error} />
      <Button type="submit" disabled={command.isPending || blocked}>
        {command.isPending ? 'Đang lưu…' : 'Lưu gia hạn'}
      </Button>
    </form>
  );
}
