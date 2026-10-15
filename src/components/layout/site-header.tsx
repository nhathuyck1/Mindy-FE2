import { Brand } from '@/components/ui/brand';
import { DesktopNavigation } from './desktop-navigation';
import { MobileNavigation } from './mobile-navigation';
import { SessionControls } from '@/features/auth/components/session-controls';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-lg">
      <div className="page-container relative flex min-h-22 items-center justify-between gap-5">
        <Brand />
        <DesktopNavigation />
        <div className="flex items-center gap-3">
          <SessionControls />
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
