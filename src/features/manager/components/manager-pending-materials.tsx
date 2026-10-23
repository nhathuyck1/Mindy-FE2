'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useManagerQuery } from '../api/manager-queries';
import { materialsSchema } from '../schemas/manager-contracts';
import {
  ManagerPagination,
  ManagerState,
  ReviewBadge,
  managerDate,
  typeLabels,
} from './manager-shared';

export function ManagerPendingMaterials(props: { onRefresh: () => void }) {
  const [page, setPage] = useState(1);
  const materials = useManagerQuery(
    `manager/materials?reviewStatus=PENDING_REVIEW&page=${page}&pageSize=20`,
    materialsSchema,
  );
  const lastPage = materials.data ? Math.max(1, Math.ceil(materials.data.total / 20)) : page;
  if (page > lastPage) setPage(lastPage);

  return (
    <section className="admin-table-panel min-w-0" aria-label="Tài liệu chờ duyệt">
      <header className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold">Tài liệu chờ duyệt</h2>
          <p className="mt-1 text-sm text-muted">Mở tài liệu để xem nội dung và kiểm duyệt.</p>
        </div>
        <Button
          variant="outline"
          disabled={materials.isFetching}
          onClick={() => {
            void materials.refetch();
            props.onRefresh();
          }}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Làm mới
        </Button>
      </header>
      <ManagerState pending={materials.isPending} error={materials.error} retry={materials.refetch}>
        {materials.data?.items.length === 0 ? (
          <p
            role="status"
            className="border-t border-line px-5 py-12 text-center text-sm text-muted"
          >
            Không có tài liệu chờ duyệt.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-data-table min-w-200">
              <caption className="sr-only">Danh sách tài liệu chờ duyệt</caption>
              <thead>
                <tr>
                  <th scope="col">Tài liệu</th>
                  <th scope="col">Loại</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Cập nhật</th>
                  <th scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {materials.data?.items.map((material) => (
                  <tr key={material.id}>
                    <th scope="row" className="max-w-90 font-normal">
                      <Link
                        href={`/manager/materials/${material.id}`}
                        className="inline-flex min-h-11 items-center rounded-lg font-semibold hover:text-mint hover:underline focus-visible:outline-2 focus-visible:outline-mint"
                      >
                        {material.title}
                      </Link>
                    </th>
                    <td>{typeLabels[material.contentType]}</td>
                    <td>
                      <ReviewBadge status={material.reviewStatus} />
                    </td>
                    <td className="whitespace-nowrap text-muted">
                      <time dateTime={material.updatedAt}>{managerDate(material.updatedAt)}</time>
                    </td>
                    <td>
                      <Button asChild variant="outline">
                        <Link href={`/manager/materials/${material.id}`}>Xem và duyệt</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {materials.data && (
          <ManagerPagination page={page} total={materials.data.total} onChange={setPage} />
        )}
      </ManagerState>
    </section>
  );
}
