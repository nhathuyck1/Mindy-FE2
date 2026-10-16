import { notFound } from 'next/navigation';
import { z } from 'zod';
import { MentorSessionPage } from '@/features/mentor/components/mentor-session-page';
export default async function Page(props: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await props.params;
  if (!z.uuid().safeParse(sessionId).success) notFound();
  return <MentorSessionPage sessionId={sessionId} />;
}
