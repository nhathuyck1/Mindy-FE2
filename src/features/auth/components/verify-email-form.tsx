'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyEmail } from '../api/registration-queries';
import { verifyEmailSchema } from '../schemas/registration-contracts';
import { safeReturnPath } from '../lib/return-path';

export function VerifyEmailForm() {
  const params = useSearchParams();
  const token = params.get('token');
  const input = verifyEmailSchema.safeParse({ token });
  const verification = useVerifyEmail();
  const router = useRouter();
  return (
    <div className="w-full max-w-md">
      <h1 className="section-title">Xác thực email</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Xác thực địa chỉ email để kích hoạt tài khoản học viên của bạn.
      </p>
      {!input.success ? (
        <p role="alert" className="mt-6 rounded-xl bg-peach p-4 text-sm">
          Liên kết xác thực không hợp lệ. Vui lòng mở lại liên kết trong email.
        </p>
      ) : (
        <button
          type="button"
          disabled={verification.isPending}
          onClick={async () => {
            try {
              await verification.mutateAsync(input.data.token);
              router.replace(safeReturnPath(params.get('returnTo')));
            } catch {
              /* Render mutation error below. */
            }
          }}
          className="mt-6 min-h-13 w-full cursor-pointer rounded-xl bg-mint px-5 text-sm font-extrabold text-canvas hover:bg-forest disabled:opacity-50"
        >
          {verification.isPending ? 'Đang xác thực…' : 'Xác thực và tiếp tục'}
        </button>
      )}
      {verification.isError && (
        <p role="alert" className="mt-4 rounded-xl bg-peach p-4 text-sm">
          Liên kết có thể đã hết hạn hoặc đã được sử dụng. Bạn có thể thử đăng nhập nếu đã xác thực.
        </p>
      )}
      <Link href="/login" className="text-link mt-6">
        ← Về trang đăng nhập
      </Link>
    </div>
  );
}
