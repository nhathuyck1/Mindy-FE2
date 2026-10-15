import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';
import { safeReturnPath } from '@/features/auth/lib/return-path';
const id = '11111111-1111-4111-8111-111111111111';
const root = `me/classes/${id}`;
const fetchMock = vi.fn<typeof fetch>();
const request = (path: string, method = 'GET', origin = 'http://localhost:3003', body?: string) =>
  new Request('http://localhost:3003/api/v1/' + path, {
    method,
    headers: { Cookie: 'access_token=private; refresh_token=secret', Origin: origin },
    body,
  });
beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});
it('Allows released material pagination and only the access cookie', async () => {
  fetchMock.mockResolvedValueOnce(
    Response.json({ items: [], page: 2, pageSize: 100, total: 0, asOf: '2026-10-16T00:00:00Z' }),
  );
  const path = `${root}/units/${id}/materials`;
  const result = await proxyApi(request(path + '?page=2&pageSize=100'), path);
  expect(result.status).toBe(200);
  expect(String(fetchMock.mock.calls[0][0])).toContain('?page=2&pageSize=100');
  expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('cookie')).toBe(
    'access_token=private',
  );
  expect(result.headers.get('cache-control')).toContain('no-store');
});
it('Signs referenced files only with same-origin POST without a body', async () => {
  const path = `${root}/materials/${id}/files/${id}/access`;
  expect((await proxyApi(request(path, 'POST', 'https://evil.test'), path)).status).toBe(403);
  expect((await proxyApi(request(path, 'POST', undefined, '{}'), path)).status).toBe(422);
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(
    Response.json({
      materialId: id,
      fileId: id,
      revision: 1,
      role: 'ATTACHMENT',
      url: 'https://files.example.test/file?signature=private',
      expiresAt: '2026-10-16T00:01:00Z',
    }),
  );
  expect((await proxyApi(request(path, 'POST'), path)).status).toBe(200);
  expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
});
it.each([
  `${root}?studentId=${id}`,
  `${root}/units/${id}/materials?page=1&page=2`,
  `${root}/units/${id}/materials?status=DRAFT`,
])('Rejects foreign and duplicate query %s', async (path) => {
  expect((await proxyApi(request(path), path.split('?')[0])).status).toBe(422);
  expect(fetchMock).not.toHaveBeenCalled();
});
it('Requires a session and rejects unsafe resource URLs', async () => {
  const path = `${root}/materials/${id}/download`;
  expect((await proxyApi(new Request('http://localhost:3003/api/v1/' + path), path)).status).toBe(
    401,
  );
  fetchMock.mockResolvedValueOnce(
    Response.json({
      materialId: id,
      fileId: id,
      url: 'javascript:alert(1)',
      expiresAt: '2026-10-16T00:01:00Z',
    }),
  );
  expect((await proxyApi(request(path), path)).status).toBe(502);
});
it('Keeps learning return paths within UUID routes and preview mode', () => {
  expect(safeReturnPath(`/user/materials/${id}?preview=true&next=https://evil.test`)).toBe(
    `/user/materials/${id}?preview=true`,
  );
  expect(safeReturnPath('/user/materials/invalid')).toBe('/');
});
