import { z } from 'zod';
import {
  mentorPaginationSchema,
  pageFields,
  classStatusSchema,
  teachingSessionSchema,
  sessionStatusSchema,
} from './mentor-contracts';

const timestamp = z.iso.datetime({ offset: true });
const count = z.number().int().nonnegative();
const person = z.object({ id: z.uuid(), displayName: z.string().nullable() });
const rangeFields = { from: timestamp.optional(), to: timestamp.optional() };
const validRange = (v: { from?: string; to?: string }) =>
  (!v.from && !v.to) ||
  Boolean(
    v.from &&
    v.to &&
    Date.parse(v.from) < Date.parse(v.to) &&
    Date.parse(v.to) - Date.parse(v.from) <= 93 * 86400000,
  );
export const reportQuerySchema = mentorPaginationSchema
  .extend(rangeFields)
  .strict()
  .refine(validRange);
export const summaryQuerySchema = z.object(rangeFields).strict().refine(validRange);
export const workspaceSessionsQuerySchema = mentorPaginationSchema
  .extend({ ...rangeFields, unitId: z.uuid().optional() })
  .strict()
  .refine(validRange);
export const progressQuerySchema = mentorPaginationSchema
  .extend({ unitId: z.uuid().optional() })
  .strict();
export const workspaceSchema = z.object({
  id: z.uuid(),
  classId: z.uuid(),
  code: z.string(),
  name: z.string(),
  status: classStatusSchema,
  course: z.object({ id: z.uuid(), title: z.string() }),
  accessScope: z.enum(['CLASS', 'SESSION']),
  assignmentType: z.enum(['PRIMARY', 'SUBSTITUTE', 'BOTH']),
  readonly: z.boolean(),
  capabilities: z.object({
    readClass: z.boolean(),
    readClassRoster: z.boolean(),
    readClassReports: z.boolean(),
    authorMaterials: z.boolean(),
  }),
  visibleUnitCount: count,
  visibleSessionCount: count,
  asOf: timestamp,
  timeZone: z.string(),
});
export const workspaceSessionsSchema = z.object({
  ...pageFields,
  items: z.array(
    teachingSessionSchema.extend({
      capabilities: z.object({ readSessionContext: z.boolean(), writeTeachingNotes: z.boolean() }),
    }),
  ),
});
const counts = {
  present: count,
  absent: count,
  unmarked: count,
  excluded: count,
  makeupPending: count,
  finalizedEligibleCount: count,
  rate: z.number().min(0).max(100).nullable(),
};
const metadata = {
  classId: z.uuid(),
  asOf: timestamp,
  timeZone: z.string(),
  readonly: z.boolean(),
};
export const classAttendanceSummarySchema = z.object({
  ...metadata,
  ...pageFields,
  items: z.array(z.object({ ...counts, enrollmentId: z.uuid(), student: person })),
});
export const studentAttendanceSummarySchema = z.object({
  ...counts,
  ...metadata,
  aggregationScope: z.literal('STUDENT_CLASS_HISTORY'),
});
export const attendanceHistorySchema = z.object({
  ...metadata,
  ...pageFields,
  items: z.array(
    z.object({
      sessionId: z.uuid(),
      enrollmentId: z.uuid(),
      rootSessionId: z.uuid(),
      title: z.string(),
      startsAt: timestamp,
      endsAt: timestamp,
      sessionStatus: sessionStatusSchema,
      attendanceStatus: z.enum(['PRESENT', 'ABSENT', 'UNMARKED']).nullable(),
      attendanceApplicability: z.enum([
        'ELIGIBLE',
        'NOT_STARTED',
        'NOT_ELIGIBLE',
        'PAYMENT_PENDING',
        'LEGACY_NO_DATA',
        'MAKEUP_PENDING',
        'MAKEUP_CREDITED',
      ]),
      excluded: z.boolean(),
      effectiveMentor: person.nullable(),
      assignmentType: z.enum(['PRIMARY', 'SUBSTITUTE']),
      makeupForSessionId: z.uuid().nullable(),
      makeupRootSessionId: z.uuid().nullable(),
      makeupPlacementId: z.uuid().nullable(),
      creditSessionId: z.uuid().nullable(),
      creditedAttendanceStatus: z.enum(['PRESENT', 'ABSENT']).nullable(),
    }),
  ),
});
const progressMetadata = {
  ...pageFields,
  completionPolicy: z.literal('UNDEFINED'),
  policyVersion: z.null(),
  assignmentSummary: z.object({ availability: z.literal('NOT_IMPLEMENTED'), counts: z.null() }),
  readonly: z.literal(true),
  asOf: timestamp,
  timeZone: z.string(),
};
export const classProgressSchema = z.object({
  ...progressMetadata,
  items: z.array(
    z.object({
      enrollmentId: z.uuid(),
      studentId: z.uuid(),
      displayName: z.string(),
      storedUnitCount: count,
      untrackedUnitCount: count,
      invalidStoredUnitCount: count,
    }),
  ),
});
export const studentProgressSchema = z.object({
  ...progressMetadata,
  items: z.array(
    z.object({
      enrollmentId: z.uuid(),
      classUnitId: z.uuid(),
      trackingStatus: z.enum(['STORED', 'UNTRACKED']),
      status: z.string().nullable(),
      progressPercent: z
        .string()
        .refine((s) => /^\d+(?:\.\d+)?$/.test(s) && Number(s) <= 100)
        .nullable(),
      completedAt: timestamp.nullable(),
      dataQuality: z.enum(['VALID', 'INVALID_PERCENT', 'UNTRACKED']),
    }),
  ),
});
export const attendanceCandidatesSchema = z.object({
  ...pageFields,
  provisional: z.literal(true),
  asOf: timestamp,
  items: z.array(
    z.object({
      enrollmentId: z.uuid(),
      student: person,
      entryType: z.enum(['REGULAR', 'MAKEUP']),
      makeupPlacementId: z.uuid().nullable(),
    }),
  ),
});
export const bulkAttendanceInputSchema = z
  .object({ expectedVersion: z.number().int().positive(), checked: z.boolean() })
  .strict();
const meetingUrl = z
  .url()
  .max(2048)
  .refine((v) => {
    try {
      const url = new URL(v);
      return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  })
  .nullable();
export const meetingInputSchema = z
  .object({ expectedVersion: z.number().int().positive(), meetingUrl })
  .strict();
export const meetingResponseSchema = z.object({
  sessionId: z.uuid(),
  classId: z.uuid(),
  meetingUrl,
  effectiveMeetingUrl: meetingUrl,
  version: z.number().int().positive(),
});
export const teachingNoteInputSchema = z
  .object({
    expectedVersion: z.number().int().min(0).max(2147483646),
    content: z.string().max(10000),
    nextSteps: z.string().max(5000),
  })
  .strict();
export const teachingNoteSchema = z.object({
  sessionId: z.uuid(),
  version: count,
  note: z
    .object({
      content: z.string(),
      nextSteps: z.string(),
      version: z.number().int().positive(),
      createdBy: z.uuid(),
      updatedBy: z.uuid(),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .nullable(),
});
