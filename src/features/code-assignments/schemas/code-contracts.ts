import { z } from 'zod';

/** Phase 7 CODE assignment contracts (Mindy-BE docs/api_flow/PHASE_7_CODE_flow-api-breakdown.md). */

const dateTime = z.iso.datetime({ offset: true });
const decimal = z.string().regex(/^\d{1,6}\.\d{2}$/);
export const codeLanguageKeys = ['javascript', 'java21'] as const;
export const codeLanguageKeySchema = z.enum(codeLanguageKeys);
export type CodeLanguageKey = z.infer<typeof codeLanguageKeySchema>;
export const codeValueTypes = [
  'int',
  'long',
  'double',
  'boolean',
  'string',
  'int[]',
  'long[]',
  'double[]',
  'boolean[]',
  'string[]',
  'int[][]',
  'string[][]',
] as const;
export const codeValueTypeSchema = z.enum(codeValueTypes);
export type CodeValueType = z.infer<typeof codeValueTypeSchema>;
const identifier = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,39}$/);
const source = z.string().max(65_536);

export const codeSignatureSchema = z.object({
  functionName: identifier,
  params: z
    .array(z.object({ name: identifier, type: codeValueTypeSchema }))
    .min(1)
    .max(6),
  returnType: codeValueTypeSchema,
});
export type CodeSignature = z.infer<typeof codeSignatureSchema>;

export const assignmentSchema = z.object({
  id: z.uuid(),
  sessionId: z.uuid(),
  purpose: z.enum(['TEST', 'HOMEWORK']),
  type: z.enum(['QUIZ', 'ZIP', 'CODE']),
  title: z.string(),
  description: z.string(),
  maxScore: z.string(),
  dueAt: dateTime.nullable(),
  timeLimitMinutes: z.number().int().nullable(),
  maxAttempts: z.number().int(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  revision: z.number().int().positive(),
  publishedAt: dateTime.nullable(),
});
export type Assignment = z.infer<typeof assignmentSchema>;
const page = { total: z.number().int(), page: z.number().int(), pageSize: z.number().int() };
export const assignmentPageSchema = z.object({ ...page, items: z.array(assignmentSchema) });
export const assignmentListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
    type: z.enum(['QUIZ', 'ZIP', 'CODE']).optional(),
  })
  .strict();
export const reviewQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    studentId: z.uuid().optional(),
  })
  .strict();

export const codeLanguageSchema = z.object({
  key: codeLanguageKeySchema,
  displayName: z.string(),
  runtimeVersion: z.string(),
  editorMode: z.string(),
});
export const codeLanguagesSchema = z.array(codeLanguageSchema);
export const starterPreviewSchema = z.object({ javascript: z.string(), java21: z.string() });

export const mentorCodeTestSchema = z.object({
  id: z.uuid(),
  position: z.number().int(),
  visibility: z.enum(['SAMPLE', 'HIDDEN']),
  inputArgs: z.array(z.unknown()),
  expected: z.unknown(),
  weight: z.number().int(),
  explanationMd: z.string().nullable(),
});
export type MentorCodeTest = z.infer<typeof mentorCodeTestSchema>;
export const testVerdictSchema = z.enum([
  'PASSED',
  'WRONG_ANSWER',
  'TIME_LIMIT',
  'MEMORY_LIMIT',
  'RUNTIME_ERROR',
  'OUTPUT_LIMIT',
]);
export const codeValidationSchema = z.object({
  languageKey: codeLanguageKeySchema,
  compileStatus: z.enum(['OK', 'ERROR', 'TIMEOUT', 'SKIPPED']),
  compileOutput: z.string(),
  passed: z.number().int(),
  total: z.number().int(),
  runtimeVersion: z.string(),
  tests: z.array(
    z.object({
      position: z.number().int(),
      visibility: z.enum(['SAMPLE', 'HIDDEN']),
      verdict: testVerdictSchema,
      actual: z.unknown(),
      timeMs: z.number(),
      memoryKb: z.number(),
      stderr: z.string(),
    }),
  ),
});
export const codeProblemSchema = z.object({
  statementMd: z.string(),
  constraintsMd: z.string(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).nullable(),
  signature: codeSignatureSchema,
  compareMode: z.enum(['EXACT', 'FLOAT', 'UNORDERED']),
  floatEpsilon: z.number().nullable(),
  scoringMode: z.enum(['PER_TEST', 'ALL_OR_NOTHING']),
  cpuTimeLimitMs: z.number().int(),
  memoryLimitMb: z.number().int(),
});
export type CodeProblem = z.infer<typeof codeProblemSchema>;
export const mentorAuthoringSchema = z.object({
  assignment: assignmentSchema,
  problem: codeProblemSchema.nullable(),
  languages: z.array(z.object({ languageKey: codeLanguageKeySchema, starterCode: z.string() })),
  tests: z.array(mentorCodeTestSchema),
  references: z.array(
    z.object({
      languageKey: codeLanguageKeySchema,
      sourceCode: z.string(),
      validatedAt: dateTime.nullable(),
      lastValidation: codeValidationSchema.nullable(),
    }),
  ),
  validatedRevision: z.number().int().nullable(),
  publishBlockers: z.array(z.string()),
  availableLanguages: codeLanguagesSchema,
});
export type MentorAuthoring = z.infer<typeof mentorAuthoringSchema>;
export const validationResultSchema = z.object({
  validated: z.boolean(),
  revision: z.number().int(),
  results: z.array(codeValidationSchema),
});

const revision = { expectedRevision: z.number().int().positive() };
export const revisionInputSchema = z.object(revision).strict();
export const createCodeAssignmentInputSchema = z
  .object({
    purpose: z.enum(['TEST', 'HOMEWORK']),
    type: z.literal('CODE'),
    title: z.string().trim().min(1).max(250),
    description: z.string().max(20_000).optional(),
    maxScore: z.string().regex(/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/),
    dueAt: dateTime,
    maxAttempts: z.number().int().min(1).max(50),
  })
  .strict();
export const upsertProblemInputSchema = z
  .object({
    ...revision,
    statementMd: z.string().max(50_000),
    constraintsMd: z.string().max(5_000).optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).nullable().optional(),
    signature: codeSignatureSchema,
    compareMode: z.enum(['EXACT', 'FLOAT', 'UNORDERED']),
    floatEpsilon: z.number().min(1e-10).max(0.1).nullable().optional(),
    scoringMode: z.enum(['PER_TEST', 'ALL_OR_NOTHING']),
    cpuTimeLimitMs: z.number().int().min(100).max(10_000),
    memoryLimitMb: z.number().int().min(64).max(512),
  })
  .strict();
export const languagesInputSchema = z
  .object({
    ...revision,
    languages: z
      .array(
        z.object({ languageKey: codeLanguageKeySchema, starterCode: source.optional() }).strict(),
      )
      .min(1)
      .max(2),
  })
  .strict();
export const testInputSchema = z
  .object({
    ...revision,
    visibility: z.enum(['SAMPLE', 'HIDDEN']),
    inputArgs: z.array(z.unknown()).max(6),
    expected: z.unknown().refine((value) => value !== undefined),
    weight: z.number().int().min(1).max(100).optional(),
    explanationMd: z.string().max(5_000).nullable().optional(),
  })
  .strict();
export const referenceInputSchema = z.object({ ...revision, sourceCode: source.min(1) }).strict();
const testItemInputSchema = testInputSchema.omit({ expectedRevision: true });
export const replaceTestsInputSchema = z
  .object({ ...revision, tests: z.array(testItemInputSchema).min(1).max(30) })
  .strict();
export const generateInputSchema = z
  .object({
    languageKey: codeLanguageKeySchema,
    sourceCode: source.min(1),
    inputs: z.array(z.array(z.unknown()).max(6)).min(1).max(30),
  })
  .strict();
export const generatedOutputSchema = z.object({
  index: z.number().int(),
  status: z.enum([
    'OK',
    'TIME_LIMIT',
    'MEMORY_LIMIT',
    'RUNTIME_ERROR',
    'OUTPUT_LIMIT',
    'NO_RESULT',
    'INVALID_RETURN',
  ]),
  expected: z.unknown(),
  console: z.string(),
  stderr: z.string(),
  timeMs: z.number(),
  memoryKb: z.number(),
});
export type GeneratedOutput = z.infer<typeof generatedOutputSchema>;
export const generateResultSchema = z.object({
  languageKey: codeLanguageKeySchema,
  compileStatus: z.enum(['OK', 'ERROR', 'TIMEOUT']),
  compileOutput: z.string(),
  runtimeVersion: z.string(),
  outputs: z.array(generatedOutputSchema),
});
export type GenerateResult = z.infer<typeof generateResultSchema>;
export const importInputSchema = z.object({ ...revision, sourceAssignmentId: z.uuid() }).strict();
export const codeLibraryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().min(1).max(100).optional(),
  })
  .strict();
export const codeLibraryItemSchema = z.object({
  assignmentId: z.uuid(),
  title: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  classCode: z.string(),
  className: z.string(),
  sessionNumber: z.number().int(),
  sessionTitle: z.string(),
  testCount: z.number().int(),
  languages: z.array(z.string()),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).nullable(),
  updatedAt: dateTime,
});
export type CodeLibraryItem = z.infer<typeof codeLibraryItemSchema>;
export const codeLibraryPageSchema = z.object({ ...page, items: z.array(codeLibraryItemSchema) });
export const signaturePreviewInputSchema = z.object({ signature: codeSignatureSchema }).strict();
export const archiveInputSchema = z
  .object({ ...revision, reason: z.string().trim().min(1).max(2_000) })
  .strict();
export const extendInputSchema = z
  .object({
    ...revision,
    dueAt: dateTime.optional(),
    maxAttempts: z.number().int().min(1).max(50).optional(),
    reason: z.string().trim().min(1).max(2_000),
  })
  .strict();

// Student
export const studentCodeAssignmentSchema = z.object({
  assignmentId: z.uuid(),
  sessionId: z.uuid(),
  title: z.string(),
  description: z.string(),
  purpose: z.enum(['TEST', 'HOMEWORK']),
  status: z.enum(['PUBLISHED', 'ARCHIVED']),
  maxScore: z.string(),
  dueAt: dateTime,
  serverNow: dateTime,
  deadlinePassed: z.boolean(),
  maxAttempts: z.number().int(),
  attemptsUsed: z.number().int(),
  attemptsRemaining: z.number().int(),
  bestScore: decimal.nullable(),
  bestSubmissionId: z.uuid().nullable(),
  inFlightSubmissionId: z.uuid().nullable(),
  canSubmit: z.boolean(),
  problem: codeProblemSchema.omit({ floatEpsilon: true }),
  languages: z.array(codeLanguageSchema.extend({ starterCode: z.string() })),
  samples: z.array(
    z.object({
      position: z.number().int(),
      inputArgs: z.array(z.unknown()),
      expected: z.unknown(),
      display: z.string(),
      explanationMd: z.string().nullable(),
    }),
  ),
  hiddenTestCount: z.number().int(),
});
export type StudentCodeAssignment = z.infer<typeof studentCodeAssignmentSchema>;
export const codeDraftSchema = z.object({
  languageKey: codeLanguageKeySchema,
  sourceCode: z.string(),
  version: z.number().int().min(0),
  updatedAt: dateTime.nullable(),
});
export const draftInputSchema = z
  .object({ sourceCode: source, expectedVersion: z.number().int().min(0) })
  .strict();
export const runInputSchema = z
  .object({
    languageKey: codeLanguageKeySchema,
    sourceCode: source.min(1),
    customArgs: z.array(z.unknown()).max(6).optional(),
  })
  .strict();
export const submitInputSchema = z
  .object({ languageKey: codeLanguageKeySchema, sourceCode: source.min(1) })
  .strict();
export const runResultSchema = z.object({
  compileStatus: z.enum(['OK', 'ERROR', 'TIMEOUT']),
  compileOutput: z.string(),
  runtimeVersion: z.string(),
  tests: z.array(
    z.object({
      kind: z.enum(['SAMPLE', 'CUSTOM']),
      position: z.number().int().nullable(),
      display: z.string(),
      expected: z.unknown().optional(),
      actual: z.unknown(),
      status: z.enum([...testVerdictSchema.options, 'COMPLETED']),
      console: z.string(),
      stderr: z.string(),
      timeMs: z.number(),
      memoryKb: z.number(),
    }),
  ),
});
export type RunResult = z.infer<typeof runResultSchema>;
export const submissionStatusSchema = z.enum(['QUEUED', 'RUNNING', 'GRADED', 'FAILED', 'VOIDED']);
export const submissionSchema = z.object({
  id: z.uuid(),
  assignmentId: z.uuid(),
  attemptNumber: z.number().int(),
  languageKey: codeLanguageKeySchema,
  runtimeVersion: z.string().nullable(),
  status: submissionStatusSchema,
  verdict: z.string().nullable(),
  countsAsAttempt: z.boolean(),
  passedCount: z.number().int().nullable(),
  totalCount: z.number().int().nullable(),
  score: z.string().nullable(),
  maxScore: z.string(),
  compileOutput: z.string().nullable(),
  maxTimeMs: z.number().nullable(),
  maxMemoryKb: z.number().nullable(),
  submittedAt: dateTime,
  judgedAt: dateTime.nullable(),
  voidedReason: z.string().nullable(),
  retryAfterMs: z.number().nullable(),
  sourceCode: z.string().optional(),
  tests: z
    .array(
      z.object({
        position: z.number().int(),
        visibility: z.enum(['SAMPLE', 'HIDDEN']),
        status: z.string(),
        timeMs: z.number(),
        memoryKb: z.number(),
        inputArgs: z.array(z.unknown()).optional(),
        expected: z.unknown().optional(),
        actual: z.unknown().optional(),
        console: z.string().optional(),
      }),
    )
    .optional(),
});
export type Submission = z.infer<typeof submissionSchema>;
export const submissionListSchema = z.object({ items: z.array(submissionSchema) });

// Mentor review
export const mentorSubmissionSchema = submissionSchema.extend({
  studentId: z.uuid(),
  displayName: z.string(),
  duplicateOfOtherStudent: z.boolean(),
});
export type MentorSubmission = z.infer<typeof mentorSubmissionSchema>;
export const mentorSubmissionPageSchema = z.object({
  ...page,
  items: z.array(mentorSubmissionSchema),
});
export const mentorSubmissionDetailSchema = mentorSubmissionSchema.extend({
  mentorTests: z.array(
    z.object({
      position: z.number().int(),
      visibility: z.enum(['SAMPLE', 'HIDDEN']),
      weight: z.number().int(),
      status: z.string(),
      timeMs: z.number(),
      memoryKb: z.number(),
      inputArgs: z.array(z.unknown()),
      expected: z.unknown(),
      actual: z.unknown().optional(),
      console: z.string().optional(),
    }),
  ),
  lastError: z.string().nullable(),
});
export const codeSummarySchema = z.object({
  assignmentId: z.uuid(),
  maxScore: z.string(),
  maxAttempts: z.number().int(),
  dueAt: dateTime.nullable(),
  totals: z.object({
    students: z.number().int(),
    submitted: z.number().int(),
    notSubmitted: z.number().int(),
    accepted: z.number().int(),
    failed: z.number().int(),
    averageBestScore: z.string().nullable(),
  }),
  items: z.array(
    z.object({
      studentId: z.uuid(),
      displayName: z.string(),
      enrollmentStatus: z.string().nullable(),
      submissionCount: z.number().int(),
      attemptsUsed: z.number().int(),
      bestScore: z.string().nullable(),
      bestSubmissionId: z.uuid().nullable(),
      latestStatus: z.string().nullable(),
      latestVerdict: z.string().nullable(),
      latestSubmittedAt: dateTime.nullable(),
      failedCount: z.number().int(),
    }),
  ),
  ...page,
});
export type CodeSummary = z.infer<typeof codeSummarySchema>;
export const voidInputSchema = z.object({ reason: z.string().trim().min(1).max(2_000) }).strict();
