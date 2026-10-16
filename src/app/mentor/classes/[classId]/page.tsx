import { notFound } from 'next/navigation';
import { z } from 'zod';
import { MentorClassPage } from '@/features/mentor/components/mentor-class-page';
export default async function Page(props: { params: Promise<{ classId: string }> }) {
  const { classId } = await props.params;
  if (!z.uuid().safeParse(classId).success) notFound();
  return <MentorClassPage classId={classId} />;
}
