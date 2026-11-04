import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'http://internal-api:3000/api/v1',
    appOrigin: 'https://frontend.test',
    realtimeOrigin: 'https://public-backend.test',
  }),
}));
import { proxyApi } from './proxy.server';
const fetchMock = vi.fn<typeof fetch>();
afterEach(() => vi.unstubAllGlobals());
const request = (
  body: unknown = { channel: 'whiteboards' },
  origin = 'https://frontend.test',
  cookie = 'access_token=private; refresh_token=never-forward; other=ignored',
  query = '',
) =>
  new Request('https://frontend.test/api/v1/auth/realtime-ticket' + query, {
    method: 'POST',
    headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
describe('realtime ticket proxy', () => {
  it('forwards only access cookie and app origin, returns runtime public realtime URL', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ticket: 'short-lived-ticket',
          expiresAt: '2026-11-04T10:00:00Z',
          accessToken: 'strip-me',
        }),
        { status: 200 },
      ),
    );
    const response = await proxyApi(request(), 'auth/realtime-ticket');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual({
      ticket: 'short-lived-ticket',
      expiresAt: '2026-11-04T10:00:00Z',
      url: 'https://public-backend.test',
    });
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toBe('http://internal-api:3000/api/v1/auth/realtime-ticket');
    expect(new Headers(init?.headers).get('cookie')).toBe('access_token=private');
    expect(new Headers(init?.headers).get('origin')).toBe('https://frontend.test');
  });
  it('blocks foreign origin, missing session and client-selected targets', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockClear();
    for (const [req, status] of [
      [request(undefined, 'https://evil.test'), 403],
      [request(undefined, undefined, ''), 401],
      [request({ channel: 'admin' }), 422],
      [request({ channel: 'chat', url: 'https://evil.test' }), 422],
      [request(undefined, undefined, undefined, '?origin=https://evil.test'), 422],
    ] as const)
      expect((await proxyApi(req, 'auth/realtime-ticket')).status).toBe(status);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
