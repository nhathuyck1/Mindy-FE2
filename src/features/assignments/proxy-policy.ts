import { z } from 'zod';
import * as dto from './contracts';
export function resolveAssignmentRule(method: string, path: string) {
  const p = path.split('/');
  const rule = (response: z.ZodType, body?: z.ZodType, idempotent = false, list = false) => ({
    response,
    body,
    idempotent,
    cookies: ['access_token'],
    query: list ? dto.assignmentQuerySchema : z.object({}).strict(),
  });
  if (!['mentor', 'me'].includes(p[0])) return;
  const author = p[0] === 'mentor';
  if (
    p.length === 4 &&
    ['classes', 'class-sessions'].includes(p[1]) &&
    z.uuidv4().safeParse(p[2]).success &&
    p[3] === 'assignments'
  ) {
    if (!author && p[1] !== 'classes') return;
    if (method === 'GET') return rule(dto.pageSchema, undefined, false, true);
    if (author && p[1] === 'class-sessions' && method === 'POST')
      return rule(dto.authorAssignmentSchema, dto.createSchema);
  }
  if (!z.uuidv4().safeParse(p[2]).success) return;
  if (p[1] === 'assignments') {
    if (p.length === 3 && method === 'GET')
      return rule(author ? dto.authorAssignmentSchema : dto.assignmentSchema);
    if (author) {
      if (p.length === 3 && method === 'PATCH')
        return rule(dto.authorAssignmentSchema, dto.updateSchema);
      if (p.length === 4 && p[3] === 'questions' && method === 'PUT')
        return rule(dto.authorAssignmentSchema, dto.questionsInputSchema);
      if (p.length === 4 && p[3] === 'publish' && method === 'POST')
        return rule(dto.authorAssignmentSchema, dto.revisionSchema);
      if (p.length === 3 && method === 'DELETE') return rule(z.null(), dto.revisionSchema);
    } else if (p.length === 4 && p[3] === 'start' && method === 'POST')
      return rule(
        dto.attemptSchema,
        z.object({ expectedAssignmentRevision: z.number().int().positive() }).strict(),
        true,
      );
  }
  if (!author && p[1] === 'assignment-submissions') {
    if ((p.length === 3 || (p.length === 4 && p[3] === 'result')) && method === 'GET')
      return rule(dto.attemptSchema);
    if (
      p.length === 4 &&
      ((p[3] === 'answers' && method === 'PUT') || (p[3] === 'submit' && method === 'POST'))
    )
      return rule(dto.attemptSchema, dto.answersInputSchema, true);
  }
}
