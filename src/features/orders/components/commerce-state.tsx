'use client';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RedirectHome } from '@/features/auth/components/auth-guard';
import { ApiError } from '@/lib/api/client';

export function CommerceLoading() {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">Đang tải…</span>
      <Skeleton className="h-12 w-2/3 bg-soft" />
      <Skeleton className="h-64 w-full bg-soft" />
    </div>
  );
}

export function CommerceError(props: { error: unknown; retry?: () => void }) {
  const status = props.error instanceof ApiError ? props.error.status : undefined;
  if (status === 401 || status === 403) return <RedirectHome />;
  const message =
    status === 404
      ? 'Không tìm thấy giỏ hàng hoặc đơn hàng này.'
      : props.error instanceof ApiError && props.error.code === 'PAYMENT_UNAVAILABLE'
        ? 'Thanh toán đang tạm gián đoạn. Bạn có thể thử lại trên đơn này.'
        : props.error instanceof ApiError
          ? props.error.message
          : 'Chưa thể kết nối hệ thống. Vui lòng thử lại.';
  return (
    <Alert className="border-coral/40 bg-peach" role="alert">
      <AlertTitle>Chưa thể hoàn tất yêu cầu</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {props.retry && status !== 404 ? (
          <Button variant="outline" className="mt-2 min-h-11" onClick={props.retry}>
            Thử lại
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
