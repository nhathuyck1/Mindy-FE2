import { z } from 'zod';
import {
  publicClassSchema,
  paginationQuerySchema,
} from '@/features/courses/schemas/course-contracts';
import { pageFields, teachingSessionSchema } from '@/features/mentor/schemas/mentor-contracts';
import { userSchema } from '@/lib/api/contracts';

const timestamp = z.iso.datetime({ offset: true });
const date = z.iso.date();
const count = z.number().int().nonnegative();
const version = z.number().int().positive();

export const managerLeaveStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
]);
export const managerLeaveListQuerySchema = paginationQuerySchema
  .extend({
    status: managerLeaveStatusSchema.optional(),
    mentorId: z.uuid().optional(),
  })
  .strict();
export const managerLeaveDetailQuerySchema = paginationQuerySchema.strict();
export const managerPeopleQuerySchema = paginationQuerySchema
  .extend({
    q: z.string().trim().min(1).max(100).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  })
  .strict();

const leavePeriodSchema = z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'FULL_DAY']);
const leaveItemSchema = z.object({
  sourceSessionId: z.uuid(),
  classId: z.uuid(),
  sourceVersion: version,
  sourceStartsAt: timestamp,
  sourceEndsAt: timestamp,
  startsAt: timestamp,
  endsAt: timestamp,
  replacementSessionId: z.uuid().nullable(),
});
const leaveExtensionSchema = z.object({ classId: z.uuid(), endDate: date });
const leaveReviewSchema = z.object({
  reviewerId: z.uuid(),
  reason: z.string(),
  reviewedAt: timestamp,
});

export const managerLeaveRequestSchema = z.object({
  id: z.uuid(),
  mentorId: z.uuid(),
  fromDate: date,
  toDate: date,
  period: leavePeriodSchema,
  reason: z.string(),
  status: managerLeaveStatusSchema,
  version,
  submittedAt: timestamp,
  expiresAt: timestamp,
  itemCount: count,
  items: z.array(leaveItemSchema),
  page: version,
  pageSize: version,
  studentConflictCount: count.nullable(),
  classExtensions: z.array(leaveExtensionSchema),
  review: leaveReviewSchema.nullable(),
  asOf: timestamp,
  timeZone: z.string(),
});
export const managerLeavePageSchema = z.object({
  ...pageFields,
  items: z.array(managerLeaveRequestSchema),
  asOf: timestamp,
});

export const managerLeaveConflictSchema = z.object({
  sourceSessionId: z.uuid(),
  studentId: z.uuid(),
  conflictingSessionId: z.uuid(),
});
export const managerLeaveDetailSchema = managerLeaveRequestSchema.extend({
  studentConflictCount: count,
  studentConflicts: z.array(managerLeaveConflictSchema),
  sourcesCurrent: z.boolean(),
});

export const approveManagerLeaveSchema = z
  .object({
    expectedVersion: version,
    reason: z.string().trim().min(1).max(1000),
    acknowledgeStudentConflicts: z.boolean(),
  })
  .strict();
export const rejectManagerLeaveSchema = z
  .object({ expectedVersion: version, reason: z.string().trim().min(1).max(1000) })
  .strict();
export const managerLeaveApprovalSchema = z.object({
  request: managerLeaveRequestSchema,
  replacements: z.array(teachingSessionSchema),
  classExtensions: z.array(leaveExtensionSchema),
  studentConflictCount: count,
});
export const managerLeaveActionResultSchema = z.union([
  managerLeaveApprovalSchema,
  managerLeaveRequestSchema,
]);

export const managerMentorSchema = userSchema.extend({ role: z.literal('MENTOR') });
export const managerStudentSchema = userSchema.extend({ role: z.literal('STUDENT') });
export const managerPeoplePageSchema = z.object({
  ...pageFields,
  items: z.array(managerMentorSchema),
});
export const managerClassLabelSchema = publicClassSchema;

export type ManagerLeaveStatus = z.infer<typeof managerLeaveStatusSchema>;
export type ManagerLeaveRequest = z.infer<typeof managerLeaveRequestSchema>;
export type ManagerLeaveDetail = z.infer<typeof managerLeaveDetailSchema>;
export type ManagerLeaveConflict = z.infer<typeof managerLeaveConflictSchema>;
export type ManagerMentor = z.infer<typeof managerMentorSchema>;
