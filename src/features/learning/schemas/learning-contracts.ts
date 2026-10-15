import { z } from 'zod';
import { classSessionSchema, publicClassSchema } from '@/features/courses/schemas/course-contracts';

const time = z.iso.datetime({ offset: true });
export const safeResourceUrl = z.url().refine((value) => {
  const url = new URL(value);
  return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
});
export const learningUnitSchema = z.object({
  id: z.uuid(),
  position: z.number().int().positive(),
  title: z.string(),
  courseUnitId: z.uuid().optional(),
  status: z.enum(['OPEN', 'LOCKED']).optional(),
  unlockAt: time.nullable().optional(),
  sessions: z.array(
    classSessionSchema.extend({ meetingUrl: safeResourceUrl.nullable().optional() }),
  ),
});
const context = publicClassSchema.extend({
  units: z.array(learningUnitSchema),
  classStatus: z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  enrollmentId: z.uuid(),
  enrollmentStatus: z.enum(['PENDING_PAYMENT', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
});
export const studentClassSchema = context.extend({
  accessMode: z.literal('FULL'),
  enrolledAt: time.nullable(),
  meetingUrl: safeResourceUrl.nullable(),
});
export const previewClassSchema = context.extend({
  units: z.array(learningUnitSchema.extend({ sessions: z.array(classSessionSchema) })),
  accessMode: z.literal('CASH_PREVIEW'),
  orderId: z.uuid(),
  orderCode: z.string(),
  expiresAt: time,
});
export const materialFileSchema = z.object({
  id: z.uuid(),
  originalFilename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  kind: z.enum([
    'PDF',
    'IMAGE',
    'DOCUMENT',
    'PRESENTATION',
    'SPREADSHEET',
    'AUDIO',
    'VIDEO',
    'SOURCE_CODE',
  ]),
});
export const materialSchema = z.object({
  id: z.uuid(),
  classId: z.uuid(),
  classUnitId: z.uuid(),
  courseUnitId: z.uuid(),
  contentType: z.enum(['ARTICLE', 'FILE', 'VIDEO']),
  title: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  revision: z.number().int().positive(),
  sessionId: z.uuid().nullable(),
  availableAt: time.nullable(),
  publishedAt: time,
  updatedAt: time,
  file: materialFileSchema.nullable(),
  attachmentCount: z.number().int().nonnegative(),
});
export const materialDetailSchema = materialSchema.extend({
  contentHtml: z.string().nullable(),
  contentSchemaVersion: z.number().int().nullable(),
  inlineImages: z.array(materialFileSchema),
  attachments: z.array(materialFileSchema),
});
export const materialPageSchema = z.object({
  items: z.array(materialSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  asOf: time,
});
export const materialDownloadSchema = z.object({
  materialId: z.uuid(),
  fileId: z.uuid(),
  url: safeResourceUrl,
  expiresAt: time,
});
export const fileAccessSchema = materialDownloadSchema.extend({
  role: z.enum(['PRIMARY', 'INLINE_IMAGE', 'ATTACHMENT']),
  revision: z.number().int().positive(),
});
export type LearningClass = z.infer<typeof studentClassSchema> | z.infer<typeof previewClassSchema>;
export type LearningUnit = z.infer<typeof learningUnitSchema>;
export type Material = z.infer<typeof materialSchema>;
export type MaterialDetail = z.infer<typeof materialDetailSchema>;
export type MaterialFile = z.infer<typeof materialFileSchema>;
