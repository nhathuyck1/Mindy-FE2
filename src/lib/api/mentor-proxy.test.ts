import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';
import { createMaterialSchema } from '@/features/mentor/schemas/mentor-contracts';
import { safeReturnPath } from '@/features/auth/lib/return-path';

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
      Cookie: 'access_token=opaque; refresh_token=secret; other=hidden',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
describe('Mentor adapter boundaries', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });
  it('keeps cash collection and staff operations outside the allowlist', async () => {
    for (const [method, path] of [
      ['GET', 'mentor/cash-orders'],
      ['POST', `mentor/cash-orders/${id}/confirm`],
      ['POST', `management/class-sessions/${id}/attendance/recover`],
      ['GET', `management/class-sessions/${id}/attendance-audits`],
      ['POST', `mentor/classes/${id}/materials/${key}/approve`],
      ['PATCH', `mentor/classes/${id}`],
      ['GET', 'mentor/classes/invalid/units'],
      ['GET', `class-sessions/${id}/context/extra`],
    ]) {
      expect((await proxyApi(request(path, method), path)).status).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('requires authentication and validates query filters, duplicates and Origin', async () => {
    const path = 'mentor/classes';
    expect((await proxyApi(request(path, 'GET', undefined, { Cookie: '' }), path)).status).toBe(
      401,
    );
    for (const query of ['?page=0', '?pageSize=101', '?page=1&page=2', '?mentorId=' + id])
      expect((await proxyApi(request(path + query), path)).status).toBe(422);
    const release = `mentor/classes/${id}/units/${key}/release`;
    expect(
      (
        await proxyApi(
          request(release, 'PATCH', { status: 'OPEN' }, { Origin: 'https://evil.test' }),
          release,
        )
      ).status,
    ).toBe(403);
    expect(
      (await proxyApi(request(release, 'PATCH', { status: 'COMPLETED' }), release)).status,
    ).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('forwards only the access cookie and strips unexpected response fields', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ items: [], page: 2, pageSize: 20, total: 0, access_token: 'hidden' }),
    );
    const result = await proxyApi(request('mentor/classes?page=2'), 'mentor/classes');
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ items: [], page: 2, pageSize: 20, total: 0 });
    expect(String(fetchMock.mock.calls[0][0])).toContain('mentor/classes?page=2&pageSize=20');
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Cookie')).toBe(
      'access_token=opaque',
    );
    expect(result.headers.get('cache-control')).toContain('no-store');
  });
  it('requires and forwards attendance idempotency with the expected version', async () => {
    const path = `class-sessions/${id}/start`;
    expect((await proxyApi(request(path, 'POST', { expectedVersion: 3 }), path)).status).toBe(422);
    expect(
      (
        await proxyApi(
          request(
            path,
            'POST',
            { expectedVersion: 3, reason: 'staff bypass' },
            { 'Idempotency-Key': key },
          ),
          path,
        )
      ).status,
    ).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(
      Response.json({ code: 'VERSION_CONFLICT', message: 'Changed' }, { status: 409 }),
    );
    expect(
      (
        await proxyApi(
          request(path, 'POST', { expectedVersion: 3 }, { 'Idempotency-Key': key }),
          path,
        )
      ).status,
    ).toBe(409);
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Idempotency-Key')).toBe(key);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ expectedVersion: 3 });
  });
  it('forwards delete revisions and rejects malformed material payloads', async () => {
    const path = `mentor/classes/${id}/materials/${key}`;
    expect((await proxyApi(request(path, 'DELETE'), path)).status).toBe(422);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect((await proxyApi(request(path + '?expectedRevision=4', 'DELETE'), path)).status).toBe(
      204,
    );
    expect(String(fetchMock.mock.calls[0][0])).toContain('?expectedRevision=4');
    expect(
      createMaterialSchema.safeParse({ title: 'Article', contentType: 'ARTICLE', fileId: id })
        .success,
    ).toBe(false);
    expect(createMaterialSchema.safeParse({ title: 'Video', contentType: 'VIDEO' }).success).toBe(
      false,
    );
    expect(
      createMaterialSchema.safeParse({
        title: 'Article',
        contentType: 'ARTICLE',
        contentHtml: 'ế'.repeat(25000),
      }).success,
    ).toBe(false);
  });
  it('rejects invalid upstream data and restricts mentor return paths', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], total: 'bad' }));
    expect((await proxyApi(request('mentor/classes'), 'mentor/classes')).status).toBe(502);
    expect(safeReturnPath(`/mentor/sessions/${id}`)).toBe(`/mentor/sessions/${id}`);
    expect(safeReturnPath(`/mentor/classes/${id}`)).toBe(`/mentor/classes/${id}`);
    expect(safeReturnPath('/mentor/cash-orders')).toBe('/');
    expect(safeReturnPath('//evil.test/mentor')).toBe('/');
  });
});
