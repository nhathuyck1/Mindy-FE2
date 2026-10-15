import { Icon } from './icon';

export function ActionLink(props: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={props.href}
      className="inline-flex min-h-14 items-center justify-between gap-5 rounded-2xl bg-coral py-2 pr-2 pl-5 text-sm font-extrabold text-forest transition-colors hover:bg-peach motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
    >
      {props.children}
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas/35">
        <Icon name="arrow" />
      </span>
    </a>
  );
}
