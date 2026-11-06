import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { MentorSessionAssignmentsPage } from '@/features/mentor/components/mentor-session-assignments-page';

export const metadata: Metadata = { title: 'Bài tập của buổi' };

export default async function Page(props: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await props.params;
  if (!z.uuid().safeParse(sessionId).success) notFound();
  return <MentorSessionAssignmentsPage sessionId={sessionId} />;
}
