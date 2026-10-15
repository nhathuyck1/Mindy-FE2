'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { useCoursePage } from '../../api/course-queries';
import { CourseCard } from '../shared/course-card';

export function RelatedCourses(props: { courseId: string; categoryId: string }) {
  const courses = useCoursePage({ categoryId: props.categoryId }, 4);
  const related =
    courses.data?.items.filter((course) => course.id !== props.courseId).slice(0, 2) ?? [];
  if (courses.isPending || courses.isError || related.length === 0) return null;
  return (
    <section
      className="rounded-xl border border-line bg-canvas p-5 sm:p-6"
      aria-labelledby="related-title"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id="related-title" className="text-lg font-extrabold">
          Khóa học liên quan
        </h2>
        <Link href="/courses" className="text-link text-xs text-mint">
          Xem tất cả <Icon name="arrow" className="size-3.5" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {related.map((course) => (
          <CourseCard key={course.id} course={course} headingLevel={3} />
        ))}
      </div>
    </section>
  );
}
