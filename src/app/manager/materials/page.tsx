import { Suspense } from 'react';
import { LoadingOverlay } from '@/components/ui/spinner';
import { ManagerMaterialsPage } from '@/features/manager/components/manager-materials-page';
export default function MaterialsPage() {
  return (
    <Suspense fallback={<LoadingOverlay scope="page" label="Đang mở kho tài liệu…" />}>
      <ManagerMaterialsPage />
    </Suspense>
  );
}
