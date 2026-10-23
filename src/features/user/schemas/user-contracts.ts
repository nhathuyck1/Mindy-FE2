import { z } from 'zod';
import { orderStatusSchema } from '@/features/orders/schemas/order-contracts';

const dateTime = z.iso.datetime({ offset: true });
const mentor = z.object({ id: z.uuid(), displayName: z.string().nullable() });
const scheduleMentor = mentor.nullable();
const classStatus = z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
const deliveryMode = z.enum(['ONLINE', 'OFFLINE']);
const pagination = {
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};
export const myClassesFiltersSchema = z
  .object({
    ...pagination,
    view: z.enum(['current', 'history', 'all']).default('current'),
  })
  .strict();
export const myScheduleFiltersSchema = z
  .object({
    ...pagination,
    pageSize: pagination.pageSize.default(100),
    from: dateTime,
    to: dateTime,
    includeCancelled: z.enum(['true', 'false']).default('true'),
  })
  .strict()
  .refine((value) => {
    const range = Date.parse(value.to) - Date.parse(value.from);
    return range > 0 && range <= 31 * 86400000;
  }, 'Khoảng lịch phải lớn hơn 0 và tối đa 31 ngày.');
export const myClassSchema = z.object({
  enrollmentId: z.uuid(),
  enrollmentStatus: z.enum(['PENDING_PAYMENT', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  enrolledAt: dateTime.nullable(),
  createdAt: dateTime,
  isHoldExpired: z.boolean(),
  courseId: z.uuid(),
  courseCode: z.string(),
  courseTitle: z.string(),
  courseImageUrl: z.string().nullable(),
  classId: z.uuid(),
  classCode: z.string(),
  className: z.string(),
  classStatus,
  deliveryMode,
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  mentor,
  order: z
    .object({
      orderId: z.uuid(),
      orderCode: z.string(),
      orderStatus: orderStatusSchema,
      paymentType: z.enum(['CASH', 'PAYOS']),
      expiresAt: dateTime,
      paidAt: dateTime.nullable(),
      requiresReview: z.boolean(),
    })
    .nullable(),
  accessMode: z.enum(['FULL', 'CASH_PREVIEW', 'NONE']),
  accessReason: z.enum([
    'ACTIVE_ENROLLMENT',
    'PENDING_CASH',
    'PENDING_PAYOS',
    'HOLD_EXPIRED',
    'ENROLLMENT_CANCELLED',
    'ENROLLMENT_COMPLETED',
    'CLASS_CANCELLED',
    'STATE_MISMATCH',
  ]),
  canViewClass: z.boolean(),
  canViewSchedule: z.boolean(),
});
const page = {
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  asOf: dateTime,
};
export const myClassesPageSchema = z.object({ ...page, items: z.array(myClassSchema) });
export const scheduleEventSchema = z.object({
  sessionId: z.uuid(),
  sessionNumber: z.number().int().positive(),
  sessionTitle: z.string(),
  sessionStatus: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  startsAt: dateTime,
  endsAt: dateTime,
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/),
  roomName: z.string().nullable(),
  classId: z.uuid(),
  classCode: z.string(),
  className: z.string(),
  classStatus,
  courseId: z.uuid(),
  courseTitle: z.string(),
  classUnitId: z.uuid(),
  unitTitle: z.string(),
  deliveryMode,
  mentor: scheduleMentor,
  assignmentType: z.enum(['PRIMARY', 'SUBSTITUTE']),
  enrollmentId: z.uuid(),
  attendanceStatus: z.enum(['UNMARKED', 'PRESENT', 'ABSENT']).nullable(),
  attendanceApplicability: z.enum([
    'ELIGIBLE',
    'NOT_STARTED',
    'NOT_ELIGIBLE',
    'PAYMENT_PENDING',
    'LEGACY_NO_DATA',
    'MAKEUP_PENDING',
    'MAKEUP_CREDITED',
  ]),
  attendanceExcluded: z.boolean(),
  creditedAttendanceStatus: z.enum(['PRESENT', 'ABSENT']).nullable(),
  makeupForSessionId: z.uuid().nullable(),
  makeupRootSessionId: z.uuid().nullable(),
  sourceClassId: z.uuid().nullable(),
  sourceSessionId: z.uuid().nullable(),
  makeupPlacementId: z.uuid().nullable(),
  accessMode: z.enum(['FULL', 'CASH_PREVIEW', 'SESSION_MAKEUP']),
});
export const mySchedulePageSchema = z.object({
  ...page,
  items: z.array(scheduleEventSchema),
  timeZone: z.string().min(1),
  from: dateTime,
  to: dateTime,
});
export type MyClass = z.infer<typeof myClassSchema>;
export type ScheduleEvent = z.infer<typeof scheduleEventSchema>;
