import { z } from 'zod';
import { adminClassDetailSchema } from '@/features/admin/schemas/admin-write-contracts';
export const scheduleConfigurationSchema = z.object({
  class: adminClassDetailSchema,
  weeklySlots: z.array(z.object({ weekday: z.number(), slotId: z.number() })),
});
export const scheduleClassesSchema = z.object({
  items: z.array(
    z.object({ id: z.uuid(), name: z.string(), status: z.string(), assignmentVersion: z.number() }),
  ),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
export const teachingSlotsSchema = z.array(
  z.object({ id: z.number().int(), startsAt: z.string(), endsAt: z.string() }),
);
export const weeklyScheduleInputSchema = z
  .object({
    startDate: z.iso.date(),
    expectedVersion: z.number().int().positive(),
    reason: z.string().trim().min(1).max(1000),
    weeklySlots: z
      .array(
        z
          .object({
            weekday: z.number().int().min(1).max(7),
            slotId: z.number().int().min(1).max(7),
          })
          .strict(),
      )
      .min(1)
      .max(49),
    sessions: z
      .array(
        z
          .object({
            sessionId: z.uuidv4().optional(),
            classUnitId: z.uuidv4(),
            title: z.string().trim().min(1).max(250),
          })
          .strict(),
      )
      .min(1)
      .max(500),
  })
  .strict();
export const schedulePreviewSchema = z.object({
  timeZone: z.string(),
  expectedVersion: z.number().int(),
  sessions: z.array(
    z.object({
      sessionId: z.uuidv4().nullable(),
      classUnitId: z.uuidv4(),
      title: z.string(),
      startsAt: z.string(),
      endsAt: z.string(),
    }),
  ),
  conflicts: z.array(
    z.object({
      kind: z.string(),
      sessionId: z.string(),
      conflictingSessionId: z.string().nullable(),
      startsAt: z.string(),
      endsAt: z.string(),
    }),
  ),
});
export const swapInputSchema = z
  .object({
    firstSessionId: z.uuidv4(),
    secondSessionId: z.uuidv4(),
    firstVersion: z.number().int().positive(),
    secondVersion: z.number().int().positive(),
    reason: z.string().trim().min(1).max(1000),
  })
  .strict()
  .refine((v) => v.firstSessionId !== v.secondSessionId);
export const retentionMaterialSchema = z.object({
  id: z.uuidv4(),
  title: z.string(),
  revision: z.number().int(),
  lastSeenAt: z.string().nullable(),
  trackingStartedAt: z.string(),
  isUnseen: z.boolean(),
  relatedSizeBytes: z.string().regex(/^\d+$/),
});
export const retentionMaterialsSchema = z.object({
  items: z.array(retentionMaterialSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
export const bulkDeleteInputSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            materialId: z.uuidv4(),
            expectedRevision: z.number().int().positive(),
            lastSeenAt: z.iso.datetime().nullable(),
            trackingStartedAt: z.iso.datetime(),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();
export const bulkDeleteResultSchema = z.object({
  items: z.array(
    z.object({
      materialId: z.uuidv4(),
      status: z.enum(['DELETED', 'STALE', 'NOT_FOUND', 'ALREADY_DELETED']),
    }),
  ),
});
export const cleanupStatsSchema = z.object({
  reclaimableBytes: z.string(),
  reclaimedBytes: z.string(),
  pendingFiles: z.number().int(),
  failedFiles: z.number().int(),
});
export const materialOpenInputSchema = z
  .object({ classId: z.uuidv4(), expectedRevision: z.number().int().positive() })
  .strict();
