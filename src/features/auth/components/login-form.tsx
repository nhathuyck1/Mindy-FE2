'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { loginSchema } from '@/lib/api/contracts';
import { useLogin } from '../api/auth-queries';
import { safeReturnPath } from '../lib/return-path';

export function LoginForm() {
  const login = useLogin();
  const router = useRouter();
  const returnTo = safeReturnPath(useSearchParams().get('returnTo'));
  const [validationError, setValidationError] = useState('');

  return (
    <div className="w-full max-w-md">
      <p className="eyebrow mb-4 text-mint">Chào mừng trở lại</p>
      <h1 className="section-title">
        Tiếp tục hành trình
        <br />
        cùng Mindy.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Một điều mới đang chờ bạn ở phía trước.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const result = loginSchema.safeParse({
            email: String(data.get('email') ?? '').trim(),
            password: data.get('password'),
          });
          if (!result.success) {
            setValidationError('Vui lòng nhập email hợp lệ và mật khẩu từ 1 đến 128 ký tự.');
            return;
          }
          setValidationError('');
          try {
            const response = await login.mutateAsync(result.data);
            router.replace(
              response.user.role === 'ADMIN' && returnTo === '/' ? '/admin' : returnTo,
            );
          } catch {
            /* Mutation renders its error below. */
          }
        }}
        className="mt-8 space-y-5"
      >
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-bold">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            maxLength={320}
            placeholder="ban@example.com"
            className="min-h-13 w-full rounded-xl border border-line bg-canvas px-4 text-base"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-bold">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={1}
            maxLength={128}
            className="min-h-13 w-full rounded-xl border border-line bg-canvas px-4 text-base"
          />
        </div>
        {(validationError || login.isError) && (
          <p role="alert" className="rounded-xl bg-peach p-4 text-sm">
            {validationError ||
              'Đăng nhập chưa thành công. Vui lòng kiểm tra email, mật khẩu và trạng thái xác thực tài khoản.'}
          </p>
        )}
        <button
          type="submit"
          disabled={login.isPending}
          className="min-h-13 w-full cursor-pointer rounded-xl bg-mint px-5 text-sm font-extrabold text-canvas transition-colors hover:bg-forest disabled:cursor-wait disabled:opacity-60"
        >
          {login.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
      <Link
        href={`/register?returnTo=${encodeURIComponent(returnTo)}`}
        className="text-link mt-6 text-mint"
      >
        Chưa có tài khoản? Đăng ký →
      </Link>
      <br />
      <Link href={returnTo === '/' ? '/' : returnTo} className="text-link mt-2">
        {returnTo === '/' ? '← Về trang chủ' : '← Tiếp tục xem khóa học'}
      </Link>
    </div>
  );
}
