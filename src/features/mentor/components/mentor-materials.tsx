'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api/client';
import {
  Plus,
  FileText,
  Video,
  Paperclip,
  Send,
  Pencil,
  Trash2,
  CalendarDays,
  LockKeyhole,
  ArrowRight,
} from 'lucide-react';
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
  unitDetailSchema,
  type ContentUnit,
  type Material,
  type MaterialDetail,
} from '../schemas/mentor-contracts';
import { MentorMaterialEditor } from './mentor-material-editor';
import { MentorPagination, MentorQueryState, MentorStatus, mentorDate } from './mentor-shared';

function UnitSessionContext(props: { unit: ContentUnit }) {
  const context = useMentorQuery(
    `mentor/classes/${props.unit.classId}/units/${props.unit.id}`,
    unitDetailSchema,
  );
  return (
    <section className="mt-8 border-t border-line pt-6" aria-label="Buổi học của chương">
      <h3 className="mb-4 flex items-center gap-2 font-bold">
        <CalendarDays aria-hidden="true" className="size-5 text-mint" />
        Buổi học
      </h3>
      <MentorQueryState pending={context.isPending} error={context.error} retry={context.refetch}>
        <ul className="divide-y divide-line">
          {context.data?.sessions.map((session) => (
            <li key={session.id} className="space-y-2 py-4 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-semibold">{session.title}</p>
                <MentorStatus value={session.status} />
              </div>
              <p className="text-muted">
                {mentorDate(session.startsAt)} – {mentorDate(session.endsAt)}
              </p>
              {session.roomName && <p>Phòng: {session.roomName}</p>}
              <Link href={`/mentor/sessions/${session.id}`} className="text-link font-semibold">
                Xem buổi học & điểm danh
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
        {context.data?.sessions.length === 0 && (
          <p className="text-sm text-muted">Chương này chưa có buổi học.</p>
        )}
      </MentorQueryState>
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
        {pending ? 'Đang lấy quyền xem…' : 'Lấy liên kết xem file'}
      </Button>
      {Boolean(error) && (
        <p role="alert" className="text-sm">
          {mentorError(error)}
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
    </div>
  );
}
function MaterialDetail(props: {
  classId: string;
  id: string;
  onClose: () => void;
  onEdit: (material: MaterialDetail) => void;
  onAction: (action: 'submit' | 'delete', material: Material) => void;
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
      embedded
    >
      <div className="space-y-5">
        <MentorQueryState pending={detail.isPending} error={detail.error} retry={detail.refetch}>
          {item && (
            <>
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4"
                role="toolbar"
                aria-label="Thao tác học liệu"
              >
                <h3 className="min-w-0 text-lg font-bold break-words">{item.title}</h3>
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
              {item.attachments.length > 0 && <h3 className="font-bold">File đính kèm</h3>}
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
export function MentorMaterials(props: { unit: ContentUnit; onRelease: () => void }) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ material?: MaterialDetail } | null>(null);
  const [confirm, setConfirm] = useState<{
    action: 'submit' | 'delete';
    material: Material;
  } | null>(null);
  const prefix = `mentor/classes/${props.unit.classId}`;
  const materials = useMentorQuery(
    `${prefix}/units/${props.unit.id}/materials?page=${page}&pageSize=20${filter ? `&reviewStatus=${filter}` : ''}`,
    materialsSchema,
  );
  const submit = useMentorCommand(materialDetailSchema);
  const remove = useMentorCommand(z.null());
  const busy = submit.isPending || remove.isPending;
  const selectedId = detail ?? materials.data?.items[0]?.id;
  return (
    <section className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-5 sm:px-8 sm:py-6">
        <div>
          <p className="mb-2 text-sm font-bold text-mint">Chương {props.unit.position}</p>
          <h2 className="text-xl font-bold break-words">{props.unit.title}</h2>
        </div>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={props.unit.status === 'COMPLETED'}
            onClick={props.onRelease}
          >
            <LockKeyhole aria-hidden="true" className="size-4" />
            Quyền truy cập
          </Button>
          <Button size="sm" onClick={() => setEditor({})}>
            <Plus className="size-4" />
            Tạo học liệu
          </Button>
        </div>
      </div>
      <div className="p-5 sm:p-8">
        <div className="mb-6 max-w-xs">
          <NativeSelect
            aria-label="Trạng thái học liệu"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
              setDetail(null);
              setEditor(null);
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
          <nav className="mb-6 flex flex-wrap gap-2" aria-label="Học liệu trong chương">
            {materials.data?.items.map((item) => {
              const Icon =
                item.contentType === 'VIDEO'
                  ? Video
                  : item.contentType === 'ARTICLE'
                    ? FileText
                    : Paperclip;
              return (
                <Button
                  key={item.id}
                  variant={selectedId === item.id ? 'default' : 'outline'}
                  className="h-auto max-w-full whitespace-normal text-left"
                  aria-pressed={selectedId === item.id}
                  onClick={() => {
                    setDetail(item.id);
                    setEditor(null);
                  }}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="min-w-0 break-words">{item.title}</span>
                </Button>
              );
            })}
          </nav>
        </MentorQueryState>
        {materials.data && materials.data.total > 20 && (
          <MentorPagination
            page={page}
            total={materials.data.total}
            onChange={(next) => {
              setPage(next);
              setDetail(null);
              setEditor(null);
            }}
          />
        )}
        {selectedId && !editor && !materials.isError && (
          <MaterialDetail
            key={selectedId}
            classId={props.unit.classId}
            id={selectedId}
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
              setPage(1);
            }}
            onClose={() => setEditor(null)}
          />
        )}
        <UnitSessionContext unit={props.unit} />
      </div>
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
