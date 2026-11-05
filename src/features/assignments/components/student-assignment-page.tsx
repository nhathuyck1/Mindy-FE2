'use client';
import { StudentCodePage } from '@/features/code-assignments/components/student-code-page';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { useAssignmentCommand, useAssignmentQuery } from '../api/assignment-queries';
import * as dto from '../schemas/assignment-contracts';
import {
  AssignmentHeading,
  AssignmentMeta,
  QueryState,
  ErrorNotice,
  FileDownload,
  assignmentRootClass,
} from './assignment-ui';
import { AssignmentHistory } from './assignment-reports';

export function StudentAssignmentPage(props: { assignmentId: string }) {
  const valid = dto.uuid.safeParse(props.assignmentId).success;
  const query = useAssignmentQuery(
    `me/assignments/${props.assignmentId}`,
    dto.studentAssignmentSchema,
    valid,
  );
  const start = useAssignmentCommand(dto.attemptSchema);
  const draft = useAssignmentCommand(dto.studentZipSchema);
  const [startedRevision, setStartedRevision] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);
  const router = useRouter();
  const classId = useSearchParams().get('classId');
  const a = query.data;
  if (!valid) return <p>Không tìm thấy bài tập.</p>;
  if (a?.type === 'CODE') return <StudentCodePage assignmentId={props.assignmentId} />;
  return (
    <div className={assignmentRootClass}>
      <AssignmentHeading
        title={a?.title ?? 'Bài tập'}
        back={
          dto.uuid.safeParse(classId).success
            ? `/user/classes/${classId}/assignments`
            : '/user/courses'
        }
        backLabel={dto.uuid.safeParse(classId).success ? 'Bài tập của lớp' : 'Khóa học của tôi'}
      />
      <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>
        {a && (
          <div className="min-w-0 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-canvas">
            <AssignmentMeta item={a} embedded />
            {a.instructionFiles.length > 0 && (
              <section className="min-w-0 space-y-3 p-5 sm:p-6">
                <h2 className="text-xl font-extrabold">Tệp đề bài</h2>
                {a.instructionFiles.map((file) => (
                  <FileDownload file={file} key={file.id} />
                ))}
              </section>
            )}
            <section className="min-w-0 space-y-4 bg-soft/50 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold">
                    {a.type === 'QUIZ' ? 'Làm bài trắc nghiệm' : 'Nộp bài ZIP'}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {a.type === 'QUIZ'
                      ? 'Tiếp tục cùng lượt nếu bạn đã bắt đầu.'
                      : 'Chọn tệp, chờ kiểm tra rồi xác nhận nộp.'}
                  </p>
                </div>
                <Button
                  disabled={
                    start.isPending ||
                    draft.isPending ||
                    a.status !== 'PUBLISHED' ||
                    (a.type === 'ZIP' && !a.capabilities.zipMutationsEnabled)
                  }
                  onClick={async () => {
                    const revision = startedRevision ?? a.revision;
                    setStartedRevision(revision);
                    try {
                      const body = dto.startInputSchema.parse({
                        expectedAssignmentRevision: revision,
                      });
                      if (a.type === 'QUIZ') {
                        const result = await start.mutateAsync({
                          path: `me/assignments/${a.id}/start`,
                          body,
                          receipt: true,
                        });
                        router.push(`/user/assignment-submissions/${result.attemptId}`);
                      } else {
                        const result = await draft.mutateAsync({
                          path: `me/assignments/${a.id}/zip-submissions`,
                          body,
                          receipt: true,
                        });
                        router.push(`/user/zip-submissions/${result.id}`);
                      }
                      setError(null);
                    } catch (e) {
                      setError(e);
                      if (e instanceof ApiError && e.status < 500) setStartedRevision(null);
                    }
                  }}
                >
                  {start.isPending || draft.isPending
                    ? 'Đang mở bài…'
                    : a.type === 'QUIZ'
                      ? 'Bắt đầu / tiếp tục'
                      : 'Tạo / tiếp tục bài nộp'}
                </Button>
              </div>
              {a.type === 'ZIP' && !a.capabilities.zipMutationsEnabled && (
                <p className="text-sm">
                  Tạm ngừng nhận bài ZIP. Bạn vẫn có thể xem bài đã nộp bên dưới.
                </p>
              )}
              <ErrorNotice error={error} />
              {Boolean(error) && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    const result = await query.refetch();
                    if (result.isSuccess && !start.hasUnresolved && !draft.hasUnresolved)
                      setStartedRevision(null);
                  }}
                >
                  Kiểm tra thông tin bài
                </Button>
              )}
            </section>
            <AssignmentHistory assignmentId={a.id} embedded />
          </div>
        )}
      </QueryState>
    </div>
  );
}
