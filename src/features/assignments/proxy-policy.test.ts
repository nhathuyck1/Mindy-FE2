import { describe, it, expect } from 'vitest';
import { resolveAssignmentRule } from './proxy-policy';
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
describe('Assignment API boundary', () => {
  it('Only allows exact authorized role paths, verbs and UUIDs', () => {
    expect(resolveAssignmentRule('POST', `me/assignments/${id}/start`)?.idempotent).toBe(true);
    expect(
      resolveAssignmentRule('GET', `mentor/classes/${id}/assignments`)?.query.safeParse({
        page: 1,
        sessionId: id,
      }).success,
    ).toBe(true);
    for (const [method, path] of [
      ['POST', `me/assignments/${id}/publish`],
      ['PUT', `me/assignments/${id}/questions`],
      ['GET', 'mentor/classes/invalid/assignments'],
      ['POST', `mentor/assignments/${id}/publish/extra`],
    ])
      expect(resolveAssignmentRule(method, path)).toBeUndefined();
  });
  it('Rejects injected grading fields and ZIP creation', () => {
    const save = resolveAssignmentRule('PUT', `me/assignment-submissions/${id}/answers`)!;
    expect(save.body?.safeParse({ expectedVersion: 1, answers: [], score: 100 }).success).toBe(
      false,
    );
    expect(
      resolveAssignmentRule('POST', `mentor/class-sessions/${id}/assignments`)?.body?.safeParse({
        type: 'ZIP',
      }).success,
    ).toBe(false);
  });
});
