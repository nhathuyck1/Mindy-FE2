'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TodaySchedule } from '@/features/dashboard/components/today-schedule';

export function UserOverviewPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">Tổng quan</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/user/courses">Khóa học của tôi</Link>
          </Button>
          <Button asChild>
            <Link href="/user/assignments">Bài tập</Link>
          </Button>
        </div>
      </header>
      <TodaySchedule audience="student" />
    </div>
  );
}
