import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { uuid } from '@/features/assignments/schemas/assignment-contracts';
import { StudentAssignmentPage } from '@/features/assignments/components/student-assignment-page';

export default async function Page(props: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await props.params;
  if (!uuid.safeParse(assignmentId).success) notFound();
  return (
    <Suspense fallback={<p role="status">Đang tải bài tập…</p>}>
      <StudentAssignmentPage assignmentId={assignmentId} />
    </Suspense>
  );
}
