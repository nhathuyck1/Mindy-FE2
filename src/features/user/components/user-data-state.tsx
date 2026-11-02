'use client';

import { Button } from '@/components/ui/button';
import { RedirectHome, RedirectLogin } from '@/features/auth/components/auth-guard';
import { ApiError } from '@/lib/api/client';
export function UserDataState(props: {
  error?: unknown;
  loading?: boolean;
  retry?: () => void;
  empty?: string;
}) {
  if (props.error instanceof ApiError && props.error.status === 401) return <RedirectLogin />;
  if (props.error instanceof ApiError && props.error.status === 403) return <RedirectHome />;
  return (
    <div
      role={props.error ? 'alert' : 'status'}
      className="rounded-2xl border border-line bg-canvas p-6 text-center sm:p-10"
    >
      <p className="font-bold">
        {props.loading ? 'Đang tải dữ liệu…' : props.error ? 'Chưa thể tải dữ liệu' : props.empty}
      </p>
      {Boolean(props.error) && (
        <>
          <p className="mt-2 text-sm">Kết nối đang gián đoạn. Vui lòng thử lại.</p>
          <Button variant="outline" className="mt-4" onClick={props.retry}>
            Thử lại
          </Button>
        </>
      )}
    </div>
  );
}
