import { AdminOnlyAccess } from '@/features/admin/components/admin-access';
import { AdminSystemRulesPage } from '@/features/admin/components/admin-system-rules-page';

export default function SettingsPage() {
  return (
    <AdminOnlyAccess>
      <AdminSystemRulesPage />
    </AdminOnlyAccess>
  );
}
