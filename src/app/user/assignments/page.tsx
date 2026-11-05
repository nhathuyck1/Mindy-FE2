import type { Metadata } from 'next';
import { StudentAssignmentsPage } from '@/features/assignments/components/student-assignments-page';

export const metadata: Metadata = { title: 'Bài tập' };
export default function Page() {
  return <StudentAssignmentsPage />;
}
