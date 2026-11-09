import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';
const fetchMock = vi.fn<typeof fetch>();
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});
describe('Tracking role proxy', () => {
  it('forwards the role together with source and pagination', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], total: 0, page: 2, pageSize: 10 }));
    const result = await proxyApi(
      new Request(
        'http://localhost:3003/api/v1/admin/tracking/events?actorRole=ADMIN&source=system_rule_audits&page=2&pageSize=10',
        { headers: { Cookie: 'access_token=opaque' } },
      ),
      'admin/tracking/events',
    );
    expect(result.status).toBe(200);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('actorRole')).toBe('ADMIN');
    expect(url.searchParams.get('source')).toBe('system_rule_audits');
    expect(url.searchParams.get('page')).toBe('2');
  });
  it('rejects unknown roles before upstream', async () => {
    vi.stubGlobal('fetch', fetchMock);
    expect(
      (
        await proxyApi(
          new Request('http://localhost:3003/api/v1/admin/tracking/events?actorRole=OWNER', {
            headers: { Cookie: 'access_token=opaque' },
          }),
          'admin/tracking/events',
        )
      ).status,
    ).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
