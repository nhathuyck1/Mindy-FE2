'use client';

import { useState } from 'react';
import { ArrowLeft, Files, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCourseCatalog } from '@/features/courses/api/course-queries';
import { courseDetailSchema } from '@/features/courses/schemas/course-contracts';
import { useManagerQuery } from '../api/manager-queries';
import { ManagerCourseWorkspace } from './manager-course-workspace';
import { ManagerCourseList } from './manager-course-list';
import { ManagerMaterialEditor } from './manager-material-editor';
import { ManagerMaterialsInventory } from './manager-materials-inventory';
import { ManagerState } from './manager-shared';

export function ManagerMaterialsPage() {
  const [inventory, setInventory] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [creating, setCreating] = useState(false);
  const courses = useCourseCatalog({});
  const selectedCourse = courses.data?.find((item) => item.id === courseId);
  const course = useManagerQuery(`courses/${courseId}`, courseDetailSchema, Boolean(courseId));

  if (inventory)
    return (
      <div className="space-y-5">
        <Button variant="outline" onClick={() => setInventory(false)}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Khóa học
        </Button>
        <ManagerMaterialsInventory />
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
            {course.data?.title ?? selectedCourse?.title ?? 'Quản lý tài liệu'}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {courseId
              ? 'Kiểm tra, duyệt và quản lý xuất bản tài liệu theo từng chương.'
              : 'Chọn một khóa học để quản lý chương và tài liệu.'}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => setInventory(true)}>
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
      {courseId ? (
        <ManagerState pending={course.isPending} error={course.error} retry={course.refetch}>
          {course.data && <ManagerCourseWorkspace key={courseId} course={course.data} />}
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
