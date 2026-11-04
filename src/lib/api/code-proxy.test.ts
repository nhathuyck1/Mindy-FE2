import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';
import { assignment } from '../../../tests/fixtures/assignment-data';

const id = '11111111-1111-4111-8111-111111111111';
const key = '22222222-2222-4222-8222-222222222222';
const fetchMock = vi.fn<typeof fetch>();
function request(
  path: string,
  method = 'GET',
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return new Request(`http://localhost:3003/api/v1/${path}`, {
    method,
    headers: {
      Origin: 'http://localhost:3003',
      Cookie: 'access_token=opaque; refresh_token=secret',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const submission = {
  id,
  assignmentId: id,
  attemptNumber: 1,
  languageKey: 'javascript',
  runtimeVersion: null,
  status: 'QUEUED',
  verdict: null,
  countsAsAttempt: true,
  passedCount: null,
  totalCount: null,
  score: null,
  maxScore: '10.00',
  compileOutput: null,
  maxTimeMs: null,
  maxMemoryKb: null,
  submittedAt: '2026-11-02T10:00:00.000Z',
  judgedAt: null,
  voidedReason: null,
  retryAfterMs: 1500,
};

describe('CODE assignment proxy rules', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it.each(['QUIZ', 'ZIP', 'CODE'] as const)(
    'preserves shared creation for %s with the full assignment projection',
    async (type) => {
      const path = `mentor/class-sessions/${id}/assignments`;
      const maxAttempts = type === 'CODE' ? 50 : type === 'ZIP' ? 3 : 1;
      fetchMock.mockResolvedValue(
        Response.json({ ...assignment, type, maxAttempts }, { status: 201 }),
      );
      const res = await proxyApi(
        request(path, 'POST', {
          type,
          purpose: 'HOMEWORK',
          title: assignment.title,
          maxScore: '10.00',
          maxAttempts,
          dueAt: assignment.dueAt,
        }),
        path,
      );
      expect(res.status).toBe(201);
      expect(await res.json()).toMatchObject({
        type,
        maxAttempts,
        capabilities: assignment.capabilities,
      });
    },
  );

  it('keeps mixed QUIZ/ZIP/CODE lists readable and strips mentor answer keys for students', async () => {
    const path = `me/classes/${id}/assignments`;
    fetchMock.mockResolvedValue(
      Response.json({
        items: ['QUIZ', 'ZIP', 'CODE'].map((type) => ({ ...assignment, type })),
        total: 3,
        page: 1,
        pageSize: 20,
      }),
    );
    const res = await proxyApi(request(path), path);
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.items.map((item: { type: string }) => item.type)).toEqual([
      'QUIZ',
      'ZIP',
      'CODE',
    ]);
    for (const item of payload.items) {
      expect(item).not.toHaveProperty('questions');
      expect(item.capabilities).toEqual(assignment.capabilities);
    }
  });

  it('keeps unknown CODE paths, bad ids and languages outside the allowlist', async () => {
    for (const [method, path] of [
      ['GET', `mentor/assignments/${id}/code-secret`],
      ['PUT', `mentor/assignments/${id}/code-tests/31`],
      ['PUT', `mentor/assignments/${id}/code-reference/python3`],
      ['GET', 'me/assignments/not-a-uuid/code'],
      ['DELETE', `me/code-submissions/${id}`],
      ['POST', `me/assignments/${id}/code-drafts/javascript`],
    ]) {
      expect((await proxyApi(request(path, method), path)).status).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires a UUID Idempotency-Key for submissions and forwards it', async () => {
    const path = `me/assignments/${id}/code-submissions`;
    const body = { languageKey: 'javascript', sourceCode: 'function f() {}' };
    expect((await proxyApi(request(path, 'POST', body), path)).status).toBe(422);
    fetchMock.mockResolvedValue(Response.json(submission, { status: 202 }));
    const res = await proxyApi(request(path, 'POST', body, { 'Idempotency-Key': key }), path);
    expect(res.status).toBe(202);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(new Headers(init?.headers).get('Idempotency-Key')).toBe(key);
  });

  it('accepts code bodies beyond the default 16kb limit but not beyond 256kb', async () => {
    const path = `me/assignments/${id}/code-runs`;
    fetchMock.mockResolvedValue(
      Response.json({
        compileStatus: 'OK',
        compileOutput: '',
        runtimeVersion: 'Node.js 22',
        tests: [],
      }),
    );
    const ok = await proxyApi(
      request(path, 'POST', { languageKey: 'javascript', sourceCode: 'x'.repeat(60_000) }),
      path,
    );
    expect(ok.status).toBe(200);
    const big = await proxyApi(
      request(path, 'POST', { languageKey: 'javascript', sourceCode: 'x'.repeat(300_000) }),
      path,
    );
    expect(big.status).toBe(413);
  });

  it('validates review queries, rejects bodies on rejudge and requires a session', async () => {
    const summary = `mentor/assignments/${id}/code-summary`;
    const bad = new Request(`http://localhost:3003/api/v1/${summary}?pageSize=500`, {
      headers: { Cookie: 'access_token=opaque' },
    });
    expect((await proxyApi(bad, summary)).status).toBe(422);
    const rejudge = `mentor/code-submissions/${id}/rejudge`;
    const withBody = new Request(`http://localhost:3003/api/v1/${rejudge}`, {
      method: 'POST',
      headers: { Origin: 'http://localhost:3003', Cookie: 'access_token=opaque' },
      body: 'x',
    });
    expect((await proxyApi(withBody, rejudge)).status).toBe(422);
    const view = `me/assignments/${id}/code`;
    expect((await proxyApi(request(view, 'GET', undefined, { Cookie: '' }), view)).status).toBe(
      401,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('drops upstream fields outside the contract (no hidden data leaks through)', async () => {
    const path = `me/code-submissions/${id}`;
    fetchMock.mockResolvedValue(Response.json({ ...submission, referenceSolution: 'secret' }));
    const res = await proxyApi(request(path), path);
    expect(res.status).toBe(200);
    expect(JSON.stringify(await res.json())).not.toContain('secret');
  });
  it('allows the authoring wizard routes with strict bodies and queries', async () => {
    const generate = `mentor/assignments/${id}/code-tests/generate`;
    expect(
      (
        await proxyApi(
          request(generate, 'POST', { languageKey: 'javascript', inputs: [] }),
          generate,
        )
      ).status,
    ).toBe(422);
    fetchMock.mockResolvedValue(
      Response.json({
        languageKey: 'javascript',
        compileStatus: 'OK',
        compileOutput: '',
        runtimeVersion: 'Node.js 22',
        outputs: [
          {
            index: 0,
            status: 'OK',
            expected: [0, 1],
            console: '',
            stderr: '',
            timeMs: 3,
            memoryKb: 900,
          },
        ],
      }),
    );
    const ok = await proxyApi(
      request(generate, 'POST', {
        languageKey: 'javascript',
        sourceCode: 'function twoSum() {}',
        inputs: [[[2, 7], 9]],
      }),
      generate,
    );
    expect(ok.status).toBe(200);
    expect((await ok.json()).outputs[0].expected).toEqual([0, 1]);

    const library = 'mentor/code-library';
    const bad = new Request(`http://localhost:3003/api/v1/${library}?pageSize=500`, {
      headers: { Cookie: 'access_token=opaque' },
    });
    expect((await proxyApi(bad, library)).status).toBe(422);
    const tests = `mentor/assignments/${id}/code-tests`;
    expect(
      (await proxyApi(request(tests, 'PUT', { expectedRevision: 2, tests: [] }), tests)).status,
    ).toBe(422);
    const importPath = `mentor/assignments/${id}/code-import`;
    expect(
      (
        await proxyApi(
          request(importPath, 'POST', { expectedRevision: 2, sourceAssignmentId: 'nope' }),
          importPath,
        )
      ).status,
    ).toBe(422);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
