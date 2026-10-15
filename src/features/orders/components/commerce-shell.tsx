import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export function CommerceShell(props: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-50 -translate-y-24 rounded-xl bg-forest px-5 py-3 font-bold text-canvas focus:translate-y-0"
      >
        Đến nội dung chính
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="min-h-[65vh] bg-soft/50 py-10 sm:py-14">
        <div className="page-container">{props.children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
