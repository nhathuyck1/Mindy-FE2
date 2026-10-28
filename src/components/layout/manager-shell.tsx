'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  FolderOpen,
  CalendarOff,
  Wallet,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
} from 'lucide-react';
import { Brand } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { LoadingOverlay } from '@/components/ui/spinner';
import { useSession } from '@/features/auth/api/auth-queries';
import { SessionControls } from '@/features/auth/components/session-controls';

const navigation = [
  { href: '/manager', title: 'Tổng quan', icon: LayoutDashboard },
  { href: '/manager/materials', title: 'Quản lý tài liệu', icon: FolderOpen },
  { href: '/manager/leave-requests', title: 'Đơn xin nghỉ', icon: CalendarOff },
  { href: '/manager/collections', title: 'Thu tiền', icon: Wallet },
];
function ManagerAccess(props: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  if (session.isPending)
    return <LoadingOverlay scope="page" label="Đang kiểm tra phiên đăng nhập…" />;
  if (!session.isError && session.data?.role === 'MANAGER' && session.data.status === 'ACTIVE')
    return <div key={session.data.id}>{props.children}</div>;
  return (
    <main className="grid min-h-dvh place-items-center bg-soft p-5">
      <section className="w-full max-w-lg space-y-5 rounded-3xl border border-line bg-canvas p-8">
        <Brand />
        <h1 className="text-3xl font-extrabold">
          {session.isError
            ? 'Chưa thể kiểm tra tài khoản'
            : session.data
              ? 'Tài khoản chưa có quyền Manager'
              : 'Đăng nhập để vào trang Manager'}
        </h1>
        <p role="status" className="text-muted">
          Khu vực quản lý tài liệu dành cho tài khoản MANAGER đang hoạt động.
        </p>
        <div className="flex flex-wrap gap-3">
          {session.isError ? (
            <Button onClick={() => session.refetch()}>Thử lại</Button>
          ) : (
            !session.data && (
              <Button asChild>
                <Link href={`/admin/login?returnTo=${encodeURIComponent(pathname)}`}>
                  Đăng nhập
                </Link>
              </Button>
            )
          )}
          <Button asChild variant="outline">
            <Link href="/">Về trang chủ</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
export function ManagerShell(props: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const path = usePathname();
  const links = (compact = false) => (
    <nav aria-label="Điều hướng Manager" className="flex flex-1 flex-col gap-2 p-3">
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobile(false)}
          aria-current={
            (item.href === '/manager' ? path === item.href : path.startsWith(item.href))
              ? 'page'
              : undefined
          }
          title={item.title}
          className={`admin-nav-link ${compact ? 'justify-center px-0' : ''} ${(item.href === '/manager' ? path === item.href : path.startsWith(item.href)) ? 'admin-nav-active' : ''}`}
        >
          <item.icon className="size-5 shrink-0" />
          {!compact && item.title}
        </Link>
      ))}
    </nav>
  );
  return (
    <ManagerAccess>
      <div className={`admin-workspace ${collapsed ? 'admin-workspace-collapsed' : ''}`}>
        <a
          href="#manager-main"
          className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-canvas focus:p-4"
        >
          Đến nội dung chính
        </a>
        <aside className="admin-sidebar">
          <div className="flex h-23 items-center justify-between border-b border-line px-4">
            {!collapsed && <Brand />}
            <Button
              variant="ghost"
              size="icon"
              aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          </div>
          <p
            className={`px-5 pt-6 pb-2 text-xs font-bold tracking-wider text-muted uppercase ${collapsed ? 'sr-only' : ''}`}
          >
            Không gian nhân viên
          </p>
          {links(collapsed)}
        </aside>
        <div className="min-w-0">
          <header className="admin-topbar">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Mở menu Manager"
                onClick={() => setMobile(true)}
              >
                <Menu />
              </Button>
              <span className="font-bold">Không gian Manager</span>
            </div>
            <SessionControls />
          </header>
          <main id="manager-main" className="admin-main" tabIndex={-1}>
            {props.children}
          </main>
        </div>
      </div>
      {mobile && (
        <Modal title="Mindy Manager" sheet onClose={() => setMobile(false)}>
          <div className="flex min-h-[70dvh] flex-col">{links()}</div>
        </Modal>
      )}
    </ManagerAccess>
  );
}
