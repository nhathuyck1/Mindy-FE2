import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'http://localhost:3000/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';
import { resolveAssignmentRule } from './assignment-rules.server';
import * as f from '../../../tests/fixtures/assignment-data';
const fetchMock = vi.fn<typeof fetch>();
const a = `mentor/assignments/${f.ids.assignment}`;
const s = `me/assignments/${f.ids.assignment}`;
const q = `me/assignment-submissions/${f.ids.submission}`;
const z = `me/zip-submissions/${f.ids.submission}`;
const m = `mentor/zip-submissions/${f.ids.submission}`;
const v = { expectedVersion: 1 };
const revision = { expectedRevision: 1 };
const start = { expectedAssignmentRevision: 1 };
const upload = {
  originalFilename: 'de.pdf',
  declaredMimeType: 'application/pdf',
  declaredSizeBytes: 1024,
};
const intent = {
  ...f.fileStatus,
  fileId: f.ids.file,
  uploadUrl: 'http://localhost:19000/private/file?signature=secret',
  requiredHeaders: { 'Content-Type': 'application/zip' },
  uploadUrlExpiresAt: f.assignment.dueAt,
  intentExpiresAt: f.assignment.dueAt,
};
const history = { ...f.pageOf([]), audits: [], totalAudits: 0 };
type Case = { method: string; path: string; body?: unknown; output: unknown; receipt?: boolean };
const matrix: Case[] = [
  {
    method: 'POST',
    path: `mentor/class-sessions/${f.ids.session}/assignments`,
    body: { type: 'QUIZ', purpose: 'HOMEWORK', title: 'Bài tập', maxScore: '10' },
    output: f.assignment,
  },
  {
    method: 'GET',
    path: `mentor/class-sessions/${f.ids.session}/assignments`,
    output: f.pageOf([f.assignment]),
  },
  {
    method: 'GET',
    path: `mentor/classes/${f.ids.class}/assignments`,
    output: f.pageOf([f.assignment]),
  },
  { method: 'GET', path: a, output: f.assignment },
  { method: 'PATCH', path: a, body: { ...revision, title: 'Tên mới' }, output: f.assignment },
  {
    method: 'PUT',
    path: `${a}/questions`,
    body: {
      ...revision,
      questions: [{ prompt: f.question.prompt, options: f.question.options, correctOption: 'A' }],
    },
    output: f.assignment,
  },
  { method: 'POST', path: `${a}/publish`, body: revision, output: f.assignment },
  {
    method: 'POST',
    path: `${a}/archive`,
    body: { ...revision, reason: 'Thay đề' },
    output: f.assignment,
  },
  { method: 'DELETE', path: a, body: revision, output: null },
  {
    method: 'GET',
    path: `me/classes/${f.ids.class}/assignments`,
    output: f.pageOf([f.assignment]),
  },
  { method: 'GET', path: s, output: f.assignment },
  { method: 'POST', path: `${s}/start`, body: start, output: f.attempt, receipt: true },
  { method: 'GET', path: q, output: f.attempt },
  {
    method: 'PUT',
    path: `${q}/answers`,
    body: { ...v, answers: [] },
    output: f.attempt,
    receipt: true,
  },
  {
    method: 'POST',
    path: `${q}/submit`,
    body: { ...v, answers: [{ questionId: f.ids.question, selectedOption: 'A' }] },
    output: f.attempt,
    receipt: true,
  },
  {
    method: 'GET',
    path: `${q}/result`,
    output: { ...f.attempt, status: 'GRADED', result: f.result },
  },
  {
    method: 'POST',
    path: `${a}/instruction-upload-intents`,
    body: { ...revision, ...upload },
    output: intent,
    receipt: true,
  },
  {
    method: 'PUT',
    path: `${a}/instruction-files`,
    body: { ...revision, fileIds: [] },
    output: { revision: 2, instructionFiles: [] },
    receipt: true,
  },
  {
    method: 'POST',
    path: `${a}/extend`,
    body: { ...revision, maxAttempts: 2, reason: 'Thêm lượt' },
    output: { revision: 2, maxAttempts: 2, dueAt: f.assignment.dueAt },
    receipt: true,
  },
  { method: 'POST', path: `${s}/zip-submissions`, body: start, output: f.zip, receipt: true },
  {
    method: 'POST',
    path: `${z}/upload-intents`,
    body: { ...v, ...upload, declaredMimeType: 'application/zip' },
    output: intent,
    receipt: true,
  },
  {
    method: 'POST',
    path: `assignment-files/${f.ids.file}/complete`,
    body: v,
    output: f.fileStatus,
    receipt: true,
  },
  { method: 'GET', path: `assignment-files/${f.ids.file}`, output: f.fileStatus },
  {
    method: 'GET',
    path: `assignment-files/${f.ids.file}/download`,
    output: { url: 'http://localhost:19000/private', expiresAt: f.assignment.dueAt },
  },
  {
    method: 'PUT',
    path: `${z}/file`,
    body: { ...v, fileId: f.ids.file },
    output: f.zip,
    receipt: true,
  },
  { method: 'POST', path: `${z}/submit`, body: v, output: f.zip, receipt: true },
  { method: 'GET', path: z, output: f.zip },
  { method: 'GET', path: m, output: f.zip },
  {
    method: 'PUT',
    path: `${m}/grade`,
    body: { expectedVersion: 0, score: '0', feedback: '' },
    output: f.zip,
    receipt: true,
  },
  {
    method: 'POST',
    path: `${m}/grade/release`,
    body: { ...v, gradeVersion: 1 },
    output: f.zip,
    receipt: true,
  },
  { method: 'GET', path: `${m}/grade/history`, output: history },
  {
    method: 'GET',
    path: `${s}/submissions`,
    output: f.pageOf([
      f.zip,
      {
        type: 'QUIZ',
        id: f.ids.submission,
        assignmentId: f.ids.assignment,
        studentId: f.ids.student,
        attemptNumber: 1,
        submittedAt: f.now,
        status: 'GRADED',
        result: f.result,
        instructionFiles: [],
      },
    ]),
  },
  { method: 'GET', path: `${a}/submissions`, output: f.pageOf([f.zip]) },
  {
    method: 'GET',
    path: `${a}/roster`,
    output: { ...f.pageOf([]), denominator: 'CURRENT_ACTIVE_ENTITLEMENTS' },
  },
  { method: 'GET', path: `mentor/classes/${f.ids.class}/assignment-metrics`, output: f.metrics },
];
function req(test: Case, search = '', raw?: string, headers?: Record<string, string>) {
  return new Request(`http://localhost:3003/api/v1/${test.path}${search}`, {
    method: test.method,
    headers: {
      origin: 'http://localhost:3003',
      cookie: 'access_token=opaque; refresh_token=private',
      'content-type': 'application/json',
      ...(test.receipt ? { 'Idempotency-Key': f.ids.student } : {}),
      ...headers,
    },
    body: raw ?? (test.body === undefined ? undefined : JSON.stringify(test.body)),
  });
}
describe('assignment proxy: all 35 routes', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });
  it.each(matrix)('$method $path validates and forwards only allowed headers', async (test) => {
    fetchMock.mockResolvedValueOnce(
      test.output === null ? new Response(null, { status: 204 }) : Response.json(test.output),
    );
    const response = await proxyApi(req(test), test.path);
    expect(response.status).toBe(test.output === null ? 204 : 200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const headers = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(headers.get('cookie')).toBe('access_token=opaque');
    expect(headers.get('idempotency-key')).toBe(test.receipt ? f.ids.student : null);
    expect(fetchMock.mock.calls[0][1]?.redirect).toBe('manual');
  });
  it.each(matrix.filter((test) => test.receipt))(
    'requires UUIDv4 receipt for $path',
    async (test) => {
      expect(
        (await proxyApi(req(test, '', undefined, { 'Idempotency-Key': 'invalid' }), test.path))
          .status,
      ).toBe(422);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it('rejects unrecognized methods, paths, UUIDs, query keys and duplicates', async () => {
    for (const [method, path] of [
      ['PUT', a],
      ['POST', `${s}/questions`],
      ['GET', `${a}/foreign`],
      ['GET', 'mentor/assignments/11111111-1111-1111-8111-111111111111'],
    ])
      expect(resolveAssignmentRule(method, path)).toBeUndefined();
    for (const search of ['?private=true', '?page=1&page=2', '?pageSize=101'])
      expect((await proxyApi(req(matrix[1], search), matrix[1].path)).status).toBe(422);
    expect(
      (
        await proxyApi(
          req(matrix[0], '', undefined, { origin: 'http://foreign.test' }),
          matrix[0].path,
        )
      ).status,
    ).toBe(403);
    expect((await proxyApi(req(matrix[3], '', undefined, { cookie: '' }), a)).status).toBe(401);
  });
  it('keeps safe indexed field errors and discards rejected values/stack', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        {
          code: 'INVALID_QUIZ_QUESTIONS',
          message: 'Kiểm tra câu hỏi.',
          details: [
            {
              fields: [
                { path: 'questions.2.options.0.text', code: 'BLANK', rejectedValue: 'secret' },
              ],
              stack: 'secret',
            },
          ],
        },
        { status: 422 },
      ),
    );
    const response = await proxyApi(req(matrix[5]), matrix[5].path);
    expect(await response.json()).toEqual({
      code: 'INVALID_QUIZ_QUESTIONS',
      message: 'Kiểm tra câu hỏi.',
      details: [{ fields: [{ path: 'questions.2.options.0.text', code: 'BLANK' }] }],
    });
    const invalid = await proxyApi(
      req(
        matrix[5],
        '',
        JSON.stringify({
          expectedRevision: 1,
          questions: [{ prompt: ' ', options: [], correctOption: 'X' }],
        }),
      ),
      matrix[5].path,
    );
    expect(JSON.stringify(await invalid.json())).toContain('questions.0.prompt');
  });
  it('enforces byte boundaries while streaming without Content-Length', async () => {
    const base = JSON.stringify({ expectedRevision: 1, description: 'ề'.repeat(19000) });
    const byteLength = new TextEncoder().encode(base).length;
    fetchMock.mockResolvedValueOnce(Response.json(f.assignment));
    const accepted = await proxyApi(req(matrix[4], '', base + ' '.repeat(65536 - byteLength)), a);
    expect(accepted.status).toBe(200);
    expect(
      (await proxyApi(req(matrix[4], '', base + ' '.repeat(65537 - byteLength)), a)).status,
    ).toBe(413);
    const bulk = JSON.stringify(matrix[5].body);
    fetchMock.mockResolvedValueOnce(Response.json(f.assignment));
    expect(
      (
        await proxyApi(
          req(matrix[5], '', bulk + ' '.repeat(8388608 - new TextEncoder().encode(bulk).length)),
          matrix[5].path,
        )
      ).status,
    ).toBe(200);
    expect(
      (await proxyApi(req(matrix[5], '', bulk + ' '.repeat(8388609 - bulk.length)), matrix[5].path))
        .status,
    ).toBe(413);
  });
  it('does not leak keys or draft grade metadata to Student', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ...f.assignment, storageKey: 'secret' }));
    const metadata = await (await proxyApi(req(matrix[10]), s)).json();
    expect(metadata).not.toHaveProperty('questions');
    expect(metadata).not.toHaveProperty('storageKey');
    fetchMock.mockResolvedValueOnce(Response.json({ ...f.attempt, result: f.result }));
    const running = await (await proxyApi(req(matrix[12]), q)).json();
    expect(running.result).toBeNull();
    expect(running.questions[0]).not.toHaveProperty('correctOption');
    fetchMock.mockResolvedValueOnce(Response.json(f.zip));
    const submission = await (await proxyApi(req(matrix[26]), z)).json();
    expect(submission).not.toHaveProperty('gradeVersion');
    expect(submission).not.toHaveProperty('releasedVersion');
  });
});
