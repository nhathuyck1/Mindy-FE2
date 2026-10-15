'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appConfig } from '@/utils/app-config';

export function DesktopNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Điều hướng chính" className="hidden items-center gap-5 lg:flex">
      {appConfig.navigation.map((item) => {
        const active =
          item.href === '/courses'
            ? pathname.startsWith('/courses')
            : item.href === '/' && pathname === '/';
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`text-link rounded-lg px-2 text-[13px] ${active ? 'bg-soft text-mint' : ''}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
