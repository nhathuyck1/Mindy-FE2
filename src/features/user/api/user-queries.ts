'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import { apiRequest } from '@/lib/api/client';
import { orderPageSchema, type Order } from '@/features/orders/schemas/order-contracts';
import { myClassesPageSchema, mySchedulePageSchema } from '../schemas/user-contracts';

export function useUserOrders(page: number, status: '' | Order['status']) {
  const session = useSession();
  const params = new URLSearchParams({ page: String(page), pageSize: '10' });
  if (status) params.set('status', status);
  return useQuery({
    queryKey: ['orders', session.data?.id, 'user', status, page],
    enabled: session.data?.role === 'STUDENT' && session.data.status === 'ACTIVE',
    queryFn: ({ signal }) =>
      apiRequest({ path: 'me/orders?' + params, schema: orderPageSchema, signal }),
    retry: false,
  });
}
export function useMyCourses(page: number, view: 'current' | 'history' | 'all') {
  const session = useSession();
  return useQuery({
    queryKey: ['my-classes', session.data?.id, view, page],
    enabled: session.data?.role === 'STUDENT' && session.data.status === 'ACTIVE',
    queryFn: ({ signal }) =>
      apiRequest({
        path: 'me/classes?' + new URLSearchParams({ page: String(page), pageSize: '10', view }),
        schema: myClassesPageSchema,
        signal,
      }),
    retry: false,
  });
}
export function useMySchedule(from: string, to: string) {
  const session = useSession();
  return useQuery({
    queryKey: ['my-schedule', session.data?.id, from, to],
    enabled: session.data?.role === 'STUDENT' && session.data.status === 'ACTIVE',
    queryFn: async ({ signal }) => {
      const readPage = (page: number) =>
        apiRequest({
          path:
            'me/schedule?' +
            new URLSearchParams({
              from,
              to,
              page: String(page),
              pageSize: '100',
              includeCancelled: 'true',
            }),
          schema: mySchedulePageSchema,
          signal,
        });
      const first = await readPage(1);
      const items = [...first.items];
      for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++) {
        const next = await readPage(page);
        if (next.total !== first.total || next.page !== page || !next.items.length) {
          throw new Error('Lịch đã thay đổi trong khi tải. Vui lòng thử lại.');
        }
        items.push(...next.items);
      }
      return {
        ...first,
        items: [
          ...new Map(
            items.map((item) => [
              `${item.sessionId}:${item.enrollmentId}:${item.makeupPlacementId ?? 'regular'}`,
              item,
            ]),
          ).values(),
        ].sort(
          (a, b) =>
            a.startsAt.localeCompare(b.startsAt) ||
            `${a.sessionId}:${a.enrollmentId}:${a.makeupPlacementId ?? ''}`.localeCompare(
              `${b.sessionId}:${b.enrollmentId}:${b.makeupPlacementId ?? ''}`,
            ),
        ),
      };
    },
    retry: false,
  });
}
