'use client';

import { Button } from '@/components/ui/button';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Brand } from '@/components/ui/brand';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import { SessionControls } from '@/features/auth/components/session-controls';
import { AdminAccess } from '@/features/admin/components/admin-access';

const navigation = [
  { href: '/admin', label: 'Tổng quan', icon: 'grid' },
  { href: '/admin/users', label: 'Người dùng', icon: 'users' },
  { href: '/admin/courses', label: 'Khóa học', icon: 'book' },
  { href: '/admin/classes', label: 'Lớp học', icon: 'calendar' },
] as const;

function isNavActive(pathname: string, href: string) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
}

function AdminNavigation(props: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Điều hướng quản trị" className="flex flex-1 flex-col gap-1 px-3 py-7">
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={props.onNavigate}
          title={props.collapsed ? item.label : undefined}
          aria-label={item.label}
          aria-current={pathname === item.href ? 'page' : undefined}
          className={`admin-nav-link ${isNavActive(pathname, item.href) ? 'admin-nav-active' : ''} ${props.collapsed ? 'justify-center px-0' : ''}`}
        >
          <Icon name={item.icon} className="size-[19px] shrink-0" />
          {!props.collapsed && <span>{item.label}</span>}
        </Link>
      ))}
      <div className="mx-3 my-5 border-t border-line" />
      <Link
        href="/admin/workflow"
        onClick={props.onNavigate}
        aria-label="Quy trình vận hành"
        aria-current={pathname === '/admin/workflow' ? 'page' : undefined}
        className={`admin-nav-link ${pathname === '/admin/workflow' ? 'admin-nav-active' : ''} ${props.collapsed ? 'justify-center px-0' : ''}`}
        title={props.collapsed ? 'Quy trình vận hành' : undefined}
      >
        <Icon name="layers" className="size-[19px] shrink-0" />
        {!props.collapsed && <span>Quy trình vận hành</span>}
      </Link>
      <Link
        href="/"
        onClick={props.onNavigate}
        aria-label="Xem website"
        title={props.collapsed ? 'Xem website' : undefined}
        className={`admin-nav-link mt-auto ${props.collapsed ? 'justify-center px-0' : ''}`}
      >
        <Icon name="monitor" className="size-[19px] shrink-0" />
        {!props.collapsed && (
          <span>
            Xem website <span aria-hidden="true">↗</span>
          </span>
        )}
      </Link>
    </nav>
  );
}

export function AdminShell(props: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const title =
    navigation.find((item) => isNavActive(pathname, item.href))?.label ?? 'Quy trình vận hành';
  const closeMobile = () => {
    setMobileOpen(false);
  };
  return (
    <AdminAccess>
      <div className={`admin-workspace ${collapsed ? 'admin-workspace-collapsed' : ''}`}>
        <a
          href="#admin-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-canvas focus:p-3"
        >
          Đến nội dung chính
        </a>
        <aside className="admin-sidebar">
          <div
            className={`flex h-23 items-center border-b border-line ${collapsed ? 'justify-center' : 'justify-between px-5'}`}
          >
            {!collapsed && <Brand />}
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="admin-icon-button"
              aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
              aria-expanded={!collapsed}
            >
              <Icon name="panel" className="size-[18px]" />
            </Button>
          </div>
          <AdminNavigation collapsed={collapsed} />
          {!collapsed && (
            <div className="m-4 mt-0 rounded-xl border border-line bg-canvas p-4">
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <Icon name="shield" className="size-4 text-mint" />
                Mindy Admin
              </div>
              <p className="mt-2 text-[15px] leading-5 text-muted">
                Một không gian cho mọi hoạt động đào tạo.
              </p>
            </div>
          )}
        </aside>
        <div className="min-w-0">
          <header className="admin-topbar">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="unstyled"
                size="unstyled"
                type="button"
                className="admin-icon-button lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Mở menu quản trị"
                aria-expanded={mobileOpen}
              >
                <Icon name="menu" className="size-5" />
              </Button>
              <p className="flex items-center gap-3 text-base">
                <span className="hidden text-muted sm:inline">Không gian quản trị</span>
                <span className="hidden text-line sm:inline">/</span>
                <span className="font-extrabold">{title}</span>
              </p>
            </div>
            <SessionControls />
          </header>
          <main id="admin-main" tabIndex={-1} className="admin-main">
            {props.children}
          </main>
          <footer className="flex flex-wrap items-center justify-between gap-2 px-5 py-5 text-[15px] text-muted sm:px-8">
            <span>Mindy Coding · Không gian quản trị</span>
            <span>Đào tạo hôm nay, mở lối ngày mai.</span>
          </footer>
        </div>
      </div>
      {mobileOpen && (
        <Modal title="Mindy Admin" sheet onClose={closeMobile}>
          <div className="flex min-h-[calc(100dvh-90px)] flex-col">
            <AdminNavigation onNavigate={closeMobile} />
          </div>
        </Modal>
      )}
    </AdminAccess>
  );
}
