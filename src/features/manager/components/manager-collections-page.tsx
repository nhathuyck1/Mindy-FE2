'use client';

import { useRef, useState } from 'react';
import { Download, RefreshCw, Wallet, Clock3, CircleCheck, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useManagerQuery } from '../api/manager-queries';
import {
  useCollectionClasses,
  collectionMoney,
  collectionStatuses,
  collectionOrdersCsv,
  cashCollectionListError,
} from '../api/manager-collections';
import {
  collectionOrdersSchema,
  type ConfirmedCashOrder,
} from '../schemas/manager-collections-contracts';
import { ManagerState, managerDate } from './manager-shared';
import { ManagerCashOrderDialog } from './manager-cash-order-dialog';
import { ManagerLocalReceipts } from './manager-local-receipts';

export function ManagerCollectionsPage() {
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collected, setCollected] = useState<
    | (Pick<ConfirmedCashOrder, 'orderCode' | 'totalAmount'> & {
        returnFocus: HTMLButtonElement | null;
      })
    | null
  >(null);
  const refreshButton = useRef<HTMLButtonElement>(null);
  const [archive, setArchive] = useState(false);
  const classes = useCollectionClasses();
  const params = new URLSearchParams({ page: String(page), pageSize: '20', paymentType: 'CASH' });
  if (classId) params.set('classId', classId);
  if (status) params.set('status', status);
  if (orderCode) params.set('orderCode', orderCode);
  const orders = useManagerQuery(`manager/orders?${params}`, collectionOrdersSchema);
  const scope = classId ? `&classId=${classId}` : '';
  const pending = useManagerQuery(
    `manager/orders?page=1&pageSize=1&paymentType=CASH&status=PENDING${scope}`,
    collectionOrdersSchema,
  );
  const paid = useManagerQuery(
    `manager/orders?page=1&pageSize=1&paymentType=CASH&status=PAID${scope}`,
    collectionOrdersSchema,
  );
  const stats = [
    { label: 'Đơn chờ thanh toán', query: pending, icon: Clock3 },
    { label: 'Đơn đã thanh toán', query: paid, icon: CircleCheck },
    { label: 'Đơn theo bộ lọc', query: orders, icon: Wallet },
  ];
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-mint uppercase">
            Mindy / Không gian Manager
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Thu tiền</h1>
          <p className="mt-2 text-sm text-muted">
            Theo dõi đơn tiền mặt và xác nhận khoản đã thu trên hệ thống.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setArchive(true)}>
            <Archive aria-hidden="true" className="size-4" />
            Phiếu cũ trên thiết bị
          </Button>
          <Button
            variant="outline"
            disabled={!orders.data?.items.length || orders.isFetching || orders.isError}
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([collectionOrdersCsv(orders.data?.items ?? [])], {
                  type: 'text/csv;charset=utf-8',
                }),
              );
              const link = document.createElement('a');
              link.href = url;
              link.download = `mindy-don-tien-mat-trang-${page}.csv`;
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            <Download aria-hidden="true" className="size-4" />
            Xuất trang CSV
          </Button>
          <Button
            ref={refreshButton}
            disabled={orders.isFetching}
            onClick={() => {
              void orders.refetch();
              void pending.refetch();
              void paid.refetch();
            }}
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Làm mới
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-start gap-4 rounded-2xl border border-line bg-canvas p-5"
          >
            <span className="rounded-xl bg-soft p-3 text-mint">
              <stat.icon aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold">
                {stat.query.isError ? '—' : (stat.query.data?.total ?? '—')}
              </p>
            </div>
          </div>
        ))}
      </div>
      <section className="admin-table-panel" aria-label="Đơn thu tiền mặt">
        <div className="space-y-5 p-5">
          <div>
            <h2 className="text-lg font-bold">Danh sách đơn tiền mặt</h2>
            <p className="mt-1 text-xs text-muted">
              Một đơn có thể gồm nhiều lớp; xác nhận thu đủ tổng đơn một lần.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="min-w-0 text-sm font-semibold">
              Lớp học
              <NativeSelect
                aria-label="Lọc đơn theo lớp"
                wrapperClassName="mt-2 w-full"
                className="h-11 truncate"
                value={classId}
                disabled={classes.isPending || classes.isError}
                onChange={(event) => {
                  setClassId(event.target.value);
                  setPage(1);
                }}
              >
                <NativeSelectOption value="">
                  {classes.isPending ? 'Đang tải lớp…' : 'Tất cả lớp học'}
                </NativeSelectOption>
                {classes.data?.map((item) => (
                  <NativeSelectOption key={item.id} value={item.id}>
                    {item.code} · {item.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <label className="min-w-0 text-sm font-semibold">
              Trạng thái
              <NativeSelect
                aria-label="Trạng thái đơn thu tiền"
                wrapperClassName="mt-2 w-full"
                className="h-11"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <NativeSelectOption value="">Tất cả trạng thái</NativeSelectOption>
                {Object.entries(collectionStatuses).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          </div>
          {classes.isError && (
            <div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
              <p>Chưa tải được danh sách lớp.</p>
              <Button size="sm" variant="outline" onClick={() => void classes.refetch()}>
                Thử tải lớp
              </Button>
            </div>
          )}
          <form
            className="flex min-w-0 flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setOrderCode(search.trim());
              setPage(1);
            }}
          >
            <label className="min-w-0 flex-1 text-sm font-semibold">
              Mã đơn chính xác
              <Input
                aria-label="Tìm theo mã đơn"
                maxLength={50}
                value={search}
                placeholder="Nhập đầy đủ mã đơn"
                className="mt-2"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <Button type="submit" variant="outline">
              Tìm đơn
            </Button>
            {orderCode && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setOrderCode('');
                  setPage(1);
                }}
              >
                Xóa tìm kiếm
              </Button>
            )}
          </form>
        </div>
        <ManagerState
          pending={orders.isPending}
          error={orders.error}
          errorMessage={cashCollectionListError(orders.error)}
          retry={() =>
            Promise.all([orders.refetch(), pending.refetch(), paid.refetch(), classes.refetch()])
          }
        >
          {orders.data?.items.length === 0 ? (
            <div className="space-y-3 border-t border-line p-10 text-center">
              <Wallet aria-hidden="true" className="mx-auto size-10 text-mint/60" />
              <h3 className="font-bold">Không có đơn tiền mặt phù hợp</h3>
              <p className="text-sm text-muted">Thử thay đổi lớp, trạng thái hoặc mã đơn.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-data-table min-w-220">
                <caption className="sr-only">Đơn tiền mặt từ máy chủ</caption>
                <thead>
                  <tr>
                    <th scope="col">Mã đơn / Học viên</th>
                    <th scope="col">Tổng đơn</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Hạn thanh toán</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data?.items.map((order) => (
                    <tr key={order.id}>
                      <th scope="row" className="font-normal">
                        <p className="font-semibold">{order.orderCode}</p>
                        <p className="mt-1 text-xs text-muted">
                          {order.student.displayName || 'Chưa cập nhật tên'}
                        </p>
                      </th>
                      <td className="whitespace-nowrap font-semibold">
                        {collectionMoney(order.totalAmount)}
                      </td>
                      <td>
                        <span className="whitespace-nowrap rounded-md bg-soft px-2.5 py-1 text-xs font-semibold">
                          {collectionStatuses[order.status]}
                        </span>
                        {order.payment?.status === 'REQUIRES_REVIEW' && (
                          <p className="mt-1 text-xs text-muted">Cần đối soát</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        {managerDate(order.expiresAt)}
                      </td>
                      <td>
                        <Button variant="outline" size="sm" onClick={() => setSelectedId(order.id)}>
                          Xem đơn
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {orders.data && (
            <nav
              aria-label="Phân trang đơn thu tiền"
              className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4 text-sm text-muted"
            >
              <span>
                {orders.data.total} đơn · Trang {page}/
                {Math.max(1, Math.ceil(orders.data.total / 20))}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1 || orders.isFetching}
                  onClick={() => setPage(page - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  disabled={page * 20 >= orders.data.total || orders.isFetching}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </Button>
              </div>
            </nav>
          )}
        </ManagerState>
      </section>
      {selectedId && (
        <ManagerCashOrderDialog
          key={selectedId}
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onSuccess={(order) => {
            setSelectedId(null);
            setCollected({
              orderCode: order.orderCode,
              totalAmount: order.totalAmount,
              returnFocus: refreshButton.current,
            });
          }}
        />
      )}
      {collected && (
        <Modal
          title="Đã thu tiền thành công"
          contentClassName="sm:max-w-md"
          returnFocus={collected.returnFocus}
          onClose={() => setCollected(null)}
        >
          <div className="space-y-5 p-6 text-center sm:p-8">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-mint/10 text-mint">
              <CircleCheck aria-hidden="true" className="size-9" />
            </span>
            <div>
              <p className="text-2xl font-bold text-forest">
                {collectionMoney(collected.totalAmount)}
              </p>
              <p className="mt-2 text-sm break-words text-muted">
                Mã đơn: <strong className="text-foreground">{collected.orderCode}</strong>
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">
                Đơn hàng đã được cập nhật thanh toán trên hệ thống.
              </p>
            </div>
            <Button className="w-full" onClick={() => setCollected(null)}>
              Hoàn tất
            </Button>
          </div>
        </Modal>
      )}
      {archive && <ManagerLocalReceipts onClose={() => setArchive(false)} />}
    </div>
  );
}
