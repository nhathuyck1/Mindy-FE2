import { z } from 'zod';
import { paymentSchema } from '@/features/payments/schemas/payment-contracts';

export const orderStatusSchema = z.enum(['PENDING', 'PAID', 'EXPIRED', 'CANCELLED']);
export const paymentTypeSchema = z.enum(['PAYOS', 'CASH']);
export const checkoutInputSchema = z.object({ paymentType: paymentTypeSchema }).strict();
export const orderSchema = z.object({
  id: z.uuid(),
  orderCode: z.string().min(1),
  paymentType: paymentTypeSchema,
  status: orderStatusSchema,
  totalAmount: z.number().int().nonnegative(),
  expiresAt: z.iso.datetime({ offset: true }),
  paidAt: z.iso.datetime({ offset: true }).nullable(),
  mentorId: z.uuid().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  details: z.array(
    z.object({
      id: z.uuid(),
      classId: z.uuid(),
      courseTitle: z.string(),
      className: z.string(),
      priceAmount: z.number().int().nonnegative(),
      quantity: z.number().int().positive(),
      totalAmount: z.number().int().nonnegative(),
    }),
  ),
});
export const checkoutResultSchema = z
  .object({ orders: z.array(orderSchema).min(1).max(20) })
  .refine(({ orders }) => {
    const type = orders[0]?.paymentType;
    if (!type) return false;
    return (
      orders.every((order) => order.paymentType === type) &&
      (type === 'CASH' || orders.length === 1) &&
      new Set(orders.map((order) => order.id)).size === orders.length
    );
  });
export const orderPaymentSchema = orderSchema
  .extend({ payment: paymentSchema.nullable() })
  .refine(
    (order) =>
      !order.payment ||
      (order.payment.orderId === order.id && order.payment.amount === order.totalAmount),
    'Giao dịch không khớp với đơn hàng.',
  );
export const orderFiltersSchema = z
  .object({
    status: orderStatusSchema.optional(),
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export const orderPageSchema = z.object({
  items: z.array(orderSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type Order = z.infer<typeof orderSchema>;
export type OrderPayment = z.infer<typeof orderPaymentSchema>;
