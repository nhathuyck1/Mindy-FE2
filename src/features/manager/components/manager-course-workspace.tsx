'use client';

import { useState } from 'react';
import { ClipboardCheck, Plus, RefreshCw, FilterX, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { CourseDetail } from '@/features/courses/schemas/course-contracts';
import { useManagerQuery } from '../api/manager-queries';
import { materialsSchema } from '../schemas/manager-contracts';
import { ManagerMaterialDetail } from './manager-material-detail';
import { ManagerMaterialEditor } from './manager-material-editor';
import { ManagerCourseMaterialsTable } from './manager-course-materials-table';
import { ManagerPagination, ManagerState, reviewLabels, typeLabels } from './manager-shared';

function ManagerChapterRegister(props: {
  courseId: string;
  unit: CourseDetail['units'][number];
  coursePicker?: React.ReactNode;
  unitPicker: React.ReactNode;
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
  const resetFilters = () => {
    setStatus('');
    setType('');
    setPage(1);
  };
  return (
    <div className="space-y-5">
      <div
        role="group"
        aria-label="Bộ lọc tài liệu"
        className="rounded-xl border border-line bg-soft/30 p-4 sm:p-5"
      >
        <div
          className={`grid min-w-0 items-end gap-4 ${props.coursePicker ? 'md:grid-cols-2' : ''}`}
        >
          {props.coursePicker}
          {props.unitPicker}
        </div>
        <div className="mt-5 grid min-w-0 items-end gap-4 border-t border-line pt-4 md:grid-cols-2">
          <label className="min-w-0 text-sm font-semibold">
            Trạng thái duyệt
            <NativeSelect
              aria-label="Trạng thái duyệt trong chương"
              wrapperClassName="mt-2 w-full"
              className="h-12 w-full text-base leading-6 font-normal"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
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
              wrapperClassName="mt-2 w-full"
              className="h-12 w-full text-base leading-6 font-normal"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
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
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            className="border-line shadow-none"
            disabled={!status && !type}
            onClick={resetFilters}
          >
            <FilterX aria-hidden="true" className="size-4" />
            Xóa bộ lọc
          </Button>
        </div>
      </div>
      <section
        aria-label="Danh sách tài liệu của chương"
        className="min-w-0 overflow-hidden rounded-xl border border-line bg-canvas"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex min-w-0 flex-[1_1_16rem] items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-lg bg-mint/10 text-mint"
            >
              <ClipboardCheck className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-muted">
                CHƯƠNG {props.unit.unitNumber}
              </p>
              <h2 className="mt-1 text-lg leading-7 font-bold [overflow-wrap:anywhere]">
                {props.unit.title}
              </h2>
              <p className="mt-1 text-xs text-muted">
                {materials.data
                  ? `${materials.data.total} tài liệu${status || type ? ' khớp bộ lọc' : ''}`
                  : 'Đang tải danh sách'}{' '}
                · Chọn tài liệu để kiểm tra và duyệt.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-line shadow-none"
              disabled={materials.isFetching}
              onClick={() => void materials.refetch()}
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Làm mới
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" className="size-4" />
              Tạo tài liệu
            </Button>
          </div>
        </header>
        {props.unit.description && (
          <p className="px-5 pb-5 text-sm leading-7 text-muted sm:px-6">{props.unit.description}</p>
        )}
        <ManagerState
          pending={materials.isPending}
          error={materials.error}
          retry={materials.refetch}
        >
          {materials.data?.items.length ? (
            <ManagerCourseMaterialsTable items={materials.data.items} onOpen={setMaterialId} />
          ) : (
            <div role="status" className="space-y-3 border-t border-line p-8 text-center">
              <FolderOpen aria-hidden="true" className="mx-auto size-9 text-mint/70" />
              <p className="text-sm leading-7 text-muted">
                {status || type
                  ? 'Chưa có tài liệu phù hợp với bộ lọc trong chương này.'
                  : 'Chương này chưa có tài liệu. Chọn Tạo tài liệu để soạn nội dung hoặc tải tệp lên.'}
              </p>
            </div>
          )}
          {materials.data && materials.data.total > 20 && (
            <ManagerPagination page={page} total={materials.data.total} onChange={setPage} />
          )}
        </ManagerState>
      </section>
      {materialId && (
        <ManagerMaterialDetail
          key={materialId}
          id={materialId}
          onClose={() => {
            setMaterialId(null);
            void materials.refetch();
          }}
        />
      )}
      {creating && (
        <ManagerMaterialEditor
          courseId={props.courseId}
          unitId={props.unit.id}
          onSaved={(material) => {
            setMaterialId(material.id);
            resetFilters();
          }}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

export function ManagerCourseWorkspace(props: {
  course: CourseDetail;
  coursePicker?: React.ReactNode;
}) {
  const [unitId, setUnitId] = useState('');
  const units = [...props.course.units].sort((a, b) => a.unitNumber - b.unitNumber);
  const selected = units.find((unit) => unit.id === unitId) ?? units[0];
  const unitPicker = (
    <label className="min-w-0 text-sm font-semibold">
      Chương
      <NativeSelect
        aria-label="Chọn chương quản lý"
        wrapperClassName="mt-2 w-full"
        className="h-12 w-full text-base leading-6 font-normal"
        value={selected?.id ?? ''}
        onChange={(event) => setUnitId(event.target.value)}
      >
        {units.map((unit) => (
          <NativeSelectOption key={unit.id} value={unit.id}>
            Chương {unit.unitNumber}: {unit.title}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </label>
  );
  return selected ? (
    <ManagerChapterRegister
      key={selected.id}
      courseId={props.course.id}
      unit={selected}
      coursePicker={props.coursePicker}
      unitPicker={unitPicker}
    />
  ) : (
    <section className="space-y-5 rounded-xl border border-line p-5">
      {props.coursePicker && <div className="max-w-2xl">{props.coursePicker}</div>}
      <p role="status" className="text-sm text-muted">
        Khóa học này chưa có chương.
      </p>
    </section>
  );
}
