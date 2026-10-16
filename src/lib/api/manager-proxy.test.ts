import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';

const id = '11111111-1111-4111-8111-111111111111';
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
      Cookie: 'access_token=opaque; refresh_token=private',
      Origin: 'http://localhost:3003',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
describe('Manager material proxy', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });
  it('validates login, strict filters and mutation origin before contacting upstream', async () => {
    const path = 'manager/materials';
    expect((await proxyApi(request(path, 'GET', undefined, { Cookie: '' }), path)).status).toBe(
      401,
    );
    expect((await proxyApi(request(`${path}?reviewStatus=PAID`), path)).status).toBe(422);
    expect((await proxyApi(request(`${path}?page=1&page=2`), path)).status).toBe(422);
    const action = `${path}/${id}/approve`;
    expect(
      (
        await proxyApi(
          request(action, 'POST', { expectedRevision: 1 }, { Origin: 'https://evil.test' }),
          action,
        )
      ).status,
    ).toBe(403);
    expect(
      (await proxyApi(request(action, 'POST', { expectedRevision: 1, role: 'ADMIN' }), action))
        .status,
    ).toBe(422);
    expect(
      (
        await proxyApi(
          request(`${path}/${id}/reject`, 'POST', { expectedRevision: 1, reason: ' ' }),
          `${path}/${id}/reject`,
        )
      ).status,
    ).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('forwards manager filters and only the access cookie without caching', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], page: 2, pageSize: 20, total: 0 }));
    const path = 'manager/materials';
    const response = await proxyApi(
      request(`${path}?page=2&reviewStatus=PENDING_REVIEW&courseUnitId=${id}`),
      path,
    );
    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain(`courseUnitId=${id}`);
    expect(new Headers(init?.headers).get('Cookie')).toBe('access_token=opaque');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('keeps the reviewed revision on conflicts and does not retry', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ code: 'MATERIAL_REVIEW_CONFLICT', message: 'Changed' }, { status: 409 }),
    );
    const path = `manager/materials/${id}/approve`;
    expect((await proxyApi(request(path, 'POST', { expectedRevision: 3 }), path)).status).toBe(409);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ expectedRevision: 3 });
  });
  it('forwards paginated unit materials with filters and rejects an injected unit query', async () => {
    const path = `manager/course-units/${id}/materials`;
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], page: 2, pageSize: 20, total: 0 }));
    const result = await proxyApi(
      request(`${path}?page=2&pageSize=20&reviewStatus=APPROVED&contentType=FILE`),
      path,
    );
    expect(result.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain(`/api/v1/${path}?`);
    expect(new URL(String(url)).searchParams.get('reviewStatus')).toBe('APPROVED');
    expect(new URL(String(url)).searchParams.get('page')).toBe('2');
    expect(new Headers(init?.headers).get('Cookie')).toBe('access_token=opaque');
    expect((await proxyApi(request(`${path}?courseUnitId=${id}`), path)).status).toBe(422);
  });
  it('accepts Manager upload scope without inventing a class and rejects partial scope', async () => {
    const path = 'files/upload-intents';
    const body = {
      courseUnitId: id,
      originalFilename: 'lesson.pdf',
      declaredMimeType: 'application/pdf',
      declaredSizeBytes: 10,
    };
    fetchMock.mockResolvedValueOnce(
      Response.json({
        fileId: id,
        uploadUrl: 'https://storage.example.test/put',
        requiredHeaders: { 'content-type': 'application/pdf' },
        uploadUrlExpiresAt: '2026-10-16T10:00:00Z',
        intentExpiresAt: '2026-10-16T10:30:00Z',
      }),
    );
    expect((await proxyApi(request(path, 'POST', body), path)).status).toBe(200);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual(body);
    expect((await proxyApi(request(path, 'POST', { ...body, classId: id }), path)).status).toBe(
      422,
    );
  });
  it('keeps unused finance reads, wrong methods and planned endpoints closed', async () => {
    for (const path of [
      'manager/cash-orders',
      'manager/payments',
      'manager/finance/summary',
      `manager/cash-orders/${id}/confirm`,
      'manager/collections',
      'manager/materials/bad',
      `manager/materials/${id}/preview`,
    ])
      expect((await proxyApi(request(path), path)).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('validates delete revision and rejects a body on file access', async () => {
    const path = `manager/materials/${id}`;
    expect((await proxyApi(request(path, 'DELETE'), path)).status).toBe(422);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect((await proxyApi(request(`${path}?expectedRevision=2`, 'DELETE'), path)).status).toBe(
      204,
    );
    const access = `${path}/files/${id}/access`;
    expect((await proxyApi(request(access, 'POST', { role: 'PRIMARY' }), access)).status).toBe(422);
  });
});
