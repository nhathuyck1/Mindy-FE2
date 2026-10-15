import { Badge } from '@/components/ui/badge';
import { statusLabels } from '../lib/admin-resources';

export function AdminStatus(props: { status: string; label?: string }) {
  const positive = ['ACTIVE', 'true', 'OPEN', 'IN_PROGRESS', 'COMPLETED'].includes(props.status);
  const negative = ['SUSPENDED', 'CANCELLED'].includes(props.status);
  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[15px] font-extrabold ${positive ? 'border-status-green/25 bg-status-green/8 text-status-green' : negative ? 'border-status-red/25 bg-status-red/8 text-status-red' : 'border-status-yellow/25 bg-status-yellow/8 text-status-yellow'}`}
    >
      <span
        aria-hidden="true"
        className="size-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none"
      />
      {props.label ?? statusLabels[props.status] ?? props.status}
    </Badge>
  );
}
