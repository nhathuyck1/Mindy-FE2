'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Modal } from '@/components/ui/modal';
import { useMentorCommand, useMentorQuery, mentorError } from '../api/mentor-queries';
import {
  createMaterialSchema,
  patchMaterialSchema,
  materialDetailSchema,
  unitSessionsSchema,
  type ContentUnit,
  type MaterialDetail,
} from '../schemas/mentor-contracts';
import { MentorFileUpload } from './mentor-file-upload';
import { MentorPagination, MentorQueryState } from './mentor-shared';

export function MentorMaterialEditor(props: {
  unit: ContentUnit;
  material?: MaterialDetail;
  onClose: () => void;
  embedded?: boolean;
  onSaved?: (material: MaterialDetail) => void;
}) {
  const material = props.material;
  const [inputMode, setInputMode] = useState<'text' | 'html'>(material ? 'html' : 'text');
  const [html, setHtml] = useState(material?.contentHtml ?? '');
  const [text, setText] = useState('');
  const [convert, setConvert] = useState(false);
  const [type, setType] = useState<'ARTICLE' | 'FILE' | 'VIDEO'>(
    material?.contentType ?? 'ARTICLE',
  );
  const [file, setFile] = useState(
    material?.file ? { id: material.file.id, name: material.file.originalFilename } : null,
  );
  const [attachments, setAttachments] = useState(
    (material?.attachments ?? []).map((f) => ({ id: f.id, name: f.originalFilename })),
  );
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState('');
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionId, setSessionId] = useState(material?.sessionId ?? '');
  const sessions = useMentorQuery(
    `mentor/classes/${props.unit.classId}/units/${props.unit.id}/sessions?page=${sessionPage}&pageSize=20`,
    unitSessionsSchema,
  );
  const command = useMentorCommand(materialDetailSchema);
  const busy = uploadBusy || command.isPending;
  return (
    <Modal
      title={material ? 'Chỉnh sửa bản nháp' : 'Tạo học liệu mới'}
      contentClassName="sm:max-w-3xl"
      embedded={props.embedded}
      onClose={() => {
        if (!command.isPending) props.onClose();
      }}
    >
      <form
        className={props.embedded ? 'space-y-5' : 'space-y-5 p-5 sm:p-7'}
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const form = new FormData(e.currentTarget);
          const fields = {
            title: String(form.get('title') ?? ''),
            description: String(form.get('description') ?? '') || null,
            sortOrder: Number(form.get('sortOrder')),
            sessionId: sessionId || null,
            availableAt: form.get('availableAt') ? `${form.get('availableAt')}:00+07:00` : null,
            ...(type === 'ARTICLE'
              ? inputMode === 'text'
                ? { contentText: String(form.get('contentText') ?? '') }
                : { contentHtml: String(form.get('contentHtml') ?? '') }
              : { fileId: file?.id }),
            attachmentFileIds: attachments.map((f) => f.id),
          };
          const parsed = material
            ? patchMaterialSchema.safeParse({ ...fields, expectedRevision: material.revision })
            : createMaterialSchema.safeParse({
                ...fields,
                contentType: type,
                ...(type === 'ARTICLE' ? { contentSchemaVersion: 1 } : {}),
              });
          if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? 'Vui lòng kiểm tra nội dung.');
            return;
          }
          if (type !== 'ARTICLE' && !file) {
            setError('Vui lòng upload file và chờ kiểm tra thành công.');
            return;
          }
          setError('');
          try {
            const saved = await command.mutateAsync({
              path: material
                ? `mentor/classes/${props.unit.classId}/materials/${material.id}`
                : `mentor/classes/${props.unit.classId}/units/${props.unit.id}/materials`,
              method: material ? 'PATCH' : 'POST',
              body: parsed.data,
            });
            props.onSaved?.(saved);
            props.onClose();
          } catch {
            /* Mutation error below. */
          }
        }}
      >
        {props.embedded && (
          <h3 className="text-lg font-bold">
            {material ? 'Chỉnh sửa bản nháp' : 'Tạo học liệu mới'}
          </h3>
        )}
        <p className="text-sm leading-6 text-muted">
          {props.unit.title} · Lưu bản nháp trước, sau đó gửi Manager duyệt.
        </p>
        <fieldset disabled={busy} className="space-y-5">
          <legend className="sr-only">Thông tin học liệu</legend>
          <label className="block text-sm font-bold">
            Loại học liệu
            <NativeSelect
              className="mt-2"
              value={type}
              disabled={Boolean(material)}
              onChange={(e) => {
                const next = e.target.value;
                if (next === 'ARTICLE' || next === 'FILE' || next === 'VIDEO') {
                  setType(next);
                  setFile(null);
                }
              }}
            >
              <NativeSelectOption value="ARTICLE">Bài viết</NativeSelectOption>
              <NativeSelectOption value="FILE">Tài liệu</NativeSelectOption>
              <NativeSelectOption value="VIDEO">Video</NativeSelectOption>
            </NativeSelect>
          </label>
          <label className="block text-sm font-bold">
            Tiêu đề
            <Input
              className="mt-2"
              name="title"
              required
              maxLength={250}
              defaultValue={material?.title}
            />
          </label>
          <label className="block text-sm font-bold">
            Mô tả
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-line bg-canvas p-3 text-base font-normal"
              name="description"
              maxLength={5000}
              defaultValue={material?.description ?? ''}
            />
          </label>
          {type === 'ARTICLE' && (
            <>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Cách nhập nội dung">
                <Button
                  type="button"
                  variant={inputMode === 'text' ? 'default' : 'outline'}
                  aria-pressed={inputMode === 'text'}
                  onClick={() => {
                    if (inputMode === 'html' && html.trim()) setConvert(true);
                    else setInputMode('text');
                  }}
                >
                  Văn bản
                </Button>
                <Button
                  type="button"
                  variant={inputMode === 'html' ? 'default' : 'outline'}
                  aria-pressed={inputMode === 'html'}
                  onClick={() => {
                    if (inputMode === 'text')
                      setHtml(
                        '<p>' +
                          text
                            .replaceAll('&', '&amp;')
                            .replaceAll('<', '&lt;')
                            .replaceAll('>', '&gt;')
                            .replaceAll('\n', '<br>') +
                          '</p>',
                      );
                    setInputMode('html');
                    setConvert(false);
                  }}
                >
                  HTML
                </Button>
              </div>
              {convert && (
                <div className="space-y-3 rounded-xl bg-peach p-4 text-sm">
                  <p>
                    Chuyển sang văn bản sẽ bỏ định dạng và ảnh trong bài. Nội dung gốc chỉ thay đổi
                    khi bạn lưu bản nháp.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const doc = new DOMParser().parseFromString(html, 'text/html');
                      doc.querySelectorAll('script,style').forEach((node) => node.remove());
                      doc.querySelectorAll('br').forEach((node) => node.replaceWith('\n'));
                      doc
                        .querySelectorAll('p,div,h1,h2,h3,h4,h5,h6,li,pre,blockquote,tr')
                        .forEach((node) => node.append('\n'));
                      setText(doc.body.textContent?.trim() ?? '');
                      setInputMode('text');
                      setConvert(false);
                    }}
                  >
                    Chuyển sang văn bản
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setConvert(false)}
                  >
                    Giữ định dạng
                  </Button>
                </div>
              )}
              <label className="block text-sm font-bold">
                {inputMode === 'text' ? 'Nội dung bài viết' : 'Nội dung bài viết (HTML)'}
                <textarea
                  aria-label={
                    inputMode === 'text' ? 'Nội dung bài viết' : 'Nội dung bài viết (HTML)'
                  }
                  className="mt-2 min-h-56 w-full rounded-xl border border-line bg-canvas p-3 font-mono text-sm font-normal"
                  name={inputMode === 'text' ? 'contentText' : 'contentHtml'}
                  required
                  key={inputMode}
                  value={inputMode === 'text' ? text : html}
                  onChange={(e) =>
                    inputMode === 'text' ? setText(e.target.value) : setHtml(e.target.value)
                  }
                />
                <span className="mt-2 block text-xs font-normal text-muted">
                  {inputMode === 'text'
                    ? 'Nhập trực tiếp nội dung, giữ nguyên các dòng xuống hàng.'
                    : 'Nội dung HTML giữ định dạng bài viết hiện tại.'}{' '}
                  Tối đa 48 KiB.
                </span>
              </label>
            </>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              Thứ tự
              <Input
                type="number"
                className="mt-2"
                name="sortOrder"
                min={0}
                max={2147483647}
                defaultValue={material?.sortOrder ?? 0}
              />
            </label>
            <label className="block text-sm font-bold">
              Khả dụng từ (UTC+7)
              <Input
                type="datetime-local"
                name="availableAt"
                className="mt-2"
                defaultValue={
                  material?.availableAt
                    ? new Date(Date.parse(material.availableAt) + 7 * 3600000)
                        .toISOString()
                        .slice(0, 16)
                    : ''
                }
              />
            </label>
          </div>
          <label className="block text-sm font-bold">
            Gắn với buổi học (tùy chọn)
            <NativeSelect
              className="mt-2"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            >
              <NativeSelectOption value="">Không gắn buổi học</NativeSelectOption>
              {sessionId && !sessions.data?.items.some((s) => s.id === sessionId) && (
                <NativeSelectOption value={sessionId}>Buổi học đã chọn</NativeSelectOption>
              )}
              {sessions.data?.items.map((s) => (
                <NativeSelectOption key={s.id} value={s.id}>
                  Buổi {s.sessionNumber}: {s.title}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        </fieldset>
        <MentorQueryState
          pending={sessions.isPending}
          error={sessions.error}
          retry={sessions.refetch}
        >
          <>
            {sessions.data && sessions.data.total > 20 && (
              <MentorPagination
                page={sessionPage}
                total={sessions.data.total}
                onChange={setSessionPage}
              />
            )}
          </>
        </MentorQueryState>
        {type !== 'ARTICLE' && (
          <>
            {file && (
              <p className="text-sm">
                File đã chọn: <strong>{file.name}</strong>
              </p>
            )}
            <MentorFileUpload
              disabled={busy}
              key={type}
              unit={props.unit}
              video={type === 'VIDEO'}
              label={file ? 'Thay file' : 'Upload file chính'}
              onBusy={setUploadBusy}
              onReady={(id, name, kind) => {
                if (type === 'VIDEO' && kind !== 'VIDEO') {
                  setError('Học liệu video cần file video hợp lệ.');
                  return;
                }
                setFile({ id, name });
                setError('');
              }}
            />
          </>
        )}
        <div className="space-y-3">
          <h3 className="text-sm font-bold">File đính kèm ({attachments.length}/50)</h3>
          {attachments.map((f) => (
            <div
              className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 text-sm"
              key={f.id}
            >
              <span className="min-w-0 break-all">{f.name}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setAttachments(attachments.filter((item) => item.id !== f.id))}
              >
                Bỏ
              </Button>
            </div>
          ))}
          {attachments.length < 50 && !command.isPending && (
            <MentorFileUpload
              disabled={busy}
              unit={props.unit}
              label="Thêm file đính kèm"
              onBusy={setUploadBusy}
              onReady={(id, name) =>
                setAttachments((current) =>
                  current.some((f) => f.id === id) ? current : [...current, { id, name }],
                )
              }
            />
          )}
        </div>
        {(error || command.isError) && (
          <p role="alert" className="rounded-xl bg-peach p-4">
            {error || mentorError(command.error)}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <Button
            type="button"
            variant="outline"
            disabled={command.isPending}
            onClick={props.onClose}
          >
            Đóng
          </Button>
          <Button disabled={busy}>{command.isPending ? 'Đang lưu…' : 'Lưu bản nháp'}</Button>
        </div>
      </form>
    </Modal>
  );
}
