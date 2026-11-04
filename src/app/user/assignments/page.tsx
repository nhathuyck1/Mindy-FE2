import type { Metadata } from 'next';
import { StudentAssignmentsPage } from '@/features/code-assignments/components/student-assignments-page';

export const metadata: Metadata = { title: 'Bài tập lập trình' };
export default function Page() {
  return <StudentAssignmentsPage />;
}
