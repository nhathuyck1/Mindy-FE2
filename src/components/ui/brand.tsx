import Image from 'next/image';
import Link from 'next/link';

export function Brand() {
  return (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center gap-2.5"
      aria-label="Mindy — trang chủ"
    >
      <Image
        src="/brand/mindy-logo.jpg"
        alt=""
        width={52}
        height={52}
        className="size-12 rounded-2xl object-cover"
      />
      <span className="text-2xl leading-none font-black tracking-tight text-forest">
        Mindy
        <span className="mt-1 block text-[10px] font-extrabold tracking-[0.2em] text-mint uppercase">
          Coding
        </span>
      </span>
    </Link>
  );
}
