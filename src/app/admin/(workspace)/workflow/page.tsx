import type { Metadata } from 'next';
import { AdminWorkflow } from '@/features/admin/components/admin-workflow';

export const metadata: Metadata = { title: 'Quy trình vận hành' };
export default function AdminWorkflowPage() {
  return <AdminWorkflow />;
}
