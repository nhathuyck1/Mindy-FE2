import { z } from 'zod';

export const addCartItemSchema = z.object({ classId: z.uuid() }).strict();
export const cartSchema = z.object({
  items: z.array(
    z.object({
      classId: z.uuid(),
      classCode: z.string(),
      className: z.string(),
      courseId: z.uuid(),
      courseTitle: z.string(),
      deliveryMode: z.enum(['ONLINE', 'OFFLINE']),
      startDate: z.iso.date(),
      endDate: z.iso.date(),
      priceSnapshot: z.number().int().nonnegative(),
      currentPriceAmount: z.number().int().nonnegative(),
      isPurchasable: z.boolean(),
      addedAt: z.iso.datetime({ offset: true }),
    }),
  ),
  totalAmount: z.number().int().nonnegative(),
});
