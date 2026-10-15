import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Brand } from '@/components/ui/brand';
import { VerifyEmailForm } from '@/features/auth/components/verify-email-form';

export const metadata: Metadata = {
  title: 'Xác thực email — Mindy Coding',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-soft px-5 py-8">
      <div className="mx-auto max-w-md">
        <Brand />
        <div className="mt-10 rounded-2xl border border-line bg-canvas p-6 sm:p-8">
          <Suspense fallback={<p role="status">Đang tải xác thực…</p>}>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
