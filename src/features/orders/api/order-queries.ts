'use client';

import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import { ApiError, apiRequest } from '@/lib/api/client';
import { shouldPollOrder } from '@/features/payments/lib/payment-state';
import { paymentResultQuerySchema } from '@/features/payments/schemas/payment-contracts';
import {
  checkoutInputSchema,
  checkoutResultSchema,
  orderPageSchema,
  orderPaymentSchema,
} from '../schemas/order-contracts';

export const ordersKey = (userId?: string) => ['orders', userId] as const;
export const orderKey = (userId: string | undefined, orderId: string) =>
  ['order', userId, orderId] as const;

export function usePendingOrders(page: number) {
  const session = useSession();
  return useQuery({
    queryKey: [...ordersKey(session.data?.id), 'PENDING', page],
    enabled: session.isSuccess && session.data?.role === 'STUDENT',
    queryFn: ({ signal }) =>
      apiRequest({
        path: `me/orders?status=PENDING&page=${page}&pageSize=10`,
        schema: orderPageSchema,
        signal,
      }),
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: () =>
      apiRequest({
        path: 'me/cart/checkout',
        method: 'POST',
        body: checkoutInputSchema.parse({ paymentType: 'PAYOS' }),
        schema: checkoutResultSchema,
      }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cart'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog'] }),
      ]),
  });
}

export function useOrder(orderId: string) {
  const session = useSession();
  const cycleStarted = useRef(0);
  const query = useQuery({
    queryKey: orderKey(session.data?.id, orderId),
    enabled: session.isSuccess && session.data?.role === 'STUDENT',
    queryFn: ({ signal }) => {
      if (!cycleStarted.current) cycleStarted.current = Date.now();
      return apiRequest({ path: `me/orders/${orderId}`, schema: orderPaymentSchema, signal });
    },
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: 'always',
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const { data, error } = query.state;
      const elapsed = Date.now() - cycleStarted.current;
      if (error instanceof ApiError && [401, 403, 404].includes(error.status)) return false;
      if (!data || elapsed > 300_000 || !shouldPollOrder(data, Date.now())) return false;
      return error || elapsed > 30_000 ? 10_000 : 3_000;
    },
  });
  const check = () => {
    cycleStarted.current = Date.now();
    return query.refetch();
  };
  return { ...query, check };
}

export function usePaymentResult(orderCode: string) {
  const session = useSession();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['payment-result', session.data?.id, orderCode],
    enabled: session.isSuccess && session.data?.role === 'STUDENT',
    staleTime: 0,
    retry: false,
    queryFn: async ({ signal }) => {
      const input = paymentResultQuerySchema.parse({ orderCode });
      const order = await apiRequest({
        path: `me/orders/payment-result?${new URLSearchParams(input)}`,
        schema: orderPaymentSchema,
        signal,
      });
      queryClient.setQueryData(orderKey(session.data?.id, order.id), order);
      return order;
    },
  });
}
