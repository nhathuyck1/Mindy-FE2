'use client';

import { useState } from 'react';
import { BookOpen, FileText, Plus, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourseContentFrame, CourseContentPanel } from '@/components/ui/course-content-frame';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { CourseDetail } from '@/features/courses/schemas/course-contracts';
import { useManagerQuery } from '../api/manager-queries';
import { materialsSchema } from '../schemas/manager-contracts';
import { ManagerMaterialDetail } from './manager-material-detail';
import { ManagerMaterialEditor } from './manager-material-editor';
import { ManagerPagination, ManagerState, reviewLabels, typeLabels } from './manager-shared';

function ManagerChapterContent(props: {
  courseId: string;
  unit: CourseDetail['units'][number];
  coursePicker: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (status) params.set('reviewStatus', status);
  if (type) params.set('contentType', type);
  const materials = useManagerQuery(
    `manager/course-units/${props.unit.id}/materials?${params}`,
    materialsSchema,
  );
  const selectedId = materialId ?? materials.data?.items[0]?.id;
  return (
    <div className="space-y-6">
      <div
        role="group"
        aria-label="Bộ lọc tài liệu"
        className="grid min-w-0 items-end gap-4 xl:grid-cols-[minmax(0,1fr)_224px_224px]"
      >
        {props.coursePicker}
        <label className="min-w-0 text-sm font-semibold">
          Trạng thái
          <NativeSelect
            aria-label="Trạng thái duyệt trong chương"
            wrapperClassName="mt-1.5 w-full"
            className="h-12 py-2 text-base leading-6 font-normal"
            value={status}
            disabled={creating}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
              setMaterialId(null);
            }}
          >
            <NativeSelectOption value="">Tất cả trạng thái</NativeSelectOption>
            {Object.entries(reviewLabels).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <label className="min-w-0 text-sm font-semibold">
          Loại tài liệu
          <NativeSelect
            aria-label="Loại tài liệu trong chương"
            wrapperClassName="mt-1.5 w-full"
            className="h-12 py-2 text-base leading-6 font-normal"
            value={type}
            disabled={creating}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
              setMaterialId(null);
            }}
          >
            <NativeSelectOption value="">Tất cả loại tài liệu</NativeSelectOption>
            {Object.entries(typeLabels).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      </div>
      <CourseContentFrame
        sidebarLabel="Nội dung khóa học"
        sidebarTitle={
          <>
            <BookOpen aria-hidden="true" className="size-5 text-mint" />
            Nội dung khóa học
          </>
        }
        sidebar={props.sidebar}
      >
        <CourseContentPanel
          label="Nội dung chương"
          header={
            <>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-mint">CHƯƠNG {props.unit.unitNumber}</p>
                  {materials.data && (
                    <span className="rounded-full bg-soft px-2 py-0.5 text-xs font-normal whitespace-nowrap text-muted">
                      Tài liệu ({materials.data.total})
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-xl font-bold break-words">{props.unit.title}</h2>
              </div>
              <Button className="ml-auto" disabled={creating} onClick={() => setCreating(true)}>
                <Plus aria-hidden="true" className="size-4" />
                Tạo tài liệu
              </Button>
            </>
          }
        >
          {creating ? (
            <ManagerMaterialEditor
              embedded
              courseId={props.courseId}
              unitId={props.unit.id}
              onSaved={(material) => {
                setMaterialId(material.id);
                setStatus('');
                setType('');
                setPage(1);
              }}
              onClose={() => setCreating(false)}
            />
          ) : (
            <>
              {props.unit.description && (
                <p className="text-sm leading-7 whitespace-pre-wrap">{props.unit.description}</p>
              )}
              <ManagerState
                pending={materials.isPending}
                error={materials.error}
                retry={materials.refetch}
              >
                {materials.data?.items.length === 0 && !materialId ? (
                  <p role="status" className="rounded-xl border border-line p-6 text-sm leading-7">
                    {status || type
                      ? 'Chưa có tài liệu phù hợp với bộ lọc trong chương này.'
                      : 'Chương này chưa có tài liệu. Chọn Tạo tài liệu ở góc phải để soạn nội dung hoặc tải tệp lên.'}
                  </p>
                ) : (
                  <>
                    {materials.data && materials.data.total > 1 && (
                      <nav
                        aria-label="Tài liệu trong chương"
                        className="flex min-w-0 gap-2 overflow-x-auto pb-2"
                      >
                        {materials.data?.items.map((item, index) => {
                          const Icon = item.contentType === 'VIDEO' ? PlayCircle : FileText;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              aria-current={selectedId === item.id ? 'true' : undefined}
                              onClick={() => setMaterialId(item.id)}
                              className={
                                'flex min-h-12 max-w-72 shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ' +
                                (selectedId === item.id
                                  ? 'border-mint bg-mint/10 font-bold'
                                  : 'border-line hover:bg-soft')
                              }
                            >
                              <Icon aria-hidden="true" className="size-5 shrink-0 text-mint" />
                              <span className="shrink-0 text-xs font-normal text-muted">
                                {(page - 1) * 20 + index + 1}.
                              </span>
                              <span className="min-w-0 flex-1 break-words">{item.title}</span>
                            </button>
                          );
                        })}
                      </nav>
                    )}
                    {selectedId && (
                      <ManagerMaterialDetail
                        embedded
                        key={selectedId}
                        id={selectedId}
                        onClose={() => {
                          setMaterialId(null);
                          void materials.refetch();
                        }}
                      />
                    )}
                  </>
                )}
                {materials.data && materials.data.total > 20 && (
                  <ManagerPagination
                    page={page}
                    total={materials.data.total}
                    onChange={(next) => {
                      setPage(next);
                      setMaterialId(null);
                    }}
                  />
                )}
              </ManagerState>
            </>
          )}
        </CourseContentPanel>
      </CourseContentFrame>
    </div>
  );
}

export function ManagerCourseWorkspace(props: {
  course: CourseDetail;
  coursePicker: React.ReactNode;
}) {
  const [unitId, setUnitId] = useState<string | null>(null);
  const units = [...props.course.units].sort((a, b) => a.unitNumber - b.unitNumber);
  const selected = units.find((unit) => unit.id === unitId) ?? units[0];
  const sidebar = (
    <nav aria-label="Chương" className="flex flex-col">
      {units.map((unit) => (
        <button
          key={unit.id}
          type="button"
          aria-current={unit.id === selected?.id ? 'step' : undefined}
          onClick={() => setUnitId(unit.id)}
          className={
            'flex min-h-19 items-start gap-3 rounded-lg px-3 py-4 text-left focus-visible:outline-2 focus-visible:outline-mint ' +
            (unit.id === selected?.id ? 'bg-mint/10 text-forest' : 'hover:bg-soft')
          }
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-xs font-bold">
            {unit.unitNumber}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold break-words">{unit.title}</span>
            <span className="mt-1 block text-xs text-muted">Chương {unit.unitNumber}</span>
          </span>
        </button>
      ))}
    </nav>
  );
  if (selected)
    return (
      <ManagerChapterContent
        key={selected.id}
        courseId={props.course.id}
        unit={selected}
        coursePicker={props.coursePicker}
        sidebar={sidebar}
      />
    );
  return (
    <div className="space-y-6">
      <div className="min-w-0 max-w-3xl">{props.coursePicker}</div>
      <CourseContentFrame
        sidebarLabel="Nội dung khóa học"
        sidebarTitle={
          <>
            <BookOpen aria-hidden="true" className="size-5 text-mint" />
            Nội dung khóa học
          </>
        }
        sidebar={sidebar}
      >
        <p
          role="status"
          className="scrollbar-hidden min-h-0 overflow-y-auto overscroll-y-contain p-6 text-sm text-muted"
        >
          Khóa học này chưa có chương.
        </p>
      </CourseContentFrame>
    </div>
  );
}
