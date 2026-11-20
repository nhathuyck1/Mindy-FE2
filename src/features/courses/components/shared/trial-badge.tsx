export function TrialBadge(props: { priceAmount?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md bg-soft px-2.5 py-1 text-xs font-bold text-forest">
      Học thử{props.priceAmount === 0 ? ' · 0đ' : ''}
    </span>
  );
}
