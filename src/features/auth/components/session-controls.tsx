'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { useLogout, useSession } from '../api/auth-queries';

export function SessionControls() {
  const session = useSession();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (session.data)
    return (
      <div
        ref={containerRef}
        className="relative shrink-0"
        onBlur={(event) => {
          if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget))
            setOpen(false);
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-label={`Tài khoản của ${session.data.displayName}`}
          aria-expanded={open}
          aria-controls={dropdownId}
          onClick={() => setOpen(!open)}
          className={`inline-flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border p-1.5 text-left transition-colors sm:pr-4 ${open ? 'border-mint bg-soft shadow-sm' : 'border-line bg-canvas hover:border-mint hover:bg-soft'}`}
        >
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-sm font-extrabold text-canvas"
          >
            {session.data.displayName
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => Array.from(part)[0])
              .join('')
              .toLocaleUpperCase('vi') || 'M'}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block text-[11px] font-semibold text-muted">Tài khoản của bạn</span>
            <span className="block max-w-32 truncate text-base font-extrabold text-forest">
              {session.data.displayName}
            </span>
          </span>
          <Icon
            name="chevron"
            className={`hidden size-4 shrink-0 text-mint motion-safe:transition-transform sm:block ${open ? '-rotate-90' : 'rotate-90'}`}
          />
        </button>
        {open && (
          <div
            id={dropdownId}
            role="region"
            aria-label="Thông tin tài khoản"
            className="absolute right-0 top-full z-50 mt-3 w-72 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-line bg-canvas p-2 shadow-xl shadow-forest/15 max-sm:-right-15"
          >
            <div className="rounded-xl bg-soft px-4 py-4">
              <p className="mb-2 text-[11px] font-extrabold tracking-wider text-mint uppercase">
                Tài khoản Mindy
              </p>
              <p className="text-base font-extrabold break-words text-foreground">
                {session.data.displayName}
              </p>
              <p className="mt-1 text-sm break-all text-muted">{session.data.email}</p>
            </div>
            <div className="mx-2 my-2 border-t border-line" />
            {session.data.role === 'ADMIN' && session.data.status === 'ACTIVE' && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-extrabold hover:bg-soft"
              >
                <Icon name="shield" className="size-5 text-mint" /> Trang quản trị
              </Link>
            )}
            <button
              type="button"
              className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-4 text-sm font-extrabold text-forest transition-colors hover:bg-peach disabled:cursor-wait disabled:opacity-50"
              disabled={logout.isPending}
              onClick={() => logout.mutate(undefined, { onSuccess: () => setOpen(false) })}
            >
              <Icon name="logout" className="size-5 text-mint" />
              {logout.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
            </button>
            {logout.isError && (
              <p
                role="alert"
                className="mx-2 mt-1 mb-2 rounded-xl bg-peach p-3 text-sm text-foreground"
              >
                Chưa thể đăng xuất. Vui lòng thử lại.
              </p>
            )}
          </div>
        )}
      </div>
    );
  return (
    <Link
      href="/login"
      className="inline-flex min-h-11 items-center rounded-xl bg-mint px-4 text-sm font-extrabold text-canvas transition-colors hover:bg-forest"
    >
      Đăng nhập
    </Link>
  );
}
