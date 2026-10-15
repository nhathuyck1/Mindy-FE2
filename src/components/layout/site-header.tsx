import { Brand } from '@/components/ui/brand';
import { DesktopNavigation } from './desktop-navigation';
import { MobileNavigation } from './mobile-navigation';
import { SessionControls } from '@/features/auth/components/session-controls';
import { CartLink } from '@/features/cart/components/cart-link';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 shadow-[0_4px_14px_-6px] shadow-forest/15 backdrop-blur-lg">
      <div className="page-container relative flex min-h-22 items-center justify-between gap-1 sm:gap-3 xl:gap-5">
        <Brand />
        <DesktopNavigation />
        <div className="flex items-center gap-1 sm:gap-3">
          <CartLink />
          <SessionControls />
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
