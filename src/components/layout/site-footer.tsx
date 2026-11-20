import { Brand } from '@/components/ui/brand';
import { FacebookIcon } from '@/components/ui/facebook-icon';
import { Mail, MapPin, Phone } from 'lucide-react';
import { appConfig } from '@/utils/app-config';
import { mindyContact } from '@/utils/mindy-contact';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-soft pt-12 pb-40 sm:pb-28 lg:pt-16">
      <div className="page-container grid gap-10 text-sm md:grid-cols-[1fr_1fr] lg:grid-cols-[1.1fr_0.9fr_1.3fr]">
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
        <section
          aria-labelledby="footer-contact-title"
          className="min-w-0 md:col-span-2 lg:col-span-1 lg:pt-3"
        >
          <h2 id="footer-contact-title" className="font-extrabold">
            Thông tin liên hệ
          </h2>
          <address className="mt-3 flex flex-col items-start gap-1 not-italic">
            <a
              href={mindyContact.mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link min-h-11 items-start py-2"
              aria-label={`Địa chỉ: ${mindyContact.address} (mở bản đồ trong tab mới)`}
            >
              <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <span>{mindyContact.address}</span>
            </a>
            <a href={mindyContact.phoneHref} className="text-link min-h-11">
              <Phone aria-hidden="true" className="size-5 shrink-0" />
              {mindyContact.phone}
            </a>
            <a href={`mailto:${mindyContact.email}`} className="text-link min-h-11">
              <Mail aria-hidden="true" className="size-5 shrink-0" />
              <span className="break-all">{mindyContact.email}</span>
            </a>
            <a
              href={mindyContact.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link min-h-11"
              aria-label="MinDy Coding trên Facebook (mở trong tab mới)"
            >
              <FacebookIcon className="size-5 shrink-0" />
              MinDy Coding
            </a>
          </address>
        </section>
      </div>
    </footer>
  );
}
