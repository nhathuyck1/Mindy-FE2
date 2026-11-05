import { z } from 'zod';
export const sequenceSchema = z.string().regex(/^(0|[1-9]\d{0,18})$/);
const person = z.object({ id: z.uuidv4(), displayName: z.string(), avatarUrl: z.null() });
const file = z.object({
  id: z.uuidv4(),
  originalFilename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  kind: z.enum(['IMAGE', 'PDF']),
});
export const messageSchema = z.object({
  id: z.uuidv4(),
  conversationId: z.uuidv4(),
  sender: person,
  clientMessageId: z.uuidv4().nullable(),
  sequence: sequenceSchema,
  lastChangedSequence: sequenceSchema,
  type: z.enum(['TEXT', 'FILE', 'IMAGE']),
  body: z.string().nullable(),
  file: file.nullable(),
  replyTo: z
    .object({ id: z.uuidv4(), senderDisplayName: z.string(), deleted: z.boolean() })
    .nullable(),
  version: z.number().int().positive(),
  createdAt: z.string(),
  editedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
});
export const conversationSchema = z.object({
  id: z.uuidv4(),
  type: z.enum(['GROUP', 'DIRECT']),
  classId: z.uuidv4().nullable(),
  name: z.string().nullable(),
  peer: person.nullable(),
  capabilities: z.object({
    canRead: z.literal(true),
    canSend: z.boolean(),
    canAttach: z.boolean(),
    canType: z.boolean(),
  }),
  accessMode: z.enum(['ACTIVE', 'CASH_PENDING', 'HISTORY_READ_ONLY']),
  lastReadSequence: sequenceSchema,
  highWatermark: sequenceSchema,
  unreadCount: z.number().int().nonnegative(),
  lastMessage: messageSchema.nullable(),
  activityAt: z.string(),
});
export const chatPage = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    meta: z.object({
      nextCursor: z.string().nullable(),
      hasMore: z.boolean(),
      highWatermark: sequenceSchema.optional(),
      throughSequence: sequenceSchema.optional(),
    }),
  });
export const conversationPageSchema = chatPage(conversationSchema);
export const messagePageSchema = chatPage(messageSchema);
export const memberSchema = z.object({
  userId: z.uuidv4(),
  displayName: z.string(),
  avatarUrl: z.null(),
  role: z.enum(['ADMIN', 'MEMBER']),
  joinedAt: z.string(),
  lastReadSequence: sequenceSchema,
});
export const memberPageSchema = chatPage(memberSchema);
export const chatMutationSchema = z.object({ message: messageSchema, replayed: z.boolean() });
export const directSchema = z.object({ conversation: conversationSchema, created: z.boolean() });
export const readSchema = z.object({
  conversationId: z.uuidv4(),
  lastReadSequence: sequenceSchema,
  lastReadAt: z.string().nullable(),
  unreadCount: z.number().int(),
});
export const textSchema = z
  .string()
  .min(1)
  .max(4000)
  .refine((s) => /\S/u.test(s) && new TextEncoder().encode(s).length <= 16384);
export const sendSchema = z
  .object({
    clientMessageId: z.uuidv4(),
    type: z.enum(['TEXT', 'FILE', 'IMAGE']),
    body: textSchema.optional(),
    fileObjectId: z.uuidv4().optional(),
    replyToMessageId: z.uuidv4().optional(),
  })
  .strict()
  .refine((s) => (s.type === 'TEXT' ? !!s.body && !s.fileObjectId : !!s.fileObjectId));
export const editSchema = z
  .object({ expectedVersion: z.number().int().min(1).max(2147483647), body: textSchema.nullable() })
  .strict();
export const pageQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().max(2048).optional(),
  })
  .strict();
export const accessSchema = z.object({ url: z.url(), expiresAt: z.string() });
export const uploadInput = z
  .object({
    originalFilename: z.string().min(1).max(250),
    declaredMimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    declaredSizeBytes: z.number().int().min(1).max(10485760),
  })
  .strict()
  .refine((v) => v.declaredMimeType === 'application/pdf' || v.declaredSizeBytes <= 5242880, {
    message: 'Ảnh tối đa 5 MiB.',
  });
export const uploadIntentSchema = z.object({
  fileId: z.uuidv4(),
  uploadUrl: z.url(),
  requiredHeaders: z.record(z.string(), z.string()),
  uploadUrlExpiresAt: z.string(),
  intentExpiresAt: z.string(),
  replayed: z.boolean(),
});
export const fileStatusSchema = z.object({
  id: z.uuidv4(),
  status: z.enum(['PENDING_UPLOAD', 'PROCESSING', 'READY', 'FAILED', 'DELETING', 'DELETED']),
  originalFilename: z.string(),
  errorCode: z.string().nullable(),
  file: file.nullable(),
});
export type Conversation = z.infer<typeof conversationSchema>;
export type ChatMessage = z.infer<typeof messageSchema>;
export type SendInput = z.infer<typeof sendSchema>;
