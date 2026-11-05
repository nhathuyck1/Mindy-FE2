import { z } from 'zod';
import { courseDetailSchema } from '@/features/courses/schemas/course-contracts';
import {
  materialsQuerySchema,
  materialsSchema as baseMaterialsSchema,
  materialSchema,
  uploadInputSchema,
} from '@/features/mentor/schemas/mentor-contracts';

// Share authoring/detail DTOs with Mentor; Manager lists retain course/unit labels below.
export {
  materialDetailSchema,
  createMaterialSchema,
  patchMaterialSchema,
  revisionSchema,
  deleteMaterialQuerySchema,
  fileAccessSchema,
  fileStatusSchema,
  uploadIntentSchema,
  emptyCommandSchema,
  type Material,
  type MaterialDetail,
} from '@/features/mentor/schemas/mentor-contracts';

export const managerFiltersSchema = materialsQuerySchema
  .extend({ courseId: z.uuid().optional(), courseUnitId: z.uuid().optional() })
  .strict();
export const managerCourseDetailSchema = courseDetailSchema.omit({ openClasses: true });
export const materialsSchema = baseMaterialsSchema.extend({
  items: z.array(
    materialSchema.extend({
      courseId: z.uuid().optional(),
      courseTitle: z.string().optional(),
      courseUnitTitle: z.string().optional(),
      courseUnitNumber: z.number().int().positive().optional(),
    }),
  ),
});
export const rejectMaterialSchema = z
  .object({
    expectedRevision: z.number().int().min(1).max(2147483647),
    reason: z.string().trim().min(1).max(2000),
  })
  .strict();
export const managerUploadSchema = uploadInputSchema
  .omit({ classId: true, classUnitId: true })
  .extend({
    classId: z.uuid().optional(),
    classUnitId: z.uuid().optional(),
  })
  .refine((value) => Boolean(value.classId) === Boolean(value.classUnitId));

export const receiptInputSchema = z.object({
  studentName: z.string().trim().min(1, 'Nhập tên học viên.').max(250),
  className: z.string().trim().min(1, 'Nhập lớp học.').max(250),
  orderCode: z.string().trim().max(100),
  amount: z.number().int().positive('Số tiền phải lớn hơn 0.').max(Number.MAX_SAFE_INTEGER),
  method: z.enum(['CASH', 'TRANSFER']),
  note: z.string().trim().max(2000),
});
export const receiptSchema = receiptInputSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  status: z.enum(['DRAFT', 'RECORDED_LOCAL', 'CANCELLED']),
});
export const receiptsSchema = z.array(receiptSchema).max(1000);
export type Receipt = z.infer<typeof receiptSchema>;
