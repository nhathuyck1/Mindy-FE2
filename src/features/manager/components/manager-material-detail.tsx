'use client';

import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import {
  CalendarDays,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useSession } from '@/features/auth/api/auth-queries';
import { formatDate, formatTime } from '@/features/courses/lib/course-format';
import { managerRequest } from '../api/manager-request';
import { useManagerQuery, useManagerCommand, managerError } from '../api/manager-queries';
import {
  fileAccessSchema,
  materialDetailSchema,
  type MaterialDetail,
} from '../schemas/manager-contracts';
import { ManagerState, ReviewBadge, typeLabels } from './manager-shared';
import { managerFileKindLabels, managerFileSize } from './manager-file-card';
import { ManagerMaterialEditor } from './manager-material-editor';

function FilePreview(props: {
  material: MaterialDetail;
  file: NonNullable<MaterialDetail['file']>;
}) {
  const [signed, setSigned] = useState<z.infer<typeof fileAccessSchema> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!signed) return;
    const timer = setTimeout(
      () => setSigned(null),
      Math.max(0, Date.parse(signed.expiresAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [signed]);
  return (
    <div className="space-y-4 rounded-xl border border-line p-4 sm:p-5">
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-mint/10 text-mint">
          <FileText aria-hidden="true" className="size-6" />
        </div>
        <div className="min-w-0 flex-1 basis-40">
          <p className="text-sm font-semibold break-words [overflow-wrap:anywhere]">
            {props.file.originalFilename}
          </p>
          <p className="mt-1 text-xs text-muted">
            {managerFileKindLabels[props.file.kind]} · {managerFileSize(props.file.sizeBytes)}
          </p>
        </div>
        <Button
          variant="outline"
          className="ml-auto"
          disabled={busy}
          onClick={async () => {
            const abort = new AbortController();
            controller.current?.abort();
            controller.current = abort;
            setBusy(true);
            setError('');
            setSigned(null);
            try {
              const result = await managerRequest({
                path: `manager/materials/${props.material.id}/files/${props.file.id}/access`,
                method: 'POST',
                schema: fileAccessSchema,
                signal: abort.signal,
              });
              if (
                result.materialId !== props.material.id ||
                result.fileId !== props.file.id ||
                result.revision !== props.material.revision ||
                Date.parse(result.expiresAt) <= Date.now()
              )
                throw new Error('Tài liệu hoặc quyền xem đã thay đổi. Hãy mở lại chi tiết.');
              setSigned(result);
            } catch (failure) {
              if (!abort.signal.aborted) setError(managerError(failure));
            } finally {
              if (!abort.signal.aborted) setBusy(false);
            }
          }}
        >
          <ExternalLink aria-hidden="true" className="size-4" />
          {busy ? 'Đang lấy quyền xem…' : 'Xem / tải tệp'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      {signed && (
        <div className="space-y-3 border-t border-line pt-4">
          <a
            href={signed.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="block text-sm font-semibold text-mint underline"
          >
            Mở tệp trong tab mới ↗
          </a>
          {props.file.kind === 'VIDEO' ? (
            <video controls src={signed.url} className="max-h-96 w-full rounded-lg" />
          ) : props.file.kind === 'AUDIO' ? (
            <audio controls src={signed.url} className="w-full" />
          ) : props.file.kind === 'PDF' ? (
            <iframe
              title={props.file.originalFilename}
              src={signed.url}
              referrerPolicy="no-referrer"
              className="h-96 w-full rounded-lg border border-line"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
export function ManagerMaterialDetail(props: {
  id: string;
  onClose: () => void;
  embedded?: boolean;
}) {
  const session = useSession();
  const detail = useManagerQuery(`manager/materials/${props.id}`, materialDetailSchema);
  const command = useManagerCommand(materialDetailSchema);
  const remove = useManagerCommand(z.null());
  const [editing, setEditing] = useState<MaterialDetail | null>(null);
  const [actionRevision, setActionRevision] = useState(0);
  const [action, setAction] = useState<
    'approve' | 'reject' | 'publish' | 'unpublish' | 'delete' | null
  >(null);
  const [reason, setReason] = useState('');
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState('');
  const submitting = useRef(false);
  const revisionChanged = action !== null && detail.data?.revision !== actionRevision;
  async function reloadMaterial() {
    if (busy || detail.isFetching) return;
    const result = await detail.refetch();
    if (result.isError) {
      setFeedback(managerError(result.error));
      return;
    }
    setLocked(false);
    setAction(null);
    setFeedback('Đã tải lại tài liệu. Kiểm tra nội dung trước khi tiếp tục.');
  }
  const material = detail.data;
  const busy = command.isPending || remove.isPending;
  const actions = {
    approve: 'Duyệt tài liệu',
    reject: 'Yêu cầu chỉnh sửa',
    publish: 'Xuất bản',
    unpublish: 'Ẩn tài liệu',
    delete: 'Xóa tài liệu',
  };
  if (editing)
    return (
      <ManagerMaterialEditor
        material={editing}
        embedded={props.embedded}
        onClose={() => {
          setEditing(null);
          void detail.refetch();
        }}
      />
    );
  return (
    <>
      <Modal
        title="Chi tiết tài liệu"
        contentClassName="sm:max-w-4xl"
        embedded={props.embedded}
        onClose={() => {
          if (!busy) props.onClose();
        }}
      >
        <div
          className={
            props.embedded
              ? 'min-w-0 space-y-5 rounded-xl border border-line bg-canvas p-5 sm:p-6'
              : 'space-y-6 p-5 sm:p-7'
          }
        >
          <ManagerState pending={detail.isPending} error={detail.error} retry={detail.refetch}>
            {material && (
              <>
                <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
                  <div className="min-w-0 flex-1 basis-56">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <ReviewBadge status={material.reviewStatus} />
                      <span className="text-xs text-muted">
                        {typeLabels[material.contentType]} · Phiên bản {material.revision}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold break-words">{material.title}</h2>
                    {material.description && (
                      <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-muted">
                        {material.description}
                      </p>
                    )}
                  </div>
                  <div
                    className="flex min-w-0 max-w-full shrink-0 flex-wrap items-center gap-2"
                    role={props.embedded ? 'toolbar' : undefined}
                    aria-label={props.embedded ? 'Thao tác tài liệu' : undefined}
                  >
                    {material.canEdit && (
                      <Button
                        variant="outline"
                        aria-label="Chỉnh sửa"
                        title="Chỉnh sửa"
                        disabled={busy || locked}
                        onClick={() => setEditing(material)}
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                        <span className="sm:hidden">Sửa</span>
                        <span className="hidden sm:inline">Chỉnh sửa</span>
                      </Button>
                    )}
                    {(material.reviewStatus === 'PENDING_REVIEW' ||
                      (material.reviewStatus === 'DRAFT' &&
                        ((material.createdBy === session.data?.id &&
                          material.createdInClassId === null) ||
                          material.firstApprovedAt))) && (
                      <Button
                        disabled={busy || locked}
                        onClick={() => {
                          setAction('approve');
                          setActionRevision(material.revision);
                          setFeedback('');
                        }}
                      >
                        <Check aria-hidden="true" className="size-4" />
                        Duyệt tài liệu
                      </Button>
                    )}
                    {material.reviewStatus === 'PENDING_REVIEW' && (
                      <Button
                        variant="ghost"
                        disabled={busy || locked}
                        onClick={() => {
                          setAction('reject');
                          setActionRevision(material.revision);
                          setFeedback('');
                        }}
                      >
                        Yêu cầu chỉnh sửa
                      </Button>
                    )}
                    {material.reviewStatus === 'APPROVED' &&
                      material.approvedRevision === material.revision && (
                        <Button
                          variant="ghost"
                          className="min-w-11"
                          aria-label={material.publishedAt ? 'Ẩn tài liệu' : 'Xuất bản'}
                          title={material.publishedAt ? 'Ẩn tài liệu' : 'Xuất bản'}
                          disabled={busy || locked}
                          onClick={() => {
                            setAction(material.publishedAt ? 'unpublish' : 'publish');
                            setActionRevision(material.revision);
                            setFeedback('');
                          }}
                        >
                          {material.publishedAt ? (
                            <EyeOff aria-hidden="true" className="size-4" />
                          ) : (
                            <Eye aria-hidden="true" className="size-4" />
                          )}
                          <span className="hidden sm:inline">
                            {material.publishedAt ? 'Ẩn tài liệu' : 'Xuất bản'}
                          </span>
                        </Button>
                      )}
                    {material.canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-11 text-coral hover:bg-coral/10 hover:text-coral"
                        aria-label="Xóa tài liệu"
                        title="Xóa tài liệu"
                        disabled={busy || locked}
                        onClick={() => {
                          setAction('delete');
                          setActionRevision(material.revision);
                          setFeedback('');
                        }}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                    )}
                  </div>
                </header>
                {feedback && !action && (
                  <div
                    role={locked ? 'alert' : 'status'}
                    className={`space-y-3 rounded-xl p-4 text-sm ${locked ? 'bg-peach' : 'bg-soft'}`}
                  >
                    <p>{feedback}</p>
                    {locked && (
                      <Button
                        variant="outline"
                        disabled={detail.isFetching}
                        onClick={() => void reloadMaterial()}
                      >
                        Tải lại tài liệu
                      </Button>
                    )}
                  </div>
                )}
                <dl className="grid gap-4 border-b border-line pb-5 text-sm sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Eye aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mint" />
                    <div>
                      <dt className="text-xs text-muted">Xuất bản</dt>
                      <dd className="mt-1 font-medium">
                        {material.publishedAt ? (
                          <time dateTime={material.publishedAt}>
                            {formatDate(material.publishedAt)} · {formatTime(material.publishedAt)}
                          </time>
                        ) : (
                          'Chưa xuất bản'
                        )}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mint" />
                    <div>
                      <dt className="text-xs text-muted">Khả dụng từ</dt>
                      <dd className="mt-1 font-medium">
                        {material.availableAt ? (
                          <time dateTime={material.availableAt}>
                            {formatDate(material.availableAt)} · {formatTime(material.availableAt)}
                          </time>
                        ) : (
                          'Ngay khi đủ điều kiện truy cập'
                        )}
                      </dd>
                    </div>
                  </div>
                </dl>
                {material.rejectionReason && (
                  <div className="rounded-xl bg-peach p-4">
                    <p className="text-sm font-bold">Lý do yêu cầu chỉnh sửa</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{material.rejectionReason}</p>
                  </div>
                )}
                {material.contentType === 'ARTICLE' && (
                  <section>
                    <h3 className="mb-3 font-bold">Nội dung bài viết</h3>
                    <iframe
                      sandbox=""
                      referrerPolicy="no-referrer"
                      title="Xem trước bài viết"
                      className="h-80 w-full rounded-xl border border-line bg-canvas"
                      srcDoc={`<!doctype html><html lang="vi"><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; form-action 'none'; base-uri 'none'"><style>body{font:16px/1.7 system-ui;padding:16px;overflow-wrap:anywhere}pre,table{max-width:100%;overflow:auto}a{pointer-events:none}</style></head><body>${material.contentHtml ?? ''}</body></html>`}
                    />
                  </section>
                )}
                {material.file && (
                  <FilePreview
                    key={`${material.file.id}:${material.revision}`}
                    material={material}
                    file={material.file}
                  />
                )}
                {material.inlineImages.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="font-bold">Ảnh trong bài viết</h3>
                    {material.inlineImages.map((file) => (
                      <FilePreview
                        key={`${file.id}:${material.revision}`}
                        material={material}
                        file={file}
                      />
                    ))}
                  </section>
                )}
                {material.attachments.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="font-bold">Tệp đính kèm</h3>
                    {material.attachments.map((file) => (
                      <FilePreview
                        key={`${file.id}:${material.revision}`}
                        material={material}
                        file={file}
                      />
                    ))}
                  </section>
                )}
              </>
            )}
          </ManagerState>
        </div>
      </Modal>
      {action && material && (
        <Modal
          title={actions[action]}
          contentClassName="max-w-[calc(100vw-2rem)] sm:max-w-xl"
          onClose={() => {
            if (!busy) setAction(null);
          }}
        >
          <form
            className="space-y-4 p-5 sm:p-6"
            onSubmit={async (event) => {
              event.preventDefault();
              if (
                busy ||
                locked ||
                revisionChanged ||
                detail.isFetching ||
                submitting.current ||
                (action === 'reject' && !reason.trim())
              )
                return;
              submitting.current = true;
              try {
                if (action === 'delete') {
                  await remove.mutateAsync({
                    path: `manager/materials/${material.id}?expectedRevision=${actionRevision}`,
                    method: 'DELETE',
                  });
                  props.onClose();
                  return;
                }
                await command.mutateAsync({
                  path: `manager/materials/${material.id}/${action}`,
                  body: {
                    expectedRevision: actionRevision,
                    ...(action === 'reject' ? { reason: reason.trim() } : {}),
                  },
                });
                setFeedback('Đã cập nhật tài liệu.');
                setAction(null);
                setReason('');
              } catch (error) {
                setFeedback(managerError(error));
                setLocked(true);
              } finally {
                submitting.current = false;
              }
            }}
          >
            <p className="font-semibold break-words">{material.title}</p>
            <p className="text-sm text-muted">Phiên bản {actionRevision}</p>
            <p className="text-sm leading-6">
              {action === 'approve'
                ? 'Duyệt và xuất bản phiên bản này. Học viên có quyền sẽ xem được khi đủ điều kiện truy cập tài liệu và học phần.'
                : action === 'delete'
                  ? 'Tài liệu sẽ được xóa khỏi kho. Xác nhận để tiếp tục.'
                  : action === 'reject'
                    ? 'Nhập lý do để tác giả chỉnh sửa và gửi duyệt lại.'
                    : 'Thao tác áp dụng cho phiên bản bạn vừa xem.'}
            </p>
            {action === 'reject' && (
              <label className="block text-sm font-semibold">
                Lý do chỉnh sửa
                <textarea
                  required
                  minLength={1}
                  maxLength={2000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  disabled={busy || locked}
                  className="mt-2 min-h-28 w-full rounded-lg border border-line bg-canvas p-3 font-normal"
                />
              </label>
            )}
            {(feedback || revisionChanged) && (
              <p role="alert" className="rounded-xl bg-peach p-4 text-sm">
                {feedback ||
                  'Phiên bản tài liệu đã thay đổi. Tải lại và kiểm tra nội dung trước khi tiếp tục.'}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={
                  busy ||
                  locked ||
                  revisionChanged ||
                  detail.isFetching ||
                  (action === 'reject' && !reason.trim())
                }
              >
                {busy ? 'Đang xử lý…' : 'Xác nhận'}
              </Button>
              {(locked || revisionChanged) && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || detail.isFetching}
                  onClick={() => void reloadMaterial()}
                >
                  Tải lại tài liệu
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setAction(null)}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
