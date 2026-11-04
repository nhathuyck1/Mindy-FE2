import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { uuid } from '@/features/assignments/schemas/assignment-contracts';
import { AssignmentList } from '@/features/assignments/components/assignment-list';

export default async function Page(props: { params: Promise<{ classId: string }> }) {
  const { classId } = await props.params;
  if (!uuid.safeParse(classId).success) notFound();
  return (
    <Suspense fallback={<p role="status">Đang tải bài tập…</p>}>
      <AssignmentList classId={classId} />
    </Suspense>
  );
}
