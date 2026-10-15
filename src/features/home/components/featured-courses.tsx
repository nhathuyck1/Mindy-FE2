'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { useCourseCategories, useCoursePage } from '@/features/courses/api/course-queries';
import { CourseCard } from '@/features/courses/components/shared/course-card';
import { QueryState } from '@/features/courses/components/shared/query-state';

export function FeaturedCourses() {
  const [categoryId, setCategoryId] = useState('');
  const categories = useCourseCategories();
  const courses = useCoursePage({ categoryId });
  return (
    <div>
      {categories.data && (
        <div
          role="group"
          aria-label="Lọc khóa học theo danh mục"
          className="mb-7 flex flex-wrap gap-2"
        >
          {[{ id: '', name: 'Tất cả' }, ...categories.data].map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={categoryId === category.id}
              onClick={() => setCategoryId(category.id)}
              className={`min-h-11 cursor-pointer rounded-full border px-4 text-xs font-extrabold transition-colors ${categoryId === category.id ? 'border-mint bg-mint text-canvas' : 'border-line bg-canvas hover:bg-soft'}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
      {courses.isPending ? (
        <QueryState loading title="Đang tìm những khóa học dành cho bạn…" />
      ) : courses.isError ? (
        <QueryState title="Chưa thể tải khóa học." retry={() => void courses.refetch()} />
      ) : !courses.data.items.length ? (
        <QueryState
          title="Chương mới đang được chuẩn bị."
          description="Các khóa học sẽ xuất hiện tại đây khi được mở."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {courses.data.items.map((course) => (
            <CourseCard key={course.id} course={course} headingLevel={3} />
          ))}
        </div>
      )}
      <div className="mt-7 text-center">
        <Link href="/courses" className="text-link text-mint">
          Khám phá tất cả khóa học <Icon name="arrow" className="size-4" />
        </Link>
      </div>
    </div>
  );
}
