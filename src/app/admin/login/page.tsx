import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { StaffLoginForm } from '@/features/auth/components/staff-login-form';

export const metadata: Metadata = { title: 'Đăng nhập nội bộ' };

export default function AdminLoginPage() {
  return (
    <main className="admin-typography relative grid min-h-dvh place-items-center overflow-hidden bg-forest px-4 py-10">
      <div
        aria-hidden="true"
        className="absolute -top-40 -right-40 size-96 rounded-full bg-canvas/10"
      />
      <Image
        src="/mindy/reading-mascot.png"
        alt=""
        width={1254}
        height={1254}
        className="pointer-events-none absolute -bottom-8 -left-8 hidden w-72 md:block"
        sizes="18rem"
      />
      <div className="relative w-full max-w-md">
        <div aria-hidden="true" className="admin-login-shadow" />
        <section className="relative rounded-xl bg-canvas p-7 shadow-xl sm:p-12">
          <Suspense fallback={<p role="status">Đang tải trang đăng nhập…</p>}>
            <StaffLoginForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
