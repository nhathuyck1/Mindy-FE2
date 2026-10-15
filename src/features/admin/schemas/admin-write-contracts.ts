import { z } from 'zod';
import { userSchema } from '@/lib/api/contracts';
import {
  classSessionSchema,
  courseDetailSchema,
} from '@/features/courses/schemas/course-contracts';
import { adminClassSchema, adminCourseSchema } from './admin-contracts';

const title = z.string().trim().min(1).max(250);
const code = z
  .string()
  .trim()
  .min(2)
  .max(50)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);
const description = z.string().max(10_000);
export const adminHttpUrlSchema = z
  .url()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, 'URL phải bắt đầu bằng http:// hoặc https:// và không chứa thông tin đăng nhập.');
export const createAdminUserSchema = z
  .object({
    displayName: z.string().trim().min(1).max(150),
    email: z.email().max(320),
    phone: z.string().min(7).max(32).optional(),
    password: z.string().min(6).max(128),
    role: userSchema.shape.role,
  })
  .strict();
export const updateAdminUserStatusSchema = z.object({ status: userSchema.shape.status }).strict();
export const createAdminCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    slug: z
      .string()
      .min(1)
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    description: z.string().max(2000).optional(),
  })
  .strict();
export const createAdminCourseSchema = z
  .object({
    categoryId: z.uuid(),
    code,
    title,
    description: description.optional(),
    imgUrl: adminHttpUrlSchema.nullable().optional(),
    priceAmount: z.number().int().min(0).max(1_000_000_000_000),
  })
  .strict();
export const updateAdminCourseSchema = createAdminCourseSchema
  .omit({ code: true })
  .extend({ description: description.nullable().optional() })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Chưa có thông tin cần cập nhật.');
export const addAdminCourseUnitSchema = z
  .object({
    title,
    description: description.optional(),
    requiredScorePercent: z.number().min(0).max(100).multipleOf(0.01).optional(),
  })
  .strict();
export const reorderAdminCourseUnitsSchema = z
  .object({
    unitIds: z
      .array(z.uuid())
      .min(1)
      .max(200)
      .refine((ids) => new Set(ids).size === ids.length),
  })
  .strict();
const classFields = {
  name: title,
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  maxStudents: z.number().int().min(1).max(1000),
  deliveryMode: z.enum(['ONLINE', 'OFFLINE']),
  meetingUrl: adminHttpUrlSchema.nullable().optional(),
};
export const createAdminClassSchema = z
  .object({
    ...classFields,
    courseId: z.uuid(),
    mentorId: z.uuid(),
    code,
    meetingUrl: adminHttpUrlSchema.optional(),
  })
  .strict()
  .refine(
    (value) => value.startDate <= value.endDate,
    'Ngày kết thúc phải từ ngày khai giảng trở đi.',
  );
// Audited mentor assignment is intentionally not mixed into a normal class edit.
export const updateAdminClassSchema = z
  .object(classFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Chưa có thông tin cần cập nhật.')
  .refine(
    (value) => !value.startDate || !value.endDate || value.startDate <= value.endDate,
    'Ngày kết thúc phải từ ngày khai giảng trở đi.',
  );
export const scheduleAdminSessionSchema = z
  .object({
    classUnitId: z.uuid(),
    title,
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    roomName: z.string().max(150).optional(),
    meetingUrl: adminHttpUrlSchema.optional(),
  })
  .strict()
  .refine(
    (value) => Date.parse(value.startsAt) < Date.parse(value.endsAt),
    'Giờ kết thúc phải sau giờ bắt đầu.',
  );
export const emptyAdminCommandSchema = z.object({}).strict();
export const updateAdminSessionTimeSchema = z
  .object({
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  })
  .strict()
  .refine(
    (value) => value.startTime < value.endTime,
    'Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày.',
  );
export const adminCourseUnitSchema = courseDetailSchema.shape.units.element;
export const adminCourseDetailSchema = adminCourseSchema.extend({
  units: z.array(adminCourseUnitSchema),
});
export const adminClassDetailSchema = adminClassSchema.extend({
  meetingUrl: adminHttpUrlSchema.nullable(),
  units: z.array(
    z.object({
      id: z.uuid(),
      courseUnitId: z.uuid(),
      position: z.number().int().positive(),
      title: z.string(),
      status: z.enum(['LOCKED', 'OPEN', 'COMPLETED']),
      unlockAt: z.iso.datetime({ offset: true }).nullable(),
      sessions: z.array(
        classSessionSchema.extend({
          classUnitId: z.uuid(),
          meetingUrl: adminHttpUrlSchema.nullable(),
        }),
      ),
    }),
  ),
});
export type AdminCourseDetail = z.infer<typeof adminCourseDetailSchema>;
export type AdminClassDetail = z.infer<typeof adminClassDetailSchema>;
