import { Icon } from './icon';

export function ActionLink(props: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={props.href}
      className="inline-flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-canvas/25 bg-action py-2 pr-2 pl-4 text-base font-extrabold text-canvas shadow-lg shadow-forest/20 transition-all hover:bg-action-hover hover:shadow-xl hover:shadow-forest/25 motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none sm:gap-5 sm:pl-6 sm:text-lg"
    >
      {props.children}
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-canvas/25">
        <Icon name="arrow" />
      </span>
    </a>
  );
}
