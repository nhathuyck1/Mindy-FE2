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
function request(path: string, cookie = true, method = 'GET') {
  return new Request(`http://localhost:3003/api/v1/${path}`, {
    method,
    headers: cookie ? { Cookie: 'access_token=access; refresh_token=private' } : {},
  });
}
function payload(scope: string) {
  const base = {
    scope,
    timeZone: 'Asia/Ho_Chi_Minh',
    generatedAt: '2026-11-03T00:00:00Z',
    from: '2026-10-01T00:00:00Z',
    to: '2026-11-03T00:00:00Z',
  };
  if (scope === 'MANAGER')
    return {
      ...base,
      summary: { collectedAmount: '0', paidOrders: 0, pendingAmount: '0', pendingOrders: 0 },
      paymentMethods: [],
      courses: [],
      classes: [],
      trend: [],
      reconciliation: [],
      openingAlerts: [],
    };
  if (scope === 'MENTOR')
    return {
      ...base,
      summary: {
        primaryClasses: 0,
        students: 0,
        assignedSessions: 0,
        substituteSessions: 0,
        completedSessions: 0,
        actualTeachingHours: 0,
      },
      upcoming: [],
      leaveRequests: [],
    };
  return {
    scope,
    timeZone: 'Asia/Ho_Chi_Minh',
    generatedAt: '2026-11-03T00:00:00Z',
    from: '2026-10-01T00:00:00Z',
    to: '2026-11-03T00:00:00Z',
    summary: {
      courses: 0,
      classes: 0,
      openClasses: 0,
      activeClasses: 0,
      registrations: 0,
      students: 0,
    },
    courses: [],
    mentors: [],
    classes: [],
    trend: [],
    classStatuses: [],
  };
}
describe('Dashboard proxy', () => {
  it.each(['admin', 'manager', 'mentor'])(
    'forwards bounded filters and only the access cookie for %s',
    async (audience) => {
      vi.stubGlobal('fetch', fetchMock);
      fetchMock.mockResolvedValue(Response.json(payload(audience.toUpperCase())));
      const response = await proxyApi(
        request(`${audience}/dashboard?days=30`),
        `${audience}/dashboard`,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toBe(`https://api.example.test/api/v1/${audience}/dashboard?days=30`);
      expect(new Headers(init?.headers).get('cookie')).toBe('access_token=access');
    },
  );
  it.each([
    'days=0',
    'days=1000',
    'days=30&days=90',
    'mentorId=11111111-1111-4111-8111-111111111111',
  ])('rejects invalid or scope-changing filters %s', async (query) => {
    vi.stubGlobal('fetch', fetchMock);
    expect((await proxyApi(request(`mentor/dashboard?${query}`), 'mentor/dashboard')).status).toBe(
      422,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rejects unauthenticated reads and unsupported writes', async () => {
    expect((await proxyApi(request('admin/dashboard', false), 'admin/dashboard')).status).toBe(401);
    expect(
      (await proxyApi(request('admin/dashboard', true, 'POST'), 'admin/dashboard')).status,
    ).toBe(404);
  });
  it('rejects a response for the wrong audience', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(Response.json(payload('ADMIN')));
    expect((await proxyApi(request('mentor/dashboard'), 'mentor/dashboard')).status).toBe(502);
  });
});
