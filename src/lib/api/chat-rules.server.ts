import 'server-only';
import { z } from 'zod';
import * as dto from '@/features/chat/schemas/chat-contracts';
const empty = z.object({}).strict();
function rule(
  response: z.ZodType,
  body?: z.ZodType,
  query: z.ZodType<Record<string, string | number>> = empty,
  idempotent = false,
) {
  return { response, body, query, idempotent, cookies: ['access_token'], bodyLimit: 32768 };
}
export function resolveChatRule(method: string, path: string) {
  const p = path.split('/');
  if (
    method === 'GET' &&
    p.length === 3 &&
    p[0] === 'classes' &&
    z.uuidv4().safeParse(p[1]).success &&
    p[2] === 'chat'
  )
    return rule(dto.conversationSchema);
  if (p[0] !== 'chat' || p[1] !== 'conversations') return;
  if (p.length === 2 && method === 'GET')
    return rule(
      dto.conversationPageSchema,
      undefined,
      dto.pageQuery.extend({ type: z.enum(['GROUP', 'DIRECT']).optional() }),
    );
  if (p.length === 3 && p[2] === 'direct' && method === 'POST')
    return rule(dto.directSchema, z.object({ peerUserId: z.uuidv4() }).strict());
  if (!z.uuidv4().safeParse(p[2]).success) return;
  if (p.length === 3 && method === 'GET') return rule(dto.conversationSchema);
  if (p.length === 4) {
    if (p[3] === 'members' && method === 'GET')
      return rule(dto.memberPageSchema, undefined, dto.pageQuery);
    if (p[3] === 'messages' && method === 'GET')
      return rule(dto.messagePageSchema, undefined, dto.pageQuery);
    if (p[3] === 'messages' && method === 'POST')
      return rule(dto.chatMutationSchema, dto.sendSchema);
    if (p[3] === 'read' && method === 'PUT')
      return rule(dto.readSchema, z.object({ throughSequence: dto.sequenceSchema }).strict());
  }
  if (p.length === 5 && p[3] === 'messages' && z.uuidv4().safeParse(p[4]).success) {
    if (method === 'PATCH') return rule(dto.chatMutationSchema, dto.editSchema, empty, true);
    if (method === 'DELETE')
      return rule(
        dto.chatMutationSchema,
        undefined,
        z.object({ expectedVersion: z.coerce.number().int().min(1).max(2147483647) }).strict(),
        true,
      );
  }
  if (
    p.length === 6 &&
    p[3] === 'messages' &&
    z.uuidv4().safeParse(p[4]).success &&
    p[5] === 'file-access' &&
    method === 'POST'
  )
    return rule(dto.accessSchema);
  if (p[3] === 'attachments') {
    if (p.length === 5 && p[4] === 'upload-intents' && method === 'POST')
      return rule(dto.uploadIntentSchema, dto.uploadInput, empty, true);
    if (z.uuidv4().safeParse(p[4]).success) {
      if (p.length === 5 && method === 'GET') return rule(dto.fileStatusSchema);
      if (p.length === 6 && p[5] === 'complete' && method === 'POST')
        return rule(dto.fileStatusSchema);
    }
  }
}
