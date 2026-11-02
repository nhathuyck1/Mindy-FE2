'use client';

import type { CodeLanguageKey, MentorAuthoring } from '../schemas/code-contracts';
import {
  generateResultSchema,
  mentorAuthoringSchema,
  validationResultSchema,
} from '../schemas/code-contracts';
import type { CodeTemplate } from '../lib/code-templates';
import { useCodeCommand } from './code-queries';

const RUNNER_TIMEOUT_MS = 95_000;

/**
 * Commands of the mentor authoring wizard. Every write sends the revision it was based on; chained
 * writes use the revision returned by the previous one, so a stale tab gets 409 instead of overwriting.
 */
export function useAuthoringActions(assignmentId: string) {
  const authoring = useCodeCommand(mentorAuthoringSchema);
  const generator = useCodeCommand(generateResultSchema);
  const validator = useCodeCommand(validationResultSchema);
  const base = `mentor/assignments/${assignmentId}`;

  const put = (
    action: string,
    revision: number,
    body: Record<string, unknown> = {},
    method: 'PUT' | 'POST' | 'DELETE' = 'PUT',
  ) =>
    authoring.mutateAsync({
      path: `${base}/${action}`,
      method,
      body: { expectedRevision: revision, ...body },
    });

  const generate = (languageKey: CodeLanguageKey, sourceCode: string, inputs: unknown[][]) =>
    generator.mutateAsync({
      path: `${base}/code-tests/generate`,
      body: { languageKey, sourceCode, inputs },
      timeoutMs: RUNNER_TIMEOUT_MS,
    });

  const validate = (revision: number) =>
    validator.mutateAsync({
      path: `${base}/code-validate`,
      body: { expectedRevision: revision },
      timeoutMs: RUNNER_TIMEOUT_MS,
    });

  /** Problem → JavaScript → reference → outputs from the reference → tests → validation. */
  async function applyTemplate(
    template: CodeTemplate,
    data: MentorAuthoring,
    onProgress: (text: string) => void,
  ): Promise<MentorAuthoring> {
    onProgress('Đang tạo đề…');
    let r = await put('code-problem', data.assignment.revision, {
      statementMd: template.statementMd,
      constraintsMd: template.constraintsMd,
      difficulty: template.difficulty,
      signature: template.signature,
      compareMode: 'EXACT',
      floatEpsilon: null,
      scoringMode: 'PER_TEST',
      cpuTimeLimitMs: 1000,
      memoryLimitMb: 256,
    });
    r = await put('code-languages', r.assignment.revision, {
      languages: [{ languageKey: 'javascript' }],
    });
    r = await put('code-reference/javascript', r.assignment.revision, {
      sourceCode: template.referenceJs,
    });
    onProgress('Đang chạy lời giải mẫu để tạo kết quả test…');
    const inputs = template.inputs.map((args) => [...args]);
    const generated = await generate('javascript', template.referenceJs, inputs);
    if (generated.compileStatus !== 'OK' || generated.outputs.some((o) => o.status !== 'OK'))
      throw new Error('Lời giải mẫu của đề mẫu không chạy được, hãy báo quản trị.');
    r = await put('code-tests', r.assignment.revision, {
      tests: inputs.map((inputArgs, index) => ({
        visibility: index < 2 ? 'SAMPLE' : 'HIDDEN',
        inputArgs,
        expected: generated.outputs[index]?.expected,
      })),
    });
    onProgress('Đang kiểm tra đề…');
    await validate(r.assignment.revision);
    return r;
  }

  return {
    put,
    generate,
    validate,
    applyTemplate,
    importFrom: (revision: number, sourceAssignmentId: string) =>
      put('code-import', revision, { sourceAssignmentId }, 'POST'),
    pending: authoring.isPending || generator.isPending || validator.isPending,
  };
}
