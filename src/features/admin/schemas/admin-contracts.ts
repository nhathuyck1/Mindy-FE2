import { z } from 'zod';
import { userSchema } from '@/lib/api/contracts';
import {
  courseSchema,
  paginationQuerySchema,
  publicClassSchema,
} from '@/features/courses/schemas/course-contracts';

const pagination = {
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
};
export const adminUserPageSchema = z.object({
  items: z.array(
    userSchema.extend({
      createdAt: z.iso.datetime({ offset: true }),
      lastLoginAt: z.iso.datetime({ offset: true }).nullable(),
    }),
  ),
  ...pagination,
});
export const adminCourseSchema = courseSchema.extend({
  isActive: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export const adminCoursePageSchema = z.object({ items: z.array(adminCourseSchema), ...pagination });
export const classStatusSchema = z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
// The table deliberately consumes no private meeting URLs.
export const adminClassSchema = publicClassSchema.extend({
  status: classStatusSchema,
  assignmentVersion: z.number().int().positive(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export const adminClassPageSchema = z.object({ items: z.array(adminClassSchema), ...pagination });
export const adminUserFiltersSchema = paginationQuerySchema
  .extend({
    role: userSchema.shape.role.optional(),
    status: userSchema.shape.status.optional(),
  })
  .strict();
export const adminCourseFiltersSchema = paginationQuerySchema
  .extend({
    categoryId: z.uuid().optional(),
    isActive: z.enum(['true', 'false']).optional(),
  })
  .strict();
export const adminClassFiltersSchema = paginationQuerySchema
  .extend({
    courseId: z.uuid().optional(),
    mentorId: z.uuid().optional(),
    status: classStatusSchema.optional(),
    deliveryMode: z.enum(['ONLINE', 'OFFLINE']).optional(),
  })
  .strict();
export type AdminCourse = z.infer<typeof adminCourseSchema>;
export type AdminClass = z.infer<typeof adminClassSchema>;

export const adminClassStudentsPageSchema = z.object({
  items: z.array(
    z.object({
      studentId: z.uuid(),
      studentName: z.string(),
      email: z.email(),
      phone: z.string().nullable(),
      studentStatus: userSchema.shape.status,
      enrollmentId: z.uuid(),
      enrollmentStatus: z.enum(['PENDING_PAYMENT', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
      enrolledAt: z.iso.datetime({ offset: true }).nullable(),
    }),
  ),
  ...pagination,
});
