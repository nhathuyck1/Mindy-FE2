'use client';

import { Button } from '@/components/ui/button';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/client';
import { TableSkeleton } from '@/components/ui/loading-skeletons';
import { LoadingOverlay } from '@/components/ui/spinner';

export function AdminQueryState(props: {
  loading?: boolean;
  error?: Error | null;
  onRetry: () => void;
  columns?: number;
  /** Tables keep the skeleton; content inside a modal uses the blurred spinner overlay. */
  variant?: 'table' | 'modal';
}) {
  const pathname = usePathname();
  if (props.loading)
    return props.variant === 'modal' ? (
      <LoadingOverlay scope="modal" label="Đang tải dữ liệu…" />
    ) : (
      <TableSkeleton columns={props.columns} />
    );
  const status = props.error instanceof ApiError ? props.error.status : 0;
  return (
    <div className="grid min-h-64 place-items-center p-6 text-center" role="alert">
      <div>
        <Icon name="shield" className="mx-auto size-8 text-mint" />
        <p className="mt-4 text-base font-extrabold">
          {status === 401
            ? 'Phiên đăng nhập đã hết hạn'
            : status === 403
              ? 'Bạn không có quyền xem dữ liệu này'
              : 'Chưa thể tải dữ liệu'}
        </p>
        {
          <p className="mt-2 text-sm text-muted">
            {status === 401
              ? 'Đăng nhập lại để tiếp tục công việc.'
              : status === 403
                ? 'Vui lòng kiểm tra quyền của tài khoản đang sử dụng.'
                : 'Kiểm tra kết nối và thử lại sau giây lát.'}
          </p>
        }
        {status === 401 ? (
          <Link
            href={`/admin/login?returnTo=${encodeURIComponent(pathname)}`}
            className="admin-button mt-5"
          >
            Đăng nhập lại
          </Link>
        ) : (
          status !== 403 && (
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              onClick={props.onRetry}
              className="admin-button mt-5"
            >
              Thử lại
            </Button>
          )
        )}
      </div>
    </div>
  );
}
