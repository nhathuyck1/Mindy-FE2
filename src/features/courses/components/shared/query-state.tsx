import Link from 'next/link';
import { Icon } from '@/components/ui/icon';

export function QueryState(props: {
  title: string;
  description?: string;
  retry?: () => void;
  loading?: boolean;
  notFound?: boolean;
}) {
  return (
    <div
      role={props.loading ? 'status' : props.retry ? 'alert' : undefined}
      className="rounded-xl border border-line bg-canvas p-7 text-center sm:p-12"
    >
      <Icon name={props.loading ? 'clock' : 'book'} className="mx-auto mb-4 size-8 text-mint" />
      <p className="font-extrabold">{props.title}</p>
      {props.description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          {props.description}
        </p>
      )}
      {props.retry && (
        <button
          type="button"
          onClick={props.retry}
          className="text-link mt-3 cursor-pointer text-mint"
        >
          Thử lại <Icon name="arrow" className="size-4" />
        </button>
      )}
      {props.notFound && (
        <Link href="/courses" className="text-link mt-3 text-mint">
          Về danh sách khóa học <Icon name="arrow" className="size-4" />
        </Link>
      )}
    </div>
  );
}
