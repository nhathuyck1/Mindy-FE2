import type { Metadata } from 'next';
import { AdminResourcePage } from '@/features/admin/components/admin-resource-page';

export const metadata: Metadata = { title: 'Người dùng' };
export default function AdminUsersPage() {
  return <AdminResourcePage key="users" resource="users" />;
}
