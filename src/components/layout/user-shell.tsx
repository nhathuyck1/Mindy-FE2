'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { Brand } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { SessionControls } from '@/features/auth/components/session-controls';
import { userNavigation } from '@/features/user/lib/user-navigation';

function UserNavigation(props: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Điều hướng tài khoản" className="flex flex-1 flex-col gap-1 px-3 py-7">
      {userNavigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={props.onNavigate}
          aria-label={item.label}
          title={props.collapsed ? item.label : undefined}
          aria-current={
            pathname === item.href || pathname.startsWith(item.href + '/') ? 'page' : undefined
          }
          className={
            'user-nav-link ' +
            (pathname === item.href || pathname.startsWith(item.href + '/')
              ? 'user-nav-active '
              : '') +
            (props.collapsed ? 'justify-center px-0' : '')
          }
        >
          <item.icon aria-hidden="true" className="size-[19px] shrink-0" />
          {!props.collapsed && <span>{item.label}</span>}
        </Link>
      ))}
      <div className="mx-3 my-5 border-t border-line" />
      <Link
        href="/"
        aria-label="Về trang chủ"
        title={props.collapsed ? 'Về trang chủ' : undefined}
        onClick={props.onNavigate}
        className={'user-nav-link mt-auto ' + (props.collapsed ? 'justify-center px-0' : '')}
      >
        <ArrowUpRight aria-hidden="true" className="size-[19px] shrink-0" />
        {!props.collapsed && <span>Về trang chủ</span>}
      </Link>
    </nav>
  );
}
function MobileUserNavigation(props: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label="Menu tài khoản"
      onCancel={(event) => {
        event.preventDefault();
        props.onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-72 max-w-[calc(100%-2rem)] border-0 border-r border-line bg-canvas p-0 text-black shadow-xl backdrop:bg-forest/50"
    >
      <div className="flex min-h-dvh flex-col">
        <div className="flex min-h-23 items-center justify-between gap-2 border-b border-line px-4">
          <Brand />
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={props.onClose}
            aria-label="Đóng menu tài khoản"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <UserNavigation onNavigate={props.onClose} />
      </div>
    </dialog>
  );
}
export function UserShell(props: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const title =
    userNavigation.find((item) => item.href === pathname || pathname.startsWith(item.href + '/'))
      ?.label ?? 'Tài khoản';
  return (
    <AuthGuard role="STUDENT">
      <div className={'user-workspace ' + (collapsed ? 'user-workspace-collapsed' : '')}>
        <a
          href="#user-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-canvas focus:p-3"
        >
          Đến nội dung chính
        </a>
        <aside className="user-sidebar" aria-label="Thanh điều hướng tài khoản">
          <div
            className={
              'flex h-23 items-center border-b border-line ' +
              (collapsed ? 'justify-center' : 'justify-between px-5')
            }
          >
            {!collapsed && <Brand />}
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <PanelLeftOpen aria-hidden="true" />
              ) : (
                <PanelLeftClose aria-hidden="true" />
              )}
            </Button>
          </div>
          <UserNavigation collapsed={collapsed} />
          {!collapsed && (
            <div className="m-4 mt-0 rounded-xl border border-line bg-soft p-4">
              <p className="text-sm font-extrabold text-forest">Mindy Coding</p>
              <p className="mt-2 text-sm leading-relaxed">Học hỏi mỗi ngày, tiến bộ từng bước.</p>
            </div>
          )}
        </aside>
        <div className="min-w-0">
          <header className="user-topbar">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon-lg"
                className="shrink-0 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Mở menu tài khoản"
                aria-expanded={mobileOpen}
              >
                <Menu aria-hidden="true" />
              </Button>
              <p className="min-w-0 text-sm sm:text-base">
                <span className="hidden text-muted xl:inline">
                  Tài khoản của tôi <span className="mx-3 text-line">/</span>
                </span>
                <span className="font-extrabold">{title}</span>
              </p>
            </div>
            <SessionControls />
          </header>
          <main id="user-main" tabIndex={-1} className="user-main">
            {props.children}
          </main>
          <footer className="px-4 py-5 text-sm text-muted sm:px-8">
            Mindy Coding · Học hỏi. Kết nối. Trưởng thành.
          </footer>
        </div>
        {mobileOpen && <MobileUserNavigation onClose={() => setMobileOpen(false)} />}
      </div>
    </AuthGuard>
  );
}
