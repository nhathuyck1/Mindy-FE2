import { z } from 'zod';
import * as c from '../schemas/code-contracts';

/**
 * Proxy allowlist for Phase 7 CODE assignments (mentor authoring/review and student work).
 * Code bodies (source, tests) need a larger limit; runs/validation wait for the judge runner.
 */
export type CodeProxyRule = {
  response: z.ZodType;
  body?: z.ZodType;
  query: z.ZodType<Record<string, string | number>>;
  cookies: string[];
  idempotent?: boolean;
  bodyLimit: number;
  timeoutMs: number;
};

const CODE_BODY_LIMIT = 262_144;
const RUNNER_TIMEOUT_MS = 90_000;
const noQuery = z.object({}).strict();
const uuid = (value: string | undefined) => z.uuid().safeParse(value).success;
const lang = (value: string | undefined) => c.codeLanguageKeySchema.safeParse(value).success;

function rule(
  response: z.ZodType,
  options: Partial<Omit<CodeProxyRule, 'response' | 'cookies'>> = {},
): CodeProxyRule {
  return {
    response,
    cookies: ['access_token'],
    query: noQuery,
    bodyLimit: CODE_BODY_LIMIT,
    timeoutMs: 10_000,
    ...options,
  };
}

export function codeProxyRule(method: string, path: string): CodeProxyRule | undefined {
  const p = path.split('/');
  if (p[0] === 'mentor') return mentorRule(method, path, p);
  if (p[0] === 'me') return studentRule(method, p);
}

function mentorRule(method: string, path: string, p: string[]): CodeProxyRule | undefined {
  if (path === 'mentor/code-languages' && method === 'GET') return rule(c.codeLanguagesSchema);
  if (path === 'mentor/code-library' && method === 'GET')
    return rule(c.codeLibraryPageSchema, { query: c.codeLibraryQuerySchema });
  if (path === 'mentor/code-signatures/preview' && method === 'POST')
    return rule(c.starterPreviewSchema, { body: c.signaturePreviewInputSchema });
  if (p[1] === 'class-sessions' && uuid(p[2]) && p[3] === 'assignments' && p.length === 4) {
    if (method === 'GET')
      return rule(c.assignmentPageSchema, { query: c.assignmentListQuerySchema });
    if (method === 'POST')
      return rule(c.assignmentSchema, { body: c.createCodeAssignmentInputSchema });
  }
  if (p[1] === 'code-submissions' && uuid(p[2])) {
    if (method === 'GET' && p.length === 3) return rule(c.mentorSubmissionDetailSchema);
    if (method === 'POST' && p.length === 4 && p[3] === 'rejudge')
      return rule(c.mentorSubmissionSchema);
    if (method === 'POST' && p.length === 4 && p[3] === 'void')
      return rule(c.mentorSubmissionSchema, { body: c.voidInputSchema });
  }
  if (p[1] !== 'assignments' || !uuid(p[2])) return;
  const action = p[3];
  if (method === 'POST' && p.length === 5 && action === 'code-tests' && p[4] === 'generate')
    return rule(c.generateResultSchema, {
      body: c.generateInputSchema,
      timeoutMs: RUNNER_TIMEOUT_MS,
    });
  // "Mentor làm mẫu": run demo code on samples / custom input (draft or published), not stored.
  if (method === 'POST' && p.length === 4 && action === 'code-runs')
    return rule(c.runResultSchema, { body: c.runInputSchema, timeoutMs: RUNNER_TIMEOUT_MS });
  if (p.length === 3 && method === 'DELETE') return rule(z.null(), { body: c.revisionInputSchema });
  if (
    p.length !== 4 &&
    !(p.length === 5 && (action === 'code-tests' || action === 'code-reference'))
  )
    return;
  if (method === 'GET') {
    if (action === 'code') return rule(c.mentorAuthoringSchema);
    if (action === 'code-summary') return rule(c.codeSummarySchema, { query: c.reviewQuerySchema });
    if (action === 'code-submissions')
      return rule(c.mentorSubmissionPageSchema, { query: c.reviewQuerySchema });
    return;
  }
  if (method === 'PUT') {
    if (action === 'code-problem')
      return rule(c.mentorAuthoringSchema, { body: c.upsertProblemInputSchema });
    if (action === 'code-tests' && p.length === 4)
      return rule(c.mentorAuthoringSchema, { body: c.replaceTestsInputSchema });
    if (action === 'code-languages')
      return rule(c.mentorAuthoringSchema, { body: c.languagesInputSchema });
    if (action === 'code-tests' && p.length === 5 && /^(?:[1-9]|[12]\d|30)$/.test(p[4] ?? ''))
      return rule(c.mentorAuthoringSchema, { body: c.testInputSchema });
    if (action === 'code-reference' && p.length === 5 && lang(p[4]))
      return rule(c.mentorAuthoringSchema, { body: c.referenceInputSchema });
    return;
  }
  if (
    method === 'DELETE' &&
    action === 'code-tests' &&
    p.length === 5 &&
    /^(?:[1-9]|[12]\d|30)$/.test(p[4] ?? '')
  )
    return rule(c.mentorAuthoringSchema, { body: c.revisionInputSchema });
  if (method !== 'POST' || p.length !== 4) return;
  if (action === 'code-validate')
    return rule(c.validationResultSchema, {
      body: c.revisionInputSchema,
      timeoutMs: RUNNER_TIMEOUT_MS,
    });
  if (action === 'publish') return rule(c.assignmentSchema, { body: c.revisionInputSchema });
  if (action === 'code-import') return rule(c.mentorAuthoringSchema, { body: c.importInputSchema });
  if (action === 'archive') return rule(c.assignmentSchema, { body: c.archiveInputSchema });
  if (action === 'code-extension') return rule(c.assignmentSchema, { body: c.extendInputSchema });
}

function studentRule(method: string, p: string[]): CodeProxyRule | undefined {
  if (
    p[1] === 'classes' &&
    uuid(p[2]) &&
    p[3] === 'assignments' &&
    p.length === 4 &&
    method === 'GET'
  )
    return rule(c.assignmentPageSchema, { query: c.assignmentListQuerySchema });
  if (p[1] === 'code-submissions' && uuid(p[2]) && p.length === 3 && method === 'GET')
    return rule(c.submissionSchema);
  if (p[1] !== 'assignments' || !uuid(p[2])) return;
  const action = p[3];
  if (p.length === 4) {
    if (method === 'GET' && action === 'code') return rule(c.studentCodeAssignmentSchema);
    if (action === 'code-runs' && method === 'POST')
      return rule(c.runResultSchema, { body: c.runInputSchema, timeoutMs: RUNNER_TIMEOUT_MS });
    if (action === 'code-submissions') {
      if (method === 'GET') return rule(c.submissionListSchema);
      if (method === 'POST')
        return rule(c.submissionSchema, { body: c.submitInputSchema, idempotent: true });
    }
  }
  if (p.length === 5 && action === 'code-drafts' && lang(p[4])) {
    if (method === 'GET') return rule(c.codeDraftSchema);
    if (method === 'PUT') return rule(c.codeDraftSchema, { body: c.draftInputSchema });
  }
}
