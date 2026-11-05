import { z } from 'zod';

const mentor = z.object({ id: z.uuidv4(), displayName: z.string().nullable() });
export const mentorCandidatesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
  })
  .strict();
export const classMentorCandidatesSchema = z.object({
  classId: z.uuidv4(),
  assignmentVersion: z.number().int().positive(),
  affectedSessionCount: z.number().int().nonnegative(),
  items: z.array(z.object({ id: z.uuidv4(), displayName: z.string(), isCurrent: z.boolean() })),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  asOf: z.iso.datetime({ offset: true }),
  timeZone: z.string(),
  availabilityBasis: z.literal('TEACHING_SCHEDULE_AND_APPROVED_LEAVE'),
});
export const assignClassMentorInputSchema = z
  .object({
    mentorId: z.uuidv4(),
    reason: z.string().trim().min(1).max(1000),
    expectedVersion: z.number().int().positive(),
  })
  .strict();
export const classMentorAssignmentSchema = z.object({
  classId: z.uuidv4(),
  primaryMentor: mentor,
  assignmentVersion: z.number().int().positive(),
  affectedSessionCount: z.number().int().nonnegative(),
  asOf: z.iso.datetime({ offset: true }),
});
export type ClassMentorIntent = {
  body: z.infer<typeof assignClassMentorInputSchema>;
  key: string;
  name: string;
  affectedSessionCount: number;
};
