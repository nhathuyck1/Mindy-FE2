import 'server-only';
import { z } from 'zod';
import * as dto from '@/features/mentor/schemas/mentor-contracts';
import * as workspace from '@/features/mentor/schemas/workspace-contracts';
import * as leave from '@/features/mentor/schemas/leave-contracts';

type MentorRule = {
  response: z.ZodType;
  body?: z.ZodType;
  query: z.ZodType<Record<string, string | number>>;
  cookies: string[];
  idempotent?: boolean;
};
function rule(
  response: z.ZodType,
  options: { body?: z.ZodType; query?: MentorRule['query']; idempotent?: boolean } = {},
): MentorRule {
  return { response, cookies: ['access_token'], query: z.object({}).strict(), ...options };
}
export function resolveMentorRule(method: string, path: string): MentorRule | undefined {
  const p = path.split('/');
  if (path === 'mentor/schedule' && method === 'GET')
    return rule(dto.scheduleSchema, { query: dto.scheduleQuerySchema });
  if (path === 'mentor/classes' && method === 'GET')
    return rule(dto.mentorClassPageSchema, { query: dto.mentorClassesQuerySchema });
  if (path === 'mentor/leave-requests/preview' && method === 'POST')
    return rule(leave.leavePreviewSchema, { body: leave.leavePreviewInputSchema });
  if (path === 'mentor/leave-requests/makeup-slots' && method === 'POST')
    return rule(leave.leaveSlotsSchema, { body: leave.leaveSlotsInputSchema });
  if (path === 'mentor/leave-requests') {
    if (method === 'GET')
      return rule(leave.leaveRequestPageSchema, { query: leave.leaveListQuerySchema });
    if (method === 'POST')
      return rule(leave.leaveRequestSchema, {
        body: leave.createLeaveInputSchema,
        idempotent: true,
      });
  }
  if (p[0] === 'mentor' && p[1] === 'leave-requests' && z.uuid().safeParse(p[2]).success) {
    if (p.length === 3 && method === 'GET')
      return rule(leave.leaveRequestSchema, { query: dto.mentorPaginationSchema });
    if (p.length === 4 && p[3] === 'withdraw' && method === 'POST')
      return rule(leave.leaveRequestSchema, {
        body: leave.withdrawLeaveInputSchema,
        idempotent: true,
      });
  }
  if (
    p[0] === 'mentor' &&
    p[1] === 'class-sessions' &&
    z.uuid().safeParse(p[2]).success &&
    p.length === 4 &&
    p[3] === 'meeting-url' &&
    method === 'PATCH'
  )
    return rule(workspace.meetingResponseSchema, { body: workspace.meetingInputSchema });
  if (p[0] === 'class-sessions' && z.uuid().safeParse(p[1]).success) {
    const action = p.slice(2).join('/');
    if (method === 'GET' && action === 'context') return rule(dto.sessionContextSchema);
    if (method === 'GET' && action === 'attendance')
      return rule(dto.attendanceSchema, { query: dto.mentorPaginationSchema });
    if (method === 'GET' && action === 'attendance-candidates')
      return rule(workspace.attendanceCandidatesSchema, { query: dto.mentorPaginationSchema });
    if (method === 'PUT' && action === 'attendance/bulk')
      return rule(dto.attendanceWriteSchema, {
        body: workspace.bulkAttendanceInputSchema,
        idempotent: true,
      });
    if (action === 'teaching-notes') {
      if (method === 'GET') return rule(workspace.teachingNoteSchema);
      if (method === 'PUT')
        return rule(workspace.teachingNoteSchema, {
          body: workspace.teachingNoteInputSchema,
          idempotent: true,
        });
    }
    if (method === 'PUT' && action === 'attendance')
      return rule(dto.attendanceWriteSchema, { body: dto.attendanceMarkSchema, idempotent: true });
    if (method === 'POST' && ['start', 'finalize', 'attendance/sync-roster'].includes(action))
      return rule(dto.attendanceWriteSchema, {
        body: dto.attendanceCommandSchema,
        idempotent: true,
      });
  }
  if (p[0] === 'files') {
    if (method === 'POST' && path === 'files/upload-intents')
      return rule(dto.uploadIntentSchema, { body: dto.uploadInputSchema });
    if (!z.uuid().safeParse(p[1]).success) return;
    if (method === 'GET' && p.length === 2) return rule(dto.fileStatusSchema);
    if (method === 'POST' && p.length === 3 && p[2] === 'complete')
      return rule(dto.fileStatusSchema, { body: dto.emptyCommandSchema });
  }
  if (p[0] !== 'mentor' || p[1] !== 'classes' || !z.uuid().safeParse(p[2]).success) return;
  if (method === 'GET' && p.length === 3) return rule(workspace.workspaceSchema);
  if (method === 'GET' && p.length === 4) {
    if (p[3] === 'students') return rule(dto.classRosterSchema, { query: dto.rosterQuerySchema });
    if (p[3] === 'units') return rule(dto.unitsSchema, { query: dto.mentorPaginationSchema });
    if (p[3] === 'sessions')
      return rule(workspace.workspaceSessionsSchema, {
        query: workspace.workspaceSessionsQuerySchema,
      });
    if (p[3] === 'attendance-summary')
      return rule(workspace.classAttendanceSummarySchema, { query: workspace.reportQuerySchema });
    if (p[3] === 'progress')
      return rule(workspace.classProgressSchema, { query: workspace.progressQuerySchema });
  }
  if (!z.uuid().safeParse(p[4]).success) return;
  if (p[3] === 'students' && p.length === 6 && method === 'GET') {
    if (p[5] === 'attendance')
      return rule(workspace.attendanceHistorySchema, { query: workspace.reportQuerySchema });
    if (p[5] === 'attendance-summary')
      return rule(workspace.studentAttendanceSummarySchema, {
        query: workspace.summaryQuerySchema,
      });
    if (p[5] === 'progress')
      return rule(workspace.studentProgressSchema, { query: dto.mentorPaginationSchema });
  }
  if (p[3] === 'units' && p.length === 5 && method === 'GET') return rule(dto.unitDetailSchema);
  if (p[3] === 'units' && p.length === 6) {
    if (p[5] === 'sessions' && method === 'GET')
      return rule(dto.unitSessionsSchema, { query: dto.mentorPaginationSchema });
    if (p[5] === 'materials') {
      if (method === 'GET') return rule(dto.materialsSchema, { query: dto.materialsQuerySchema });
      if (method === 'POST')
        return rule(dto.materialDetailSchema, { body: dto.createMaterialSchema });
    }
  }
  if (p[3] !== 'materials') return;
  if (p.length === 5) {
    if (method === 'GET') return rule(dto.materialDetailSchema);
    if (method === 'PATCH')
      return rule(dto.materialDetailSchema, { body: dto.patchMaterialSchema });
    if (method === 'DELETE') return rule(z.null(), { query: dto.deleteMaterialQuerySchema });
  }
  if (method === 'POST' && p.length === 6 && p[5] === 'submit')
    return rule(dto.materialDetailSchema, { body: dto.revisionSchema });
  if (method === 'GET' && p.length === 6 && p[5] === 'preview')
    return rule(dto.fileAccessSchema, { query: dto.deleteMaterialQuerySchema });
  if (
    method === 'GET' &&
    p.length === 8 &&
    p[5] === 'assets' &&
    z.uuid().safeParse(p[6]).success &&
    p[7] === 'access'
  )
    return rule(dto.fileAccessSchema, { query: dto.deleteMaterialQuerySchema });
  if (
    method === 'POST' &&
    p.length === 8 &&
    p[5] === 'files' &&
    z.uuid().safeParse(p[6]).success &&
    p[7] === 'access'
  )
    return rule(dto.fileAccessSchema);
}
