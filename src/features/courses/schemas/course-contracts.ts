import { z } from 'zod';

const categoryRefSchema = z.object({ id: z.uuid(), name: z.string(), slug: z.string() });
export const courseSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  imgUrl: z.url().nullable(),
  priceAmount: z.number().int().nonnegative(),
  category: categoryRefSchema,
});
const pagination = {
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
};
export const coursePageSchema = z.object({ items: z.array(courseSchema), ...pagination });
export const categoryPageSchema = z.object({
  items: z.array(
    categoryRefSchema.extend({ description: z.string().nullable(), isActive: z.boolean() }),
  ),
  ...pagination,
});
export const publicClassSchema = z.object({
  id: z.uuid(),
  courseId: z.uuid(),
  code: z.string(),
  name: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  deliveryMode: z.enum(['ONLINE', 'OFFLINE']),
  maxStudents: z.number().int().positive(),
  availableSeats: z.number().int().nonnegative(),
  mentor: z.object({ id: z.uuid(), displayName: z.string().nullable() }),
});
export const classPageSchema = z.object({ items: z.array(publicClassSchema), ...pagination });
const courseUnitSchema = z.object({
  id: z.uuid(),
  unitNumber: z.number().int().positive(),
  title: z.string(),
  description: z.string().nullable(),
  requiredScorePercent: z.number().min(0).max(100),
});
export const courseDetailSchema = courseSchema.extend({
  units: z.array(courseUnitSchema),
  openClasses: z.array(publicClassSchema),
});
export const classSessionSchema = z.object({
  id: z.uuid(),
  sessionNumber: z.number().int().positive(),
  title: z.string(),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  roomName: z.string().nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});
export const classDetailSchema = publicClassSchema.extend({
  units: z.array(
    z.object({
      id: z.uuid(),
      position: z.number().int().positive(),
      title: z.string(),
      sessions: z.array(classSessionSchema),
    }),
  ),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const classFiltersQuerySchema = paginationQuerySchema
  .extend({
    deliveryMode: z.enum(['ONLINE', 'OFFLINE']).optional(),
    startsFrom: z.iso.date().optional(),
    startsTo: z.iso.date().optional(),
  })
  .refine((value) => !value.startsFrom || !value.startsTo || value.startsFrom <= value.startsTo);
export const courseFiltersQuerySchema = classFiltersQuerySchema.safeExtend({
  categoryId: z.uuid().optional(),
});

export type Course = z.infer<typeof courseSchema>;
export type CourseDetail = z.infer<typeof courseDetailSchema>;
export type CourseCategory = z.infer<typeof categoryRefSchema>;
export type PublicClass = z.infer<typeof publicClassSchema>;
export type ClassDetail = z.infer<typeof classDetailSchema>;
export type ClassSession = z.infer<typeof classSessionSchema>;
