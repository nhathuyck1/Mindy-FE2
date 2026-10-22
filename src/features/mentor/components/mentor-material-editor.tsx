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
import { MentorUploadFileCard } from './mentor-upload-file-card';
import { MentorPagination, MentorQueryState } from './mentor-shared';
import { minimumScheduleInput } from '../lib/schedule-time';

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
  const [type, setType] = useState<'ARTICLE' | 'FILE' | 'VIDEO'>(
    material?.contentType ?? 'ARTICLE',
  );
  const [file, setFile] = useState(
    material?.file
      ? {
          id: material.file.id,
          name: material.file.originalFilename,
          sizeBytes: material.file.sizeBytes,
        }
      : null,
  );
  const [attachments, setAttachments] = useState(
    (material?.attachments ?? []).map((f) => ({
      id: f.id,
      name: f.originalFilename,
      sizeBytes: f.sizeBytes,
    })),
  );
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState('');
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionId, setSessionId] = useState(material?.sessionId ?? '');
  const [minimumTime, setMinimumTime] = useState(() => minimumScheduleInput(Date.now()));
  const refreshMinimumTime = () => setMinimumTime(minimumScheduleInput(Date.now()));
  const sessions = useMentorQuery(
    `mentor/classes/${props.unit.classId}/units/${props.unit.id}/sessions?page=${sessionPage}&pageSize=20`,
    unitSessionsSchema,
  );
  const command = useMentorCommand(materialDetailSchema);
  const busy = uploadBusy || command.isPending;
  return (
    <Modal
      title={material ? 'Chỉnh sửa bản nháp' : 'Tạo chương mới'}
      contentClassName="sm:max-w-3xl"
      embedded={props.embedded}
      onClose={() => {
        if (!command.isPending) props.onClose();
      }}
    >
      <form
        className={`@container/mentor-editor min-w-0 space-y-5 ${props.embedded ? '' : 'p-5 sm:p-7'}`}
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
          if (!material && fields.availableAt && Date.parse(fields.availableAt) < Date.now()) {
            refreshMinimumTime();
            setError('Thời gian khả dụng không được ở trong quá khứ (UTC+7).');
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
            {material ? 'Chỉnh sửa bản nháp' : 'Tạo chương mới'}
          </h3>
        )}
        <p className="text-sm leading-6 text-muted">
          {props.unit.title} · Lưu bản nháp trước, sau đó gửi Manager duyệt.
        </p>
        <fieldset disabled={busy} className="min-w-0 space-y-5">
          <legend className="sr-only">Thông tin chương</legend>
          <label className="block text-sm font-bold">
            Loại chương
            <NativeSelect
              wrapperClassName="mt-2 w-full min-w-0"
              className="h-12 w-full"
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
                    if (inputMode === 'html') {
                      const doc = new DOMParser().parseFromString(html, 'text/html');
                      doc.querySelectorAll('script,style').forEach((node) => node.remove());
                      doc.querySelectorAll('br').forEach((node) => node.replaceWith('\n'));
                      doc
                        .querySelectorAll('p,div,h1,h2,h3,h4,h5,h6,li,pre,blockquote,tr')
                        .forEach((node) => node.append('\n'));
                      setText(doc.body.textContent?.trim() ?? '');
                    }
                    setInputMode('text');
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
                  }}
                >
                  HTML
                </Button>
              </div>
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
          <div className="grid min-w-0 gap-4 @xl/mentor-editor:grid-cols-2">
            <label className="block min-w-0 text-sm font-bold">
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
            <label className="block min-w-0 text-sm font-bold">
              Khả dụng từ (UTC+7)
              <Input
                type="datetime-local"
                name="availableAt"
                min={material ? undefined : minimumTime}
                onFocus={material ? undefined : refreshMinimumTime}
                onClick={material ? undefined : refreshMinimumTime}
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
              wrapperClassName="mt-2 w-full min-w-0"
              className="h-12 w-full"
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
          <MentorFileUpload
            disabled={busy}
            key={type}
            unit={props.unit}
            video={type === 'VIDEO'}
            label="Tài liệu chính"
            value={file}
            onSelect={() => {
              setFile(null);
              setError('');
            }}
            onBusy={setUploadBusy}
            onReady={(id, name, kind, sizeBytes) => {
              if (type === 'VIDEO' && kind !== 'VIDEO') {
                setError('Chương dạng video cần file video hợp lệ.');
                return;
              }
              setFile({ id, name, sizeBytes });
              setError('');
            }}
          />
        )}
        <div className="space-y-3">
          <h3 className="text-sm font-bold">Tệp đính kèm ({attachments.length}/50)</h3>
          {attachments.length < 50 && !command.isPending && (
            <MentorFileUpload
              compact
              disabled={busy}
              unit={props.unit}
              label="Thêm tệp đính kèm"
              onBusy={setUploadBusy}
              onReady={(id, name, _kind, sizeBytes) =>
                setAttachments((current) =>
                  current.some((f) => f.id === id)
                    ? current
                    : [...current, { id, name, sizeBytes }],
                )
              }
            />
          )}
          {attachments.map((f) => (
            <MentorUploadFileCard
              key={f.id}
              file={f}
              state="ready"
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setAttachments(attachments.filter((item) => item.id !== f.id))}
                >
                  Bỏ
                </Button>
              }
            />
          ))}
        </div>
        {(error || command.isError) && (
          <p role="alert" className="rounded-xl bg-peach p-4">
            {error || mentorError(command.error)}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
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
