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
const approvedMaterial = {
  id,
  courseUnitId: id,
  contentType: 'ARTICLE',
  title: 'Bài viết',
  description: null,
  sortOrder: 0,
  availableAt: null,
  sessionId: null,
  createdBy: id,
  createdInClassId: null,
  revision: 3,
  reviewStatus: 'APPROVED',
  approvedRevision: 3,
  reviewedBy: id,
  reviewedAt: '2026-10-23T03:00:00Z',
  firstApprovedAt: '2026-10-23T03:00:00Z',
  rejectionReason: null,
  publishedAt: '2026-10-23T03:00:00Z',
  createdAt: '2026-10-23T03:00:00Z',
  updatedAt: '2026-10-23T03:00:00Z',
  canEdit: true,
  file: null,
  contentHtml: '<p>Nội dung</p>',
  contentSchemaVersion: 1,
  inlineImages: [],
  attachments: [],
};
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
  it.each(['approve', 'reject'] as const)(
    'forwards a successful %s with the expected revision and validates its response',
    async (action) => {
      const path = `manager/materials/${id}/${action}`;
      const result =
        action === 'approve'
          ? approvedMaterial
          : {
              ...approvedMaterial,
              reviewStatus: 'REJECTED',
              approvedRevision: null,
              publishedAt: null,
              rejectionReason: 'Thêm ví dụ.',
            };
      fetchMock.mockResolvedValueOnce(Response.json(result));
      const body = {
        expectedRevision: 3,
        ...(action === 'reject' ? { reason: '  Thêm ví dụ.  ' } : {}),
      };
      const response = await proxyApi(request(path, 'POST', body), path);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(result);
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toBe(`https://api.example.test/api/v1/${path}`);
      expect(init?.method).toBe('POST');
      expect(JSON.parse(String(init?.body))).toEqual({
        expectedRevision: 3,
        ...(action === 'reject' ? { reason: 'Thêm ví dụ.' } : {}),
      });
      expect(new Headers(init?.headers).get('Cookie')).toBe('access_token=opaque');
      expect(response.headers.get('cache-control')).toContain('private, no-store');
    },
  );
  it('forwards a draft edit with its revision and a bodyless delete returning 204', async () => {
    const path = `manager/materials/${id}`;
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ...approvedMaterial,
        title: 'Tên mới',
        revision: 4,
        reviewStatus: 'DRAFT',
        approvedRevision: null,
        publishedAt: null,
      }),
    );
    const edit = { title: 'Tên mới', expectedRevision: 3 };
    expect((await proxyApi(request(path, 'PATCH', edit), path)).status).toBe(200);
    expect(fetchMock.mock.calls[0][1]?.method).toBe('PATCH');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual(edit);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const response = await proxyApi(request(`${path}?expectedRevision=4`, 'DELETE'), path);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    const [url, init] = fetchMock.mock.calls[1];
    expect(String(url)).toBe(`https://api.example.test/api/v1/${path}?expectedRevision=4`);
    expect(init?.method).toBe('DELETE');
    expect(init?.body).toBeUndefined();
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
