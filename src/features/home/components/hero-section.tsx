import Image from 'next/image';
import { ActionLink } from '@/components/ui/action-link';
import { Icon } from '@/components/ui/icon';

export function HeroSection() {
  return (
    <section className="relative isolate overflow-clip bg-hero text-hero-copy">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[url('/mindy/hero-clouds.webp')] bg-cover bg-bottom opacity-25 mix-blend-luminosity"
      />
      <div className="page-container grid items-center gap-4 pt-12 pb-14 md:grid-cols-[1.1fr_1fr] md:py-16 lg:min-h-170 lg:gap-8">
        <div className="relative z-10">
          <p className="mb-7 flex items-center gap-2.5 text-xs font-bold sm:text-sm">
            <span className="size-2 rounded-full bg-coral" />
            Khởi đầu nhỏ — bứt phá lớn.
          </p>
          <h1 className="max-w-170 text-[clamp(2.65rem,4.7vw,4.35rem)] leading-[1.12] font-extrabold tracking-[-0.045em] text-hero-ink">
            Học lập trình.
            <br />
            Mở thế giới
            <br className="hidden md:block lg:hidden" /> của bạn.
          </h1>
          <p className="mt-7 max-w-110 text-base leading-relaxed sm:text-lg">
            Từ dòng mã nguồn đầu tiên đến điều bạn muốn tạo ra. Khám phá, thực hành và từng bước
            tiến bộ cùng Mindy.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
            <ActionLink href="#khoa-hoc">Khám phá khóa học</ActionLink>
            <a href="#thuc-hanh" className="text-link">
              Thử viết mã nguồn <Icon name="code" className="size-4" />
            </a>
          </div>
          <p className="mt-7 flex items-center gap-2.5 text-xs font-semibold">
            <Icon name="book" className="size-4 shrink-0" />
            Học có lộ trình. Thực hành có không gian.
          </p>
        </div>
        <div className="relative mx-auto w-full max-w-140 pt-6 md:pt-0">
          <Image
            src="/mindy/coding-mascot.png"
            alt="Bạn ếch Mindy đang khám phá lập trình trên laptop"
            width={1280}
            height={1280}
            sizes="(max-width: 767px) 90vw, (max-width: 1280px) 46vw, 560px"
            preload
            className="h-auto w-full drop-shadow-2xl"
          />
          <p className="absolute bottom-[6%] left-[8%] -rotate-4 rounded-xl border border-line bg-canvas px-4 py-3 text-xs font-bold shadow-lg shadow-forest/5 sm:text-sm">
            Cứ thử. Bạn sẽ làm được.
          </p>
        </div>
      </div>
    </section>
  );
}
