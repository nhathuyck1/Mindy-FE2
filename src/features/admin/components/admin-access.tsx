'use client';

import { Button } from '@/components/ui/button';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brand } from '@/components/ui/brand';
import { Icon } from '@/components/ui/icon';
import { useSession } from '@/features/auth/api/auth-queries';

export function AdminAccess(props: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  if (session.data?.role === 'ADMIN' && session.data.status === 'ACTIVE' && !session.isError)
    return props.children;
  const loading = session.isPending;
  const denied = Boolean(session.data);
  return (
    <main className="admin-typography grid min-h-dvh place-items-center bg-soft p-5">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-canvas p-7 sm:p-10">
        <Brand />
        <div className="mt-10 mb-5 grid size-14 place-items-center rounded-2xl bg-soft text-mint">
          <Icon name="shield" className="size-7" />
        </div>
        <p className="eyebrow text-mint">Mindy Admin</p>
        <h1 className="mt-3 text-3xl font-extrabold">
          {loading
            ? 'Đang kiểm tra phiên đăng nhập…'
            : session.isError
              ? 'Chưa thể kiểm tra tài khoản'
              : denied
                ? 'Tài khoản chưa có quyền quản trị'
                : 'Đăng nhập để vào trang quản trị'}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted" role="status">
          {loading
            ? 'Vui lòng chờ trong giây lát.'
            : session.isError
              ? 'Kết nối hiện chưa sẵn sàng. Vui lòng thử lại.'
              : denied
                ? 'Khu vực này dành cho tài khoản ADMIN đang hoạt động.'
                : 'Dùng tài khoản quản trị của bạn để quản lý người dùng, khóa học và lớp học.'}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {session.isError ? (
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              className="admin-button admin-button-primary"
              onClick={() => session.refetch()}
            >
              Thử lại
            </Button>
          ) : (
            !loading &&
            !denied && (
              <Link
                href={`/login?returnTo=${encodeURIComponent(pathname)}`}
                className="admin-button admin-button-primary"
              >
                Đăng nhập <Icon name="arrow" className="size-4" />
              </Link>
            )
          )}
          <Link href="/" className="admin-button">
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
