'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArticleEditor } from '@/components/ui/article-editor';
import { articleContentError } from '@/lib/article-content';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useCourseCatalog } from '@/features/courses/api/course-queries';
import { courseDetailSchema } from '@/features/courses/schemas/course-contracts';
import { useManagerCommand, useManagerQuery, managerError } from '../api/manager-queries';
import {
  createMaterialSchema,
  patchMaterialSchema,
  materialDetailSchema,
  type MaterialDetail,
} from '../schemas/manager-contracts';
import { ManagerFileUpload } from './manager-file-upload';
import { ManagerFileCard, type ManagerUploadedFile } from './manager-file-card';

export function ManagerMaterialEditor(props: {
  material?: MaterialDetail;
  onClose: () => void;
  embedded?: boolean;
  courseId?: string;
  unitId?: string;
  onSaved?: (material: MaterialDetail) => void;
}) {
  const material = props.material;
  const courses = useCourseCatalog({});
  const [courseId, setCourseId] = useState(props.courseId ?? '');
  const [unitId, setUnitId] = useState(material?.courseUnitId ?? props.unitId ?? '');
  const [contentHtml, setContentHtml] = useState(material?.contentHtml ?? '');
  const [editorReady, setEditorReady] = useState(false);
  const course = useManagerQuery(
    `courses/${courseId}`,
    courseDetailSchema,
    Boolean(courseId) && !material,
  );
  const [type, setType] = useState<'ARTICLE' | 'FILE' | 'VIDEO'>(
    material?.contentType ?? 'ARTICLE',
  );
  const [file, setFile] = useState<ManagerUploadedFile | null>(
    material?.file
      ? {
          id: material.file.id,
          name: material.file.originalFilename,
          kind: material.file.kind,
          sizeBytes: material.file.sizeBytes,
        }
      : null,
  );
  const [attachments, setAttachments] = useState(
    (material?.attachments ?? []).map((item) => ({
      id: item.id,
      name: item.originalFilename,
      kind: item.kind,
      sizeBytes: item.sizeBytes,
    })),
  );
  const [primaryUploading, setPrimaryUploading] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [primaryPending, setPrimaryPending] = useState(false);
  const [attachmentPending, setAttachmentPending] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const command = useManagerCommand(materialDetailSchema);
  const busy = primaryUploading || attachmentUploading || command.isPending;
  return (
    <Modal
      title={material ? 'Chỉnh sửa tài liệu' : 'Tạo tài liệu mới'}
      contentClassName="flex flex-col overflow-hidden sm:max-w-3xl [&>div:first-child]:shrink-0"
      embedded={props.embedded}
      onClose={() => {
        if (!busy) props.onClose();
      }}
    >
      <form
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy || conflict || primaryPending || attachmentPending) return;
          if (type === 'ARTICLE') {
            if (!editorReady) return;
            const contentError = articleContentError(contentHtml);
            if (contentError) {
              setError(contentError);
              return;
            }
          }
          const data = new FormData(event.currentTarget);
          const fields = {
            title: String(data.get('title') ?? ''),
            description: String(data.get('description') ?? '') || null,
            sortOrder: Number(data.get('sortOrder')),
            availableAt: data.get('availableAt') ? `${data.get('availableAt')}:00+07:00` : null,
            attachmentFileIds: attachments.map((item) => item.id),
            ...(type === 'ARTICLE' ? { contentHtml } : { fileId: file?.id }),
          };
          const parsed = material
            ? patchMaterialSchema.safeParse({ ...fields, expectedRevision: material.revision })
            : createMaterialSchema.safeParse({
                ...fields,
                contentType: type,
                ...(type === 'ARTICLE' ? { contentSchemaVersion: 1 } : {}),
              });
          if (!unitId || !parsed.success || (type !== 'ARTICLE' && !file)) {
            setError('Vui lòng chọn học phần, nhập đủ nội dung và chờ tệp được kiểm tra.');
            return;
          }
          setError('');
          try {
            const saved = await command.mutateAsync({
              path: material
                ? `manager/materials/${material.id}`
                : `manager/course-units/${unitId}/materials`,
              method: material ? 'PATCH' : 'POST',
              body: parsed.data,
            });
            props.onSaved?.(saved);
            props.onClose();
          } catch (failure) {
            setError(managerError(failure));
            setConflict(true);
          }
        }}
      >
        <div
          className={
            props.embedded
              ? 'min-w-0 space-y-5 pb-6'
              : 'min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7'
          }
        >
          {props.embedded && (
            <h3 className="text-lg font-bold">
              {material ? 'Chỉnh sửa tài liệu' : 'Tạo tài liệu mới'}
            </h3>
          )}
          <p className="rounded-xl bg-soft p-4 text-sm leading-6">
            {material
              ? 'Lưu thay đổi sẽ tạo phiên bản mới, đưa về bản nháp và thu hồi trạng thái duyệt/xuất bản hiện tại.'
              : 'Tài liệu mới được lưu dưới dạng bản nháp. Mở lại chi tiết để xem trước và duyệt khi đã sẵn sàng.'}
          </p>
          <fieldset disabled={busy || conflict} className="min-w-0 space-y-5">
            <legend className="sr-only">Thông tin tài liệu</legend>
            {!material && !props.unitId && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block min-w-0 text-sm font-semibold">
                  Khóa học
                  <NativeSelect
                    aria-label="Khóa học"
                    required
                    wrapperClassName="mt-2 w-full"
                    className="h-12 w-full py-2 text-base leading-6"
                    value={courseId}
                    onChange={(event) => {
                      setCourseId(event.target.value);
                      setUnitId('');
                      setFile(null);
                      setAttachments([]);
                    }}
                  >
                    <NativeSelectOption value="">Chọn khóa học</NativeSelectOption>
                    {courses.data?.map((item) => (
                      <NativeSelectOption key={item.id} value={item.id}>
                        {item.title}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </label>
                <label className="block min-w-0 text-sm font-semibold">
                  Học phần
                  <NativeSelect
                    aria-label="Học phần"
                    required
                    disabled={!course.data}
                    wrapperClassName="mt-2 w-full"
                    className="h-12 w-full py-2 text-base leading-6"
                    value={unitId}
                    onChange={(event) => {
                      setUnitId(event.target.value);
                      setFile(null);
                      setAttachments([]);
                    }}
                  >
                    <NativeSelectOption value="">
                      {course.isFetching ? 'Đang tải học phần…' : 'Chọn học phần'}
                    </NativeSelectOption>
                    {course.data?.units.map((unit) => (
                      <NativeSelectOption key={unit.id} value={unit.id}>
                        {unit.unitNumber}. {unit.title}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </label>
                <p className="text-xs text-muted sm:col-span-2">
                  Danh sách chọn hiện gồm các khóa học đang hoạt động.
                </p>
              </div>
            )}
            <label className="block min-w-0 text-sm font-semibold">
              Loại tài liệu
              <NativeSelect
                aria-label="Loại tài liệu"
                wrapperClassName="mt-2 w-full"
                className="h-12 w-full py-2 text-base leading-6"
                value={type}
                disabled={Boolean(material)}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === 'ARTICLE' || value === 'FILE' || value === 'VIDEO') {
                    setType(value);
                    setFile(null);
                  }
                }}
              >
                <NativeSelectOption value="ARTICLE">Bài viết</NativeSelectOption>
                <NativeSelectOption value="FILE">Tệp tài liệu</NativeSelectOption>
                <NativeSelectOption value="VIDEO">Video</NativeSelectOption>
              </NativeSelect>
            </label>
            <label className="block min-w-0 text-sm font-semibold">
              Tiêu đề
              <Input
                name="title"
                required
                maxLength={250}
                defaultValue={material?.title}
                className="mt-2"
                placeholder="Nhập tên tài liệu"
              />
            </label>
            <label className="block min-w-0 text-sm font-semibold">
              Mô tả
              <textarea
                name="description"
                maxLength={5000}
                defaultValue={material?.description ?? ''}
                className="mt-2 min-h-24 w-full rounded-lg border border-line p-3 font-normal"
              />
            </label>
            {type === 'ARTICLE' && (
              <ArticleEditor
                value={contentHtml}
                onChange={setContentHtml}
                onReadyChange={setEditorReady}
                disabled={busy || conflict}
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block min-w-0 text-sm font-semibold">
                Thứ tự hiển thị
                <Input
                  name="sortOrder"
                  type="number"
                  min={0}
                  max={2147483647}
                  defaultValue={material?.sortOrder ?? 0}
                  className="mt-2"
                />
              </label>
              <label className="block min-w-0 text-sm font-semibold">
                Khả dụng từ (UTC+7)
                <Input
                  name="availableAt"
                  type="datetime-local"
                  defaultValue={
                    material?.availableAt
                      ? new Date(Date.parse(material.availableAt) + 7 * 3600000)
                          .toISOString()
                          .slice(0, 16)
                      : ''
                  }
                  className="mt-2"
                />
              </label>
            </div>
          </fieldset>
          {(courses.isError || course.isError) && !material && (
            <div role="alert" className="rounded-lg bg-peach p-3 text-sm">
              Chưa tải được khóa học hoặc học phần.
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => {
                  void courses.refetch();
                  if (courseId) void course.refetch();
                }}
              >
                Thử lại
              </Button>
            </div>
          )}
          {type !== 'ARTICLE' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                {type === 'VIDEO' ? 'Video bài học' : 'Tệp chính'}
              </h3>
              <ManagerFileUpload
                key={`${unitId}:${type}`}
                label={file ? 'Thay tệp chính' : 'Tải tệp chính'}
                courseUnitId={unitId}
                disabled={busy || conflict}
                video={type === 'VIDEO'}
                value={file}
                onBusy={setPrimaryUploading}
                onPending={setPrimaryPending}
                onReady={(next) => {
                  if ((type === 'VIDEO') !== (next.kind === 'VIDEO')) {
                    setError('Chọn đúng loại tệp: video cần MP4; tài liệu cần tệp khác video.');
                    return;
                  }
                  setFile(next);
                  setError('');
                }}
              />
            </div>
          )}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold">
                Tệp đính kèm {attachments.length > 0 && `(${attachments.length})`}
              </h3>
              <span className="text-xs text-muted">Không bắt buộc</span>
            </div>
            {attachments.map((item) => (
              <ManagerFileCard
                key={item.id}
                file={item}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    aria-label={`Bỏ tệp ${item.name}`}
                    disabled={busy || conflict}
                    onClick={() =>
                      setAttachments(attachments.filter((entry) => entry.id !== item.id))
                    }
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                }
              />
            ))}
            {attachments.length < 50 && (
              <ManagerFileUpload
                key={unitId}
                label="Thêm tệp đính kèm"
                compact
                courseUnitId={unitId}
                disabled={busy || conflict}
                onBusy={setAttachmentUploading}
                onPending={setAttachmentPending}
                onReady={(next) =>
                  setAttachments((current) =>
                    current.some((entry) => entry.id === next.id) ? current : [...current, next],
                  )
                }
              />
            )}
          </section>
          {error && (
            <p role="alert" className="rounded-xl bg-peach p-4 text-sm">
              {error}
            </p>
          )}
          {(primaryPending || attachmentPending) && (
            <p role="status" className="text-sm text-muted">
              Chờ tệp được kiểm tra để lưu tài liệu. Bạn vẫn có thể chọn tệp khác.
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-line bg-canvas p-4 sm:px-7">
          <p className="mr-auto hidden text-xs text-muted sm:block">
            Lưu để thêm tài liệu vào học phần.
          </p>
          <Button type="button" variant="outline" disabled={busy} onClick={props.onClose}>
            Đóng
          </Button>
          <Button
            disabled={
              busy ||
              conflict ||
              primaryPending ||
              attachmentPending ||
              (type === 'ARTICLE' && !editorReady) ||
              (type !== 'ARTICLE' && !file)
            }
          >
            {command.isPending ? 'Đang lưu…' : 'Lưu bản nháp'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
