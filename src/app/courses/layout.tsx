import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export default function CoursesLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-50 -translate-y-24 rounded-xl bg-forest px-5 py-3 font-bold text-canvas focus:translate-y-0"
      >
        Đến nội dung chính
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="min-h-[65vh] bg-canvas pb-12">
        {props.children}
      </main>
      <SiteFooter />
    </>
  );
}
