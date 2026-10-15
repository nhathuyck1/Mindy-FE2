import { z } from 'zod';
import { paymentSchema } from '@/features/payments/schemas/payment-contracts';

export const orderStatusSchema = z.enum(['PENDING', 'PAID', 'EXPIRED', 'CANCELLED']);
export const checkoutInputSchema = z.object({ paymentType: z.literal('PAYOS') }).strict();
export const orderSchema = z.object({
  id: z.uuid(),
  orderCode: z.string().min(1),
  paymentType: z.enum(['PAYOS', 'CASH']),
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
  .object({ orders: z.array(orderSchema).length(1) })
  .refine((result) => result.orders[0].paymentType === 'PAYOS');
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
