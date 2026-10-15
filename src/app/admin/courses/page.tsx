import type { Metadata } from 'next';
import { AdminResourcePage } from '@/features/admin/components/admin-resource-page';

export const metadata: Metadata = { title: 'Khóa học' };
export default function AdminCoursesPage() {
  return <AdminResourcePage key="courses" resource="courses" />;
}
