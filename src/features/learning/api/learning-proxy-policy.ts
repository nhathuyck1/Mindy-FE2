import { z } from 'zod';
import {
  fileAccessSchema,
  materialDetailSchema,
  materialDownloadSchema,
  materialPageSchema,
  previewClassSchema,
  studentClassSchema,
} from '../schemas/learning-contracts';

export function learningProxyRule(method: string, path: string) {
  const parts = path.split('/');
  if (parts[0] !== 'me' || parts[1] !== 'classes' || !z.uuid().safeParse(parts[2]).success) return;
  let response: z.ZodType | undefined;
  if (method === 'GET') {
    if (parts.length === 3) response = studentClassSchema;
    if (parts.length === 4 && parts[3] === 'preview') response = previewClassSchema;
    if (
      parts.length === 6 &&
      parts[3] === 'units' &&
      z.uuid().safeParse(parts[4]).success &&
      parts[5] === 'materials'
    )
      response = materialPageSchema;
    if (parts[3] === 'materials' && z.uuid().safeParse(parts[4]).success) {
      if (parts.length === 5) response = materialDetailSchema;
      if (parts.length === 6 && parts[5] === 'download') response = materialDownloadSchema;
    }
  }
  if (
    method === 'POST' &&
    parts.length === 8 &&
    parts[3] === 'materials' &&
    z.uuid().safeParse(parts[4]).success &&
    parts[5] === 'files' &&
    z.uuid().safeParse(parts[6]).success &&
    parts[7] === 'access'
  )
    response = fileAccessSchema;
  if (response) return { response, cookies: ['access_token'] };
}
export const learningPaginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
