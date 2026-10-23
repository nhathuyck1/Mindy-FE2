import { z } from 'zod';
const id = z.uuid();
const time = z.iso.datetime({ offset: true });
const label = z.enum(['A', 'B', 'C', 'D']);
export const questionSchema = z.object({
  id,
  position: z.number().int(),
  prompt: z.string(),
  options: z.array(z.object({ label, text: z.string() })),
});
export const assignmentSchema = z.object({
  id,
  sessionId: id,
  purpose: z.enum(['TEST', 'HOMEWORK']),
  type: z.enum(['QUIZ', 'ZIP']),
  title: z.string(),
  description: z.string(),
  maxScore: z.string(),
  dueAt: time.nullable(),
  timeLimitMinutes: z.number().nullable(),
  maxAttempts: z.number(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  revision: z.number().int().positive(),
  publishedAt: time.nullable(),
});
export const authorAssignmentSchema = assignmentSchema.extend({
  questions: z.array(questionSchema.extend({ correctOption: label })).optional(),
});
export const pageSchema = z.object({
  items: z.array(assignmentSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export const attemptSchema = z.object({
  attemptId: id,
  assignmentId: id,
  status: z.enum(['IN_PROGRESS', 'FINALIZING', 'GRADED', 'VOIDED']),
  version: z.number().int().positive(),
  startedAt: time,
  expiresAt: time.nullable(),
  submittedAt: time.nullable(),
  submissionSource: z.string().nullable(),
  serverNow: time,
  totalQuestions: z.number(),
  answeredCount: z.number(),
  questions: z.array(questionSchema),
  answers: z.array(z.object({ questionId: id, selectedOption: label })),
  retryAfterSeconds: z.number().nullable(),
  result: z
    .object({
      totalQuestions: z.number(),
      answeredCount: z.number(),
      correctCount: z.number(),
      wrongCount: z.number(),
      score: z.string(),
      maxScore: z.string(),
      results: z.array(
        z.object({
          questionId: id,
          selectedOption: label.nullable(),
          correctOption: label,
          isCorrect: z.boolean(),
        }),
      ),
    })
    .nullable(),
});
export const revisionSchema = z.object({ expectedRevision: z.number().int().positive() }).strict();
export const updateSchema = revisionSchema
  .extend({
    title: z.string().trim().min(1).max(250),
    description: z.string().max(20000),
    dueAt: time.nullable(),
    timeLimitMinutes: z.number().int().min(1).max(240).nullable(),
  })
  .strict();
export const createSchema = z
  .object({
    purpose: z.enum(['TEST', 'HOMEWORK']),
    type: z.literal('QUIZ'),
    title: z.string().trim().min(1).max(250),
    description: z.string().max(20000),
    maxScore: z.string().regex(/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/),
    dueAt: time.nullable(),
    timeLimitMinutes: z.number().int().min(1).max(240).nullable(),
    maxAttempts: z.literal(1),
  })
  .strict();
export const questionsInputSchema = revisionSchema
  .extend({
    questions: z
      .array(
        z
          .object({
            id: id.optional(),
            prompt: z.string().trim().min(1).max(5000),
            options: z
              .array(z.object({ label, text: z.string().trim().min(1).max(2000) }).strict())
              .length(4),
            correctOption: label,
          })
          .strict(),
      )
      .min(1)
      .max(200),
  })
  .strict();
export const answersInputSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    answers: z.array(z.object({ questionId: id, selectedOption: label }).strict()).max(200),
  })
  .strict();
export type Assignment = z.infer<typeof assignmentSchema>;
export type Attempt = z.infer<typeof attemptSchema>;
export type AuthorAssignment = z.infer<typeof authorAssignmentSchema>;
export const assignmentQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    sessionId: id.optional(),
    type: z.enum(['QUIZ', 'ZIP']).optional(),
    purpose: z.enum(['TEST', 'HOMEWORK']).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  })
  .strict();
