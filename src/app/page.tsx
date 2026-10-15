import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { HomeContent } from '@/features/home/components/home-content';

export default function HomePage() {
  return (
    <>
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-50 -translate-y-24 rounded-xl bg-forest px-5 py-3 font-bold text-canvas focus:translate-y-0"
      >
        Đến nội dung chính
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <HomeContent />
      </main>
      <SiteFooter />
    </>
  );
}
