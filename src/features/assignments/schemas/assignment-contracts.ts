import { z } from 'zod';

export const uuid = z.uuidv4();
const count = z.number().int().nonnegative();
const version = z.number().int().positive();
const timestamp = z.iso.datetime({ offset: true });
const nonblank = (max: number) => z.string().max(max).regex(/\S/, 'Không được để trống.');
export const scoreSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/, 'Điểm có tối đa 2 số thập phân.');
export function scoreCents(score: string) {
  const [whole, fraction = ''] = scoreSchema.parse(score).split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export const labels = ['A', 'B', 'C', 'D'] as const;
export const optionLabel = z.enum(labels);
const option = z.object({ label: optionLabel, text: z.string() });
export const questionSchema = z.object({
  id: uuid,
  position: count,
  prompt: z.string(),
  options: z.array(option).length(4),
});
export const mentorQuestionSchema = questionSchema.extend({ correctOption: optionLabel });
export const questionInputSchema = z
  .object({
    id: uuid.optional(),
    prompt: nonblank(5000),
    options: z
      .array(z.object({ label: optionLabel, text: nonblank(2000) }).strict())
      .length(4)
      .refine((options) => new Set(options.map((o) => o.label)).size === 4, 'Cần đủ A, B, C, D.'),
    correctOption: optionLabel,
  })
  .strict();
export const revisionInputSchema = z.object({ expectedRevision: version }).strict();
export const createInputSchema = z
  .object({
    type: z.enum(['QUIZ', 'ZIP']),
    purpose: z.enum(['TEST', 'HOMEWORK']),
    title: nonblank(250),
    description: z.string().max(20000).optional(),
    maxScore: scoreSchema.refine((v) => scoreSchema.safeParse(v).success && scoreCents(v) > 0),
    dueAt: timestamp.nullable().optional(),
    timeLimitMinutes: z.number().int().min(1).max(240).nullable().optional(),
    maxAttempts: z.number().int().min(1).max(10).default(1),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.type === 'QUIZ' && v.maxAttempts !== 1)
      ctx.addIssue({
        code: 'custom',
        path: ['maxAttempts'],
        message: 'Trắc nghiệm chỉ có 1 lượt.',
      });
    if (v.type === 'ZIP' && !v.dueAt)
      ctx.addIssue({ code: 'custom', path: ['dueAt'], message: 'Chọn hạn nộp.' });
    if (v.type === 'ZIP' && v.timeLimitMinutes != null)
      ctx.addIssue({
        code: 'custom',
        path: ['timeLimitMinutes'],
        message: 'ZIP không dùng bộ đếm giờ.',
      });
  });
export const patchInputSchema = revisionInputSchema
  .extend({
    title: nonblank(250).optional(),
    description: z.string().max(20000).optional(),
    dueAt: timestamp.nullable().optional(),
    timeLimitMinutes: z.number().int().min(1).max(240).nullable().optional(),
  })
  .strict();
export const questionsInputSchema = revisionInputSchema
  .extend({ questions: z.array(questionInputSchema).min(1).max(200) })
  .strict();
export const archiveInputSchema = revisionInputSchema.extend({ reason: nonblank(2000) }).strict();
export const startInputSchema = z.object({ expectedAssignmentRevision: version }).strict();
export const answerSchema = z.object({ questionId: uuid, selectedOption: optionLabel }).strict();
export const answersInputSchema = z
  .object({
    expectedVersion: version,
    answers: z
      .array(answerSchema)
      .max(200)
      .refine((v) => new Set(v.map((a) => a.questionId)).size === v.length),
  })
  .strict();

export const fileSchema = z.object({
  id: uuid,
  originalFilename: z.string(),
  mimeType: z.string(),
  sizeBytes: count,
});
export const instructionSchema = fileSchema.extend({ position: count });
const assignmentFields = {
  id: uuid,
  sessionId: uuid,
  type: z.enum(['QUIZ', 'ZIP', 'CODE']),
  purpose: z.enum(['TEST', 'HOMEWORK']),
  title: z.string(),
  description: z.string(),
  maxScore: scoreSchema,
  dueAt: timestamp.nullable(),
  timeLimitMinutes: z.number().int().positive().nullable(),
  maxAttempts: version,
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  revision: version,
  publishedAt: timestamp.nullable(),
  instructionFiles: z.array(instructionSchema),
  capabilities: z.object({
    zipMutationsEnabled: z.boolean(),
    instructionFilesEnabled: z.boolean(),
  }),
};
// Student projection strips every unknown/private field at the proxy and client.
export const studentAssignmentSchema = z.object(assignmentFields);
export const mentorAssignmentSchema = studentAssignmentSchema.extend({
  questions: z.array(mentorQuestionSchema).optional(),
});
export const pageFields = { total: count, page: version, pageSize: version };
export const pageOf = <T extends z.ZodType>(item: T) =>
  z.object({ ...pageFields, items: z.array(item) });
export const studentAssignmentPageSchema = pageOf(studentAssignmentSchema);
export const mentorAssignmentPageSchema = pageOf(mentorAssignmentSchema);
export const quizResultSchema = z.object({
  totalQuestions: count,
  answeredCount: count,
  correctCount: count,
  wrongCount: count,
  score: scoreSchema,
  maxScore: scoreSchema,
  results: z.array(
    z.object({
      questionId: uuid,
      selectedOption: optionLabel.nullable(),
      correctOption: optionLabel,
      isCorrect: z.boolean(),
    }),
  ),
});
export const attemptSchema = z
  .object({
    attemptId: uuid,
    assignmentId: uuid,
    status: z.enum(['IN_PROGRESS', 'FINALIZING', 'GRADED', 'VOIDED']),
    version,
    startedAt: timestamp,
    expiresAt: timestamp.nullable(),
    submittedAt: timestamp.nullable(),
    submissionSource: z.string().nullable(),
    serverNow: timestamp,
    totalQuestions: count,
    answeredCount: count,
    questions: z.array(questionSchema),
    answers: z.array(answerSchema),
    result: quizResultSchema.nullable(),
    retryAfterSeconds: z.number().positive().nullable(),
  })
  .transform((v) => ({ ...v, result: v.status === 'GRADED' ? v.result : null }));

const pageQueryFields = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};
export const paginationSchema = z.object(pageQueryFields).strict();
export const assignmentQuerySchema = paginationSchema
  .extend({
    type: z.enum(['QUIZ', 'ZIP', 'CODE']).optional(),
    purpose: z.enum(['TEST', 'HOMEWORK']).optional(),
    sessionId: uuid.optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  })
  .strict();
const submissionFilters = { attemptNumber: z.coerce.number().int().min(1).max(10).optional() };
export const studentHistoryQuerySchema = paginationSchema
  .extend({ ...submissionFilters, status: z.enum(['SUBMITTED', 'RELEASED']).optional() })
  .strict();
export const mentorHistoryQuerySchema = paginationSchema
  .extend({
    ...submissionFilters,
    studentId: uuid.optional(),
    status: z.enum(['SUBMITTED', 'UNGRADED', 'GRADED', 'RELEASED', 'UNRELEASED']).optional(),
    history: z.enum(['true', 'false']).optional(),
  })
  .strict();
export const fileStatusSchema = fileSchema.extend({
  status: z.enum(['PENDING_UPLOAD', 'PROCESSING', 'READY', 'FAILED', 'DELETING', 'DELETED']),
  version,
  purpose: z.enum(['INSTRUCTION', 'SUBMISSION']),
  errorCode: z.string().nullable(),
});
const httpUrl = z.url().refine((v) => {
  const u = new URL(v);
  return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password;
});
export const uploadSchema = fileStatusSchema.extend({
  fileId: uuid,
  uploadUrl: httpUrl,
  requiredHeaders: z.record(z.string(), z.string()),
  uploadUrlExpiresAt: timestamp,
  intentExpiresAt: timestamp,
});
export const downloadSchema = z.object({ url: httpUrl, expiresAt: timestamp });
export const versionInputSchema = z.object({ expectedVersion: version }).strict();
const uploadFields = {
  originalFilename: nonblank(250),
  declaredMimeType: z.string().max(150),
  declaredSizeBytes: z.number().int().positive().max(26214400),
};
export const instructionUploadInputSchema = revisionInputSchema
  .extend({
    ...uploadFields,
    declaredMimeType: z.enum([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
    ]),
  })
  .strict();
export const zipUploadInputSchema = versionInputSchema
  .extend({
    ...uploadFields,
    declaredMimeType: z.literal('application/zip'),
    declaredSizeBytes: z.number().int().positive().max(20971520),
  })
  .strict();
export const instructionInputSchema = revisionInputSchema
  .extend({
    fileIds: z
      .array(uuid)
      .max(5)
      .refine((v) => new Set(v).size === v.length),
  })
  .strict();
export const instructionsResponseSchema = z.object({
  revision: version,
  instructionFiles: z.array(instructionSchema),
});
export const extendInputSchema = revisionInputSchema
  .extend({
    dueAt: timestamp.optional(),
    maxAttempts: z.number().int().min(1).max(10).optional(),
    reason: nonblank(2000),
  })
  .strict()
  .refine(
    (v) => v.dueAt !== undefined || v.maxAttempts !== undefined,
    'Chọn hạn hoặc số lượt mới.',
  );
export const extensionSchema = z.object({
  revision: version,
  dueAt: timestamp,
  maxAttempts: version,
});
export const attachInputSchema = versionInputSchema.extend({ fileId: uuid }).strict();
export const gradeInputSchema = z
  .object({
    expectedVersion: count,
    score: scoreSchema,
    feedback: z.string().max(10000),
    reason: nonblank(2000).optional(),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.expectedVersion > 0 && !v.reason)
      c.addIssue({ code: 'custom', path: ['reason'], message: 'Nhập lý do sửa điểm.' });
  });
export const releaseInputSchema = versionInputSchema
  .extend({ gradeVersion: version })
  .strict()
  .refine((v) => v.expectedVersion === v.gradeVersion, 'Phiên bản điểm không khớp.');
export const gradeSchema = z.object({ version, score: scoreSchema, feedback: z.string() });
export const zipSnapshotSchema = z.object({
  title: z.string(),
  description: z.string(),
  maxScore: scoreSchema,
  dueAt: timestamp,
  instructionFiles: z.array(instructionSchema),
});
export const studentZipSchema = z.object({
  type: z.literal('ZIP'),
  id: uuid,
  assignmentId: uuid,
  studentId: uuid,
  status: z.enum(['DRAFT', 'SUBMITTED', 'VOIDED']),
  version,
  attemptNumber: version.nullable(),
  submittedAt: timestamp.nullable(),
  snapshot: zipSnapshotSchema.nullable(),
  file: fileSchema.nullable(),
  grade: gradeSchema.nullable(),
});
export const mentorZipSchema = studentZipSchema.extend({
  gradeVersion: count,
  releasedVersion: version.nullable(),
});
const quizHistorySchema = z.object({
  type: z.literal('QUIZ'),
  id: uuid,
  assignmentId: uuid,
  studentId: uuid,
  attemptNumber: version,
  submittedAt: timestamp,
  status: z.literal('GRADED'),
  result: quizResultSchema.nullable(),
  instructionFiles: z.array(instructionSchema),
});
export const studentHistorySchema = pageOf(
  z.discriminatedUnion('type', [studentZipSchema, quizHistorySchema]),
);
export const mentorHistorySchema = pageOf(
  z.discriminatedUnion('type', [mentorZipSchema, quizHistorySchema]),
);
export const gradeHistorySchema = pageOf(
  gradeSchema.extend({ actorId: uuid, reason: z.string().nullable(), createdAt: timestamp }),
).extend({
  totalAudits: count,
  audits: z.array(
    z.object({
      action: z.enum(['GRADE', 'RELEASE']),
      version,
      actorId: uuid,
      reason: z.string().nullable(),
      createdAt: timestamp,
    }),
  ),
});
export const countsSchema = z.object({
  assignments: count,
  eligible: count,
  submitted: count,
  missing: count,
  ungraded: count,
  unreleased: count,
  released: count,
});
export const metricsSchema = countsSchema.extend({
  denominator: z.literal('CURRENT_ACTIVE_ASSIGNMENT_STUDENT_PAIRS'),
  historyIncludesTerminalEnrollments: z.boolean(),
  missingIsHistorical: z.boolean(),
});
export const rosterSchema = pageOf(
  z.object({
    studentId: uuid,
    enrollmentId: uuid,
    displayName: z.string(),
    submissionId: uuid.nullable(),
    submitted: z.boolean(),
    graded: z.boolean(),
    released: z.boolean(),
    missing: z.boolean(),
  }),
).extend({ denominator: z.literal('CURRENT_ACTIVE_ENTITLEMENTS') });
export type Assignment = z.infer<typeof mentorAssignmentSchema>;
export type Attempt = z.infer<typeof attemptSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type QuestionInput = z.infer<typeof questionInputSchema>;
export type ZipSubmission = z.infer<typeof studentZipSchema>;
export type MentorZipSubmission = z.infer<typeof mentorZipSchema>;
