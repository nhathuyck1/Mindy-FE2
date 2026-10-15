'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession, sessionKey } from '@/features/auth/api/auth-queries';
import { orderKey } from '@/features/orders/api/order-queries';
import { orderPaymentSchema, type OrderPayment } from '@/features/orders/schemas/order-contracts';
import { apiRequest } from '@/lib/api/client';
import { userSchema } from '@/lib/api/contracts';
import { paymentSchema } from '../schemas/payment-contracts';
import { isPayable, needsPaymentLink } from '../lib/payment-state';

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
}

export function usePreparePayment(order: OrderPayment | undefined) {
  const session = useSession();
  const queryClient = useQueryClient();
  const launched = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const userId = session.data?.id;
  const mutation = useMutation({
    retry: false,
    mutationFn: async () => {
      if (!order || !userId) throw new Error('Không tìm thấy đơn hàng.');
      controller.current?.abort();
      const attempt = new AbortController();
      controller.current = attempt;
      const key = orderKey(userId, order.id);
      for (let retry = 0; retry <= 3; retry++) {
        if (retry > 0) await delay(1000 * 2 ** retry, attempt.signal);
        const currentSession = userSchema.safeParse(queryClient.getQueryData(sessionKey));
        if (!currentSession.success || currentSession.data.id !== userId)
          throw new Error('Phiên đã thay đổi.');
        // Read before every attempt: a webhook may have settled the order during backoff.
        const latest = await apiRequest({
          path: `me/orders/${order.id}`,
          schema: orderPaymentSchema,
          signal: attempt.signal,
        });
        attempt.signal.throwIfAborted();
        queryClient.setQueryData(key, latest);
        if (!needsPaymentLink(latest, Date.now())) return latest.payment;
        const payment = await apiRequest({
          path: `me/orders/${order.id}/payments/payos`,
          method: 'POST',
          body: {},
          schema: paymentSchema,
          signal: attempt.signal,
        });
        if (payment.orderId !== order.id || payment.amount !== order.totalAmount)
          throw new Error('Giao dịch không khớp đơn hàng.');
        queryClient.setQueryData<OrderPayment>(key, (current) =>
          current && isPayable(current, Date.now()) ? { ...current, payment } : current,
        );
        if (payment.status !== 'CREATING' || retry === 3) return payment;
      }
      return null;
    },
    onSuccess: () => {
      if (!controller.current?.signal.aborted && order)
        void queryClient.invalidateQueries({ queryKey: orderKey(userId, order.id) });
    },
  });
  const { mutate } = mutation;
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!order || launched.current || !needsPaymentLink(order, Date.now())) return;
    // Defer one task so Strict Mode's setup/cleanup cannot send duplicate POSTs.
    const timer = setTimeout(() => {
      launched.current = true;
      mutate();
    }, 0);
    return () => clearTimeout(timer);
  }, [order, mutate]);
  return mutation;
}
