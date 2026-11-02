import 'server-only';
import { z } from 'zod';
import * as dto from '@/features/whiteboard/schemas/whiteboard-contracts';
const empty = z.object({}).strict();
function rule(
  response: z.ZodType,
  body?: z.ZodType,
  idempotent = false,
  query: z.ZodType<Record<string, string | number>> = empty,
) {
  return { response, body, idempotent, query, cookies: ['access_token'], bodyLimit: 65536 };
}
export function resolveWhiteboardRule(method: string, path: string) {
  const p = path.split('/');
  if (
    p[0] === 'class-sessions' &&
    dto.boardUuid.safeParse(p[1]).success &&
    p.length === 3 &&
    p[2] === 'whiteboard'
  ) {
    if (method === 'GET') return rule(dto.sessionBoardSchema);
    if (method === 'POST') return rule(dto.sessionBoardSchema, dto.boardCreateInput, true);
  }
  if (p[0] !== 'whiteboards' || !dto.boardUuid.safeParse(p[1]).success) return;
  const action = p.slice(2).join('/');
  if (!action && method === 'GET') return rule(dto.boardResponseSchema);
  if (action === 'control' && method === 'PATCH')
    return rule(dto.boardMetadataSchema, dto.boardControlInput, true);
  if (action === 'snapshots') {
    if (method === 'GET')
      return rule(dto.boardSnapshotsSchema, undefined, false, dto.boardPageQuery);
    if (method === 'POST') return rule(dto.boardSnapshotSchema, dto.boardEpochInput, true);
  }
  if (action === 'resets' && method === 'POST')
    return rule(dto.boardMetadataSchema, dto.boardResetInput, true);
  if (action === 'restores' && method === 'POST')
    return rule(dto.boardMetadataSchema, dto.boardRestoreInput, true);
  if (action === 'assets' && method === 'POST')
    return rule(dto.boardAssetIntentSchema, dto.boardAssetInput, true);
  if (action === 'exports' && method === 'POST')
    return rule(dto.boardExportSchema, dto.boardExportInput, true);
  if (p.length >= 4 && dto.boardUuid.safeParse(p[3]).success) {
    if (p[2] === 'snapshots' && p.length === 4 && method === 'GET')
      return rule(dto.boardPreviewSchema);
    if (p[2] === 'assets') {
      if (p.length === 4 && method === 'GET') return rule(dto.boardAssetStatusSchema);
      if (p.length === 5 && p[4] === 'complete' && method === 'POST')
        return rule(dto.boardAssetStatusSchema, empty, true);
      if (p.length === 5 && p[4] === 'access' && method === 'POST')
        return rule(dto.boardAccessSchema);
    }
    if (p[2] === 'exports') {
      if (p.length === 4 && method === 'GET') return rule(dto.boardExportSchema);
      if (p.length === 5 && p[4] === 'access' && method === 'POST')
        return rule(dto.boardAccessSchema);
    }
  }
}
