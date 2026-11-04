import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { uuid } from '@/features/assignments/schemas/assignment-contracts';
import { ZipSubmissionPage } from '@/features/assignments/components/zip-submission-page';

export default async function Page(props: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await props.params;
  if (!uuid.safeParse(submissionId).success) notFound();
  return (
    <Suspense fallback={<p role="status">Đang tải bài tập…</p>}>
      <ZipSubmissionPage submissionId={submissionId} mentor />
    </Suspense>
  );
}
