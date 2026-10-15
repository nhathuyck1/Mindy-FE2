import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});
const id = '11111111-1111-4111-8111-111111111111';
const user = {
  id,
  email: 'test@example.test',
  displayName: 'Test',
  phone: null,
  role: 'MENTOR',
  status: 'ACTIVE',
  lastLoginAt: null,
  createdAt: '2026-10-15T00:00:00Z',
};
const course = {
  id,
  code: 'WEB',
  title: 'Web',
  description: null,
  imgUrl: null,
  priceAmount: 1000,
  category: { id, name: 'Web', slug: 'web' },
  isActive: false,
  createdAt: user.createdAt,
  updatedAt: user.createdAt,
  units: [],
};
function write(
  path: string,
  body: unknown,
  method = 'POST',
  origin = 'http://localhost:3003',
  cookie = 'access_token=opaque; refresh_token=hidden; unrelated=private',
) {
  return new Request(`http://localhost:3003/api/v1/${path}`, {
    method,
    headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
it('Requires Origin and an access cookie on POST, PATCH and PUT before sending a write', async () => {
  const cases = [
    [
      'POST',
      'admin/users',
      { email: user.email, displayName: 'Test', password: '123456', role: 'MENTOR' },
    ],
    ['PATCH', `admin/users/${id}/status`, { status: 'SUSPENDED' }],
    ['PUT', `admin/courses/${id}/units/order`, { unitIds: [id] }],
  ] as const;
  for (const [method, path, body] of cases) {
    expect((await proxyApi(write(path, body, method, 'https://evil.test'), path)).status).toBe(403);
    expect((await proxyApi(write(path, body, method, undefined, ''), path)).status).toBe(401);
  }
  expect(fetchMock).not.toHaveBeenCalled();
});
it('Creates managed users with the shared password policy, strips secrets and never forwards refresh cookies', async () => {
  const body = { email: user.email, displayName: 'Test', password: '123456', role: 'MENTOR' };
  for (const input of [
    { ...body, password: '12345' },
    { ...body, status: 'ACTIVE' },
    { ...body, role: 'ROOT' },
  ])
    expect((await proxyApi(write('admin/users', input), 'admin/users')).status).toBe(422);
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(
    Response.json({ ...user, passwordHash: 'hidden' }, { status: 201 }),
  );
  const response = await proxyApi(write('admin/users', body), 'admin/users');
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual(user);
  expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Cookie')).toBe(
    'access_token=opaque',
  );
  expect(response.headers.get('cache-control')).toContain('no-store');
});
it('Validates resource updates and does not allow code, role or mentor assignment injection', async () => {
  const cases = [
    [`admin/users/${id}/status`, { status: 'ACTIVE', role: 'ADMIN' }],
    [`admin/courses/${id}`, { code: 'CHANGED' }],
    [`admin/courses/${id}`, { priceAmount: -1 }],
    [`admin/classes/${id}`, { mentorId: id, name: 'Mixed command' }],
    [`admin/classes/${id}/sessions/${id}`, { startTime: '22:00', endTime: '01:00' }],
  ] as const;
  for (const [path, body] of cases)
    expect((await proxyApi(write(path, body, 'PATCH'), path)).status).toBe(422);
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(Response.json(course));
  const response = await proxyApi(
    write(`admin/courses/${id}`, { title: 'Web', priceAmount: 1000 }, 'PATCH'),
    `admin/courses/${id}`,
  );
  expect(response.status).toBe(200);
  expect(fetchMock.mock.calls[0][1]?.method).toBe('PATCH');
  fetchMock.mockResolvedValueOnce(
    Response.json({ code: 'CONFLICT', message: 'Duplicate' }, { status: 409 }),
  );
  expect(
    (await proxyApi(write(`admin/courses/${id}`, { title: 'Web' }, 'PATCH'), `admin/courses/${id}`))
      .status,
  ).toBe(409);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it('Keeps unsupported delete/deactivate and invalid UUID routes closed', async () => {
  for (const [method, path] of [
    ['DELETE', `admin/courses/${id}`],
    ['POST', `admin/courses/${id}/deactivate`],
    ['POST', 'admin/classes/bad/open'],
    ['PATCH', `admin/classes/${id}/sessions/bad`],
  ])
    expect(
      (await proxyApi(new Request(`http://localhost:3003/api/v1/${path}`, { method }), path))
        .status,
    ).toBe(404);
  expect(fetchMock).not.toHaveBeenCalled();
});
it('Validates empty lifecycle commands, full unit reorder sets and timezone-bearing session requests', async () => {
  for (const [method, path, body] of [
    ['POST', `admin/classes/${id}/cancel`, { status: 'COMPLETED' }],
    ['PUT', `admin/courses/${id}/units/order`, { unitIds: [id, id] }],
    [
      'POST',
      `admin/classes/${id}/sessions`,
      {
        classUnitId: id,
        title: 'Test',
        startsAt: '2026-10-20T09:00:00',
        endsAt: '2026-10-20T11:00:00',
      },
    ],
  ] as const)
    expect((await proxyApi(write(path, body, method), path)).status).toBe(422);
  fetchMock.mockResolvedValueOnce(Response.json(course));
  expect(
    (
      await proxyApi(
        write(`admin/courses/${id}/units/order`, { unitIds: [id] }, 'PUT'),
        `admin/courses/${id}/units/order`,
      )
    ).status,
  ).toBe(200);
  expect(fetchMock.mock.calls[0][1]?.method).toBe('PUT');
});
it('Protects detail reads and rejects malformed responses or unsupported query fields', async () => {
  const path = `admin/courses/${id}`;
  const request = (query = '', cookie = 'access_token=opaque') =>
    new Request(`http://localhost:3003/api/v1/${path}${query}`, { headers: { Cookie: cookie } });
  expect((await proxyApi(request('', ''), path)).status).toBe(401);
  expect((await proxyApi(request('?role=ADMIN'), path)).status).toBe(422);
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(Response.json(course));
  expect((await proxyApi(request(), path)).status).toBe(200);
  fetchMock.mockResolvedValueOnce(Response.json({ id }));
  expect((await proxyApi(request(), path)).status).toBe(502);
});
