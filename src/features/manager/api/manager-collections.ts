'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import { ApiError } from '@/lib/api/client';
import {
  collectionClassesSchema,
  type CollectionOrder,
} from '../schemas/manager-collections-contracts';
import { apiRequest } from '@/lib/api/client';

export function useCollectionClasses() {
  const session = useSession();
  return useQuery({
    queryKey: ['manager', session.data?.id, 'collection-classes'],
    enabled: session.data?.role === 'MANAGER' && session.data.status === 'ACTIVE',
    retry: false,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const first = await apiRequest({
        path: 'manager/classes?page=1&pageSize=100',
        schema: collectionClassesSchema,
        signal,
      });
      const items = [...first.items];
      for (let page = 2; (page - 1) * first.pageSize < first.total; page++) {
        const next = await apiRequest({
          path: `manager/classes?page=${page}&pageSize=100`,
          schema: collectionClassesSchema,
          signal,
        });
        if (next.page !== page || !next.items.length)
          throw new Error('Danh sách lớp đã thay đổi. Vui lòng tải lại.');
        items.push(...next.items);
      }
      return items;
    },
  });
}
export function cashCollectionError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 409)
      return 'Đơn không thể xác nhận: đã hết hạn, thay đổi hoặc không còn giữ chỗ hợp lệ. Hãy kiểm tra lại đơn.';
    if (error.status === 401 || error.status === 403)
      return 'Phiên đăng nhập hoặc quyền thu tiền đã thay đổi. Vui lòng đăng nhập lại.';
    if (error.status === 404) return 'Không tìm thấy đơn hàng. Hãy tải lại danh sách.';
    if (error.status === 422) return 'Kiểm tra số tiền đã nhận; phải bằng toàn bộ tổng đơn.';
  }
  return 'Chưa xác định được kết quả xác nhận. Hãy kiểm tra lại đơn trước khi thao tác tiếp.';
}
export const collectionMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
export const collectionStatuses = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  EXPIRED: 'Hết hạn',
  CANCELLED: 'Đã hủy',
};
export function collectionOrdersCsv(orders: CollectionOrder[]) {
  const cell = (value: string | number) =>
    '"' +
    String(value)
      .replace(/^\s*[=+@-]/, (value) => "'" + value)
      .replaceAll('"', '""') +
    '"';
  return (
    '\uFEFF' +
    [
      [
        'Mã đơn',
        'Học viên',
        'Phương thức',
        'Tổng tiền VND',
        'Trạng thái',
        'Ngày tạo',
        'Ngày thanh toán',
      ],
      ...orders.map((order) => [
        order.orderCode,
        order.student.displayName ?? '',
        order.paymentType,
        order.totalAmount,
        collectionStatuses[order.status],
        order.createdAt,
        order.paidAt ?? '',
      ]),
    ]
      .map((row) => row.map(cell).join(','))
      .join('\r\n')
  );
}
