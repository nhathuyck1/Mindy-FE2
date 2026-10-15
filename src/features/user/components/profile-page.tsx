'use client';

import { Mail, UserRound } from 'lucide-react';
import { useSession } from '@/features/auth/api/auth-queries';
import { formatDate } from '@/features/courses/lib/course-format';
export function ProfilePage() {
  const session = useSession();
  const user = session.data;
  if (!user) return null;
  const fields = [
    ['Họ và tên', user.displayName],
    ['Email', user.email],
    ['Số điện thoại', user.phone || 'Chưa cập nhật'],
    ['Vai trò', 'Học viên'],
    ['Trạng thái', 'Đang hoạt động'],
    ['Ngày tham gia', formatDate(user.createdAt)],
  ];
  return (
    <div className="max-w-5xl">
      <div className="mb-7">
        <p className="mb-2 text-sm font-bold text-mint">TÀI KHOẢN MINDY</p>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Thông tin cá nhân</h1>
        <p className="mt-2 text-sm sm:text-base">Thông tin tài khoản và liên hệ của bạn.</p>
      </div>
      <section
        aria-label="Hồ sơ cá nhân"
        className="overflow-hidden rounded-2xl border border-line bg-canvas"
      >
        <div className="h-24 bg-mint sm:h-32" />
        <div className="px-5 pb-7 sm:px-8">
          <div className="flex flex-wrap items-end gap-4">
            <div
              aria-hidden="true"
              className="-mt-10 grid size-20 self-start place-items-center rounded-2xl border-4 border-canvas bg-soft text-forest"
            >
              <UserRound className="size-9" />
            </div>
            <div className="min-w-0 pt-3 pb-1">
              <h2 className="break-words text-xl font-extrabold">{user.displayName}</h2>
              <p className="mt-1 flex items-center gap-2 break-all text-sm">
                <Mail aria-hidden="true" className="size-4 shrink-0 text-mint" />
                {user.email}
              </p>
            </div>
          </div>
          <dl className="mt-8 grid gap-x-10 gap-y-6 border-t border-line pt-7 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-2 break-words text-base font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
