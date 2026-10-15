import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';
const fetchMock = vi.fn<typeof fetch>();
const request = (path: string, cookie = true) =>
  new Request('http://localhost:3003/api/v1/' + path, {
    headers: cookie
      ? { Cookie: 'access_token=private; refresh_token=secret; tracking=ignore' }
      : {},
  });
beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});
describe('Student workspace adapter', () => {
  it.each(['me/classes', 'me/schedule'])('Does not call %s without a session', async (path) => {
    expect((await proxyApi(request(path, false), path)).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('Forwards valid weekly range and only the access cookie, stripping unrelated fields', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        items: [],
        page: 1,
        pageSize: 100,
        total: 0,
        timeZone: 'Asia/Ho_Chi_Minh',
        from: '2026-10-11T17:00:00Z',
        to: '2026-10-18T17:00:00Z',
        asOf: '2026-10-15T00:00:00Z',
        meetingUrl: 'private',
      }),
    );
    const response = await proxyApi(
      request('me/schedule?from=2026-10-11T17%3A00%3A00Z&to=2026-10-18T17%3A00%3A00Z'),
      'me/schedule',
    );
    expect(response.status).toBe(200);
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('cookie')).toBe(
      'access_token=private',
    );
    expect(String(fetchMock.mock.calls[0][0])).toContain('pageSize=100');
    expect(await response.json()).not.toHaveProperty('meetingUrl');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it.each([
    'me/schedule?from=2026-10-12&to=2026-10-19',
    'me/schedule?from=2026-10-12T00%3A00%3A00Z&to=2026-12-12T00%3A00%3A00Z',
    'me/classes?view=invalid',
    'me/classes?page=1&page=2',
    'me/classes?studentId=other',
  ])('Rejects invalid/foreign query %s', async (path) => {
    expect((await proxyApi(request(path), path.split('?')[0])).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('Keeps admin paths and invalid learning URLs outside the allowlist', async () => {
    for (const path of [
      'admin/users',
      'me/classes/not-a-uuid',
      'me/classes/11111111-1111-4111-8111-111111111111/students',
    ])
      expect((await proxyApi(request(path), path)).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
