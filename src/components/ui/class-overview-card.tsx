import type { ReactNode } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, MapPin, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export const classOverviewGrid = 'grid gap-5 md:grid-cols-2 xl:grid-cols-3';

export function ClassOverviewCard(props: {
  href?: string;
  code: string;
  title: string;
  subtitle: string;
  status: ReactNode;
  dates: string;
  online: boolean;
  delivery: string;
  footer: ReactNode;
}) {
  const DeliveryIcon = props.online ? Video : MapPin;
  const className =
    'flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-canvas';
  const content = (
    <>
      <div className="flex items-center justify-between gap-3 bg-soft/70 px-5 py-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-canvas text-mint">
          <BookOpen aria-hidden="true" className="size-6" />
        </span>
        {props.status}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold break-words text-muted">{props.subtitle}</p>
        <p className="mt-4 text-xs font-bold tracking-wide text-mint">{props.code}</p>
        <h2 className="mt-2 text-lg leading-7 font-extrabold break-words">{props.title}</h2>
        <p className="mt-5 flex items-start gap-2 text-sm text-muted">
          <CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mint" />
          <span>{props.dates}</span>
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <DeliveryIcon aria-hidden="true" className="size-4 shrink-0 text-mint" />
          {props.delivery}
        </p>
      </div>
      <div className="mx-5 flex flex-wrap items-center gap-3 border-t border-line py-4 text-sm">
        {props.footer}
      </div>
    </>
  );
  return props.href ? (
    <Link
      href={props.href}
      className={cn(
        className,
        'group transition-colors hover:border-mint hover:bg-soft/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint',
      )}
    >
      {content}
    </Link>
  ) : (
    <article className={className}>{content}</article>
  );
}
