import { describe, expect, it } from 'vitest';
import * as dto from './assignment-contracts';
import * as f from '../../../../tests/fixtures/assignment-data';
import {
  classProgressSchema,
  studentProgressSchema,
} from '@/features/mentor/schemas/workspace-contracts';
describe('assignment boundaries', () => {
  it('validates type-specific create rules, strict PATCH and nonblank fields', () => {
    const base = { type: 'QUIZ', purpose: 'TEST', title: 'Bài tập', maxScore: '10' };
    expect(dto.createInputSchema.safeParse(base).success).toBe(true);
    for (const change of [
      { maxAttempts: 2 },
      { title: ' ' },
      { maxScore: '0' },
      { maxScore: '1.001' },
      { extra: true },
      { type: 'ZIP' },
    ])
      expect(dto.createInputSchema.safeParse({ ...base, ...change }).success).toBe(false);
    expect(dto.patchInputSchema.safeParse({ expectedRevision: 1, maxScore: '20' }).success).toBe(
      false,
    );
    expect(
      dto.createInputSchema.safeParse({
        ...base,
        type: 'ZIP',
        dueAt: f.assignment.dueAt,
        timeLimitMinutes: 10,
      }).success,
    ).toBe(false);
  });
  it('handles 200 ABCD questions and detects indexed invalid/duplicate labels', () => {
    const { id: _id, position: _position, ...question } = f.question;
    void _id;
    void _position;
    expect(
      dto.questionsInputSchema.safeParse({
        expectedRevision: 1,
        questions: Array.from({ length: 200 }, () => question),
      }).success,
    ).toBe(true);
    expect(
      dto.questionsInputSchema.safeParse({
        expectedRevision: 1,
        questions: Array.from({ length: 201 }, () => question),
      }).success,
    ).toBe(false);
    expect(
      dto.questionInputSchema.safeParse({
        ...question,
        options: question.options.map((o) => ({ ...o, label: 'A' })),
      }).success,
    ).toBe(false);
  });
  it('keeps score comparisons exact, requires correction reason and matching release versions', () => {
    expect(dto.scoreCents('999999.99')).toBe(99999999);
    expect(dto.scoreCents('0.01')).toBe(1);
    expect(
      dto.gradeInputSchema.safeParse({ expectedVersion: 0, score: '0', feedback: '' }).success,
    ).toBe(true);
    expect(
      dto.gradeInputSchema.safeParse({ expectedVersion: 1, score: '10', feedback: '' }).success,
    ).toBe(false);
    expect(dto.releaseInputSchema.safeParse({ expectedVersion: 2, gradeVersion: 1 }).success).toBe(
      false,
    );
  });
  it('validates MIME, limits and Student-only history filters', () => {
    expect(
      dto.zipUploadInputSchema.safeParse({
        expectedVersion: 1,
        originalFilename: 'a.zip',
        declaredMimeType: 'application/zip',
        declaredSizeBytes: 20971520,
      }).success,
    ).toBe(true);
    expect(
      dto.zipUploadInputSchema.safeParse({
        expectedVersion: 1,
        originalFilename: 'a.zip',
        declaredMimeType: 'text/html',
        declaredSizeBytes: 10,
      }).success,
    ).toBe(false);
    for (const input of [{ history: 'true' }, { studentId: f.ids.student }, { status: 'UNGRADED' }])
      expect(dto.studentHistoryQuerySchema.safeParse(input).success).toBe(false);
  });
  it.each([classProgressSchema, studentProgressSchema])(
    'accepts AVAILABLE and old unavailable progress without manufacturing zero',
    (schema) => {
      const base = {
        ...f.pageOf([]),
        completionPolicy: 'UNDEFINED',
        policyVersion: null,
        readonly: true,
        asOf: f.now,
        timeZone: 'Asia/Ho_Chi_Minh',
      };
      expect(
        schema.parse({
          ...base,
          assignmentSummary: { availability: 'AVAILABLE', counts: f.counts },
        }).assignmentSummary.counts,
      ).toEqual(f.counts);
      expect(
        schema.parse({
          ...base,
          assignmentSummary: { availability: 'NOT_IMPLEMENTED', counts: null },
        }).assignmentSummary.counts,
      ).toBeNull();
      expect(
        schema.safeParse({
          ...base,
          assignmentSummary: { availability: 'AVAILABLE', counts: null },
        }).success,
      ).toBe(false);
    },
  );
});
