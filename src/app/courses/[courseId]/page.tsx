import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { CourseDetailContent } from '@/features/courses/components/detail/course-detail';

export const metadata: Metadata = { title: 'Chi tiết khóa học — Mindy Coding' };

export default async function CourseDetailPage(props: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ classId?: string | string[] }>;
}) {
  const { courseId } = await props.params;
  if (!z.uuid().safeParse(courseId).success) notFound();
  const { classId } = await props.searchParams;
  const initialClassId = z.uuid().safeParse(classId);
  return (
    <CourseDetailContent
      key={`${courseId}-${initialClassId.success ? initialClassId.data : ''}`}
      courseId={courseId}
      initialClassId={initialClassId.success ? initialClassId.data : undefined}
    />
  );
}
