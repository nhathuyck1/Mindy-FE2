'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Pagination } from '@/features/courses/components/shared/pagination';
import { useAdminReconciliation } from '../api/admin-queries';
import { AdminQueryState } from './admin-query-state';

const formatUtc7 = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
const formatAmount = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toLocaleString('vi-VN')} ${currency}`;
  }
};

export function AdminReconciliationPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const query = useAdminReconciliation(page, pageSize);
  return (
    <div className="space-y-6">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow text-muted">Mindy / Quản trị</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Cần đối soát thanh toán</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Danh sách giao dịch cần kiểm tra từ dữ liệu thanh toán.
          </p>
        </div>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          <RefreshCw aria-hidden="true" className="size-4" />
          Làm mới
        </Button>
      </header>
      <section className="admin-table-panel" aria-label="Danh sách cần đối soát">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
          <div>
            <h2 className="font-extrabold">Giao dịch cần kiểm tra</h2>
            {query.data && (
              <p className="mt-1 text-sm text-muted">
                {query.data.total.toLocaleString('vi-VN')} giao dịch
              </p>
            )}
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            Số dòng
            <NativeSelect
              aria-label="Số dòng mỗi trang"
              className="h-11 py-2"
              value={String(pageSize)}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50].map((size) => (
                <NativeSelectOption key={size} value={String(size)}>
                  {size}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        </div>
        {query.isPending || query.isError ? (
          <AdminQueryState
            loading={query.isPending}
            error={query.error}
            onRetry={() => void query.refetch()}
            columns={6}
          />
        ) : !query.data.items.length ? (
          <p
            className="grid min-h-56 place-items-center p-6 text-center text-sm text-muted"
            role="status"
          >
            Hiện không có giao dịch cần đối soát.
          </p>
        ) : (
          <>
            <div
              role="region"
              aria-label="Bảng giao dịch cần đối soát"
              tabIndex={0}
              className="max-w-full overflow-x-auto"
            >
              <table className="admin-data-table min-w-[1040px]">
                <caption className="sr-only">Giao dịch thanh toán cần đối soát</caption>
                <thead>
                  <tr>
                    <th scope="col">Mã giao dịch nhà cung cấp</th>
                    <th scope="col">Mã tham chiếu</th>
                    <th scope="col">Số tiền</th>
                    <th scope="col">Nguồn</th>
                    <th scope="col">Lý do cần kiểm tra</th>
                    <th scope="col">Thời gian (UTC+7)</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.providerOrderCode.toLocaleString('vi-VN')}</td>
                      <td className="max-w-64 whitespace-normal break-all">{item.referenceCode}</td>
                      <td>{formatAmount(item.amount, item.currency)}</td>
                      <td className="whitespace-normal">{item.source}</td>
                      <td className="max-w-80 whitespace-normal">
                        {item.reason || 'Chưa có lý do'}
                      </td>
                      <td>{formatUtc7(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-4 pb-1 sm:px-5">
              <Pagination
                page={page}
                totalPages={Math.ceil(query.data.total / query.data.pageSize)}
                onChange={setPage}
                comfortable
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
