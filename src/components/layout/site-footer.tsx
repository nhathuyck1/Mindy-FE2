import { Brand } from '@/components/ui/brand';
import { appConfig } from '@/utils/app-config';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-soft py-12 lg:py-16">
      <div className="page-container grid gap-10 text-sm md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Brand />
          <p className="mt-5 text-muted">Một nơi để học. Một hành trình để lớn.</p>
          <p className="mt-6 text-xs text-muted">© 2026 Trung tâm Mindy</p>
        </div>
        <nav aria-label="Điều hướng cuối trang" className="flex flex-col items-start gap-1">
          {appConfig.navigation.slice(1).map((item) => (
            <a key={item.href} href={item.href} className="text-link">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="md:pt-3">
          <p className="font-extrabold">Học hỏi. Kết nối. Trưởng thành.</p>
          <p className="mt-3 text-muted">Cùng nhau tiến bộ mỗi ngày.</p>
        </div>
      </div>
    </footer>
  );
}
