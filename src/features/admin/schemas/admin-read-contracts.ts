import { z } from 'zod';

export const trackingSources = [
  'material_audit_events',
  'teaching_assignment_audits',
  'session_lifecycle_audits',
  'session_schedule_audits',
  'attendance_audits',
  'guest_attendance_audits',
  'makeup_placement_audits',
  'mentor_leave_audits',
  'teaching_note_audits',
  'class_unit_release_audit',
  'session_meeting_audits',
  'attendance_recovery_audits',
] as const;
export const trackingSourceSchema = z.enum(trackingSources);

const pageQuery = {
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};
export const adminTrackingQuerySchema = z
  .object({
    ...pageQuery,
    source: trackingSourceSchema.optional(),
    actorId: z.uuid().optional(),
    entityId: z.uuid().optional(),
    classId: z.uuid().optional(),
    sessionId: z.uuid().optional(),
    action: z.string().max(80).optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
  })
  .strict()
  .refine((query) => !query.from || !query.to || Date.parse(query.from) < Date.parse(query.to), {
    message: 'Thời điểm bắt đầu phải trước thời điểm kết thúc.',
    path: ['to'],
  });
export const adminReconciliationQuerySchema = z.object(pageQuery).strict();

const pagination = {
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
};
export const adminTrackingEventSchema = z.object({
  id: z.uuid(),
  source: trackingSourceSchema,
  action: z.string(),
  actor: z.object({ id: z.uuid(), displayName: z.string().nullable() }).nullable(),
  entityType: z.string(),
  entityId: z.uuid().nullable(),
  classId: z.uuid().nullable(),
  sessionId: z.uuid().nullable(),
  version: z.number().nullable(),
  reason: z.string().nullable(),
  occurredAt: z.iso.datetime({ offset: true }),
});
export const adminTrackingPageSchema = z.object({
  items: z.array(adminTrackingEventSchema),
  ...pagination,
});
export const adminTrackingDetailSchema = adminTrackingEventSchema.extend({
  data: z.record(z.string(), z.unknown()),
  evidenceItems: z.array(z.record(z.string(), z.unknown())),
});
export const adminReconciliationItemSchema = z.object({
  id: z.uuid(),
  paymentId: z.uuid().nullable(),
  providerOrderCode: z.number().int(),
  referenceCode: z.string(),
  amount: z.number(),
  currency: z.string(),
  reason: z.string().nullable(),
  source: z.string(),
  actorId: z.uuid().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});
export const adminReconciliationPageSchema = z.object({
  items: z.array(adminReconciliationItemSchema),
  ...pagination,
});

export type AdminTrackingEvent = z.infer<typeof adminTrackingEventSchema>;
export type AdminTrackingDetail = z.infer<typeof adminTrackingDetailSchema>;
export type AdminTrackingQuery = z.infer<typeof adminTrackingQuerySchema>;
