import { Suspense } from 'react';
import { ManagerLeaveRequestsPage } from '@/features/manager/components/manager-leave-requests-page';

export default function ManagerLeaveRequestsRoute() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8 text-muted">
          Đang tải bộ lọc…
        </p>
      }
    >
      <ManagerLeaveRequestsPage />
    </Suspense>
  );
}
