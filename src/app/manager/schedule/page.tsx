import type { Metadata } from 'next';
import { z } from 'zod';
import { ManagerSchedulePage } from '@/features/manager/components/manager-schedule-page';

export const metadata: Metadata = { title: 'Lịch và khai giảng' };

export default async function Page(props: {
  searchParams: Promise<{ classId?: string | string[] }>;
}) {
  const params = await props.searchParams;
  const classId = z.uuidv4().safeParse(params.classId);
  return <ManagerSchedulePage initialClassId={classId.success ? classId.data : undefined} />;
}
