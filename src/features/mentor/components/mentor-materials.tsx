'use client';

import { useEffect, useState } from 'react';
import { Plus, FileText, Video, Paperclip, Eye, Send, Pencil, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useSession } from '@/features/auth/api/auth-queries';
import { useMentorCommand, useMentorQuery, mentorError } from '../api/mentor-queries';
import {
  materialsSchema,
  materialDetailSchema,
  fileAccessSchema,
  unitSessionsSchema,
  type ContentUnit,
  type Material,
  type MaterialDetail,
} from '../schemas/mentor-contracts';
import { MentorMaterialEditor } from './mentor-material-editor';
import { MentorPagination, MentorQueryState, MentorStatus, mentorDate } from './mentor-shared';

function UnitSessionContext(props: { unit: ContentUnit }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const sessions = useMentorQuery(
    `mentor/classes/${props.unit.classId}/units/${props.unit.id}/sessions?page=${page}&pageSize=20`,
    unitSessionsSchema,
    open,
  );
  return (
    <div className="mb-6 rounded-xl border border-line p-4">
      <Button variant="outline" aria-expanded={open} onClick={() => setOpen(!open)}>
        Các buổi trong chương
      </Button>
      {open && (
        <div className="mt-4">
          <MentorQueryState
            pending={sessions.isPending}
            error={sessions.error}
            retry={sessions.refetch}
            empty={sessions.data?.items.length === 0}
          >
            <ul className="space-y-3">
              {sessions.data?.items.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 text-sm"
                >
                  <span>
                    Buổi {session.sessionNumber}: {session.title}
                  </span>
                  <MentorStatus value={session.status} />
                </li>
              ))}
            </ul>
          </MentorQueryState>
          {sessions.data && (
            <MentorPagination page={page} total={sessions.data.total} onChange={setPage} />
          )}
        </div>
      )}
    </div>
  );
}

function MaterialFilePreview(props: {
  classId: string;
  materialId: string;
  file: NonNullable<Material['file']>;
}) {
  const command = useMentorCommand(fileAccessSchema);
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
    <div className="space-y-3 rounded-xl border border-line p-4">
      <p className="text-sm font-bold break-all">{props.file.originalFilename}</p>
      <p className="text-xs text-muted">
        {props.file.mimeType} ·{' '}
        {(props.file.sizeBytes / 1048576).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} MiB
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={command.isPending}
        onClick={async () => {
          setLink(null);
          try {
            const result = await command.mutateAsync({
              path: `mentor/classes/${props.classId}/materials/${props.materialId}/files/${props.file.id}/access`,
            });
            if (result.materialId !== props.materialId || result.fileId !== props.file.id)
              throw new Error('File trả về không khớp.');
            setLink(result);
          } catch {
            /* Mutation error below. */
          }
        }}
      >
        {command.isPending ? 'Đang lấy quyền xem…' : 'Lấy liên kết xem file'}
      </Button>
      {command.isError && (
        <p role="alert" className="text-sm">
          {mentorError(command.error)}
        </p>
      )}
      {link && (
        <div className="space-y-3">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="text-link break-words text-mint"
          >
            Mở / tải file ↗
          </a>
          <p className="text-xs text-muted">Liên kết hết hạn: {mentorDate(link.expiresAt)}</p>
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
    </div>
  );
}
function MaterialDetail(props: {
  classId: string;
  id: string;
  onClose: () => void;
  onEdit: (material: MaterialDetail) => void;
}) {
  const detail = useMentorQuery(
    `mentor/classes/${props.classId}/materials/${props.id}`,
    materialDetailSchema,
  );
  const session = useSession();
  const item = detail.data;
  const editable =
    item?.canEdit &&
    item.createdBy === session.data?.id &&
    !item.firstApprovedAt &&
    ['DRAFT', 'REJECTED'].includes(item.reviewStatus);
  return (
    <Modal
      title={item?.title ?? 'Chi tiết học liệu'}
      contentClassName="sm:max-w-4xl"
      onClose={props.onClose}
    >
      <div className="space-y-5 p-5 sm:p-7">
        <MentorQueryState pending={detail.isPending} error={detail.error} retry={detail.refetch}>
          {item && (
            <>
              <div className="flex flex-wrap gap-2">
                <MentorStatus value={item.contentType} />
                <MentorStatus value={item.reviewStatus} />
                {item.publishedAt && <span className="text-sm text-muted">Đã xuất bản</span>}
              </div>
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
                  file={item.file}
                />
              )}
              {item.inlineImages.length > 0 && <h3 className="font-bold">Ảnh trong bài viết</h3>}
              {item.inlineImages.map((file) => (
                <MaterialFilePreview
                  key={file.id}
                  classId={props.classId}
                  materialId={item.id}
                  file={file}
                />
              ))}
              {item.attachments.length > 0 && <h3 className="font-bold">File đính kèm</h3>}
              {item.attachments.map((file) => (
                <MaterialFilePreview
                  key={file.id}
                  classId={props.classId}
                  materialId={item.id}
                  file={file}
                />
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm text-muted">
                <span>
                  Phiên bản {item.revision} · Cập nhật {mentorDate(item.updatedAt)}
                </span>
                {editable && (
                  <Button onClick={() => props.onEdit(item)}>
                    <Pencil className="size-4" />
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </>
          )}
        </MentorQueryState>
      </div>
    </Modal>
  );
}
export function MentorMaterials(props: { unit: ContentUnit }) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ material?: MaterialDetail } | null>(null);
  const [confirm, setConfirm] = useState<{
    action: 'submit' | 'delete';
    material: Material;
  } | null>(null);
  const session = useSession();
  const prefix = `mentor/classes/${props.unit.classId}`;
  const materials = useMentorQuery(
    `${prefix}/units/${props.unit.id}/materials?page=${page}&pageSize=20${filter ? `&reviewStatus=${filter}` : ''}`,
    materialsSchema,
  );
  const submit = useMentorCommand(materialDetailSchema);
  const remove = useMentorCommand(z.null());
  const busy = submit.isPending || remove.isPending;
  return (
    <section className="rounded-2xl border border-line bg-canvas p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-bold text-mint">Chương {props.unit.position}</p>
          <h2 className="text-2xl font-extrabold break-words">{props.unit.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Học liệu đã xuất bản và các bản bạn đã gửi. Bản nháp cần được Manager duyệt trước khi
            học viên truy cập.
          </p>
        </div>
        <Button onClick={() => setEditor({})}>
          <Plus className="size-4" />
          Tạo học liệu
        </Button>
      </div>
      <UnitSessionContext unit={props.unit} />
      <div className="mb-6 max-w-xs">
        <NativeSelect
          aria-label="Trạng thái học liệu"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
        >
          <NativeSelectOption value="">Mọi trạng thái học liệu</NativeSelectOption>
          <NativeSelectOption value="DRAFT">Bản nháp</NativeSelectOption>
          <NativeSelectOption value="PENDING_REVIEW">Chờ duyệt</NativeSelectOption>
          <NativeSelectOption value="REJECTED">Cần chỉnh sửa</NativeSelectOption>
          <NativeSelectOption value="APPROVED">Đã duyệt</NativeSelectOption>
        </NativeSelect>
      </div>
      <MentorQueryState
        pending={materials.isPending}
        error={materials.error}
        retry={materials.refetch}
        empty={materials.data?.items.length === 0}
      >
        <div className="space-y-4">
          {materials.data?.items.map((item) => {
            const editable =
              item.canEdit &&
              item.createdBy === session.data?.id &&
              !item.firstApprovedAt &&
              ['DRAFT', 'REJECTED'].includes(item.reviewStatus);
            const Icon =
              item.contentType === 'VIDEO'
                ? Video
                : item.contentType === 'ARTICLE'
                  ? FileText
                  : Paperclip;
            return (
              <article key={item.id} className="rounded-xl border border-line p-5">
                <div className="flex gap-4">
                  <Icon className="mt-1 size-6 shrink-0 text-mint" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <MentorStatus value={item.contentType} />
                      <MentorStatus value={item.reviewStatus} />
                      {item.publishedAt && (
                        <span className="text-xs font-bold text-mint">Đã xuất bản</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold break-words">{item.title}</h3>
                    {item.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                        {item.description}
                      </p>
                    )}
                    {item.rejectionReason && (
                      <p className="mt-3 rounded-lg bg-peach p-3 text-sm">{item.rejectionReason}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setDetail(item.id)}>
                        <Eye className="size-4" />
                        Xem chi tiết
                      </Button>
                      {editable && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              submit.reset();
                              remove.reset();
                              setConfirm({ action: 'submit', material: item });
                            }}
                          >
                            <Send className="size-4" />
                            Gửi duyệt
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              submit.reset();
                              remove.reset();
                              setConfirm({ action: 'delete', material: item });
                            }}
                          >
                            <Trash2 className="size-4" />
                            Xóa nháp
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </MentorQueryState>
      {materials.data && (
        <MentorPagination page={page} total={materials.data.total} onChange={setPage} />
      )}
      {detail && (
        <MaterialDetail
          key={detail}
          classId={props.unit.classId}
          id={detail}
          onClose={() => setDetail(null)}
          onEdit={(material) => {
            setDetail(null);
            setEditor({ material });
          }}
        />
      )}
      {editor && (
        <MentorMaterialEditor
          unit={props.unit}
          material={editor.material}
          onClose={() => setEditor(null)}
        />
      )}
      {confirm && (
        <Modal
          title={confirm.action === 'submit' ? 'Gửi học liệu duyệt' : 'Xóa bản nháp'}
          onClose={() => {
            if (!busy) setConfirm(null);
          }}
        >
          <div className="space-y-5 p-6">
            <p>
              {confirm.action === 'submit'
                ? 'Gửi bản nháp này cho Manager duyệt? Bạn sẽ không sửa được khi đang chờ duyệt.'
                : 'Xóa bản nháp này khỏi danh sách học liệu?'}{' '}
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
