import { z } from 'zod';
import { ManagerLeaveDetailPage } from '@/features/manager/components/manager-leave-detail-page';

export default async function ManagerLeaveRequestRoute(props: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await props.params;
  if (!z.uuid().safeParse(requestId).success)
    return (
      <p role="alert" className="rounded-xl border border-line bg-canvas p-6">
        Đường dẫn đơn xin nghỉ không hợp lệ.
      </p>
    );
  return <ManagerLeaveDetailPage requestId={requestId} />;
}
