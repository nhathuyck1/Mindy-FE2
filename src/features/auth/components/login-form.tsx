'use client';

import Link from 'next/link';
import { useAudienceLogin } from '../api/use-audience-login';

export function LoginForm() {
  const login = useAudienceLogin('student');

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
      <form onSubmit={login.submit} className="mt-8 space-y-5">
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
        {login.wrongRole ? (
          <div role="alert" className="rounded-xl bg-peach p-4 text-sm">
            <p>Tài khoản Quản trị, Quản lý hoặc Mentor vui lòng đăng nhập tại trang nội bộ.</p>
            <Link href="/admin/login" className="text-link mt-2 text-mint">
              Đến trang đăng nhập nội bộ →
            </Link>
          </div>
        ) : (
          login.error && (
            <p role="alert" className="rounded-xl bg-peach p-4 text-sm">
              {login.error}
            </p>
          )
        )}
        <button
          type="submit"
          disabled={login.pending}
          className="min-h-13 w-full cursor-pointer rounded-xl bg-mint px-5 text-sm font-extrabold text-canvas transition-colors hover:bg-forest disabled:cursor-wait disabled:opacity-60"
        >
          {login.pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
      <Link
        href={`/register?returnTo=${encodeURIComponent(login.returnTo)}`}
        className="text-link mt-6 text-mint"
      >
        Chưa có tài khoản? Đăng ký →
      </Link>
      <br />
      <Link href={login.returnTo === '/' ? '/' : login.returnTo} className="text-link mt-2">
        {login.returnTo === '/' ? '← Về trang chủ' : '← Tiếp tục xem khóa học'}
      </Link>
    </div>
  );
}
