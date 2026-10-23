'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, BookOpen, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/features/courses/components/shared/pagination';
import { useAccessibleClasses } from '../api/learning-queries';
import { UserDataState } from '@/features/user/components/user-data-state';

export function MaterialsPage() {
  const [page, setPage] = useState(1);
  const query = useAccessibleClasses();
  const items = query.data ?? [];
  const totalPages = Math.ceil(items.length / 10);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  return (
    <>
      <div className="mb-8 flex items-start gap-4">
        <span className="hidden rounded-2xl bg-mint/10 p-4 text-mint sm:block">
          <FolderOpen aria-hidden="true" className="size-7" />
        </span>
        <div>
          <p className="eyebrow font-bold text-mint">Không gian học tập</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Tài liệu học tập</h1>
        </div>
      </div>
      {query.isPending ? (
        <UserDataState loading />
      ) : query.isError ? (
        <UserDataState error={query.error} retry={() => void query.refetch()} />
      ) : !items.length ? (
        <UserDataState empty="Chưa có lớp học nào có quyền truy cập tài liệu." />
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            {items.slice((currentPage - 1) * 10, currentPage * 10).map((item) => (
              <article
                key={item.enrollmentId}
                className="flex min-w-0 flex-col rounded-2xl border border-line bg-canvas p-5 sm:p-7"
              >
                <div className="flex items-center justify-between gap-3">
                  <BookOpen aria-hidden="true" className="size-6 text-mint" />
                  <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold">
                    {item.accessMode === 'FULL' ? 'Đang học' : 'Xem trước'}
                  </span>
                </div>
                <p className="mt-5 text-xs font-semibold text-mint">{item.courseCode}</p>
                <h2 className="mt-2 text-xl font-bold">{item.courseTitle}</h2>
                <p className="mt-2 text-sm text-muted">
                  {item.className} · {item.classCode}
                </p>
                <p className="mt-4 text-sm">Mentor: {item.mentor.displayName || 'Chưa cập nhật'}</p>
                <div className="mt-auto pt-6">
                  <Button asChild className="w-full sm:w-auto">
                    <Link
                      href={`/user/materials/${item.classId}${item.accessMode === 'CASH_PREVIEW' ? '?preview=true' : ''}`}
                    >
                      {item.accessMode === 'FULL' ? 'Vào học' : 'Xem trước chương'}
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} comfortable />
        </>
      )}
    </>
  );
}
