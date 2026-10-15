import { z } from 'zod';

export const providerOrderCodeSchema = z.string().regex(/^[1-9][0-9]{0,15}$/);
export const paymentResultQuerySchema = z.object({ orderCode: providerOrderCodeSchema }).strict();
export const emptyPaymentSchema = z.object({}).strict();
export const payosUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === 'https:' &&
    url.hostname === 'pay.payos.vn' &&
    !url.port &&
    !url.username &&
    !url.password
  );
}, 'Đường dẫn thanh toán không hợp lệ.');

export const paymentSchema = z.object({
  paymentId: z.uuid(),
  orderId: z.uuid(),
  providerOrderCode: z.number().int().positive().nullable(),
  status: z.enum(['CREATING', 'PENDING', 'SUCCEEDED', 'REQUIRES_REVIEW']),
  checkoutUrl: payosUrlSchema.nullable(),
  qrCode: z.string().min(1).nullable(),
  expiresAt: z.iso.datetime({ offset: true }),
  amount: z.number().int().nonnegative(),
});
export type Payment = z.infer<typeof paymentSchema>;
