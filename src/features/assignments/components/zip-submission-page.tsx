'use client';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api/client';
import { useAssignmentCommand, useAssignmentQuery } from '../api/assignment-queries';
import * as dto from '../schemas/assignment-contracts';
import {
  AssignmentHeading,
  AssignmentMeta,
  Status,
  QueryState,
  Confirm,
  ErrorNotice,
  FileDownload,
  Pager,
  dateLabel,
  assignmentRootClass,
  panelClass,
  fieldClass,
} from './assignment-ui';
import { AssignmentUpload } from './assignment-upload';
import { useAssignmentReportFilters } from './assignment-reports';

export function ZipSubmissionPage(props: { submissionId: string; mentor?: boolean }) {
  const valid = dto.uuid.safeParse(props.submissionId).success;
  const query = useAssignmentQuery(
    `${props.mentor ? 'mentor' : 'me'}/zip-submissions/${props.submissionId}`,
    props.mentor ? dto.mentorZipSchema : dto.studentZipSchema,
    valid,
    props.mentor ? 'MENTOR' : 'STUDENT',
  );
  if (!valid) return <p>Không tìm thấy bài nộp.</p>;
  return (
    <div className={assignmentRootClass}>
      <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>
        {query.data && (
          <ZipDetail
            item={query.data}
            mentor={props.mentor}
            refresh={async () => {
              const result = await query.refetch();
              if (result.isError) throw result.error;
              return result.data;
            }}
          />
        )}
      </QueryState>
    </div>
  );
}
function ZipDetail(props: {
  item: dto.ZipSubmission;
  mentor?: boolean;
  refresh: () => Promise<unknown>;
}) {
  const s = props.item;
  const metadata = useAssignmentQuery(
    `me/assignments/${s.assignmentId}`,
    dto.studentAssignmentSchema,
    !props.mentor && s.status === 'DRAFT',
  );
  const attach = useAssignmentCommand(dto.studentZipSchema);
  const submit = useAssignmentCommand(dto.studentZipSchema);
  const [error, setError] = useState<unknown>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const canUpload =
    s.status === 'DRAFT' &&
    metadata.data?.capabilities.zipMutationsEnabled &&
    metadata.data.status === 'PUBLISHED';
  return (
    <>
      <AssignmentHeading
        title={s.snapshot?.title ?? metadata.data?.title ?? 'Bài nộp ZIP'}
        back={`/${props.mentor ? 'mentor' : 'user'}/assignments/${s.assignmentId}`}
      />
      <section className={`${panelClass} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Status value={s.status} />
          <span className="text-sm text-muted">
            {s.attemptNumber
              ? `Lượt ${s.attemptNumber} · ${dateLabel(s.submittedAt)}`
              : 'Chưa nộp bài'}
          </span>
        </div>
        {s.snapshot && (
          <>
            <p className="whitespace-pre-wrap break-words">{s.snapshot.description}</p>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted">Hạn tại lần nộp</dt>
                <dd className="font-bold">{dateLabel(s.snapshot.dueAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Điểm tối đa</dt>
                <dd className="font-bold">{s.snapshot.maxScore}</dd>
              </div>
            </dl>
            {s.snapshot.instructionFiles.map((file) => (
              <FileDownload key={file.id} file={file} />
            ))}
          </>
        )}
        {s.file && <FileDownload file={s.file} />}
      </section>
      {s.status === 'DRAFT' && !props.mentor && (
        <QueryState pending={metadata.isPending} error={metadata.error} retry={metadata.refetch}>
          {metadata.data && (
            <>
              <AssignmentMeta item={metadata.data} />
              <section className={`${panelClass} space-y-5`}>
                <h2 className="text-xl font-extrabold">Tệp bài làm</h2>
                {!canUpload && <p>Tạm ngừng nhận bài mới. Bản nháp của bạn vẫn được giữ.</p>}
                <AssignmentUpload
                  path={`me/zip-submissions/${s.id}/upload-intents`}
                  submissionVersion={s.version}
                  disabled={!canUpload || blocked || submit.isPending || attach.isPending}
                  onStart={() => setReplacing(true)}
                  onBusyChange={setUploading}
                  onReady={async (fileId) => {
                    try {
                      await attach.mutateAsync({
                        path: `me/zip-submissions/${s.id}/file`,
                        method: 'PUT',
                        body: dto.attachInputSchema.parse({ expectedVersion: s.version, fileId }),
                        receipt: true,
                      });
                      await props.refresh();
                      setReplacing(false);
                      setError(null);
                    } catch (e) {
                      setBlocked(true);
                      setError(e);
                      throw e;
                    }
                  }}
                />
                <ErrorNotice error={error} />
                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={
                      !s.file ||
                      !canUpload ||
                      replacing ||
                      uploading ||
                      blocked ||
                      submit.isPending ||
                      attach.isPending
                    }
                    onClick={() => setConfirm(s.version)}
                  >
                    Nộp bài ZIP
                  </Button>
                  <Button
                    variant="outline"
                    disabled={submit.isPending || attach.isPending}
                    onClick={async () => {
                      try {
                        await props.refresh();
                        const result = await metadata.refetch();
                        if (result.isError) throw result.error;
                        attach.reconcile();
                        submit.reconcile();
                        setBlocked(false);
                        setError(null);
                      } catch (e) {
                        setError(e);
                      }
                    }}
                  >
                    Tải lại bài nộp
                  </Button>
                  {replacing && s.file && (
                    <Button
                      variant="ghost"
                      disabled={uploading}
                      onClick={() => setReplacing(false)}
                    >
                      Dùng tệp đã gắn
                    </Button>
                  )}
                </div>
              </section>
            </>
          )}
        </QueryState>
      )}
      {s.status !== 'DRAFT' && !props.mentor && (
        <section className={`${panelClass} space-y-4`}>
          <h2 className="text-xl font-extrabold">Kết quả</h2>
          {s.grade ? (
            <>
              <p className="text-3xl font-extrabold text-forest">
                {s.grade.score}
                <span className="text-lg text-muted"> / {s.snapshot?.maxScore}</span>
              </p>
              {s.grade.feedback && (
                <p className="whitespace-pre-wrap break-words">{s.grade.feedback}</p>
              )}
            </>
          ) : (
            <p className="text-muted">Chưa trả điểm.</p>
          )}
        </section>
      )}
      {props.mentor && <MentorGrade submissionId={s.id} />}
      {confirm !== null && (
        <Confirm
          title="Nộp bài ZIP?"
          busy={submit.isPending}
          error={error}
          disabled={blocked || replacing || confirm !== s.version || !canUpload}
          label="Xác nhận nộp bài"
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            try {
              await submit.mutateAsync({
                path: `me/zip-submissions/${s.id}/submit`,
                body: { expectedVersion: confirm },
                receipt: true,
              });
              setConfirm(null);
              setError(null);
              await props.refresh();
            } catch (e) {
              setError(e);
              if (e instanceof ApiError && e.status < 500) {
                setBlocked(true);
                setConfirm(null);
              }
            }
          }}
        >
          <p className="font-bold break-all">{s.file?.originalFilename}</p>
          <p>Sau khi nộp, tệp của lượt này sẽ được khóa.</p>
        </Confirm>
      )}
    </>
  );
}
function MentorGrade(props: { submissionId: string }) {
  const query = useAssignmentQuery(
    `mentor/zip-submissions/${props.submissionId}`,
    dto.mentorZipSchema,
    true,
    'MENTOR',
  );
  return (
    <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>
      {query.data && (
        <>
          <GradeForm item={query.data} refresh={query.refetch} />
          <GradeHistory submissionId={props.submissionId} />
        </>
      )}
    </QueryState>
  );
}
function GradeForm(props: { item: dto.MentorZipSubmission; refresh: () => Promise<unknown> }) {
  const [gradeVersion, setGradeVersion] = useState(props.item.gradeVersion);
  const [score, setScore] = useState(props.item.grade?.score ?? '');
  const [feedback, setFeedback] = useState(props.item.grade?.feedback ?? '');
  const [reason, setReason] = useState('');
  const [dirty, setDirty] = useState(false);
  const [replaceGrade, setReplaceGrade] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [release, setRelease] = useState<{ version: number; score: string } | null>(null);
  const [blocked, setBlocked] = useState(false);
  const grade = useAssignmentCommand(dto.mentorZipSchema);
  const publish = useAssignmentCommand(dto.mentorZipSchema);
  const busy = grade.isPending || publish.isPending;
  const stale = gradeVersion !== props.item.gradeVersion;
  return (
    <section className={`${panelClass} space-y-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">Chấm bài</h2>
        <span className="text-sm text-muted">
          {props.item.releasedVersion === null
            ? 'Chưa trả điểm'
            : props.item.releasedVersion === props.item.gradeVersion
              ? 'Đã trả điểm hiện tại'
              : 'Bản sửa chờ trả điểm'}
        </span>
      </div>
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || stale || blocked || !props.item.snapshot) return;
          try {
            const body = dto.gradeInputSchema.parse({
              expectedVersion: gradeVersion,
              score,
              feedback,
              ...(gradeVersion > 0 ? { reason } : {}),
            });
            if (dto.scoreCents(body.score) > dto.scoreCents(props.item.snapshot.maxScore))
              throw new ApiError(
                422,
                'SCORE_RANGE',
                `Điểm phải từ 0 đến ${props.item.snapshot.maxScore}.`,
              );
            const result = await grade.mutateAsync({
              path: `mentor/zip-submissions/${props.item.id}/grade`,
              method: 'PUT',
              body,
              receipt: true,
            });
            setGradeVersion(result.gradeVersion);
            setReason('');
            setDirty(false);
            setError(null);
            await props.refresh();
          } catch (e) {
            setError(e);
            if (!(e instanceof z.ZodError) && e instanceof ApiError && e.status === 409)
              setBlocked(true);
          }
        }}
      >
        <fieldset
          disabled={
            busy || blocked || stale || grade.hasUnresolved || props.item.status !== 'SUBMITTED'
          }
          className="grid gap-5"
        >
          <label className={`${fieldClass} max-w-64`}>
            Điểm / {props.item.snapshot?.maxScore ?? '—'}
            <Input
              name="score"
              required
              inputMode="decimal"
              value={score}
              onChange={(e) => {
                setScore(e.target.value);
                setDirty(true);
              }}
            />
          </label>
          <label className={fieldClass}>
            Nhận xét
            <Textarea
              value={feedback}
              rows={4}
              maxLength={10000}
              onChange={(e) => {
                setFeedback(e.target.value);
                setDirty(true);
              }}
            />
          </label>
          {gradeVersion > 0 && (
            <label className={fieldClass}>
              Lý do sửa điểm
              <Textarea
                required
                value={reason}
                maxLength={2000}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          )}
        </fieldset>
        <ErrorNotice error={error} />
        {stale && (
          <p role="alert">Điểm đã được sửa ở nơi khác. Bản nhập của bạn được giữ để đối chiếu.</p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={
              busy ||
              blocked ||
              stale ||
              grade.hasUnresolved ||
              !dirty ||
              props.item.status !== 'SUBMITTED'
            }
          >
            {grade.isPending ? 'Đang lưu…' : gradeVersion > 0 ? 'Lưu điểm sửa' : 'Lưu điểm'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={
              busy ||
              dirty ||
              blocked ||
              stale ||
              gradeVersion === 0 ||
              props.item.releasedVersion === gradeVersion
            }
            onClick={() => setRelease({ version: gradeVersion, score })}
          >
            Trả điểm
          </Button>
          <Button
            variant="ghost"
            type="button"
            disabled={busy}
            onClick={async () => {
              await props.refresh();
            }}
          >
            Kiểm tra bản điểm mới
          </Button>
        </div>
        {grade.hasUnresolved && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              try {
                const result = await grade.retryUnresolved();
                setGradeVersion(result.gradeVersion);
                setReason('');
                setDirty(false);
                setError(null);
                await props.refresh();
              } catch (e) {
                setError(e);
              }
            }}
          >
            Thử lại lần lưu điểm vừa gửi
          </Button>
        )}
        {(stale || blocked) && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setReplaceGrade(true)}
          >
            Dùng bản điểm mới
          </Button>
        )}
      </form>
      {replaceGrade && (
        <Confirm
          title="Dùng bản điểm trên máy chủ?"
          busy={false}
          onClose={() => setReplaceGrade(false)}
          onConfirm={() => {
            setGradeVersion(props.item.gradeVersion);
            setScore(props.item.grade?.score ?? '');
            setFeedback(props.item.grade?.feedback ?? '');
            setReason('');
            setDirty(false);
            setBlocked(false);
            setError(null);
            grade.reconcile();
            publish.reconcile();
            setReplaceGrade(false);
          }}
        >
          <p>Điểm và nhận xét chưa lưu trên màn hình sẽ được thay bằng bản mới.</p>
        </Confirm>
      )}
      {release && (
        <Confirm
          title="Trả điểm cho học viên?"
          busy={publish.isPending}
          error={error}
          disabled={release.version !== props.item.gradeVersion || blocked}
          label="Xác nhận trả điểm"
          onClose={() => setRelease(null)}
          onConfirm={async () => {
            try {
              await publish.mutateAsync({
                path: `mentor/zip-submissions/${props.item.id}/grade/release`,
                body: { expectedVersion: release.version, gradeVersion: release.version },
                receipt: true,
              });
              setRelease(null);
              setError(null);
              await props.refresh();
            } catch (e) {
              setError(e);
              if (e instanceof ApiError && e.status === 409) {
                setRelease(null);
                setBlocked(true);
                await props.refresh();
              }
            }
          }}
        >
          <p className="text-3xl font-extrabold text-forest">
            {release.score} / {props.item.snapshot?.maxScore}
          </p>
          <p>Học viên sẽ thấy điểm và nhận xét của bản này.</p>
        </Confirm>
      )}
    </section>
  );
}
function GradeHistory(props: { submissionId: string }) {
  const { params, change } = useAssignmentReportFilters('grade-');
  const parsed = dto.paginationSchema.safeParse(Object.fromEntries(params));
  const page = parsed.success ? parsed.data.page : 1;
  const query = useAssignmentQuery(
    `mentor/zip-submissions/${props.submissionId}/grade/history?page=${page}&pageSize=20`,
    dto.gradeHistorySchema,
    parsed.success,
    'MENTOR',
  );
  return (
    <section className={`${panelClass} space-y-5`}>
      <h2 className="text-xl font-extrabold">Lịch sử điểm</h2>
      <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>
        {query.data && (
          <>
            <ul className="divide-y divide-line">
              {query.data.items.map((item) => (
                <li key={item.version} className="space-y-2 py-4">
                  <p className="font-bold">
                    Bản {item.version} · {item.score} điểm
                  </p>
                  <p className="text-sm text-muted">{dateLabel(item.createdAt)}</p>
                  {item.feedback && (
                    <p className="whitespace-pre-wrap break-words">{item.feedback}</p>
                  )}
                  {item.reason && (
                    <p className="text-sm whitespace-pre-wrap break-words">Lý do: {item.reason}</p>
                  )}
                </li>
              ))}
            </ul>
            <h3 className="font-bold">Nhật ký chấm / trả điểm</h3>
            <ul className="space-y-3">
              {query.data.audits.map((audit, i) => (
                <li key={i} className="text-sm">
                  {audit.action === 'GRADE' ? 'Lưu điểm' : 'Trả điểm'} · Bản {audit.version} ·{' '}
                  {dateLabel(audit.createdAt)}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted">
              {query.data.total} bản điểm · {query.data.totalAudits} thao tác
            </p>
            <Pager
              page={page}
              total={Math.max(query.data.total, query.data.totalAudits)}
              hideCount
              onChange={(p) => change('page', String(p))}
            />
          </>
        )}
      </QueryState>
    </section>
  );
}
