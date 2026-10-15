'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/features/auth/api/auth-queries';
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

export function CommerceError(props: { error: unknown; retry?: () => void; returnTo: string }) {
  const status = props.error instanceof ApiError ? props.error.status : undefined;
  const message =
    status === 401
      ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập để tiếp tục.'
      : status === 403
        ? 'Bạn không có quyền xem hoặc thanh toán đơn hàng này.'
        : status === 404
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
        {status === 401 ? (
          <Button asChild className="mt-2 min-h-11">
            <Link href={`/login?returnTo=${encodeURIComponent(props.returnTo)}`}>
              Đăng nhập lại
            </Link>
          </Button>
        ) : props.retry && status !== 403 && status !== 404 ? (
          <Button variant="outline" className="mt-2 min-h-11" onClick={props.retry}>
            Thử lại
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export function StudentGate(props: { returnTo: string; children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session.isSuccess && !session.data)
      router.replace(`/login?returnTo=${encodeURIComponent(props.returnTo)}`);
  }, [session.isSuccess, session.data, router, props.returnTo]);
  if (session.isError)
    return (
      <CommerceError
        error={session.error}
        retry={() => void session.refetch()}
        returnTo={props.returnTo}
      />
    );
  if (!session.data) return <CommerceLoading />;
  if (session.data.role !== 'STUDENT')
    return (
      <Alert>
        <AlertTitle>Dành cho học viên</AlertTitle>
        <AlertDescription>
          Vui lòng sử dụng tài khoản học viên để đăng ký và thanh toán lớp học.
        </AlertDescription>
      </Alert>
    );
  return props.children;
}
