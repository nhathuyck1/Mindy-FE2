import { describe, expect, it } from 'vitest';
import { orderPaymentSchema, type OrderPayment } from '@/features/orders/schemas/order-contracts';
import { paymentSchema, payosUrlSchema } from '../schemas/payment-contracts';
import { isPayable, needsPaymentLink, shouldPollOrder, paymentHeading } from './payment-state';

const id = '55555555-5555-4555-8555-555555555555';
const now = Date.parse('2026-10-15T10:00:00Z');
const order: OrderPayment = {
  id,
  orderCode: 'MDTEST',
  paymentType: 'PAYOS',
  status: 'PENDING',
  totalAmount: 100000,
  expiresAt: '2026-10-15T10:15:00Z',
  paidAt: null,
  mentorId: null,
  createdAt: '2026-10-15T10:00:00Z',
  details: [],
  payment: null,
};
const payment = paymentSchema.parse({
  paymentId: id,
  orderId: id,
  providerOrderCode: 1000000000,
  status: 'PENDING',
  checkoutUrl: 'https://pay.payos.vn/web/test',
  qrCode: 'bank-payload',
  expiresAt: order.expiresAt,
  amount: order.totalAmount,
});

describe('Payment availability and confirmation', () => {
  it('Prepares missing/CREATING links; reuses ready links and URL-only recovery', () => {
    expect(needsPaymentLink(order, now)).toBe(true);
    expect(
      needsPaymentLink(
        { ...order, payment: { ...payment, status: 'CREATING', qrCode: null, checkoutUrl: null } },
        now,
      ),
    ).toBe(true);
    expect(needsPaymentLink({ ...order, payment }, now)).toBe(false);
    expect(needsPaymentLink({ ...order, payment: { ...payment, qrCode: null } }, now)).toBe(false);
  });
  it.each(['PAID', 'CANCELLED', 'EXPIRED'] as const)(
    'Never offers another payment for %s',
    (status) => {
      expect(isPayable({ ...order, status }, now)).toBe(false);
      expect(shouldPollOrder({ ...order, status }, now)).toBe(false);
    },
  );
  it('Stops payment for expired holds, CASH, review and already-recorded transactions', () => {
    expect(isPayable(order, Date.parse(order.expiresAt))).toBe(false);
    expect(isPayable({ ...order, paymentType: 'CASH' }, now)).toBe(false);
    for (const status of ['REQUIRES_REVIEW', 'SUCCEEDED'] as const) {
      expect(isPayable({ ...order, payment: { ...payment, status } }, now)).toBe(false);
    }
    expect(
      shouldPollOrder({ ...order, payment: { ...payment, status: 'REQUIRES_REVIEW' } }, now),
    ).toBe(false);
    expect(shouldPollOrder({ ...order, payment: { ...payment, status: 'SUCCEEDED' } }, now)).toBe(
      true,
    );
    expect(paymentHeading({ ...order, payment: { ...payment, status: 'SUCCEEDED' } }, now)).toBe(
      'Đang đồng bộ kết quả thanh toán',
    );
    expect(paymentHeading({ ...order, status: 'PAID' }, now)).toBe('Thanh toán thành công');
  });
  it('Rejects payment/order mismatches and arbitrary external checkout URLs', () => {
    expect(
      orderPaymentSchema.safeParse({ ...order, payment: { ...payment, amount: 1 } }).success,
    ).toBe(false);
    expect(
      orderPaymentSchema.safeParse({
        ...order,
        payment: { ...payment, orderId: '66666666-6666-4666-8666-666666666666' },
      }).success,
    ).toBe(false);
    for (const url of [
      'javascript:alert(1)',
      'https://pay.payos.vn.evil.test/web/a',
      'https://user:pass@pay.payos.vn/web/a',
      'http://pay.payos.vn/web/a',
    ])
      expect(payosUrlSchema.safeParse(url).success).toBe(false);
    expect(orderPaymentSchema.safeParse({ ...order, payment: null }).success).toBe(true);
    expect(paymentSchema.safeParse({ ...payment, qrCode: null, checkoutUrl: null }).success).toBe(
      true,
    );
  });
});
