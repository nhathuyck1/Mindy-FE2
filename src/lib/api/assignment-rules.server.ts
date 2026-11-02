import 'server-only';
import { z } from 'zod';
import * as dto from '@/features/assignments/schemas/assignment-contracts';

function rule(
  response: z.ZodType,
  body?: z.ZodType,
  query: z.ZodType<Record<string, string | number>> = z.object({}).strict(),
  idempotent = false,
  bulk = false,
) {
  return {
    response,
    body,
    query,
    cookies: ['access_token'],
    idempotent,
    bodyLimit: bulk ? 8_388_608 : 65_536,
    timeoutMs: bulk ? 45_000 : 10_000,
  };
}
export function resolveAssignmentRule(method: string, path: string) {
  const p = path.split('/');
  const mentor = p[0] === 'mentor';
  if (p[0] === 'assignment-files' && dto.uuid.safeParse(p[1]).success) {
    if (p.length === 2 && method === 'GET') return rule(dto.fileStatusSchema);
    if (p.length === 3 && p[2] === 'complete' && method === 'POST')
      return rule(dto.fileStatusSchema, dto.versionInputSchema, undefined, true);
    if (p.length === 3 && p[2] === 'download' && method === 'GET') return rule(dto.downloadSchema);
    return;
  }
  if (!mentor && p[0] !== 'me') return;
  if (!dto.uuid.safeParse(p[2]).success) return;
  const action = p.slice(3).join('/');
  if ((p[1] === 'classes' || (mentor && p[1] === 'class-sessions')) && action === 'assignments') {
    if (method === 'GET')
      return rule(
        mentor ? dto.mentorAssignmentPageSchema : dto.studentAssignmentPageSchema,
        undefined,
        dto.assignmentQuerySchema,
      );
    if (mentor && p[1] === 'class-sessions' && method === 'POST')
      return rule(dto.mentorAssignmentSchema, dto.createInputSchema);
  }
  if (mentor && p[1] === 'classes' && action === 'assignment-metrics' && method === 'GET')
    return rule(dto.metricsSchema, undefined, dto.assignmentQuerySchema);
  if (p[1] === 'assignments') {
    if (!action && method === 'GET')
      return rule(mentor ? dto.mentorAssignmentSchema : dto.studentAssignmentSchema);
    if (action === 'submissions' && method === 'GET')
      return rule(
        mentor ? dto.mentorHistorySchema : dto.studentHistorySchema,
        undefined,
        mentor ? dto.mentorHistoryQuerySchema : dto.studentHistoryQuerySchema,
      );
    if (mentor) {
      if (!action && method === 'PATCH')
        return rule(dto.mentorAssignmentSchema, dto.patchInputSchema);
      if (!action && method === 'DELETE') return rule(z.null(), dto.revisionInputSchema);
      if (action === 'questions' && method === 'PUT')
        return rule(dto.mentorAssignmentSchema, dto.questionsInputSchema, undefined, false, true);
      if (action === 'publish' && method === 'POST')
        return rule(dto.mentorAssignmentSchema, dto.revisionInputSchema);
      if (action === 'archive' && method === 'POST')
        return rule(dto.mentorAssignmentSchema, dto.archiveInputSchema);
      if (action === 'instruction-upload-intents' && method === 'POST')
        return rule(dto.uploadSchema, dto.instructionUploadInputSchema, undefined, true);
      if (action === 'instruction-files' && method === 'PUT')
        return rule(dto.instructionsResponseSchema, dto.instructionInputSchema, undefined, true);
      if (action === 'extend' && method === 'POST')
        return rule(dto.extensionSchema, dto.extendInputSchema, undefined, true);
      if (action === 'roster' && method === 'GET')
        return rule(dto.rosterSchema, undefined, dto.mentorHistoryQuerySchema);
    } else {
      if (action === 'start' && method === 'POST')
        return rule(dto.attemptSchema, dto.startInputSchema, undefined, true);
      if (action === 'zip-submissions' && method === 'POST')
        return rule(dto.studentZipSchema, dto.startInputSchema, undefined, true);
    }
  }
  if (!mentor && p[1] === 'assignment-submissions') {
    if ((!action || action === 'result') && method === 'GET') return rule(dto.attemptSchema);
    if ((action === 'answers' && method === 'PUT') || (action === 'submit' && method === 'POST'))
      return rule(dto.attemptSchema, dto.answersInputSchema, undefined, true);
  }
  if (p[1] === 'zip-submissions') {
    if (!action && method === 'GET')
      return rule(mentor ? dto.mentorZipSchema : dto.studentZipSchema);
    if (mentor) {
      if (action === 'grade' && method === 'PUT')
        return rule(dto.mentorZipSchema, dto.gradeInputSchema, undefined, true);
      if (action === 'grade/release' && method === 'POST')
        return rule(dto.mentorZipSchema, dto.releaseInputSchema, undefined, true);
      if (action === 'grade/history' && method === 'GET')
        return rule(dto.gradeHistorySchema, undefined, dto.paginationSchema);
    } else {
      if (action === 'upload-intents' && method === 'POST')
        return rule(dto.uploadSchema, dto.zipUploadInputSchema, undefined, true);
      if (action === 'file' && method === 'PUT')
        return rule(dto.studentZipSchema, dto.attachInputSchema, undefined, true);
      if (action === 'submit' && method === 'POST')
        return rule(dto.studentZipSchema, dto.versionInputSchema, undefined, true);
    }
  }
}
