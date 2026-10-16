'use client';

import { useState } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  Clock3,
  CheckCheck,
  PencilLine,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useCourseCatalog } from '@/features/courses/api/course-queries';
import { courseDetailSchema } from '@/features/courses/schemas/course-contracts';
import { useManagerQuery } from '../api/manager-queries';
import { materialsSchema } from '../schemas/manager-contracts';
import {
  ManagerState,
  ManagerPagination,
  ReviewBadge,
  reviewLabels,
  typeLabels,
  managerDate,
} from './manager-shared';
import { ManagerMaterialDetail } from './manager-material-detail';
import { ManagerMaterialEditor } from './manager-material-editor';
import { ManagerCourseWorkspace } from './manager-course-workspace';

export function ManagerMaterialsInventory() {
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [unitId, setUnitId] = useState('');
  const courses = useCourseCatalog({});
  const course = useManagerQuery(`courses/${courseId}`, courseDetailSchema, Boolean(courseId));
  const selectingUnit = Boolean(courseId) && !unitId;
  const materialsPath = unitId ? `manager/course-units/${unitId}/materials` : 'manager/materials';
  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (status) params.set('reviewStatus', status);
  if (type) params.set('contentType', type);
  const materials = useManagerQuery(`${materialsPath}?${params}`, materialsSchema, !selectingUnit);
  const pending = useManagerQuery(
    `${materialsPath}?page=1&pageSize=1&reviewStatus=PENDING_REVIEW`,
    materialsSchema,
    !selectingUnit,
  );
  const approved = useManagerQuery(
    `${materialsPath}?page=1&pageSize=1&reviewStatus=APPROVED`,
    materialsSchema,
    !selectingUnit,
  );
  const drafts = useManagerQuery(
    `${materialsPath}?page=1&pageSize=1&reviewStatus=DRAFT`,
    materialsSchema,
    !selectingUnit,
  );
  const stats = [
    {
      label: 'Đang chờ duyệt',
      query: pending,
      icon: Clock3,
      status: 'PENDING_REVIEW',
      hint: 'Kiểm tra trước khi phát hành',
    },
    {
      label: 'Đã được duyệt',
      query: approved,
      icon: CheckCheck,
      status: 'APPROVED',
      hint: 'Quản lý trạng thái xuất bản',
    },
    {
      label: 'Bản nháp',
      query: drafts,
      icon: PencilLine,
      status: 'DRAFT',
      hint: 'Nội dung đang được biên soạn',
    },
  ];
  const coursePicker = (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-semibold" htmlFor="manager-workspace-course">
        Khóa học
      </label>
      <NativeSelect
        id="manager-workspace-course"
        aria-label="Lọc theo khóa học"
        wrapperClassName="w-full"
        className="h-12 py-2 text-base leading-6"
        value={courseId}
        onChange={(event) => {
          setCourseId(event.target.value);
          setUnitId('');
          setPage(1);
        }}
      >
        <NativeSelectOption value="">Toàn bộ kho tài liệu</NativeSelectOption>
        {courses.data?.map((item) => (
          <NativeSelectOption key={item.id} value={item.id}>
            {item.title}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
  if (courseId)
    return (
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-mint uppercase">
            Mindy / Quản lý tài liệu
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {course.data?.title ?? 'Nội dung khóa học'}
          </h1>
        </div>
        {!course.data && <div className="max-w-3xl">{coursePicker}</div>}
        <ManagerState pending={course.isPending} error={course.error} retry={course.refetch}>
          {course.data && (
            <ManagerCourseWorkspace
              key={courseId}
              course={course.data}
              coursePicker={coursePicker}
            />
          )}
        </ManagerState>
      </div>
    );
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-mint uppercase">
            Mindy / Không gian Manager
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý tài liệu</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Một nơi để biên soạn, kiểm duyệt và phát hành học liệu cho các khóa học.
          </p>
        </div>
        <Button onClick={() => setCreate(true)}>
          <Plus className="size-4" />
          Tạo tài liệu
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <button
            type="button"
            key={item.status}
            onClick={() => {
              setStatus(item.status);
              setPage(1);
            }}
            className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 text-left transition-colors hover:border-mint ${status === item.status ? 'border-mint/50 bg-soft/60' : 'border-line bg-canvas'}`}
          >
            <span className="rounded-xl bg-mint/10 p-3 text-mint">
              <item.icon className="size-5" />
            </span>
            <span>
              <span className="block text-sm text-muted">{item.label}</span>
              <span className="mt-1 block text-3xl font-bold">
                {selectingUnit ? '—' : (item.query.data?.total ?? '—')}
              </span>
              <span className="mt-2 block text-xs text-muted">
                {selectingUnit
                  ? 'Chọn học phần để xem số lượng'
                  : item.query.isError
                    ? 'Chưa tải được số lượng'
                    : item.hint}
              </span>
            </span>
          </button>
        ))}
      </div>
      <section className="admin-table-panel" aria-label="Kho tài liệu">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <FolderOpen className="size-5 text-mint" />
            <h2 className="text-lg font-bold">Kho tài liệu</h2>
          </div>
          <Button
            variant="outline"
            disabled={materials.isFetching || selectingUnit}
            onClick={() => {
              void materials.refetch();
              void pending.refetch();
              void approved.refetch();
              void drafts.refetch();
            }}
          >
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        </div>
        <div className="grid gap-3 border-t border-line px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="min-w-0 text-xs font-semibold [&>div]:w-full">
            Khóa học
            <NativeSelect
              aria-label="Lọc theo khóa học"
              wrapperClassName="mt-2 w-full"
              className="h-12 w-full truncate py-2 text-base leading-6"
              value={courseId}
              disabled={courses.isPending || courses.isError}
              onChange={(event) => {
                setCourseId(event.target.value);
                setUnitId('');
                setPage(1);
              }}
            >
              <NativeSelectOption value="">
                {courses.isPending ? 'Đang tải khóa học…' : 'Toàn bộ kho tài liệu'}
              </NativeSelectOption>
              {courses.data?.map((item) => (
                <NativeSelectOption key={item.id} value={item.id}>
                  {item.title}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className="min-w-0 text-xs font-semibold [&>div]:w-full">
            Học phần
            <NativeSelect
              aria-label="Lọc theo học phần"
              wrapperClassName="mt-2 w-full"
              className="h-12 w-full truncate py-2 text-base leading-6"
              value={unitId}
              disabled={!courseId || !course.data || course.isError}
              onChange={(event) => {
                setUnitId(event.target.value);
                setPage(1);
              }}
            >
              <NativeSelectOption value="">
                {courseId && course.isPending ? 'Đang tải học phần…' : 'Chọn học phần'}
              </NativeSelectOption>
              {courseId &&
                course.data?.units.map((unit) => (
                  <NativeSelectOption key={unit.id} value={unit.id}>
                    {unit.unitNumber}. {unit.title}
                  </NativeSelectOption>
                ))}
            </NativeSelect>
          </label>
          <label className="min-w-0 text-xs font-semibold [&>div]:w-full">
            Trạng thái duyệt
            <NativeSelect
              aria-label="Trạng thái duyệt"
              wrapperClassName="mt-2 w-full"
              className="h-12 w-full py-2 text-base leading-6"
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
          <label className="min-w-0 text-xs font-semibold [&>div]:w-full">
            Loại tài liệu
            <NativeSelect
              aria-label="Loại tài liệu"
              wrapperClassName="mt-2 w-full"
              className="h-12 w-full py-2 text-base leading-6"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
            >
              <NativeSelectOption value="">Tất cả loại</NativeSelectOption>
              {Object.entries(typeLabels).map(([value, label]) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        </div>
        <div className="px-5 pb-4 text-xs leading-5 text-muted">
          {unitId ? (
            <p>
              Đang xem: {course.data?.title} ·{' '}
              {course.data?.units.find((unit) => unit.id === unitId)?.title}. Số lượng thống kê
              thuộc học phần này.
            </p>
          ) : !courseId ? (
            <p>
              Đang xem toàn bộ kho. Chọn khóa học đang hoạt động và học phần để xem tài liệu riêng.
            </p>
          ) : null}
          {(courses.isError || (courseId && course.isError)) && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded-lg bg-peach p-3 text-foreground"
            >
              <p>Chưa tải được danh sách khóa học hoặc học phần.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (courses.isError) void courses.refetch();
                  if (courseId) void course.refetch();
                }}
              >
                Thử lại bộ lọc
              </Button>
            </div>
          )}
        </div>
        <ManagerState
          pending={!selectingUnit && materials.isPending}
          error={selectingUnit ? null : materials.error}
          retry={materials.refetch}
        >
          {selectingUnit ? (
            <div
              role="status"
              className="border-t border-line px-6 py-12 text-center text-sm text-muted"
            >
              {course.isPending
                ? 'Đang tải học phần…'
                : course.data?.units.length === 0
                  ? 'Khóa học này chưa có học phần.'
                  : 'Chọn học phần để xem danh sách tài liệu.'}
            </div>
          ) : materials.data?.items.length === 0 ? (
            <div className="grid justify-items-center gap-3 border-t border-line px-6 py-16 text-center">
              <FileText className="size-10 text-mint/60" />
              <h3 className="font-bold">Chưa có tài liệu trong danh sách này</h3>
              <p className="text-sm text-muted">
                Thay đổi bộ lọc hoặc tạo tài liệu mới cho khóa học.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-data-table min-w-200">
                <caption className="sr-only">Danh sách tài liệu và trạng thái kiểm duyệt</caption>
                <thead>
                  <tr>
                    <th scope="col">Tài liệu</th>
                    <th scope="col">Loại</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Cập nhật</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.data?.items.map((item) => (
                    <tr key={item.id}>
                      <th scope="row" className="max-w-90 font-normal">
                        <button
                          className="cursor-pointer text-left font-semibold hover:text-mint hover:underline"
                          onClick={() => setDetail(item.id)}
                        >
                          {item.title}
                        </button>
                        <p className="mt-1 text-xs text-muted">
                          Phiên bản {item.revision} ·{' '}
                          {item.publishedAt ? 'Đang xuất bản' : 'Chưa xuất bản'}
                        </p>
                      </th>
                      <td>{typeLabels[item.contentType]}</td>
                      <td>
                        <ReviewBadge status={item.reviewStatus} />
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        {managerDate(item.updatedAt)}
                      </td>
                      <td>
                        <Button variant="outline" size="sm" onClick={() => setDetail(item.id)}>
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!selectingUnit && materials.data && (
            <ManagerPagination page={page} total={materials.data.total} onChange={setPage} />
          )}
        </ManagerState>
      </section>
      {detail && <ManagerMaterialDetail key={detail} id={detail} onClose={() => setDetail(null)} />}
      {create && <ManagerMaterialEditor onClose={() => setCreate(false)} />}
    </div>
  );
}
