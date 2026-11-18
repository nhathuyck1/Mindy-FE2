import { notFound } from 'next/navigation';
import { z } from 'zod';
import { StudentSessionPage } from '@/features/user/components/student-session-page';

export const metadata = { title: 'Chi tiết buổi học' };

export default async function Page(props: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{
    date?: string | string[];
    enrollmentId?: string | string[];
    makeupPlacementId?: string | string[];
  }>;
}) {
  const { sessionId } = await props.params;
  const query = await props.searchParams;
  const parsed = z
    .object({
      sessionId: z.uuid(),
      date: z.iso.date(),
      enrollmentId: z.uuid(),
      makeupPlacementId: z.uuid().optional(),
    })
    .safeParse({
      sessionId,
      date: query.date,
      enrollmentId: query.enrollmentId,
      makeupPlacementId: query.makeupPlacementId,
    });
  if (!parsed.success) notFound();
  return <StudentSessionPage {...parsed.data} />;
}
