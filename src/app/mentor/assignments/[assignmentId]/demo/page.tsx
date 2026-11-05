import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { MentorCodeDemoPage } from '@/features/code-assignments/components/mentor-code-demo-page';

export const metadata: Metadata = { title: 'Mentor làm mẫu' };
export default async function Page(props: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await props.params;
  if (!z.uuid().safeParse(assignmentId).success) notFound();
  return <MentorCodeDemoPage assignmentId={assignmentId} />;
}
