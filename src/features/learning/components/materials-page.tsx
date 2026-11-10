'use client';

import { useState } from 'react';
import { classOverviewGrid } from '@/components/ui/class-overview-card';
import { StudentClassCard } from '@/features/user/components/student-class-card';
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
      <header className="mb-7">
        <p className="eyebrow text-mint">Mindy · Học viên</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Tài liệu học tập</h1>
        <p className="mt-3 text-base text-muted">
          Mở lớp để xem chương, bài đọc, video và tài liệu.
        </p>
      </header>
      {query.isPending ? (
        <UserDataState loading />
      ) : query.isError ? (
        <UserDataState error={query.error} retry={() => void query.refetch()} />
      ) : !items.length ? (
        <UserDataState empty="Chưa có lớp học nào có quyền truy cập tài liệu." />
      ) : (
        <>
          <div className={classOverviewGrid}>
            {items.slice((currentPage - 1) * 10, currentPage * 10).map((item) => (
              <StudentClassCard key={item.enrollmentId} item={item} />
            ))}
          </div>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} comfortable />
        </>
      )}
    </>
  );
}
