import { z } from 'zod';
import {
  paginationQuerySchema,
  publicClassSchema,
} from '@/features/courses/schemas/course-contracts';

const timestamp = z.iso.datetime({ offset: true });
const count = z.number().int().nonnegative();
const version = z.number().int().positive();
export const pageFields = { page: version, pageSize: version, total: count };
export const mentorPaginationSchema = paginationQuerySchema.strict();
export const classStatusSchema = z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const sessionStatusSchema = z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const mentorClassesQuerySchema = paginationQuerySchema
  .extend({
    status: classStatusSchema.optional(),
    assignment: z.enum(['PRIMARY', 'SUBSTITUTE', 'ANY']).optional(),
  })
  .strict();
export const mentorClassSchema = publicClassSchema.extend({
  status: classStatusSchema,
  assignmentType: z.enum(['PRIMARY', 'SUBSTITUTE', 'BOTH']),
  accessScope: z.enum(['CLASS', 'SESSION']),
});
export const mentorClassPageSchema = z.object({ items: z.array(mentorClassSchema), ...pageFields });
const person = z.object({ id: z.uuid(), displayName: z.string().nullable() });
export const teachingSessionSchema = z.object({
  makeupForSessionId: z.uuid().nullable().optional(),
  makeupRootSessionId: z.uuid().nullable().optional(),
  sessionId: z.uuid(),
  classId: z.uuid(),
  classUnitId: z.uuid(),
  title: z.string(),
  startsAt: timestamp,
  endsAt: timestamp,
  status: sessionStatusSchema,
  primaryMentor: person,
  effectiveMentor: person.nullable(),
  assignmentType: z.enum(['PRIMARY', 'SUBSTITUTE']),
  version,
  actualStartedAt: timestamp.nullable(),
  actualEndedAt: timestamp.nullable(),
  editableUntil: timestamp.nullable(),
  asOf: timestamp,
  timeZone: z.string(),
});
export const scheduleQuerySchema = paginationQuerySchema
  .extend({
    from: timestamp.optional(),
    to: timestamp.optional(),
    classId: z.uuid().optional(),
  })
  .strict()
  .refine(
    (v) => (!v.from && !v.to) || Boolean(v.from && v.to && Date.parse(v.from) < Date.parse(v.to)),
  );
export const scheduleSchema = z.object({
  items: z.array(teachingSessionSchema),
  ...pageFields,
  from: timestamp,
  to: timestamp,
  timeZone: z.string(),
  asOf: timestamp,
});
export const sessionContextSchema = z.object({
  session: teachingSessionSchema,
  roomName: z.string().nullable(),
  meetingUrl: z.url().nullable(),
  accessScope: z.literal('SESSION'),
});
const orderStatus = z.enum(['PENDING', 'PAID', 'EXPIRED', 'CANCELLED']);
export const rosterQuerySchema = paginationQuerySchema
  .extend({
    paymentType: z.enum(['CASH', 'PAYOS']).optional(),
    orderStatus: orderStatus.optional(),
  })
  .strict();
export const classRosterSchema = z.object({
  ...pageFields,
  items: z.array(
    z.object({
      enrollmentId: z.uuid(),
      enrollmentStatus: z.enum(['PENDING_PAYMENT', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
      studentId: z.uuid(),
      studentName: z.string(),
      orderId: z.uuid(),
      orderCode: z.string(),
      orderStatus,
      paymentType: z.enum(['CASH', 'PAYOS']),
      classAmount: count,
      orderTotalAmount: count,
      orderClassCount: version,
      expiresAt: timestamp,
      paidAt: timestamp.nullable(),
      canConfirmCash: z.boolean(),
    }),
  ),
});
const attendanceStatus = z.enum(['UNMARKED', 'PRESENT', 'ABSENT']);
const attendanceSession = teachingSessionSchema.extend({
  permissions: z.object({
    canStart: z.boolean(),
    canEditAttendance: z.boolean(),
    canFinalize: z.boolean(),
    canSyncRoster: z.boolean(),
    canRecover: z.boolean(),
    canViewAttendanceAudits: z.boolean(),
  }),
});
const totals = z.object({ present: count, absent: count, unmarked: count, eligible: count });
export const attendanceSchema = z.object({
  ...pageFields,
  session: attendanceSession,
  totals,
  pendingPaymentCount: count,
  items: z.array(
    z.object({
      attendanceId: z.uuid(),
      enrollmentId: z.uuid(),
      entryType: z.enum(['REGULAR', 'MAKEUP']),
      makeupPlacementId: z.uuid().nullable(),
      student: person,
      status: attendanceStatus,
      checkedInAt: timestamp.nullable(),
      admittedAt: timestamp,
    }),
  ),
});
export const attendanceWriteSchema = z.object({
  session: attendanceSession,
  totals,
  changedEnrollmentIds: z.array(z.uuid()),
  changedMakeupPlacementIds: z.array(z.uuid()),
});
export const attendanceCommandSchema = z.object({ expectedVersion: version }).strict();
export const attendanceMarkSchema = attendanceCommandSchema
  .extend({
    records: z
      .array(z.object({ enrollmentId: z.uuid(), status: attendanceStatus }).strict())
      .min(0)
      .max(100),
    guestRecords: z
      .array(z.object({ makeupPlacementId: z.uuid(), status: attendanceStatus }).strict())
      .max(100)
      .optional(),
  })
  .strict()
  .refine((v) => v.records.length + (v.guestRecords?.length ?? 0) > 0);
export const unitSchema = z.object({
  id: z.uuid(),
  classId: z.uuid(),
  courseUnitId: z.uuid(),
  title: z.string(),
  position: version,
  status: z.enum(['LOCKED', 'OPEN', 'COMPLETED']),
  unlockAt: timestamp.nullable(),
});
export const unitsSchema = z.object({ items: z.array(unitSchema), ...pageFields });
export const unitDetailSchema = unitSchema.omit({ classId: true }).extend({
  sessions: z.array(
    z.object({
      id: z.uuid(),
      classUnitId: z.uuid(),
      title: z.string(),
      sessionNumber: version,
      startsAt: timestamp,
      endsAt: timestamp,
      roomName: z.string().nullable(),
      meetingUrl: z.url().nullable(),
      status: sessionStatusSchema,
    }),
  ),
});
export const unitSessionSchema = z.object({
  id: z.uuid(),
  classUnitId: z.uuid(),
  title: z.string(),
  sessionNumber: version,
  status: sessionStatusSchema,
});
export const unitSessionsSchema = z.object({
  items: z.array(unitSessionSchema),
  ...pageFields,
});
export const unitTimetableSchema = z.object({
  items: z.array(
    teachingSessionSchema.extend({
      capabilities: z.object({ readSessionContext: z.boolean(), writeTeachingNotes: z.boolean() }),
    }),
  ),
  ...pageFields,
});
export type ContentSession = z.infer<typeof unitSessionSchema> & {
  startsAt: string;
  endsAt: string;
  canReadContext: boolean;
};
export const materialTypeSchema = z.enum(['ARTICLE', 'FILE', 'VIDEO']);
const reviewStatus = z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']);
const fileKind = z.enum([
  'PDF',
  'IMAGE',
  'DOCUMENT',
  'PRESENTATION',
  'SPREADSHEET',
  'AUDIO',
  'VIDEO',
  'SOURCE_CODE',
]);
const fileSummary = z.object({
  id: z.uuid(),
  originalFilename: z.string(),
  mimeType: z.string(),
  sizeBytes: count,
  kind: fileKind,
});
export const materialSchema = z.object({
  id: z.uuid(),
  courseUnitId: z.uuid(),
  contentType: materialTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  sortOrder: count,
  availableAt: timestamp.nullable(),
  sessionId: z.uuid().nullable(),
  createdBy: z.uuid(),
  createdInClassId: z.uuid().nullable(),
  revision: version,
  reviewStatus,
  approvedRevision: version.nullable(),
  reviewedBy: z.string().nullable(),
  reviewedAt: timestamp.nullable(),
  firstApprovedAt: timestamp.nullable(),
  rejectionReason: z.string().nullable(),
  publishedAt: timestamp.nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
  canEdit: z.boolean(),
  file: fileSummary.nullable(),
});
export const materialDetailSchema = materialSchema.extend({
  contentHtml: z.string().nullable(),
  contentSchemaVersion: version.nullable(),
  inlineImages: z.array(fileSummary),
  attachments: z.array(fileSummary),
});
export const materialsSchema = z.object({ items: z.array(materialSchema), ...pageFields });
export const materialsQuerySchema = paginationQuerySchema
  .extend({ reviewStatus: reviewStatus.optional(), contentType: materialTypeSchema.optional() })
  .strict();
const materialFields = {
  title: z.string().trim().min(1).max(250),
  description: z.string().max(5000).nullable().optional(),
  sortOrder: z.number().int().min(0).max(2147483647).optional(),
  availableAt: timestamp.nullable().optional(),
  sessionId: z.uuid().nullable().optional(),
  contentHtml: z
    .string()
    .refine((v) => new TextEncoder().encode(v).byteLength <= 49152, 'Bài viết tối đa 48 KiB.')
    .optional(),
  contentText: z
    .string()
    .max(49152)
    .refine((v) => new TextEncoder().encode(v).byteLength <= 49152, 'Bài viết tối đa 48 KiB.')
    .optional(),
  fileId: z.uuid().optional(),
  attachmentFileIds: z
    .array(z.uuid())
    .max(50)
    .refine((ids) => new Set(ids).size === ids.length)
    .optional(),
};
export const createMaterialSchema = z
  .object({
    ...materialFields,
    contentType: materialTypeSchema,
    contentSchemaVersion: z.literal(1).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.contentType === 'ARTICLE'
        ? (!v.contentHtml?.trim() && !v.contentText?.trim()) || v.fileId !== undefined
        : !v.fileId || v.contentHtml !== undefined || v.contentText !== undefined
    )
      ctx.addIssue({
        code: 'custom',
        message: 'Bài viết cần nội dung; tài liệu và video cần file đã kiểm tra.',
      });
    if (v.contentHtml !== undefined && v.contentText !== undefined)
      ctx.addIssue({ code: 'custom', message: 'Chỉ chọn một cách nhập nội dung.' });
  });
export const revisionSchema = z.object({ expectedRevision: version.max(2147483647) }).strict();
export const deleteMaterialQuerySchema = z
  .object({ expectedRevision: z.coerce.number().int().min(1).max(2147483647) })
  .strict();
export const patchMaterialSchema = z
  .object(materialFields)
  .partial()
  .extend({ expectedRevision: version.max(2147483647) })
  .strict()
  .refine(
    (v) => v.contentHtml === undefined || v.contentText === undefined,
    'Chỉ chọn một cách nhập nội dung.',
  )
  .refine(
    (v) => v.contentText === undefined || Boolean(v.contentText.trim()),
    'Nội dung không được để trống.',
  );
const storageUrl = z.url().refine((value) => {
  const url = new URL(value);
  return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
});
export const fileAccessSchema = z.object({
  materialId: z.uuid(),
  fileId: z.uuid(),
  role: z.enum(['PRIMARY', 'INLINE_IMAGE', 'ATTACHMENT']),
  revision: version,
  url: storageUrl,
  expiresAt: timestamp,
});
export const uploadInputSchema = z
  .object({
    courseUnitId: z.uuid(),
    classId: z.uuid(),
    classUnitId: z.uuid(),
    originalFilename: z.string().min(1).max(250),
    declaredMimeType: z.string().min(1).max(150),
    declaredSizeBytes: z.number().int().min(1).max(209715200),
  })
  .strict();
export const uploadIntentSchema = z.object({
  fileId: z.uuid(),
  uploadUrl: storageUrl,
  requiredHeaders: z.record(z.string(), z.string()),
  uploadUrlExpiresAt: timestamp,
  intentExpiresAt: timestamp,
});
export const fileStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(['PENDING_UPLOAD', 'PROCESSING', 'READY', 'FAILED', 'DELETED']),
  originalFilename: z.string(),
  courseUnitId: z.uuid(),
  declaredSizeBytes: count,
  sizeBytes: count.nullable(),
  mimeType: z.string().nullable(),
  kind: fileKind.nullable(),
  intentExpiresAt: timestamp,
  readyAt: timestamp.nullable(),
  metadataStatus: z.string().nullable(),
  errorCode: z.string().nullable(),
});
export const emptyCommandSchema = z.object({}).strict();
export type TeachingSession = z.infer<typeof teachingSessionSchema>;
export type MentorClass = z.infer<typeof mentorClassSchema>;
export type ContentUnit = z.infer<typeof unitSchema>;
export type Material = z.infer<typeof materialSchema>;
export type MaterialDetail = z.infer<typeof materialDetailSchema>;
