import { describe, expect, it } from 'vitest';
import type { MentorAuthoring } from '../schemas/code-contracts';
import {
  firstOpenStep,
  formatCell,
  formFrom,
  formProblems,
  matchesType,
  parseBulk,
  parseCell,
  problemBody,
  signatureProblems,
  stepDone,
} from './code-authoring';
import { codeTemplates } from './code-templates';

const twoSum = {
  functionName: 'twoSum',
  params: [
    { name: 'nums', type: 'int[]' as const },
    { name: 'target', type: 'int' as const },
  ],
  returnType: 'int[]' as const,
};

function authoring(overrides: Partial<MentorAuthoring> = {}): MentorAuthoring {
  return {
    assignment: {
      id: '11111111-1111-4111-8111-111111111111',
      sessionId: '22222222-2222-4222-8222-222222222222',
      purpose: 'HOMEWORK',
      type: 'CODE',
      title: 'Two Sum',
      description: '',
      maxScore: '10.00',
      dueAt: '2026-11-10T00:00:00.000Z',
      timeLimitMinutes: null,
      maxAttempts: 10,
      status: 'DRAFT',
      revision: 5,
      publishedAt: null,
    },
    problem: null,
    languages: [],
    tests: [],
    references: [],
    validatedRevision: null,
    publishBlockers: ['CODE_PROBLEM_REQUIRED'],
    availableLanguages: [],
    ...overrides,
  };
}

describe('mentor authoring helpers', () => {
  it('reads cells by type: bare strings, JSON for the rest, with Vietnamese errors', () => {
    expect(parseCell('string', 'hello world')).toEqual({ value: 'hello world' });
    expect(parseCell('string', '"  padded "')).toEqual({ value: '  padded ' });
    expect(parseCell('int', ' 42 ')).toEqual({ value: 42 });
    expect(parseCell('int', '2147483648')).toEqual({ error: 'Cần số nguyên, ví dụ 5' });
    expect(parseCell('int[]', '[1, 2, 3]')).toEqual({ value: [1, 2, 3] });
    expect(parseCell('int[]', '[1, "2"]')).toEqual({ error: 'Cần mảng số nguyên, ví dụ [5]' });
    expect(parseCell('boolean', 'true')).toEqual({ value: true });
    expect(parseCell('double', '')).toEqual({ error: 'Nhập số thực, ví dụ 1.5' });
    expect(parseCell('string[][]', '[["a","b"],[]]')).toEqual({ value: [['a', 'b'], []] });
  });

  it('formats cells so they parse back to the same value', () => {
    for (const [type, value] of [
      ['string', 'abc'],
      ['string', ''],
      ['string', ' lead'],
      ['string', '"quoted"'],
      ['string', 'a\nb'],
      ['int[]', [1, 2]],
      ['boolean', false],
    ] as const) {
      expect(parseCell(type, formatCell(type, value))).toEqual({ value });
    }
    expect(formatCell('string', 'abc')).toBe('abc');
  });

  it('mirrors the server type rules', () => {
    expect(matchesType('long', 2 ** 53)).toBe(false);
    expect(matchesType('long', 2 ** 53 - 1)).toBe(true);
    expect(matchesType('double', Number.NaN)).toBe(false);
    expect(matchesType('int[][]', [[1], [2, 3]])).toBe(true);
  });

  it('parses bulk paste lines and reports the failing line', () => {
    expect(parseBulk(twoSum, '[[2,7,11,15], 9]\n\n[[3,2,4], 6]')).toEqual({
      rows: [
        [[2, 7, 11, 15], 9],
        [[3, 2, 4], 6],
      ],
    });
    expect(parseBulk(twoSum, '[[1,2], 3]\n[1, 2]')).toEqual({
      error: 'Dòng 2: sai số lượng hoặc kiểu tham số, ví dụ [[5], 5]',
    });
    const single = {
      functionName: 'rev',
      params: [{ name: 's', type: 'string' as const }],
      returnType: 'string' as const,
    };
    expect(parseBulk(single, 'hello\n"x"\n["y"]')).toEqual({ rows: [['hello'], ['x'], ['y']] });
    const arr = {
      functionName: 'm',
      params: [{ name: 'nums', type: 'int[]' as const }],
      returnType: 'int' as const,
    };
    expect(parseBulk(arr, '[1,2,3]\n[[4]]')).toEqual({ rows: [[[1, 2, 3]], [[4]]] });
  });

  it('checks names like the server and validates limits', () => {
    expect(signatureProblems(twoSum)).toEqual([]);
    expect(signatureProblems({ ...twoSum, functionName: 'class' })).toHaveLength(1);
    expect(signatureProblems({ ...twoSum, params: [{ name: 'twoSum', type: 'int' }] })).toEqual([
      'Tên hàm và tên tham số không được trùng nhau.',
    ]);
    const form = { ...formFrom(authoring()), cpuTimeLimitMs: '50', languages: [] };
    expect(formProblems(form)).toEqual([
      'Giới hạn thời gian phải từ 100 đến 10000 ms.',
      'Chọn ít nhất một ngôn ngữ.',
    ]);
  });

  it('starts new problems with friendly defaults and builds the save body', () => {
    const form = formFrom(authoring());
    expect(form).toMatchObject({
      languages: ['javascript'],
      compareMode: 'EXACT',
      scoringMode: 'PER_TEST',
      cpuTimeLimitMs: '1000',
      memoryLimitMb: '256',
    });
    expect(problemBody({ ...form, compareMode: 'FLOAT', floatEpsilon: '0.001' })).toMatchObject({
      floatEpsilon: 0.001,
      cpuTimeLimitMs: 1000,
      difficulty: null,
    });
    expect(problemBody(form).floatEpsilon).toBeNull();
  });

  it('tracks wizard progress from saved state only', () => {
    expect(firstOpenStep(authoring())).toBe('problem');
    const problem = {
      statementMd: 'x',
      constraintsMd: '',
      difficulty: null,
      signature: twoSum,
      compareMode: 'EXACT' as const,
      floatEpsilon: null,
      scoringMode: 'PER_TEST' as const,
      cpuTimeLimitMs: 1000,
      memoryLimitMb: 256,
    };
    const ready = authoring({
      problem,
      languages: [{ languageKey: 'javascript', starterCode: '' }],
      tests: [
        {
          id: 'a',
          position: 1,
          visibility: 'SAMPLE',
          inputArgs: [[1], 1],
          expected: [0],
          weight: 1,
          explanationMd: null,
        },
        {
          id: 'b',
          position: 2,
          visibility: 'HIDDEN',
          inputArgs: [[1], 1],
          expected: [0],
          weight: 1,
          explanationMd: null,
        },
      ],
      references: [
        { languageKey: 'javascript', sourceCode: 'x', validatedAt: null, lastValidation: null },
      ],
      validatedRevision: 5,
    });
    expect(stepDone(ready)).toEqual({ problem: true, function: true, tests: true, publish: false });
    expect(firstOpenStep(ready)).toBe('publish');
    expect(firstOpenStep({ ...ready, validatedRevision: 4 })).toBe('tests');
  });

  it('ships templates whose inputs match their signatures', () => {
    for (const t of codeTemplates) {
      expect(signatureProblems(t.signature), t.key).toEqual([]);
      expect(t.inputs.length, t.key).toBeGreaterThanOrEqual(3);
      for (const args of t.inputs) {
        expect(args.length, t.key).toBe(t.signature.params.length);
        t.signature.params.forEach((p, i) =>
          expect(matchesType(p.type, args[i]), t.key).toBe(true),
        );
      }
      const fn = new Function(`${t.referenceJs}; return ${t.signature.functionName};`)() as (
        ...args: unknown[]
      ) => unknown;
      for (const args of t.inputs)
        expect(matchesType(t.signature.returnType, fn(...args)), t.key).toBe(true);
    }
  });
});
