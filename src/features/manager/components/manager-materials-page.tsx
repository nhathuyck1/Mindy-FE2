'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Files, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useCourseCatalog } from '@/features/courses/api/course-queries';
import { courseDetailSchema } from '@/features/courses/schemas/course-contracts';
import { useManagerQuery } from '../api/manager-queries';
import { ManagerCourseWorkspace } from './manager-course-workspace';
import { ManagerCourseList } from './manager-course-list';
import { ManagerMaterialEditor } from './manager-material-editor';
import { ManagerMaterialsInventory } from './manager-materials-inventory';
import { ManagerState } from './manager-shared';

export function ManagerMaterialsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inventory = searchParams.get('view') === 'inventory';
  const requestedStatus = searchParams.get('reviewStatus');
  const reviewStatus = ['PENDING_REVIEW', 'APPROVED', 'DRAFT'].includes(requestedStatus ?? '')
    ? (requestedStatus ?? 'PENDING_REVIEW')
    : 'PENDING_REVIEW';
  const [courseId, setCourseId] = useState('');
  const [creating, setCreating] = useState(false);
  const courses = useCourseCatalog({});
  const selectedCourse = courses.data?.find((item) => item.id === courseId);
  const course = useManagerQuery(`courses/${courseId}`, courseDetailSchema, Boolean(courseId));

  const coursePicker = (
    <div className="min-w-0">
      <label htmlFor="manager-course-picker" className="mb-2 block text-sm font-semibold">
        Khóa học
      </label>
      <NativeSelect
        id="manager-course-picker"
        aria-label="Lọc theo khóa học"
        wrapperClassName="w-full"
        className="h-12 py-2 text-base leading-6"
        title={selectedCourse?.title}
        value={courseId}
        disabled={courses.isPending || courses.isError}
        onChange={(event) => setCourseId(event.target.value)}
      >
        <NativeSelectOption value="">Chọn khóa học</NativeSelectOption>
        {courses.data?.map((item) => (
          <NativeSelectOption key={item.id} value={item.id}>
            {item.title}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );

  if (inventory)
    return (
      <div className="space-y-5">
        <Button variant="outline" onClick={() => router.push('/manager/materials')}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Khóa học
        </Button>
        <ManagerMaterialsInventory
          reviewStatus={reviewStatus}
          onReviewStatusChange={(status) => {
            const query = new URLSearchParams(searchParams.toString());
            query.set('view', 'inventory');
            if (status) query.set('reviewStatus', status);
            else query.delete('reviewStatus');
            router.push(`${pathname}?${query.toString()}`);
          }}
        />
      </div>
    );

  return (
    <div className="space-y-6">
      {courseId && (
        <Button variant="outline" onClick={() => setCourseId('')}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Danh sách khóa học
        </Button>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold tracking-widest text-mint uppercase">
            Mindy / Quản lý tài liệu
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {course.data?.title ?? 'Quản lý tài liệu'}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {courseId
              ? 'Mở chương và chỉnh sửa nội dung ngay tại đây.'
              : 'Chọn một khóa học để quản lý chương và tài liệu.'}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push('/manager/materials?view=inventory&reviewStatus=PENDING_REVIEW')
            }
          >
            <Files aria-hidden="true" className="size-4" />
            Toàn bộ tài liệu
          </Button>
          {!courseId && (
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" className="size-4" />
              Tạo tài liệu
            </Button>
          )}
        </div>
      </div>
      {courseId && !course.data && <div className="max-w-3xl">{coursePicker}</div>}
      {courseId ? (
        <ManagerState pending={course.isPending} error={course.error} retry={course.refetch}>
          {course.data && (
            <ManagerCourseWorkspace
              key={courseId}
              course={course.data}
              coursePicker={coursePicker}
            />
          )}
        </ManagerState>
      ) : (
        <ManagerState pending={courses.isPending} error={courses.error} retry={courses.refetch}>
          {courses.data && <ManagerCourseList courses={courses.data} onSelect={setCourseId} />}
        </ManagerState>
      )}
      {creating && <ManagerMaterialEditor onClose={() => setCreating(false)} />}
    </div>
  );
}
