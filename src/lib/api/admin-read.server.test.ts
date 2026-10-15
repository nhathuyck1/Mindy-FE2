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

describe('Admin read API adapter', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });
  it('Protects UUID class-student lists and validates pagination and response', async () => {
    const id = '44444444-4444-4444-8444-444444444444';
    const path = `admin/classes/${id}/students`;
    const request = (suffix = '', cookie = 'access_token=opaque; refresh_token=hidden') =>
      new Request(`http://localhost:3003/api/v1/${path}${suffix}`, { headers: { Cookie: cookie } });
    expect((await proxyApi(request('', ''), path)).status).toBe(401);
    for (const query of ['?page=0', '?pageSize=101', '?role=ADMIN'])
      expect((await proxyApi(request(query), path)).status).toBe(422);
    for (const invalid of ['admin/classes/bad/students', `${path}/extra`])
      expect((await proxyApi(request(), invalid)).status).toBe(404);
    expect(
      (
        await proxyApi(
          new Request(`http://localhost:3003/api/v1/${path}`, { method: 'POST' }),
          path,
        )
      ).status,
    ).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
    const student = {
      studentId: user.id,
      studentName: user.displayName,
      email: user.email,
      phone: null,
      studentStatus: 'ACTIVE',
      enrollmentId: id,
      enrollmentStatus: 'PENDING_PAYMENT',
      enrolledAt: null,
    };
    fetchMock.mockResolvedValueOnce(
      Response.json({
        items: [{ ...student, passwordHash: 'hidden' }],
        page: 2,
        pageSize: 20,
        total: 21,
      }),
    );
    const response = await proxyApi(request('?page=2&pageSize=20'), path);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [student], page: 2, pageSize: 20, total: 21 });
    expect(String(fetchMock.mock.calls[0][0])).toContain(`${path}?page=2&pageSize=20`);
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Cookie')).toBe(
      'access_token=opaque',
    );
    expect(response.headers.get('cache-control')).toContain('no-store');
    fetchMock.mockResolvedValueOnce(
      Response.json({
        items: [{ ...student, enrolledAt: 'bad' }],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    );
    expect((await proxyApi(request(), path)).status).toBe(502);
  });

  it('Protects UUID class-student details and strips private fields', async () => {
    const classId = '44444444-4444-4444-8444-444444444444';
    const path = `admin/classes/${classId}/students/${user.id}`;
    const request = (suffix = '', cookie = 'access_token=opaque; refresh_token=hidden') =>
      new Request(`http://localhost:3003/api/v1/${path}${suffix}`, { headers: { Cookie: cookie } });
    expect((await proxyApi(request('', ''), path)).status).toBe(401);
    expect((await proxyApi(request('?page=1'), path)).status).toBe(422);
    expect((await proxyApi(request(), `admin/classes/${classId}/students/bad`)).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
    const detail = {
      studentId: user.id,
      studentName: user.displayName,
      email: user.email,
      phone: '0900000000',
      studentStatus: 'ACTIVE',
      enrollmentId: classId,
      enrollmentStatus: 'ACTIVE',
      enrolledAt: '2026-10-12T01:00:00.000Z',
      classId,
      orderDetailId: classId,
      registeredAt: '2026-10-10T01:00:00.000Z',
      accountCreatedAt: '2026-10-01T01:00:00.000Z',
      lastLoginAt: null,
    };
    fetchMock.mockResolvedValueOnce(Response.json({ ...detail, passwordHash: 'hidden' }));
    const response = await proxyApi(request(), path);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(detail);
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Cookie')).toBe(
      'access_token=opaque',
    );
  });

  it('Requires admin cookies, validates filters and leaves role enforcement to the backend', async () => {
    const request = (
      query = '',
      cookie = 'access_token=opaque; refresh_token=private; unrelated=secret',
    ) =>
      new Request(`http://localhost:3003/api/v1/admin/users${query}`, {
        headers: { Cookie: cookie },
      });
    expect((await proxyApi(request('', ''), 'admin/users')).status).toBe(401);
    for (const query of [
      '?role=ROOT',
      '?status=BAD',
      '?pageSize=101',
      '?q=unsupported',
      '?page=1&page=2',
      '?role=STUDENT&role=ADMIN',
    ])
      expect((await proxyApi(request(query), 'admin/users')).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(
      Response.json({ items: [user], page: 2, pageSize: 10, total: 12 }),
    );
    const response = await proxyApi(
      request('?page=2&pageSize=10&role=STUDENT&status=ACTIVE'),
      'admin/users',
    );
    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      'admin/users?page=2&pageSize=10&role=STUDENT&status=ACTIVE',
    );
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Cookie')).toBe(
      'access_token=opaque',
    );
    expect(response.headers.get('cache-control')).toContain('no-store');
    fetchMock.mockResolvedValueOnce(
      Response.json({ code: 'FORBIDDEN', message: 'Admin only' }, { status: 403 }),
    );
    expect((await proxyApi(request(), 'admin/users')).status).toBe(403);
  });
});
