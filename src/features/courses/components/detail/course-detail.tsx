'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/client';
import { useCourseDetail } from '../../api/course-queries';
import { deliveryLabel } from '../../lib/course-format';
import { CourseImage } from '../shared/course-image';
import { QueryState } from '../shared/query-state';
import { ClassPicker } from '../enrollment/class-picker';
import { CourseCurriculum } from './course-curriculum';
import { RelatedCourses } from './related-courses';
import { CourseOverview } from './course-overview';
import { CourseMentors } from './course-mentors';
import { CourseRegistrationCard } from './course-registration-card';

export function CourseDetailContent(props: { courseId: string; initialClassId?: string }) {
  const query = useCourseDetail(props.courseId);
  const [pickerOpen, setPickerOpen] = useState(Boolean(props.initialClassId));
  if (query.isPending)
    return (
      <div className="page-container py-10">
        <QueryState loading title="Đang tải chi tiết khóa học…" />
      </div>
    );
  if (query.isError)
    return (
      <div className="page-container py-10">
        <QueryState
          title={
            query.error instanceof ApiError && query.error.status === 404
              ? 'Không tìm thấy khóa học'
              : 'Chưa thể tải chi tiết khóa học'
          }
          description="Khóa học có thể đã ngừng mở hoặc kết nối đang gián đoạn."
          notFound
          retry={
            query.error instanceof ApiError && query.error.status === 404
              ? undefined
              : () => void query.refetch()
          }
        />
      </div>
    );
  const course = query.data;
  const mentors = [
    ...new Map(course.openClasses.map((item) => [item.mentor.id, item.mentor])).values(),
  ];
  const modes = [...new Set(course.openClasses.map((item) => item.deliveryMode))];
  const units = [...course.units].sort((a, b) => a.unitNumber - b.unitNumber);

  return (
    <div className="page-container py-7 lg:py-9">
      <nav
        aria-label="Đường dẫn"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted"
      >
        <Link href="/" className="hover:text-mint">
          Trang chủ
        </Link>
        <Icon name="chevron" className="size-3" />
        <Link href="/courses" className="hover:text-mint">
          Khóa học
        </Link>
        <Icon name="chevron" className="size-3" />
        <span>{course.category.name}</span>
        <Icon name="chevron" className="size-3" />
        <span aria-current="page" className="font-bold text-forest">
          {course.title}
        </span>
      </nav>
      <div className="mb-7 max-w-3xl">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-line bg-canvas px-3 py-1 text-[11px] font-extrabold text-mint">
            {course.category.name}
          </span>
          <span className="rounded-full border border-line bg-canvas px-3 py-1 text-[11px] font-bold">
            {course.code}
          </span>
        </div>
        <h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
          {course.title}
        </h1>
        {course.description && (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
            {course.description}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Icon name="book" className="size-4 text-mint" />
            {units.length} học phần
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="user" className="size-4 text-mint" />
            {mentors.length} mentor ở các lớp đang mở
          </span>
          {modes.map((mode) => (
            <span key={mode} className="flex items-center gap-1.5">
              <Icon
                name={mode === 'ONLINE' ? 'monitor' : 'location'}
                className="size-4 text-mint"
              />
              {deliveryLabel(mode)}
            </span>
          ))}
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-xl border border-line bg-canvas">
            <div className="relative aspect-video overflow-hidden">
              <CourseImage
                src={course.imgUrl}
                title={course.title}
                preload
                sizes="(max-width: 1023px) 92vw, 800px"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 text-xs sm:grid-cols-3">
              <span className="flex items-center gap-2">
                <Icon name="book" className="size-5 shrink-0 text-mint" />
                <span>
                  <strong className="block">Giáo trình rõ ràng</strong>
                  <span className="text-[10px] text-muted">{units.length} học phần</span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Icon name="calendar" className="size-5 shrink-0 text-mint" />
                <span>
                  <strong className="block">Chủ động lịch học</strong>
                  <span className="text-[10px] text-muted">Xem lịch trước khi chọn lớp</span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Icon name="user" className="size-5 shrink-0 text-mint" />
                <span>
                  <strong className="block">Mentor đồng hành</strong>
                  <span className="text-[10px] text-muted">Theo từng lớp học</span>
                </span>
              </span>
            </div>
          </div>
          <nav
            aria-label="Nội dung khóa học"
            className="flex flex-wrap gap-1 rounded-lg border border-line bg-canvas p-1 text-xs font-bold"
          >
            {[
              { id: 'tong-quan', label: 'Tổng quan' },
              { id: 'giao-trinh', label: 'Giáo trình' },
              { id: 'mentor', label: 'Mentor' },
            ].map((tab, index) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className={`flex min-h-11 flex-1 items-center justify-center rounded-md border bg-canvas px-4 hover:border-mint hover:text-mint ${index === 0 ? 'border-mint text-mint' : 'border-transparent'}`}
              >
                {tab.label}
              </a>
            ))}
          </nav>
          <CourseOverview course={course} />
          <CourseCurriculum units={course.units} />
          <CourseMentors course={course} onChooseClass={() => setPickerOpen(true)} />
          <RelatedCourses courseId={course.id} categoryId={course.category.id} />
        </div>
        <CourseRegistrationCard course={course} onChooseClass={() => setPickerOpen(true)} />
      </div>
      {pickerOpen && (
        <ClassPicker
          course={course}
          initialClassId={props.initialClassId}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
