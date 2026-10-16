import { z } from 'zod';
import { orderSchema, orderStatusSchema } from '@/features/orders/schemas/order-contracts';
import {
  mentorClassPageSchema,
  mentorClassesQuerySchema,
} from '@/features/mentor/schemas/mentor-contracts';
import { paginationQuerySchema } from '@/features/courses/schemas/course-contracts';

const timestamp = z.iso.datetime({ offset: true });
const money = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const student = z.object({ id: z.uuid(), displayName: z.string().nullable() });
const payment = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  amount: money,
  status: z.enum(['CREATING', 'PENDING', 'SUCCEEDED', 'REQUIRES_REVIEW']),
  paidAt: timestamp.nullable(),
  confirmedBy: z
    .object({
      id: z.uuid(),
      displayName: z.string().nullable(),
      source: z.enum(['MANAGER', 'LEGACY_MENTOR']),
    })
    .nullable(),
  review: z
    .object({ outcome: z.literal('REQUIRES_REVIEW'), reason: z.string().nullable() })
    .nullable(),
});
export const collectionOrderSchema = orderSchema.omit({ mentorId: true, details: true }).extend({
  totalAmount: money,
  student,
  payment: payment.nullable(),
});
export const collectionOrderDetailSchema = orderSchema.extend({
  totalAmount: money,
  student,
  payment: payment.nullable(),
});
export const collectionOrdersSchema = z.object({
  items: z.array(collectionOrderSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export const collectionFiltersSchema = paginationQuerySchema
  .extend({
    status: orderStatusSchema.optional(),
    paymentType: z.enum(['CASH', 'PAYOS']).optional(),
    classId: z.uuid().optional(),
    orderCode: z.string().trim().min(1).max(50).optional(),
  })
  .strict();
export const confirmCashSchema = z.object({ receivedAmount: money.min(1) }).strict();
export const confirmedCashOrderSchema = orderSchema.extend({
  totalAmount: money.min(1),
  paymentType: z.literal('CASH'),
  status: z.literal('PAID'),
  paidAt: timestamp,
});
export {
  mentorClassPageSchema as collectionClassesSchema,
  mentorClassesQuerySchema as collectionClassesFiltersSchema,
};
export type CollectionOrder = z.infer<typeof collectionOrderSchema>;
export type CollectionOrderDetail = z.infer<typeof collectionOrderDetailSchema>;
export type ConfirmedCashOrder = z.infer<typeof confirmedCashOrderSchema>;
