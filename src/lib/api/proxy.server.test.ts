import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));

import { proxyApi } from './proxy.server';

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'student@example.test',
  displayName: 'Học viên',
  phone: null,
  role: 'STUDENT',
  status: 'ACTIVE',
  lastLoginAt: null,
  createdAt: '2026-10-15T00:00:00Z',
};
const fetchMock = vi.fn<typeof fetch>();

function loginRequest(origin = 'http://localhost:3003', extra = {}) {
  return new Request('http://localhost:3003/api/v1/auth/login', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@example.test', password: 'x', ...extra }),
  });
}

describe('Homepage and login API adapter', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('Rejects requests outside the homepage and login allowlist', async () => {
    const response = await proxyApi(
      new Request('http://localhost:3003/api/v1/admin/unsupported'),
      'admin/unsupported',
    );
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Rejects foreign-origin login before contacting the backend', async () => {
    expect((await proxyApi(loginRequest('https://untrusted.test'), 'auth/login')).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Rejects role injection and preserves the login password policy', async () => {
    expect((await proxyApi(loginRequest(undefined, { role: 'ADMIN' }), 'auth/login')).status).toBe(
      422,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Installs HttpOnly cookies and strips extra tokens from the response body', async () => {
    const headers = new Headers();
    headers.append(
      'Set-Cookie',
      'access_token=opaque-access; Path=/; HttpOnly; Secure; SameSite=Lax',
    );
    headers.append(
      'Set-Cookie',
      'refresh_token=opaque-refresh; Path=/api/v1/auth/refresh; HttpOnly; Secure; SameSite=Lax',
    );
    headers.append('Set-Cookie', 'unrelated=value; Path=/');
    fetchMock.mockResolvedValueOnce(
      Response.json(
        {
          user,
          accessTokenExpiresAt: '2026-10-15T01:00:00Z',
          accessToken: 'must-not-reach-browser',
        },
        { headers },
      ),
    );
    const response = await proxyApi(loginRequest(), 'auth/login');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user, accessTokenExpiresAt: '2026-10-15T01:00:00Z' });
    expect(response.headers.getSetCookie()).toEqual([
      'access_token=opaque-access; Path=/; HttpOnly; SameSite=Lax',
      'refresh_token=opaque-refresh; Path=/api/v1/auth/refresh; HttpOnly; SameSite=Lax',
    ]);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const input = fetchMock.mock.calls[0][1];
    expect(JSON.parse(String(input?.body)).password).toBe('x');
  });

  it('Rejects successful login responses without session cookies', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ user, accessTokenExpiresAt: '2026-10-15T01:00:00Z' }),
    );
    expect((await proxyApi(loginRequest(), 'auth/login')).status).toBe(502);
  });

  it('Forwards only the access cookie for the current user', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(user));
    const request = new Request('http://localhost:3003/api/v1/auth/me', {
      headers: { Cookie: 'access_token=opaque; unrelated=secret; refresh_token=private' },
    });
    expect((await proxyApi(request, 'auth/me')).status).toBe(200);
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get('cookie')).toBe('access_token=opaque');
  });

  it('Returns anonymous without contacting the backend when no cookie exists', async () => {
    expect(
      (await proxyApi(new Request('http://localhost:3003/api/v1/auth/me'), 'auth/me')).status,
    ).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Rejects invalid catalog responses instead of caching them', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ items: [{ title: 'Incomplete' }] }));
    expect(
      (await proxyApi(new Request('http://localhost:3003/api/v1/courses'), 'courses')).status,
    ).toBe(502);
  });

  it('Validates filters and never forwards catalog cookies', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], page: 1, pageSize: 4, total: 0 }));
    const request = new Request('http://localhost:3003/api/v1/courses?page=1&pageSize=4', {
      headers: { Cookie: 'access_token=private' },
    });
    expect((await proxyApi(request, 'courses')).status).toBe(200);
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has('cookie')).toBe(false);
    expect(
      (await proxyApi(new Request('http://localhost:3003/api/v1/courses?pageSize=999'), 'courses'))
        .status,
    ).toBe(422);
  });

  it('Allows only UUID public detail routes and GET operations', async () => {
    for (const path of [
      'courses/not-a-uuid',
      'courses/11111111-1111-4111-8111-111111111111/units',
      'classes/11111111-1111-4111-8111-111111111111/meeting',
    ]) {
      expect(
        (await proxyApi(new Request(`http://localhost:3003/api/v1/${path}`), path)).status,
      ).toBe(404);
    }
    const path = 'courses/11111111-1111-4111-8111-111111111111';
    expect(
      (
        await proxyApi(
          new Request(`http://localhost:3003/api/v1/${path}`, { method: 'POST' }),
          path,
        )
      ).status,
    ).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Forwards public class filters without cookies and rejects invalid dates or modes', async () => {
    const path = 'courses/11111111-1111-4111-8111-111111111111/classes';
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], page: 2, pageSize: 10, total: 0 }));
    expect(
      (
        await proxyApi(
          new Request(
            `http://localhost:3003/api/v1/${path}?page=2&pageSize=10&deliveryMode=ONLINE&startsFrom=2026-10-20&startsTo=2026-12-01`,
            { headers: { Cookie: 'access_token=private' } },
          ),
          path,
        )
      ).status,
    ).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      'deliveryMode=ONLINE&startsFrom=2026-10-20&startsTo=2026-12-01',
    );
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has('Cookie')).toBe(false);
    for (const query of [
      'deliveryMode=OTHER',
      'startsFrom=2026-02-30',
      'startsFrom=2026-12-01&startsTo=2026-10-20',
      'pageSize=101',
    ]) {
      expect(
        (await proxyApi(new Request(`http://localhost:3003/api/v1/${path}?${query}`), path)).status,
      ).toBe(422);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('Validates public class details and strips private meeting links from nested sessions', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const path = `classes/${id}`;
    fetchMock.mockResolvedValueOnce(
      Response.json({
        id,
        courseId: id,
        code: 'WEB',
        name: 'Web',
        startDate: '2026-10-20',
        endDate: '2026-11-20',
        deliveryMode: 'ONLINE',
        maxStudents: 10,
        availableSeats: 3,
        mentor: { id, displayName: 'Mentor' },
        meetingUrl: 'https://private.example.test',
        units: [
          {
            id,
            position: 1,
            title: 'HTML',
            sessions: [
              {
                id,
                sessionNumber: 1,
                title: 'HTML',
                startsAt: '2026-10-20T12:00:00Z',
                endsAt: '2026-10-20T14:00:00Z',
                roomName: null,
                status: 'SCHEDULED',
                meetingUrl: 'https://private.example.test',
              },
            ],
          },
        ],
      }),
    );
    const response = await proxyApi(new Request(`http://localhost:3003/api/v1/${path}`), path);
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain('meetingUrl');
    fetchMock.mockResolvedValueOnce(Response.json({ id, units: [] }));
    expect((await proxyApi(new Request(`http://localhost:3003/api/v1/${path}`), path)).status).toBe(
      502,
    );
  });

  it('Keeps registration purchase protected by Origin, cookie and server-owned price', async () => {
    const request = (body: unknown, cookie = '', origin = 'http://localhost:3003') =>
      new Request('http://localhost:3003/api/v1/me/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: origin },
        body: JSON.stringify(body),
      });
    const input = { classId: '11111111-1111-4111-8111-111111111111' };
    expect((await proxyApi(request(input), 'me/cart/items')).status).toBe(401);
    expect(
      (
        await proxyApi(
          request(input, 'access_token=private', 'https://foreign.test'),
          'me/cart/items',
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await proxyApi(
          request({ ...input, priceAmount: 1 }, 'access_token=private'),
          'me/cart/items',
        )
      ).status,
    ).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], totalAmount: 0 }, { status: 201 }));
    expect(
      (
        await proxyApi(
          request(input, 'access_token=private; refresh_token=hidden; unrelated=secret'),
          'me/cart/items',
        )
      ).status,
    ).toBe(201);
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Cookie')).toBe(
      'access_token=private',
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual(input);
  });

  it('Validates account registration and preserves the accepted response without a session', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ message: 'Verification sent.' }, { status: 202 }),
    );
    const request = new Request('http://localhost:3003/api/v1/auth/register', {
      method: 'POST',
      headers: { Origin: 'http://localhost:3003', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Học viên',
        email: 'student@example.test',
        password: 'password',
      }),
    });
    const response = await proxyApi(request, 'auth/register');
    expect(response.status).toBe(202);
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});
