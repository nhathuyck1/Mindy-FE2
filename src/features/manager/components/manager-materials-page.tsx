'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Files, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourseContentFrame, CourseContentPanel } from '@/components/ui/course-content-frame';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useCourseCatalog } from '@/features/courses/api/course-queries';
import { courseDetailSchema } from '@/features/courses/schemas/course-contracts';
import { useManagerQuery } from '../api/manager-queries';
import { ManagerCourseWorkspace } from './manager-course-workspace';
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
        <Button variant="outline" onClick={() => setInventory(false)}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Khóa học
        </Button>
        <ManagerMaterialsInventory />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold tracking-widest text-mint uppercase">
            Mindy / Quản lý tài liệu
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {course.data?.title ?? 'Quản lý tài liệu'}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Chọn khóa học, mở chương và chỉnh sửa nội dung ngay tại đây.
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
      {(!courseId || !course.data) && <div className="max-w-3xl">{coursePicker}</div>}
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
        <CourseContentFrame
          sidebarLabel="Danh sách khóa học"
          sidebarTitle={
            <>
              <BookOpen aria-hidden="true" className="size-5 text-mint" />
              Khóa học
            </>
          }
          sidebar={
            <ManagerState pending={courses.isPending} error={courses.error} retry={courses.refetch}>
              <nav className="flex flex-col" aria-label="Khóa học">
                {courses.data?.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCourseId(item.id)}
                    className="flex min-h-19 items-start gap-3 rounded-lg px-3 py-4 text-left transition-colors hover:bg-mint/10 focus-visible:outline-2 focus-visible:outline-mint"
                  >
                    <BookOpen aria-hidden="true" className="mt-1 size-5 shrink-0 text-mint" />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold break-words">{item.title}</span>
                      <span className="mt-1 block text-xs text-muted">{item.code}</span>
                    </span>
                  </button>
                ))}
                {courses.data?.length === 0 && (
                  <p role="status" className="p-3 text-sm text-muted">
                    Chưa có khóa học.
                  </p>
                )}
              </nav>
            </ManagerState>
          }
        >
          <CourseContentPanel
            label="Nội dung khóa học"
            header={
              <div>
                <p className="text-xs font-semibold text-mint">HỌC LIỆU</p>
                <h2 className="mt-2 text-xl font-bold">Nội dung khóa học</h2>
              </div>
            }
          >
            <p
              role="status"
              className="flex items-center gap-3 rounded-xl border border-line p-6 text-sm leading-7"
            >
              <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-mint" />
              Chọn khóa học để xem chương và tài liệu.
            </p>
          </CourseContentPanel>
        </CourseContentFrame>
      )}
      {creating && <ManagerMaterialEditor onClose={() => setCreating(false)} />}
    </div>
  );
}
