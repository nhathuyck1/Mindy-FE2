import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { Brand } from '@/components/ui/brand';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = { title: 'Đăng nhập — Mindy Coding' };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col items-start px-6 py-8 sm:px-12 lg:px-16">
        <Brand />
        <div className="flex w-full flex-1 items-center justify-center py-12">
          <Suspense fallback={<p role="status">Đang tải trang đăng nhập…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
      <aside className="hidden flex-col items-center justify-center bg-soft p-12 lg:flex">
        <Image
          src="/mindy/coding-mascot.png"
          alt="Bạn ếch Mindy đồng hành cùng bạn học lập trình"
          width={560}
          height={560}
          className="h-auto w-full max-w-130"
          sizes="45vw"
        />
        <p className="mt-8 text-2xl font-extrabold">Khởi đầu nhỏ. Bứt phá lớn.</p>
        <p className="mt-3 text-sm text-muted">Cứ thử. Bạn sẽ làm được.</p>
      </aside>
    </main>
  );
}
