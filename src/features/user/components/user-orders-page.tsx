'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDate, formatPrice } from '@/features/courses/lib/course-format';
import { Pagination } from '@/features/courses/components/shared/pagination';
import { orderStatusSchema, type Order } from '@/features/orders/schemas/order-contracts';
import { useUserOrders } from '../api/user-queries';
import { UserDataState } from './user-data-state';
import { UserDetailsDialog } from './user-details-dialog';
const labels = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy',
};
export function UserOrdersPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Order | null>(null);
  const [status, setStatus] = useState<'' | Order['status']>('');
  const query = useUserOrders(page, status);
  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Đơn hàng của tôi</h1>
        </div>
        <label className="flex flex-col gap-2 text-sm font-bold">
          Trạng thái đơn hàng
          <select
            value={status}
            onChange={(e) => {
              const parsed = orderStatusSchema.safeParse(e.target.value);
              setStatus(parsed.success ? parsed.data : '');
              setPage(1);
              setSelected(null);
            }}
            className="min-h-11 rounded-lg border border-line bg-canvas px-3 font-normal"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {query.isPending ? (
        <UserDataState loading />
      ) : query.isError ? (
        <UserDataState error={query.error} retry={() => void query.refetch()} />
      ) : !query.data.items.length ? (
        <UserDataState empty="Chưa có đơn hàng phù hợp." />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-canvas">
            <div
              role="region"
              aria-label="Bảng đơn hàng"
              tabIndex={0}
              className="max-w-full overflow-x-auto"
            >
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <caption className="sr-only">Danh sách đơn hàng của tôi</caption>
                <thead className="border-b border-line bg-soft">
                  <tr>
                    {[
                      'Mã đơn hàng',
                      'Khóa học',
                      'Ngày tạo',
                      'Thanh toán',
                      'Số lớp',
                      'Tổng tiền',
                      'Trạng thái',
                      'Thao tác',
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="px-5 py-4 font-extrabold whitespace-nowrap"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {query.data.items.map((order) => (
                    <tr key={order.id} className="hover:bg-soft/50">
                      <th scope="row" className="px-5 py-3 text-left font-bold whitespace-nowrap">
                        {order.orderCode}
                      </th>
                      <td className="min-w-52 max-w-72 px-5 py-3">
                        <p
                          className="line-clamp-2 font-semibold"
                          title={[
                            ...new Set(order.details.map((detail) => detail.courseTitle)),
                          ].join(', ')}
                        >
                          {[...new Set(order.details.map((detail) => detail.courseTitle))].join(
                            ', ',
                          ) || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {order.paymentType === 'PAYOS' ? 'payOS' : 'Tiền mặt'}
                      </td>
                      <td className="px-5 py-3">{order.details.length}</td>
                      <td className="px-5 py-3 font-bold whitespace-nowrap">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={
                            'inline-flex rounded-lg px-3 py-2 text-xs font-bold ' +
                            (order.status === 'PAID'
                              ? 'bg-soft text-forest'
                              : 'bg-peach text-black')
                          }
                        >
                          {labels[order.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Button variant="outline" onClick={() => setSelected(order)}>
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            page={page}
            totalPages={Math.ceil(query.data.total / query.data.pageSize)}
            onChange={(page) => {
              setPage(page);
              setSelected(null);
            }}
            comfortable
          />
        </>
      )}
      {selected && (
        <UserDetailsDialog title="Chi tiết đơn hàng" onClose={() => setSelected(null)}>
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            {[
              ['Mã đơn hàng', selected.orderCode],
              ['Trạng thái', labels[selected.status]],
              ['Ngày tạo', formatDate(selected.createdAt)],
              [
                'Hình thức thanh toán',
                selected.paymentType === 'PAYOS' ? 'Chuyển khoản payOS' : 'Tiền mặt',
              ],
              ['Hạn thanh toán', formatDate(selected.expiresAt)],
              [
                'Ngày thanh toán',
                selected.paidAt ? formatDate(selected.paidAt) : 'Chưa thanh toán',
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted">{label}</dt>
                <dd className="mt-1 break-words font-bold">{value}</dd>
              </div>
            ))}
          </dl>
          <section aria-label="Các lớp trong đơn hàng" className="rounded-xl border border-line">
            <ul className="divide-y divide-line">
              {selected.details.map((detail) => (
                <li key={detail.id} className="flex flex-wrap justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <h3 className="font-bold">{detail.courseTitle}</h3>
                    <p className="mt-1 text-sm">{detail.className}</p>
                    <p className="mt-1 text-xs">Số lượng: {detail.quantity}</p>
                  </div>
                  <p className="text-sm font-bold">{formatPrice(detail.totalAmount)}</p>
                </li>
              ))}
            </ul>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <p>
              Tổng thanh toán <strong className="ml-2">{formatPrice(selected.totalAmount)}</strong>
            </p>
            {selected.paymentType === 'PAYOS' && (
              <Button asChild>
                <Link href={'/checkout/' + selected.id}>Xem trạng thái thanh toán</Link>
              </Button>
            )}
          </div>
        </UserDetailsDialog>
      )}
    </>
  );
}
