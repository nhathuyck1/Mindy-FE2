'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useRegister } from '../api/registration-queries';
import { registerSchema } from '../schemas/registration-contracts';
import { safeReturnPath } from '../lib/return-path';

export function RegisterForm() {
  const registration = useRegister();
  const [validationError, setValidationError] = useState('');
  const returnTo = safeReturnPath(useSearchParams().get('returnTo'));
  const loginUrl = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <div className="w-full max-w-md">
      <p className="eyebrow mb-4 text-mint">Bắt đầu cùng Mindy</p>
      <h1 className="section-title">Tạo tài khoản học viên</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Một tài khoản để tiếp tục hành trình học của bạn.
      </p>
      {registration.isSuccess ? (
        <div
          role="status"
          className="mt-7 rounded-xl border border-line bg-soft p-5 text-sm leading-relaxed"
        >
          Nếu email có thể đăng ký, liên kết xác thực đã được gửi. Hãy kiểm tra hộp thư và thư rác,
          xác thực email rồi quay lại đăng nhập để tiếp tục chọn lớp.
        </div>
      ) : (
        <form
          className="mt-7 space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            const input = registerSchema.safeParse({
              displayName: String(fields.get('displayName') ?? '').trim(),
              email: String(fields.get('email') ?? '').trim(),
              password: fields.get('password'),
            });
            if (!input.success) {
              setValidationError('Nhập họ tên, email hợp lệ và mật khẩu từ 6 đến 128 ký tự.');
              return;
            }
            setValidationError('');
            try {
              await registration.mutateAsync(input.data);
            } catch {
              /* Render mutation error below. */
            }
          }}
        >
          {[
            {
              name: 'displayName',
              label: 'Họ và tên',
              type: 'text',
              autoComplete: 'name',
              maxLength: 150,
              minLength: 1,
            },
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              autoComplete: 'username',
              maxLength: 320,
              minLength: 1,
            },
            {
              name: 'password',
              label: 'Mật khẩu',
              type: 'password',
              autoComplete: 'new-password',
              maxLength: 128,
              minLength: 6,
            },
          ].map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="mb-2 block text-sm font-bold">
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                required
                minLength={field.minLength}
                maxLength={field.maxLength}
                className="min-h-13 w-full rounded-xl border border-line bg-canvas px-4 text-base"
              />
            </div>
          ))}
          {(validationError || registration.isError) && (
            <p role="alert" className="rounded-xl bg-peach p-4 text-sm">
              {validationError || 'Chưa thể gửi yêu cầu đăng ký. Vui lòng thử lại sau.'}
            </p>
          )}
          <button
            type="submit"
            disabled={registration.isPending}
            className="min-h-13 w-full cursor-pointer rounded-xl bg-mint px-5 text-sm font-extrabold text-canvas hover:bg-forest disabled:opacity-50"
          >
            {registration.isPending ? 'Đang gửi yêu cầu…' : 'Tạo tài khoản'}
          </button>
        </form>
      )}
      <Link href={loginUrl} className="text-link mt-6 text-mint">
        Đã có tài khoản? Đăng nhập →
      </Link>
      <br />
      <Link href={returnTo === '/' ? '/courses' : returnTo} className="text-link mt-2">
        ← Tiếp tục xem khóa học
      </Link>
    </div>
  );
}
