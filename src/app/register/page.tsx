import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Brand } from '@/components/ui/brand';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = { title: 'Đăng ký tài khoản — Mindy Coding' };
export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-soft px-5 py-8">
      <div className="mx-auto max-w-md">
        <Brand />
        <div className="mt-10 rounded-2xl border border-line bg-canvas p-6 sm:p-8">
          <Suspense fallback={<p role="status">Đang tải đăng ký…</p>}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
