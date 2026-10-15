'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Icon } from '@/components/ui/icon';

export function CourseImage(props: {
  src: string | null;
  title: string;
  sizes: string;
  preload?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const allowed =
    props.src &&
    new URL(props.src).protocol === 'https:' &&
    new URL(props.src).hostname === 'images.unsplash.com';
  return allowed && failedSrc !== props.src ? (
    <Image
      src={props.src!}
      alt={props.title}
      fill
      sizes={props.sizes}
      preload={props.preload}
      className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
      onError={() => setFailedSrc(props.src)}
    />
  ) : (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-canvas text-mint">
      <Icon name="code" className="size-12" />
      <span className="text-xs font-extrabold tracking-widest uppercase">Mindy Coding</span>
    </div>
  );
}
