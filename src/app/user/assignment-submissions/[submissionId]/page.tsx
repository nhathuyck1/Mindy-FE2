import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { uuid } from '@/features/assignments/schemas/assignment-contracts';
import { QuizAttemptPage } from '@/features/assignments/components/quiz-attempt-page';

export default async function Page(props: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await props.params;
  if (!uuid.safeParse(submissionId).success) notFound();
  return (
    <Suspense fallback={<p role="status">Đang tải bài tập…</p>}>
      <QuizAttemptPage submissionId={submissionId} />
    </Suspense>
  );
}
