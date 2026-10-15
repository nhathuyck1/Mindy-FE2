import { notFound } from 'next/navigation';
import { z } from 'zod';
import { LearningPage } from '@/features/learning/components/learning-page';
export const metadata = { title: 'Không gian học tập' };
export default async function Page(props: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { classId } = await props.params;
  if (!z.uuid().safeParse(classId).success) notFound();
  const search = await props.searchParams;
  return <LearningPage classId={classId} preview={search.preview === 'true'} />;
}
