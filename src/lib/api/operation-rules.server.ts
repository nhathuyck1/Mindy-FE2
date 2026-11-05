import { z } from 'zod';
import * as dto from '@/features/operations/schemas/operation-contracts';
import {
  assignClassMentorInputSchema,
  classMentorAssignmentSchema,
  classMentorCandidatesSchema,
  mentorCandidatesQuerySchema,
} from '@/features/admin/schemas/admin-mentor-contracts';
const empty = z.object({}).strict();
function rule(response: z.ZodType, body?: z.ZodType, idempotent = false) {
  return { response, body, idempotent, query: empty, cookies: ['access_token'], bodyLimit: 65536 };
}
export function resolveOperationRule(method: string, path: string) {
  const p = path.split('/');
  if (
    p.length === 4 &&
    p[0] === 'management' &&
    p[1] === 'classes' &&
    z.uuidv4().safeParse(p[2]).success
  ) {
    if (method === 'GET' && p[3] === 'available-mentors')
      return {
        ...rule(classMentorCandidatesSchema.refine((data) => data.classId === p[2])),
        query: mentorCandidatesQuerySchema,
      };
    if (method === 'PATCH' && p[3] === 'mentor')
      return rule(
        classMentorAssignmentSchema.refine((data) => data.classId === p[2]),
        assignClassMentorInputSchema,
        true,
      );
  }
  if (method === 'GET' && path === 'management/classes')
    return {
      ...rule(dto.scheduleClassesSchema),
      query: z
        .object({
          page: z.coerce.number().int().min(1).default(1),
          pageSize: z.coerce.number().int().min(1).max(100).default(20),
          status: z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
        })
        .strict(),
    };
  if (
    method === 'GET' &&
    p.length === 4 &&
    p[0] === 'management' &&
    p[1] === 'classes' &&
    z.uuidv4().safeParse(p[2]).success &&
    p[3] === 'weekly-schedule'
  )
    return rule(dto.scheduleConfigurationSchema);
  if (method === 'GET' && path === 'teaching-slots') return rule(dto.teachingSlotsSchema);
  if (method === 'GET' && path === 'manager/materials/storage-cleanup')
    return rule(dto.cleanupStatsSchema);
  if (method === 'POST' && path === 'manager/materials/bulk-delete')
    return rule(dto.bulkDeleteResultSchema, dto.bulkDeleteInputSchema);
  if (
    method === 'POST' &&
    p.length === 3 &&
    p[0] === 'materials' &&
    z.uuidv4().safeParse(p[1]).success &&
    p[2] === 'open'
  )
    return rule(z.null(), dto.materialOpenInputSchema);
  if (
    method === 'POST' &&
    p[0] === 'management' &&
    p[1] === 'classes' &&
    z.uuidv4().safeParse(p[2]).success &&
    p[3] === 'weekly-schedule' &&
    (p.length === 4 || (p.length === 5 && p[4] === 'preview'))
  )
    return rule(dto.schedulePreviewSchema, dto.weeklyScheduleInputSchema, p.length === 4);
  if (
    method === 'POST' &&
    p.length === 5 &&
    p[0] === 'mentor' &&
    p[1] === 'classes' &&
    z.uuidv4().safeParse(p[2]).success &&
    p[3] === 'sessions' &&
    p[4] === 'swap'
  )
    return rule(dto.schedulePreviewSchema, dto.swapInputSchema, true);
}
