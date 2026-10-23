import { AdminOnlyAccess } from '@/features/admin/components/admin-access';
import { AdminTrackingPage } from '@/features/admin/components/admin-tracking-page';

export default function TrackingPage() {
  return (
    <AdminOnlyAccess>
      <AdminTrackingPage />
    </AdminOnlyAccess>
  );
}
