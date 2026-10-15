import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { AdminClassStudentsPage } from '@/features/admin/components/admin-class-students';

export const metadata: Metadata = { title: 'Học viên lớp học' };

export default async function AdminClassStudentsRoutePage(
  props: PageProps<'/admin/classes/[classId]/students'>,
) {
  const { classId } = await props.params;
  if (!z.uuid().safeParse(classId).success) notFound();
  return <AdminClassStudentsPage key={classId} classId={classId} />;
}
