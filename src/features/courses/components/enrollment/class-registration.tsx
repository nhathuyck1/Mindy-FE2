'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@/features/auth/api/auth-queries';
import { useAddCartItem } from '@/features/cart/api/cart-queries';
import { ApiError } from '@/lib/api/client';
import type { ClassDetail } from '../../schemas/course-contracts';

export function ClassRegistration(props: { detail: ClassDetail }) {
  const session = useSession();
  const addItem = useAddCartItem();
  const router = useRouter();
  const goToLogin = () => {
    const returnTo = `/courses/${props.detail.courseId}?classId=${props.detail.id}`;
    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  };
  return (
    <div className="mt-5 border-t border-line pt-5">
      {addItem.isSuccess ? (
        <p role="status" className="rounded-lg bg-soft p-4 text-sm font-bold">
          Đã thêm lớp vào giỏ hàng. Chỗ học được giữ khi bạn tạo đơn thanh toán.
        </p>
      ) : (
        <>
          <button
            type="button"
            disabled={
              session.isPending ||
              addItem.isPending ||
              props.detail.availableSeats === 0 ||
              (Boolean(session.data) && session.data?.role !== 'STUDENT')
            }
            onClick={async () => {
              if (session.isError) {
                await session.refetch();
                return;
              }
              if (!session.data) {
                goToLogin();
                return;
              }
              try {
                await addItem.mutateAsync(props.detail.id);
              } catch (error) {
                if (error instanceof ApiError && error.status === 401) goToLogin();
              }
            }}
            className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-mint px-4 text-sm font-extrabold text-canvas hover:bg-forest disabled:cursor-default disabled:opacity-50"
          >
            {session.isPending
              ? 'Đang kiểm tra phiên…'
              : addItem.isPending
                ? 'Đang thêm lớp…'
                : props.detail.availableSeats === 0
                  ? 'Lớp đã hết chỗ'
                  : session.isError
                    ? 'Kiểm tra lại phiên đăng nhập'
                    : 'Đăng ký lớp này'}
          </button>
          {session.data && session.data.role !== 'STUDENT' && (
            <p className="mt-2 text-xs text-muted">Đăng ký lớp dành cho tài khoản học viên.</p>
          )}
          {addItem.isError && (
            <p role="alert" className="mt-3 rounded-lg bg-peach p-3 text-xs">
              {addItem.error instanceof ApiError
                ? addItem.error.message
                : 'Chưa thể thêm lớp vào giỏ hàng. Vui lòng thử lại.'}
            </p>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Đăng ký để thêm lớp vào giỏ hàng. Bạn cần đăng nhập bằng tài khoản học viên để tiếp tục.
          </p>
        </>
      )}
    </div>
  );
}
