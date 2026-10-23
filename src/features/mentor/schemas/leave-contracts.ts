import { z } from 'zod';
import { mentorPaginationSchema, pageFields, teachingSessionSchema } from './mentor-contracts';

const timestamp = z.iso.datetime({ offset: true });
const date = z.iso.date();
const version = z.number().int().positive();
const count = z.number().int().nonnegative();
export const leavePeriodSchema = z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'FULL_DAY']);
export const leaveStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
]);
export const leaveListQuerySchema = mentorPaginationSchema
  .extend({ status: leaveStatusSchema.optional() })
  .strict();
export const leavePreviewInputSchema = z
  .object({ fromDate: date, toDate: date, period: leavePeriodSchema })
  .strict()
  .refine(
    (v) => v.toDate >= v.fromDate && Date.parse(v.toDate) - Date.parse(v.fromDate) < 93 * 86400000,
  );
const sourceVersion = z.object({ sessionId: z.uuid(), version });
export const leavePreviewSchema = z.object({
  affectedSessions: z.array(teachingSessionSchema),
  sourceVersions: z.array(sourceVersion),
  noticeEligible: z.boolean(),
  noticeDeadline: timestamp.nullable(),
  asOf: timestamp,
  timeZone: z.string(),
});
export const leaveSlotsInputSchema = z
  .object({
    sourceSessionId: z.uuid(),
    targetDate: date,
    targetPeriod: leavePeriodSchema,
  })
  .strict();
export const leaveSlotsSchema = z.object({
  slots: z.array(z.object({ startsAt: timestamp, endsAt: timestamp })),
  sessionVersion: version,
  asOf: timestamp,
  timeZone: z.string(),
});
const sessionMapping = z
  .object({
    sourceSessionId: z.uuid(),
    targetDate: date,
    targetPeriod: leavePeriodSchema,
    startsAt: timestamp,
    endsAt: timestamp,
  })
  .strict();
export const createLeaveInputSchema = z
  .object({
    fromDate: date,
    toDate: date,
    period: leavePeriodSchema,
    reason: z.string().trim().min(1).max(1000),
    sourceVersions: z.array(sourceVersion.strict()).min(1).max(500),
    dayMappings: z
      .array(z.object({ sourceDate: date, targetDate: date }).strict())
      .max(93)
      .optional(),
    sessionMappings: z.array(sessionMapping).max(500).optional(),
  })
  .strict()
  .refine(
    (v) => v.toDate >= v.fromDate && Date.parse(v.toDate) - Date.parse(v.fromDate) < 93 * 86400000,
  )
  .refine(
    (v) =>
      (v.period === 'FULL_DAY' &&
        Boolean(v.dayMappings?.length) &&
        v.sessionMappings === undefined) ||
      (Boolean(v.sessionMappings?.length) && v.dayMappings === undefined),
  );
export const withdrawLeaveInputSchema = z
  .object({ expectedVersion: version, reason: z.string().trim().min(1).max(1000) })
  .strict();
export const leaveRequestSchema = z.object({
  id: z.uuid(),
  mentorId: z.uuid(),
  fromDate: date,
  toDate: date,
  period: leavePeriodSchema,
  reason: z.string(),
  status: leaveStatusSchema,
  version,
  submittedAt: timestamp,
  expiresAt: timestamp,
  itemCount: count,
  page: version,
  pageSize: version,
  items: z.array(
    z.object({
      sourceSessionId: z.uuid(),
      classId: z.uuid(),
      sourceVersion: version,
      sourceStartsAt: timestamp,
      sourceEndsAt: timestamp,
      startsAt: timestamp,
      endsAt: timestamp,
      replacementSessionId: z.uuid().nullable(),
    }),
  ),
  studentConflictCount: count.nullable(),
  classExtensions: z.array(z.object({ classId: z.uuid(), endDate: date })),
  review: z.object({ reviewerId: z.uuid(), reason: z.string(), reviewedAt: timestamp }).nullable(),
  asOf: timestamp,
  timeZone: z.string(),
});
export const leaveRequestPageSchema = z.object({
  ...pageFields,
  items: z.array(leaveRequestSchema),
  asOf: timestamp,
});
export type LeavePreview = z.infer<typeof leavePreviewSchema>;
export type LeaveSessionMapping = z.infer<typeof sessionMapping>;
