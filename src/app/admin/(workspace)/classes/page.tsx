import type { Metadata } from 'next';
import { AdminResourcePage } from '@/features/admin/components/admin-resource-page';

export const metadata: Metadata = { title: 'Lớp học' };
export default function AdminClassesPage() {
  return <AdminResourcePage key="classes" resource="classes" />;
}
