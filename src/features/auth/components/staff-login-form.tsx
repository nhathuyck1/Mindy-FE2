'use client';

import Link from 'next/link';
import { Brand } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAudienceLogin } from '../api/use-audience-login';

const fieldClass = 'h-12 rounded-lg border-transparent bg-ink/4 text-[14px] md:text-[14px]';

export function StaffLoginForm() {
  const login = useAudienceLogin('staff');

  return (
    <div className="w-full">
      <Brand />
      <h1 className="mt-8 text-xl text-muted">
        Chào mừng đến <strong className="font-extrabold text-foreground">Mindy Admin</strong>
      </h1>
      <p className="mt-1 text-sm text-muted">Dành cho Quản trị viên, Quản lý và Mentor.</p>
      <form onSubmit={login.submit} className="mt-7 space-y-5">
        <div className="space-y-2">
          <label htmlFor="staff-email" className="block text-[14px] font-extrabold">
            Email
          </label>
          <Input
            id="staff-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            maxLength={320}
            placeholder="email@example.com"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="staff-password" className="block text-[14px] font-extrabold">
            Mật khẩu
          </label>
          <Input
            id="staff-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={1}
            maxLength={128}
            placeholder="••••••••"
            className={fieldClass}
          />
        </div>
        {login.wrongRole ? (
          <div role="alert" className="rounded-lg bg-peach p-4 text-sm">
            <p>Tài khoản học viên vui lòng đăng nhập tại trang dành cho học viên.</p>
            <Link href="/login" className="mt-2 inline-block font-extrabold text-mint">
              Đến trang đăng nhập học viên →
            </Link>
          </div>
        ) : (
          login.error && (
            <p role="alert" className="rounded-lg bg-peach p-4 text-sm">
              {login.error}
            </p>
          )
        )}
        <Button
          type="submit"
          disabled={login.pending}
          className="mt-2 min-h-12 w-full font-extrabold"
        >
          {login.pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </Button>
      </form>
    </div>
  );
}
