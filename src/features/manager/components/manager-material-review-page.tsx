'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { ManagerMaterialDetail } from './manager-material-detail';

export function ManagerMaterialReviewPage(props: { materialId: string }) {
  const router = useRouter();
  const validId = z.uuid().safeParse(props.materialId);
  return (
    <div className="min-w-0 space-y-5">
      <Button asChild variant="outline">
        <Link href="/manager">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Về tổng quan
        </Link>
      </Button>
      <header>
        <p className="mb-2 text-xs font-semibold tracking-widest text-mint uppercase">
          Mindy / Quản lý tài liệu
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">Xem và duyệt tài liệu</h1>
      </header>
      {validId.success ? (
        <ManagerMaterialDetail
          key={validId.data}
          id={validId.data}
          embedded
          onClose={() => router.replace('/manager')}
        />
      ) : (
        <p role="alert" className="rounded-xl border border-line bg-canvas p-6">
          Đường dẫn tài liệu không hợp lệ.
        </p>
      )}
    </div>
  );
}
