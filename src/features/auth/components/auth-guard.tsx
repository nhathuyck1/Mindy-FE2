'use client';

import { Fragment, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import type { User } from '@/lib/api/contracts';
import { useSession } from '../api/auth-queries';

export function RedirectHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return <p role="status">Đang chuyển về trang chủ…</p>;
}

export function AuthGuard(props: { children: React.ReactNode; role?: User['role'] }) {
  const session = useSession();
  if (session.isPending) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (session.isError) {
    if (session.error instanceof ApiError && [401, 403].includes(session.error.status))
      return <RedirectHome />;
    return (
      <Alert className="border-coral/40 bg-peach" role="alert">
        <AlertTitle>Chưa thể kiểm tra phiên đăng nhập</AlertTitle>
        <AlertDescription>
          <p>Chưa thể kết nối hệ thống. Vui lòng thử lại.</p>
          <Button
            variant="outline"
            className="mt-2 min-h-11"
            onClick={() => void session.refetch()}
          >
            Thử lại
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (
    !session.data ||
    session.data.status !== 'ACTIVE' ||
    (props.role && session.data.role !== props.role)
  )
    return <RedirectHome />;
  return <Fragment key={session.data.id}>{props.children}</Fragment>;
}
