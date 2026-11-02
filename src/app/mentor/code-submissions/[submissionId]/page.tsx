import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { MentorCodeSubmissionPage } from '@/features/code-assignments/components/mentor-code-review-page';

export const metadata: Metadata = { title: 'Chi tiết bài nộp code' };
export default async function Page(props: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await props.params;
  if (!z.uuid().safeParse(submissionId).success) notFound();
  return <MentorCodeSubmissionPage submissionId={submissionId} />;
}
