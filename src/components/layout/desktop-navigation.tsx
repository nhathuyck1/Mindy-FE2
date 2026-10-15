'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appConfig } from '@/utils/app-config';

export function DesktopNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Điều hướng chính" className="hidden items-stretch self-stretch lg:flex">
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
            className={`inline-flex items-center justify-center px-3 text-[15px] font-black whitespace-nowrap transition-colors hover:bg-soft hover:text-mint focus-visible:-outline-offset-4 xl:px-5 xl:text-base ${active ? 'bg-soft text-mint' : 'text-forest'}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
