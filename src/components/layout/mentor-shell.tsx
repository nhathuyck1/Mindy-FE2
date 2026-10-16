'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  CalendarDays,
  GraduationCap,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
} from 'lucide-react';
import { Brand } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { LoadingOverlay } from '@/components/ui/spinner';
import { useSession } from '@/features/auth/api/auth-queries';
import { SessionControls } from '@/features/auth/components/session-controls';

const navigation = [
  { href: '/mentor', title: 'Lịch dạy', icon: CalendarDays },
  { href: '/mentor/classes', title: 'Lớp của tôi', icon: GraduationCap },
];
function MentorAccess(props: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  if (session.isPending)
    return <LoadingOverlay scope="page" label="Đang kiểm tra phiên đăng nhập…" />;
  if (!session.isError && session.data?.role === 'MENTOR' && session.data.status === 'ACTIVE')
    return props.children;
  return (
    <main className="grid min-h-dvh place-items-center bg-soft p-5">
      <section className="w-full max-w-lg space-y-5 rounded-3xl border border-line bg-canvas p-8">
        <Brand />
        <h1 className="text-3xl font-extrabold">
          {session.isError
            ? 'Chưa thể kiểm tra tài khoản'
            : session.data
              ? 'Tài khoản chưa có quyền Mentor'
              : 'Đăng nhập để vào trang Mentor'}
        </h1>
        <p role="status" className="text-muted">
          Khu vực giảng dạy dành cho tài khoản MENTOR đang hoạt động.
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
export function MentorShell(props: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const path = usePathname();
  const links = (compact = false) => (
    <nav aria-label="Điều hướng Mentor" className="flex flex-1 flex-col gap-2 p-3">
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobile(false)}
          aria-current={
            (item.href === '/mentor' ? path === item.href : path.startsWith(item.href))
              ? 'page'
              : undefined
          }
          title={item.title}
          className={`admin-nav-link ${compact ? 'justify-center px-0' : ''} ${(item.href === '/mentor' ? path === item.href : path.startsWith(item.href)) ? 'admin-nav-active' : ''}`}
        >
          <item.icon className="size-5 shrink-0" />
          {!compact && item.title}
        </Link>
      ))}
      <Link href="/" className="admin-nav-link mt-auto" title="Xem website">
        <Globe className="size-5 shrink-0" />
        {!compact && 'Xem website'}
      </Link>
    </nav>
  );
  return (
    <MentorAccess>
      <div className={`admin-workspace ${collapsed ? 'admin-workspace-collapsed' : ''}`}>
        <a
          href="#mentor-main"
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
            Không gian giảng dạy
          </p>
          {links(collapsed)}
          {!collapsed && (
            <div className="m-4 rounded-2xl bg-soft p-4">
              <GraduationCap className="mb-2 size-6 text-mint" />
              <p className="font-bold">Mindy Mentor</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Đồng hành cùng từng bước tiến của học viên.
              </p>
            </div>
          )}
        </aside>
        <div className="min-w-0">
          <header className="admin-topbar">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Mở menu Mentor"
                onClick={() => setMobile(true)}
              >
                <Menu />
              </Button>
              <span className="font-bold">Không gian Mentor</span>
            </div>
            <SessionControls />
          </header>
          <main id="mentor-main" className="admin-main" tabIndex={-1}>
            {props.children}
          </main>
        </div>
      </div>
      {mobile && (
        <Modal title="Mindy Mentor" sheet onClose={() => setMobile(false)}>
          <div className="flex min-h-[70dvh] flex-col">{links()}</div>
        </Modal>
      )}
    </MentorAccess>
  );
}
