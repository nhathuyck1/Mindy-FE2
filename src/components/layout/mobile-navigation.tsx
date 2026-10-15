'use client';

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { closeMobileNavigation, toggleMobileNavigation } from '@/lib/store/ui-slice';
import { appConfig } from '@/utils/app-config';
import { Icon } from '@/components/ui/icon';

export function MobileNavigation() {
  const open = useAppSelector((state) => state.ui.mobileNavigationOpen);
  const dispatch = useAppDispatch();
  return (
    <div
      className="lg:hidden"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          dispatch(closeMobileNavigation());
          event.currentTarget.querySelector('button')?.focus();
        }
      }}
    >
      <button
        type="button"
        aria-label={open ? 'Đóng trình đơn' : 'Mở trình đơn'}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => dispatch(toggleMobileNavigation())}
        className="grid size-12 cursor-pointer place-items-center rounded-xl border border-line bg-canvas"
      >
        <Icon name={open ? 'close' : 'menu'} />
      </button>
      <nav
        id="mobile-navigation"
        aria-label="Điều hướng di động"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-canvas px-5 py-4 shadow-lg shadow-forest/5"
      >
        {appConfig.navigation.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => dispatch(closeMobileNavigation())}
            className="flex min-h-12 items-center rounded-xl px-4 font-bold hover:bg-soft"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
