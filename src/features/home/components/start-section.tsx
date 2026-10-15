'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/icon';

const cards = [
  {
    href: '#khoa-hoc',
    label: 'Khám phá khóa học',
    title: 'Tìm khóa học hợp với bạn.',
    text: 'Bắt đầu từ điều bạn muốn tạo ra. Khám phá các khóa học và chọn chủ đề khiến bạn tò mò.',
    detail:
      'Xem lộ trình, lịch học và giảng viên để tìm một khóa học phù hợp với mục tiêu của bạn.',
    action: 'Xem khóa học',
    image: '/mindy/reading-mascot.png',
  },
  {
    href: '#thuc-hanh',
    label: 'Không gian thực hành',
    title: 'Học bằng cách thử.',
    text: 'Một dòng mã nhỏ có thể mở ra một ý tưởng mới. Dành một chút thời gian để khám phá thế giới lập trình.',
    detail: 'Bắt đầu với ví dụ đầu tiên, quan sát kết quả và hiểu thêm từng chút qua mỗi lần thử.',
    action: 'Khám phá ngay',
    image: '/mindy/coding-mascot.png',
  },
  {
    href: '#hanh-trinh',
    label: 'Hành trình của bạn',
    title: 'Khởi đầu của riêng bạn.',
    text: 'Ai cũng có một điểm xuất phát. Bạn có thể bắt đầu từ những điều cơ bản và đi theo nhịp học của mình.',
    detail: 'Tìm hiểu cách học cùng Mindy và chọn bước đầu tiên cho hành trình bạn muốn theo đuổi.',
    action: 'Cách bắt đầu',
    image: '/mindy/journey-mascot.png',
  },
] as const;

export function StartSection() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = useCallback((index: number) => {
    const slider = sliderRef.current;
    if (!slider) return;
    const nextIndex = (index + cards.length) % cards.length;
    const slide = slider.children.item(nextIndex);
    if (!(slide instanceof HTMLElement)) return;
    slider.scrollTo({
      left: slide.offsetLeft,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      goToSlide(activeIndex + 1);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [activeIndex, goToSlide]);

  function syncActiveSlide() {
    const slider = sliderRef.current;
    if (!slider) return;
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    Array.from(slider.children).forEach((slide, index) => {
      if (!(slide instanceof HTMLElement)) return;
      const distance = Math.abs(slide.offsetLeft - slider.scrollLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setActiveIndex(nearestIndex);
  }

  return (
    <section id="bat-dau" className="page-container py-16 lg:py-24" aria-labelledby="start-title">
      <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <h2 id="start-title" className="section-title">
          Có nhiều cách
          <br />
          để bắt đầu.
        </h2>
        <p className="text-sm leading-relaxed text-muted sm:text-base">
          Một khóa học mới, một ý tưởng nhỏ.
          <br />
          Chọn điều khiến bạn tò mò hôm nay.
        </p>
      </div>
      <div
        id="start-slider"
        ref={sliderRef}
        role="region"
        aria-roledescription="băng chuyền"
        aria-label="Các cách bắt đầu cùng Mindy"
        tabIndex={0}
        onScroll={syncActiveSlide}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            goToSlide(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
          }
        }}
        className="relative flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain pb-5 [scrollbar-width:none] focus-visible:-outline-offset-3 [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, index) => (
          <article
            key={card.href}
            role="group"
            aria-roledescription="trang chiếu"
            aria-label={`${index + 1} / ${cards.length}: ${card.title}`}
            inert={index !== activeIndex}
            className="relative isolate grid w-full shrink-0 snap-start snap-always gap-8 px-6 py-8 before:absolute before:inset-x-0 before:top-16 before:bottom-0 before:-z-10 before:bg-feature sm:px-10 sm:pb-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:px-12 lg:pt-0 lg:pb-12 lg:before:top-20"
          >
            <div className="min-w-0">
              <Image
                src={card.image}
                alt=""
                width={1280}
                height={1280}
                sizes="(max-width: 639px) 144px, 192px"
                className="mb-3 size-36 object-contain sm:size-48"
              />
              <p className="eyebrow mb-3 text-forest">{card.label}</p>
              <h3
                id={`start-card-${index}`}
                className="max-w-100 text-3xl leading-tight font-extrabold tracking-tight lg:text-4xl"
              >
                {card.title}
              </h3>
              <div className="mt-5 max-w-110 space-y-4 text-sm leading-relaxed text-muted sm:text-base">
                <p>{card.text}</p>
                <p>{card.detail}</p>
              </div>
              <a
                href={card.href}
                className="mt-7 inline-flex min-h-12 items-center gap-6 rounded-full border-2 border-forest bg-canvas px-6 py-3 text-sm font-extrabold text-forest shadow-[0_4px_0_0_var(--color-forest)] transition-colors hover:bg-forest hover:text-canvas motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
              >
                {card.action}
                <Icon name="arrow" className="size-4" />
              </a>
            </div>
            <div
              aria-hidden="true"
              className="bg-canvas p-4 shadow-xl shadow-forest/10 sm:p-5 lg:self-stretch"
            >
              <div className="h-full min-h-64 bg-banner sm:min-h-80 lg:min-h-120" />
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-center">
        <div className="flex items-center gap-1">
          {cards.map((card, index) => (
            <button
              key={card.href}
              type="button"
              aria-label={`Xem nội dung ${index + 1}: ${card.title}`}
              aria-controls="start-slider"
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => goToSlide(index)}
              className="grid size-11 place-items-center rounded-full"
            >
              <span
                className={`h-2.5 rounded-full transition-colors ${index === activeIndex ? 'w-7 bg-forest' : 'w-2.5 bg-line hover:bg-mint'}`}
              />
            </button>
          ))}
          <span className="sr-only" aria-live="off" aria-atomic="true">
            Nội dung {activeIndex + 1} trên {cards.length}: {cards[activeIndex].title}
          </span>
        </div>
      </div>
    </section>
  );
}
