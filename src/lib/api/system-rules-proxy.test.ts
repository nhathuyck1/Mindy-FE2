import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';

const path = 'admin/system-rules/session_start_time_enforced';
const fetchMock = vi.fn<typeof fetch>();
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});
function request(body: unknown, origin = 'http://localhost:3003') {
  return new Request(`http://localhost:3003/api/v1/${path}`, {
    method: 'PATCH',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      Cookie: 'access_token=opaque; refresh_token=private',
    },
    body: JSON.stringify(body),
  });
}
describe('System rules proxy', () => {
  it('forwards a strict boolean and trimmed reason with only access cookie', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValueOnce(
      Response.json({
        key: 'session_start_time_enforced',
        value: false,
        version: 2,
        updatedAt: '2026-11-09T03:00:00Z',
        updatedBy: null,
      }),
    );
    const result = await proxyApi(
      request({ value: false, expectedVersion: 1, reason: ' Demo ' }),
      path,
    );
    expect(result.status).toBe(200);
    const init = fetchMock.mock.calls[0][1];
    expect(new Headers(init?.headers).get('Cookie')).toBe('access_token=opaque');
    expect(JSON.parse(String(init?.body))).toEqual({
      value: false,
      expectedVersion: 1,
      reason: 'Demo',
    });
  });
  it.each([
    { value: 'false', expectedVersion: 1, reason: 'Demo' },
    { value: false, expectedVersion: 0, reason: 'Demo' },
    { value: false, expectedVersion: 1, reason: ' ' },
    { value: false, expectedVersion: 1, reason: 'Demo', arbitrary: true },
  ])('rejects invalid config before reaching upstream', async (body) => {
    vi.stubGlobal('fetch', fetchMock);
    expect((await proxyApi(request(body), path)).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rejects foreign origins and unknown rule keys', async () => {
    vi.stubGlobal('fetch', fetchMock);
    const body = { value: false, expectedVersion: 1, reason: 'Demo' };
    expect((await proxyApi(request(body, 'https://foreign.test'), path)).status).toBe(403);
    expect((await proxyApi(request(body), 'admin/system-rules/unknown')).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
