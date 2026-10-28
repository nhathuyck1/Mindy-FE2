'use client';

import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api/client';
import {
  Plus,
  FileText,
  Paperclip,
  Send,
  Pencil,
  Trash2,
  CalendarDays,
  ArrowLeft,
  ExternalLink,
  LoaderCircle,
} from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useSession } from '@/features/auth/api/auth-queries';
import {
  useMentorCommand,
  useMentorQuery,
  useMentorUnitMaterials,
  useMentorUnitSessions,
  mentorError,
} from '../api/mentor-queries';
import {
  materialDetailSchema,
  fileAccessSchema,
  type ContentUnit,
  type Material,
  type MaterialDetail,
} from '../schemas/mentor-contracts';
import { MentorMaterialEditor } from './mentor-material-editor';
import { MentorQueryState, MentorStatus, mentorDate } from './mentor-shared';
import { MentorSessionMaterials } from './mentor-session-materials';

type UnitContextQuery = ReturnType<typeof useMentorUnitSessions>;

const fileKindLabels = {
  PDF: 'PDF',
  IMAGE: 'Hình ảnh',
  DOCUMENT: 'Tài liệu',
  PRESENTATION: 'Bài trình chiếu',
  SPREADSHEET: 'Bảng tính',
  AUDIO: 'Âm thanh',
  VIDEO: 'Video',
  SOURCE_CODE: 'Văn bản / mã nguồn',
};

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const unit = bytes < 1048576 ? 'KB' : 'MB';
  const size = bytes / (unit === 'KB' ? 1024 : 1048576);
  return `${size.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} ${unit}`;
}

function MaterialSession(props: {
  sessionId: string | null;
  context: UnitContextQuery;
  onChoose?: () => void;
}) {
  const linked = props.context.data?.sessions.find((item) => item.id === props.sessionId);
  const hasActions = Boolean(
    (props.sessionId && props.context.error) || (!props.sessionId && props.onChoose),
  );
  return (
    <section
      aria-label="Buổi học của tài liệu"
      className={`grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3 rounded-xl border border-line bg-soft/50 p-4 sm:gap-4 ${hasActions ? '@xl/mentor-content:grid-cols-[2.5rem_minmax(0,1fr)_auto]' : ''}`}
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-canvas text-mint"
      >
        <CalendarDays className="size-5" />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-muted">Buổi học của tài liệu</p>
        {linked ? (
          <>
            <p className="text-base leading-7 font-semibold [overflow-wrap:anywhere]">
              {linked.title}
            </p>
            <p className="text-sm leading-6 text-muted">
              Buổi {linked.sessionNumber} · {mentorDate(linked.startsAt)} –{' '}
              {mentorDate(linked.endsAt)}
            </p>
          </>
        ) : (
          <p className="text-base leading-7 font-semibold">
            {!props.sessionId
              ? 'Chưa gắn buổi học'
              : props.context.isPending
                ? 'Đang tải thông tin buổi học…'
                : props.context.error
                  ? 'Chưa tải được thông tin buổi học'
                  : 'Buổi học đã gắn không nằm trong chương này'}
          </p>
        )}
        {!props.sessionId && (
          <p className="text-sm leading-6 text-muted">
            Tài liệu chưa được gắn với một buổi học cụ thể.
          </p>
        )}
      </div>
      {hasActions && (
        <div className="col-span-full flex flex-wrap items-center gap-2 @xl/mentor-content:col-span-1">
          {props.sessionId && props.context.error && (
            <Button type="button" variant="outline" onClick={() => props.context.refetch()}>
              Thử lại
            </Button>
          )}
          {!props.sessionId && props.onChoose && (
            <Button type="button" variant="outline" onClick={props.onChoose}>
              Gắn buổi học
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

function MaterialFilePreview(props: {
  classId: string;
  materialId: string;
  revision: number;
  primary?: boolean;
  file: NonNullable<Material['file']>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const path = props.primary
    ? `mentor/classes/${props.classId}/materials/${props.materialId}/preview?expectedRevision=${props.revision}`
    : `mentor/classes/${props.classId}/materials/${props.materialId}/assets/${props.file.id}/access?expectedRevision=${props.revision}`;
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);
  useEffect(() => {
    if (!link) return;
    const timer = setTimeout(
      () => setLink(null),
      Math.max(0, Date.parse(link.expiresAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [link]);
  return (
    <section
      aria-label={props.file.originalFilename}
      className="min-w-0 overflow-hidden rounded-xl border border-line bg-canvas"
    >
      <div className="flex flex-wrap items-center gap-4 bg-soft/40 p-4 @xl/mentor-content:p-5">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-xl border border-mint/15 bg-mint/10 text-mint"
        >
          <FileText className="size-6" />
        </span>
        <div className="min-w-0 flex-[1_1_10rem] space-y-2">
          <p className="text-base leading-6 font-semibold [overflow-wrap:anywhere]">
            {props.file.originalFilename}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="rounded-md border border-line bg-canvas px-2 py-0.5 text-xs font-semibold text-forest">
              {fileKindLabels[props.file.kind]}
            </span>
            <span>{fileSize(props.file.sizeBytes)}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full border-mint/25 text-forest shadow-none @xl/mentor-content:ml-auto @xl/mentor-content:w-auto"
          disabled={pending}
          onClick={async () => {
            setLink(null);
            setPending(true);
            setError(null);
            const abort = new AbortController();
            controller.current = abort;
            try {
              const result = await apiRequest({
                path,
                schema: fileAccessSchema,
                signal: abort.signal,
              });
              if (
                result.materialId !== props.materialId ||
                result.fileId !== props.file.id ||
                result.revision !== props.revision
              )
                throw new Error('File trả về không khớp.');
              if (!abort.signal.aborted) setLink(result);
            } catch (error) {
              if (!abort.signal.aborted) setError(error);
            } finally {
              if (!abort.signal.aborted) setPending(false);
            }
          }}
        >
          {pending ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <ExternalLink aria-hidden="true" className="size-4" />
          )}
          {pending ? 'Đang lấy quyền xem…' : 'Xem / tải tệp'}
        </Button>
      </div>
      {Boolean(error) && (
        <p role="alert" className="border-t border-line px-4 py-3 text-sm text-destructive">
          {mentorError(error)}
        </p>
      )}
      {link && (
        <div className="space-y-4 border-t border-line p-4 @xl/mentor-content:p-5">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="text-link break-words text-mint"
          >
            Mở tệp trong tab mới
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
          <p className="text-xs text-muted">Liên kết hết hạn: {mentorDate(link.expiresAt)}</p>
          {props.file.kind === 'AUDIO' && (
            <audio controls preload="metadata" className="w-full" src={link.url} />
          )}
          {props.file.kind === 'PDF' && (
            <iframe
              title={props.file.originalFilename}
              referrerPolicy="no-referrer"
              src={link.url}
              className="h-[32rem] w-full rounded-xl border border-line"
            />
          )}
          {props.file.kind === 'VIDEO' && (
            <video controls preload="metadata" className="w-full rounded-xl" src={link.url}>
              <track kind="captions" />
            </video>
          )}
          {props.file.kind === 'IMAGE' && (
            <iframe
              title={props.file.originalFilename}
              sandbox=""
              referrerPolicy="no-referrer"
              src={link.url}
              className="h-80 w-full rounded-xl border border-line"
            />
          )}
        </div>
      )}
    </section>
  );
}
function MaterialDetail(props: {
  classId: string;
  unitContext: UnitContextQuery;
  id: string;
  onClose: () => void;
  onEdit: (material: MaterialDetail) => void;
  canAuthor: boolean;
  onAction: (action: 'submit' | 'delete', material: Material) => void;
}) {
  const detail = useMentorQuery(
    `mentor/classes/${props.classId}/materials/${props.id}`,
    materialDetailSchema,
  );
  const session = useSession();
  const item = detail.data;
  const editable =
    props.canAuthor &&
    item?.canEdit &&
    item.createdBy === session.data?.id &&
    !item.firstApprovedAt &&
    ['DRAFT', 'REJECTED'].includes(item.reviewStatus);
  return (
    <Modal
      title={item?.title ?? 'Chi tiết nội dung'}
      contentClassName="sm:max-w-4xl"
      onClose={props.onClose}
      embedded
    >
      <div className="space-y-5">
        <MentorQueryState pending={detail.isPending} error={detail.error} retry={detail.refetch}>
          {item && (
            <>
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4"
                role="toolbar"
                aria-label="Thao tác nội dung"
              >
                <div className="min-w-0 flex-[1_1_16rem] space-y-3">
                  <h3 className="text-xl leading-7 font-bold break-words">{item.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <MentorStatus value={item.contentType} />
                    <MentorStatus value={item.reviewStatus} />
                    {item.publishedAt && <span className="text-sm text-muted">Đã xuất bản</span>}
                  </div>
                </div>
                {editable && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => props.onEdit(item)}>
                      <Pencil aria-hidden="true" className="size-4" />
                      Chỉnh sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => props.onAction('submit', item)}
                    >
                      <Send aria-hidden="true" className="size-4" />
                      Gửi duyệt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => props.onAction('delete', item)}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      Xóa nháp
                    </Button>
                  </div>
                )}
              </div>
              <MaterialSession
                sessionId={item.sessionId}
                context={props.unitContext}
                onChoose={editable ? () => props.onEdit(item) : undefined}
              />
              {item.description && (
                <p className="whitespace-pre-wrap text-base leading-7">{item.description}</p>
              )}
              {item.rejectionReason && (
                <p className="rounded-xl bg-peach p-4 text-sm">
                  Lý do từ chối: {item.rejectionReason}
                </p>
              )}
              {item.contentHtml && (
                <iframe
                  title="Nội dung bài viết"
                  sandbox=""
                  referrerPolicy="no-referrer"
                  className="h-96 w-full rounded-xl border border-line bg-canvas"
                  srcDoc={`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><style>body{font-family:system-ui,sans-serif;padding:16px;line-height:1.7;overflow-wrap:anywhere}pre{white-space:pre-wrap}img{max-width:100%}</style></head><body>${item.contentHtml}</body></html>`}
                />
              )}
              {item.file && (
                <MaterialFilePreview
                  classId={props.classId}
                  materialId={item.id}
                  key={`${item.file.id}-${item.revision}`}
                  revision={item.revision}
                  primary
                  file={item.file}
                />
              )}
              {item.inlineImages.length > 0 && <h3 className="font-bold">Ảnh trong bài viết</h3>}
              {item.inlineImages.map((file) => (
                <MaterialFilePreview
                  key={`${file.id}-${item.revision}`}
                  classId={props.classId}
                  materialId={item.id}
                  revision={item.revision}
                  file={file}
                />
              ))}
              {item.attachments.length > 0 && (
                <h3 className="flex items-center gap-2 text-base font-bold">
                  <Paperclip aria-hidden="true" className="size-5 text-mint" />
                  Tệp đính kèm
                  <span className="rounded-full bg-mint/10 px-2.5 py-0.5 text-sm font-semibold text-forest">
                    {item.attachments.length}
                  </span>
                </h3>
              )}
              {item.attachments.map((file) => (
                <MaterialFilePreview
                  key={`${file.id}-${item.revision}`}
                  classId={props.classId}
                  materialId={item.id}
                  revision={item.revision}
                  file={file}
                />
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm text-muted">
                <span>
                  Phiên bản {item.revision} · Cập nhật {mentorDate(item.updatedAt)}
                </span>
              </div>
            </>
          )}
        </MentorQueryState>
      </div>
    </Modal>
  );
}
export function MentorMaterials(props: { unit: ContentUnit; canAuthor: boolean }) {
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ material?: MaterialDetail } | null>(null);
  const [confirm, setConfirm] = useState<{
    action: 'submit' | 'delete';
    material: Material;
  } | null>(null);
  const prefix = `mentor/classes/${props.unit.classId}`;
  const unitContext = useMentorUnitSessions(props.unit);
  const materials = useMentorUnitMaterials(props.unit, filter);
  const submit = useMentorCommand(materialDetailSchema);
  const remove = useMentorCommand(z.null());
  const busy = submit.isPending || remove.isPending;
  const body = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    if (detail || editor) body.current?.focus({ preventScroll: true });
  }, [detail, editor]);
  return (
    <section
      aria-label="Nội dung chương"
      className="flex min-h-0 min-w-0 flex-col [overflow-wrap:anywhere]"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-line p-5 sm:px-6 sm:py-6">
        <div className="min-w-0 flex-[1_1_16rem]">
          <p className="mb-2 text-sm font-bold text-mint">Chương {props.unit.position}</p>
          <h2 className="text-xl font-bold [overflow-wrap:anywhere]">{props.unit.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2 [&>button]:grow">
          {props.canAuthor && (
            <Button
              disabled={Boolean(editor)}
              onClick={() => {
                setDetail(null);
                setEditor({});
              }}
            >
              <Plus className="size-4" />
              Thêm nội dung
            </Button>
          )}
        </div>
      </div>
      <div
        ref={body}
        role="region"
        aria-label="Nội dung chương - vùng cuộn"
        tabIndex={0}
        className="scrollbar-hidden @container/mentor-content min-h-0 min-w-0 flex-1 p-5 focus-visible:outline-2 focus-visible:outline-mint focus-visible:-outline-offset-2 sm:p-6 @3xl/mentor-course:overflow-y-auto @3xl/mentor-course:overscroll-y-contain"
      >
        {!editor && !detail && (
          <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 flex-[1_1_14rem]">
                <h3 className="text-lg font-bold">Nội dung theo buổi học</h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {props.canAuthor
                    ? 'Chọn nội dung để xem, chỉnh sửa hoặc gửi duyệt. Nhấn Thêm nội dung ở đầu chương để tạo và chọn buổi học.'
                    : 'Nội dung đã công bố trong phạm vi buổi học được phân công.'}
                </p>
              </div>
              <NativeSelect
                aria-label="Trạng thái nội dung"
                wrapperClassName="ml-auto w-60 max-w-full min-w-0"
                className="h-12 w-full text-[16px] leading-6"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                }}
              >
                <NativeSelectOption value="">Mọi trạng thái nội dung</NativeSelectOption>
                {props.canAuthor && <NativeSelectOption value="DRAFT">Bản nháp</NativeSelectOption>}
                {props.canAuthor && (
                  <NativeSelectOption value="PENDING_REVIEW">Chờ duyệt</NativeSelectOption>
                )}
                {props.canAuthor && (
                  <NativeSelectOption value="REJECTED">Cần chỉnh sửa</NativeSelectOption>
                )}
                <NativeSelectOption value="APPROVED">Đã duyệt</NativeSelectOption>
              </NativeSelect>
            </div>
            <MentorQueryState
              pending={materials.isPending || unitContext.isPending}
              error={materials.error ?? unitContext.error}
              retry={() => Promise.all([materials.refetch(), unitContext.refetch()])}
            >
              <MentorSessionMaterials
                sessions={unitContext.data?.sessions ?? []}
                items={materials.data ?? []}
                filtered={Boolean(filter)}
                onSelect={setDetail}
              />
            </MentorQueryState>
          </>
        )}
        {(detail || editor) && (
          <Button
            variant="ghost"
            className="mb-5 -ml-3 text-forest"
            onClick={() => {
              setDetail(null);
              setEditor(null);
              body.current?.focus({ preventScroll: true });
            }}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Về danh sách buổi học
          </Button>
        )}
        {detail && !editor && (
          <MaterialDetail
            key={detail}
            classId={props.unit.classId}
            canAuthor={props.canAuthor}
            unitContext={unitContext}
            id={detail}
            onClose={() => setDetail(null)}
            onAction={(action, material) => {
              submit.reset();
              remove.reset();
              setConfirm({ action, material });
            }}
            onEdit={(material) => {
              setEditor({ material });
            }}
          />
        )}
        {editor && (
          <MentorMaterialEditor
            embedded
            key={editor.material?.id ?? 'new'}
            unit={props.unit}
            material={editor.material}
            onSaved={(material) => {
              setDetail(material.id);
              setFilter('');
            }}
            onClose={() => setEditor(null)}
          />
        )}
      </div>
      {confirm && (
        <Modal
          title={confirm.action === 'submit' ? 'Gửi nội dung duyệt' : 'Xóa bản nháp'}
          onClose={() => {
            if (!busy) setConfirm(null);
          }}
        >
          <div className="space-y-5 p-6">
            <p>
              {confirm.action === 'submit'
                ? 'Gửi bản nháp này cho Manager duyệt? Bạn sẽ không sửa được khi đang chờ duyệt.'
                : 'Xóa bản nháp này khỏi buổi học?'}{' '}
              <strong>{confirm.material.title}</strong>
            </p>
            {(submit.isError || remove.isError) && (
              <p role="alert" className="rounded-xl bg-peach p-4">
                {mentorError(submit.error ?? remove.error)}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>
                Quay lại
              </Button>
              <Button
                disabled={busy || materials.isFetching}
                onClick={async () => {
                  try {
                    if (confirm.action === 'submit')
                      await submit.mutateAsync({
                        path: `${prefix}/materials/${confirm.material.id}/submit`,
                        body: { expectedRevision: confirm.material.revision },
                      });
                    else
                      await remove.mutateAsync({
                        path: `${prefix}/materials/${confirm.material.id}?expectedRevision=${confirm.material.revision}`,
                        method: 'DELETE',
                      });
                    if (confirm.action === 'delete') setDetail(null);
                    setConfirm(null);
                  } catch {
                    /* Keep dialog and show error. */
                  }
                }}
              >
                {busy ? 'Đang xử lý…' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
