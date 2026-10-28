import { AdminOnlyAccess } from '@/features/admin/components/admin-access';
import { AdminReconciliationPage } from '@/features/admin/components/admin-reconciliation-page';

export default function ReconciliationPage() {
  return (
    <AdminOnlyAccess>
      <AdminReconciliationPage />
    </AdminOnlyAccess>
  );
}
