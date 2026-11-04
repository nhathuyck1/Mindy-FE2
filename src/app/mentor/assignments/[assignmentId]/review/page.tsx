import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { MentorCodeReviewPage } from '@/features/code-assignments/components/mentor-code-review-page';

export const metadata: Metadata = { title: 'Bài nộp code' };
export default async function Page(props: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await props.params;
  if (!z.uuid().safeParse(assignmentId).success) notFound();
  return <MentorCodeReviewPage assignmentId={assignmentId} />;
}
