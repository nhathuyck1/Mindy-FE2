import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { CourseDetailContent } from '@/features/courses/components/detail/course-detail';

export const metadata: Metadata = { title: 'Chi tiết khóa học — Mindy Coding' };

export default async function CourseDetailPage(props: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ classId?: string | string[]; trial?: string | string[] }>;
}) {
  const { courseId } = await props.params;
  if (!z.uuid().safeParse(courseId).success) notFound();
  const { classId, trial } = await props.searchParams;
  const initialClassId = z.uuid().safeParse(classId);
  return (
    <CourseDetailContent
      key={`${courseId}-${initialClassId.success ? initialClassId.data : ''}-${trial === 'true'}`}
      courseId={courseId}
      initialTrialOnly={trial === 'true'}
      initialClassId={initialClassId.success ? initialClassId.data : undefined}
    />
  );
}
