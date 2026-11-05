'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useManagerCourseOptions } from '../api/manager-course-queries';
import { useManagerQuery } from '../api/manager-queries';
import { managerCourseDetailSchema, materialsSchema } from '../schemas/manager-contracts';
import {
  ManagerPagination,
  ManagerState,
  ReviewBadge,
  managerDate,
  typeLabels,
} from './manager-shared';

export function ManagerPendingMaterials(props: { onRefresh: () => void }) {
  const [page, setPage] = useState(1);
  const [courseId, setCourseId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [type, setType] = useState('');
  const courses = useManagerCourseOptions();
  const course = useManagerQuery(
    `manager/courses/${courseId}`,
    managerCourseDetailSchema,
    Boolean(courseId),
  );
  const params = new URLSearchParams({
    reviewStatus: 'PENDING_REVIEW',
    page: String(page),
    pageSize: '20',
  });
  if (unitId) params.set('courseUnitId', unitId);
  if (type) params.set('contentType', type);
  const selectingUnit = Boolean(courseId) && !unitId;
  const materials = useManagerQuery(`manager/materials?${params}`, materialsSchema, !selectingUnit);
  const hasFilters = Boolean(courseId || unitId || type);
  const lastPage = materials.data ? Math.max(1, Math.ceil(materials.data.total / 20)) : page;
  if (page > lastPage) setPage(lastPage);

  return (
    <section className="admin-table-panel min-w-0" aria-label="Tài liệu chờ duyệt">
      <header className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold">Tài liệu chờ duyệt</h2>
          <p className="mt-1 text-sm text-muted">Mở tài liệu để xem nội dung và kiểm duyệt.</p>
        </div>
        <Button
          variant="outline"
          disabled={materials.isFetching || selectingUnit}
          onClick={() => {
            void materials.refetch();
            props.onRefresh();
          }}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Làm mới
        </Button>
      </header>
      <div
        role="group"
        aria-label="Bộ lọc tài liệu chờ duyệt"
        className="grid gap-4 border-t border-line px-5 py-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] sm:px-6"
      >
        <label className="min-w-0 text-sm font-semibold">
          Khóa học
          <NativeSelect
            aria-label="Lọc theo khóa học"
            wrapperClassName="mt-2 w-full"
            className="h-12 truncate py-2 text-base leading-6"
            value={courseId}
            disabled={courses.isPending || courses.isError}
            onChange={(event) => {
              setCourseId(event.target.value);
              setUnitId('');
              setPage(1);
            }}
          >
            <NativeSelectOption value="">
              {courses.isPending ? 'Đang tải khóa học…' : 'Tất cả khóa học'}
            </NativeSelectOption>
            {courses.data?.map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <label className="min-w-0 text-sm font-semibold">
          Học phần
          <NativeSelect
            aria-label="Lọc theo học phần"
            wrapperClassName="mt-2 w-full"
            className="h-12 truncate py-2 text-base leading-6"
            value={unitId}
            disabled={!courseId || !course.data || course.isError}
            onChange={(event) => {
              setUnitId(event.target.value);
              setPage(1);
            }}
          >
            <NativeSelectOption value="">
              {!courseId
                ? 'Chọn khóa học trước'
                : course.isPending
                  ? 'Đang tải học phần…'
                  : 'Chọn học phần'}
            </NativeSelectOption>
            {courseId &&
              course.data?.units.map((unit) => (
                <NativeSelectOption key={unit.id} value={unit.id}>
                  {unit.unitNumber}. {unit.title}
                </NativeSelectOption>
              ))}
          </NativeSelect>
        </label>
        <label className="min-w-0 text-sm font-semibold">
          Loại tài liệu
          <NativeSelect
            aria-label="Lọc theo loại tài liệu"
            wrapperClassName="mt-2 w-full"
            className="h-12 py-2 text-base leading-6"
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
        <Button
          variant="outline"
          className="h-12 self-end"
          disabled={!hasFilters}
          onClick={() => {
            setCourseId('');
            setUnitId('');
            setType('');
            setPage(1);
          }}
        >
          Xóa bộ lọc
        </Button>
      </div>
      {(courses.isError || (courseId && course.isError)) && (
        <div role="alert" className="flex flex-wrap items-center gap-3 px-5 pb-4 sm:px-6">
          <p className="text-sm text-muted">Chưa tải được bộ lọc khóa học hoặc học phần.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (courses.isError) void courses.refetch();
              if (courseId && course.isError) void course.refetch();
            }}
          >
            Thử lại bộ lọc
          </Button>
        </div>
      )}
      {selectingUnit ? (
        <p role="status" className="border-t border-line px-5 py-8 text-sm text-muted">
          Chọn học phần để xem tài liệu chờ duyệt.
        </p>
      ) : (
        <ManagerState
          pending={materials.isPending}
          error={materials.error}
          retry={materials.refetch}
        >
          {materials.data?.items.length === 0 ? (
            <p
              role="status"
              className="border-t border-line px-5 py-12 text-center text-sm text-muted"
            >
              {hasFilters
                ? 'Không có tài liệu chờ duyệt phù hợp với bộ lọc.'
                : 'Không có tài liệu chờ duyệt.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-data-table min-w-260">
                <caption className="sr-only">Danh sách tài liệu chờ duyệt</caption>
                <thead>
                  <tr>
                    <th scope="col">Tài liệu</th>
                    <th scope="col">Khóa học</th>
                    <th scope="col">Học phần</th>
                    <th scope="col">Loại</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Cập nhật</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.data?.items.map((material) => (
                    <tr key={material.id}>
                      <th scope="row" className="max-w-90 font-normal">
                        <Link
                          href={`/manager/materials/${material.id}`}
                          className="inline-flex min-h-11 items-center rounded-lg font-semibold hover:text-mint hover:underline focus-visible:outline-2 focus-visible:outline-mint"
                        >
                          {material.title}
                        </Link>
                      </th>
                      <td className="min-w-44 max-w-64 whitespace-normal wrap-anywhere">
                        {material.courseTitle ?? 'Chưa có thông tin khóa học'}
                      </td>
                      <td className="min-w-44 max-w-64 whitespace-normal wrap-anywhere">
                        {material.courseUnitTitle ? (
                          <>
                            {material.courseUnitNumber ? `${material.courseUnitNumber}. ` : ''}
                            {material.courseUnitTitle}
                          </>
                        ) : (
                          <span className="text-xs text-muted">{material.courseUnitId}</span>
                        )}
                      </td>
                      <td>{typeLabels[material.contentType]}</td>
                      <td>
                        <ReviewBadge status={material.reviewStatus} />
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        <time dateTime={material.updatedAt}>{managerDate(material.updatedAt)}</time>
                      </td>
                      <td>
                        <Button asChild variant="outline">
                          <Link href={`/manager/materials/${material.id}`}>Xem và duyệt</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {materials.data && (
            <ManagerPagination page={page} total={materials.data.total} onChange={setPage} />
          )}
        </ManagerState>
      )}
    </section>
  );
}
