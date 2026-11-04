import { z } from 'zod';

export const boardUuid = z.uuidv4();
export const boardVersion = z.string().regex(/^\d{1,18}$/);
export const boardMode = z.enum(['PRESENTATION', 'COLLABORATIVE']);
export const boardMetadataSchema = z.object({
  id: boardUuid,
  sessionId: boardUuid,
  title: z.string().min(1).max(250),
  mode: boardMode,
  epoch: boardUuid,
  controlVersion: boardVersion,
  sequence: boardVersion,
  schemaVersion: z.union([z.literal(1), z.literal(2)]),
  lastPersistedAt: z.iso.datetime({ offset: true }),
});
export const boardCapabilitiesSchema = z.object({
  canView: z.boolean(),
  canCreate: z.boolean(),
  canEdit: z.boolean(),
  canControl: z.boolean(),
  canUpload: z.boolean(),
  canSnapshot: z.boolean(),
  canRestore: z.boolean(),
  canExport: z.boolean(),
  canCollaborate: z.boolean().optional().default(false),
  canImportPdf: z.boolean().optional().default(false),
  canExportPdf: z.boolean().optional().default(false),
});
export const boardContextSchema = z.object({
  sessionId: boardUuid,
  sessionTitle: z.string(),
  classId: boardUuid,
  className: z.string(),
  sessionStatus: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  displayName: z.string(),
  mentor: z.boolean(),
});
export const boardResponseSchema = z.object({
  board: boardMetadataSchema,
  context: boardContextSchema,
  capabilities: boardCapabilitiesSchema,
});
export const sessionBoardSchema = z.object({
  sessionId: boardUuid,
  board: boardMetadataSchema.nullable(),
  context: boardContextSchema,
  capabilities: boardCapabilitiesSchema,
});
export const boardSyncSchema = z.object({
  board: boardMetadataSchema,
  capabilities: boardCapabilitiesSchema,
  binary: z.string().max(5592408),
  identity: z.object({ id: boardUuid, name: z.string() }),
});
const coordinate = z.number().finite().min(-100000).max(100000);
const shapeBase = {
  id: boardUuid,
  x: coordinate,
  y: coordinate,
  width: z.number().min(1).max(10000),
  height: z.number().min(1).max(10000),
  color: z.string().regex(/^#[\da-f]{6}$/i),
};
export const boardShapeSchema = z.discriminatedUnion('type', [
  z.object({ ...shapeBase, type: z.literal('sticky'), text: z.string().max(5000) }),
  z.object({
    ...shapeBase,
    type: z.literal('stroke'),
    points: z
      .array(coordinate)
      .min(4)
      .max(20000)
      .refine((p) => p.length % 2 === 0),
    strokeWidth: z.number().min(1).max(48),
  }),
  z.object({ ...shapeBase, type: z.literal('image'), assetId: boardUuid }),
  z.object({
    ...shapeBase,
    type: z.literal('rectangle'),
    fill: z.union([z.literal('transparent'), z.string().regex(/^#[\da-f]{6}$/i)]),
    strokeWidth: z.number().min(1).max(48),
  }),
  z.object({
    ...shapeBase,
    type: z.literal('ellipse'),
    fill: z.union([z.literal('transparent'), z.string().regex(/^#[\da-f]{6}$/i)]),
    strokeWidth: z.number().min(1).max(48),
  }),
  z.object({
    ...shapeBase,
    type: z.literal('text'),
    text: z.string().max(5000),
    fontSize: z.number().min(12).max(96),
  }),
]);
export const boardProjectionSchema = z.array(boardShapeSchema).max(2000);
export const boardSnapshotSchema = z.object({
  id: boardUuid,
  epoch: boardUuid,
  sequence: boardVersion,
  reason: z.enum(['MANUAL', 'SESSION_END', 'BEFORE_RESET']),
  createdAt: z.iso.datetime({ offset: true }),
});
export const boardSnapshotsSchema = z.object({
  items: z.array(boardSnapshotSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export const boardPreviewSchema = boardSnapshotSchema.extend({
  projection: boardProjectionSchema,
  schemaVersion: z.union([z.literal(1), z.literal(2)]),
});
const safeUrl = z.url().refine((s) => {
  const u = new URL(s);
  return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password;
});
export const boardAccessSchema = z.object({
  url: safeUrl,
  expiresAt: z.iso.datetime({ offset: true }),
});
export const boardAssetIntentSchema = z.object({
  id: boardUuid,
  status: z.literal('PENDING_UPLOAD'),
  putUrl: safeUrl,
  expiresAt: z.iso.datetime({ offset: true }),
});
export const boardAssetStatusSchema = z.object({
  id: boardUuid,
  status: z.enum([
    'PENDING_UPLOAD',
    'PROCESSING',
    'READY',
    'IMPORTED',
    'FAILED',
    'DELETING',
    'DELETED',
  ]),
  width: z.number().nullable(),
  height: z.number().nullable(),
  error: z.string().nullable(),
  assets: z.array(z.object({ id: boardUuid, width: z.number(), height: z.number() })).nullable(),
});
export const boardExportSchema = z.object({
  id: boardUuid,
  status: z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED']),
  format: z.enum(['PNG', 'PDF']),
  sourceSequence: boardVersion,
  createdAt: z.iso.datetime({ offset: true }),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  error: z.string().nullable(),
});
export const boardCreateInput = z
  .object({ title: z.string().trim().min(1).max(250).optional() })
  .strict();
export const boardControlInput = boardCreateInput
  .extend({ expectedControlVersion: boardVersion, mode: boardMode.optional() })
  .strict()
  .refine((p) => p.title !== undefined || p.mode !== undefined);
export const boardEpochInput = z.object({ expectedEpoch: boardUuid }).strict();
export const boardResetInput = boardEpochInput
  .extend({ expectedSequence: boardVersion, expectedControlVersion: boardVersion })
  .strict();
export const boardRestoreInput = boardResetInput.extend({ snapshotId: boardUuid }).strict();
export const boardViewport = z
  .object({
    x: coordinate,
    y: coordinate,
    width: z.number().min(1).max(10000),
    height: z.number().min(1).max(10000),
    scale: z.number().min(0.1).max(4),
  })
  .strict();
export const boardExportInput = boardEpochInput
  .extend({
    format: z.enum(['PNG', 'PDF']),
    scope: z.enum(['VIEWPORT', 'CONTENT']),
    viewport: boardViewport.optional(),
  })
  .strict()
  .refine((p) => (p.scope === 'VIEWPORT') === !!p.viewport);
export const boardAssetInput = z
  .object({
    filename: z.string().min(1).max(250),
    mimeType: z.enum(['image/png', 'image/jpeg', 'application/pdf']),
    sizeBytes: z.number().int().min(1).max(10485760),
    pages: z
      .array(z.number().int().min(1).max(100))
      .min(1)
      .max(10)
      .refine((p) => new Set(p).size === p.length)
      .optional(),
  })
  .strict()
  .refine((p) => (p.mimeType === 'application/pdf') === !!p.pages);
export const boardPageQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
export type BoardShape = z.infer<typeof boardShapeSchema>;
export type BoardMetadata = z.infer<typeof boardMetadataSchema>;
export type BoardCapabilities = z.infer<typeof boardCapabilitiesSchema>;
export type BoardSync = z.infer<typeof boardSyncSchema>;
export type SessionBoard = z.infer<typeof sessionBoardSchema>;
