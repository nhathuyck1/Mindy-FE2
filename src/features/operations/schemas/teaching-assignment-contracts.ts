import { z } from 'zod';
import {
  classStatusSchema,
  pageFields,
  teachingSessionSchema,
} from '@/features/mentor/schemas/mentor-contracts';
import {
  classMentorCandidatesSchema,
  assignClassMentorInputSchema,
} from '@/features/admin/schemas/admin-mentor-contracts';

export const teachingClassDetailSchema = z.object({
  class: z.object({
    id: z.uuidv4(),
    name: z.string(),
    code: z.string(),
    status: classStatusSchema,
    primaryMentor: teachingSessionSchema.shape.primaryMentor,
    assignmentVersion: z.number().int().positive(),
  }),
  sessions: z.object({ items: z.array(teachingSessionSchema), ...pageFields }),
});
export const sessionMentorCandidatesSchema = classMentorCandidatesSchema
  .omit({ classId: true, assignmentVersion: true, affectedSessionCount: true })
  .extend({
    sessionId: z.uuidv4(),
    sessionVersion: z.number().int().positive(),
    checkedFrom: z.iso.datetime({ offset: true }),
    checkedTo: z.iso.datetime({ offset: true }),
  });
export const assignSessionMentorInputSchema = assignClassMentorInputSchema.extend({
  mentorId: z.uuidv4().nullable(),
});
export type TeachingSession = z.infer<typeof teachingSessionSchema>;
export type SessionMentorIntent = {
  key: string;
  name: string;
  body: z.infer<typeof assignSessionMentorInputSchema>;
};
