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
const other = '22222222-2222-4222-8222-222222222222';
const fetchMock = vi.fn<typeof fetch>();
const paid = {
  id,
  orderCode: 'CASH-001',
  paymentType: 'CASH',
  status: 'PAID',
  totalAmount: 3000000,
  expiresAt: '2026-10-17T03:00:00Z',
  paidAt: '2026-10-16T03:00:00Z',
  mentorId: null,
  createdAt: '2026-10-15T03:00:00Z',
  details: [],
};
function request(
  path: string,
  method = 'GET',
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return new Request(`http://localhost:3003/api/v1/${path}`, {
    method,
    headers: {
      Cookie: 'access_token=opaque; refresh_token=secret',
      Origin: 'http://localhost:3003',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
describe('Manager collection boundaries', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });
  it('forwards order filters and validates auth, duplicate queries and unknown parameters', async () => {
    const path = 'manager/orders';
    expect((await proxyApi(request(path, 'GET', undefined, { Cookie: '' }), path)).status).toBe(
      401,
    );
    for (const query of [
      '?page=0',
      '?pageSize=101',
      '?status=APPROVED',
      '?page=1&page=2',
      '?role=ADMIN',
      '?classId=invalid',
      '?orderCode=',
    ])
      expect((await proxyApi(request(path + query), path)).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], page: 2, pageSize: 20, total: 0 }));
    const result = await proxyApi(
      request(`${path}?page=2&paymentType=CASH&status=PENDING&classId=${id}&orderCode=CASH-001`),
      path,
    );
    expect(result.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(new URL(String(url)).searchParams.get('classId')).toBe(id);
    expect(new URL(String(url)).searchParams.get('status')).toBe('PENDING');
    expect(new Headers(init?.headers).get('Cookie')).toBe('access_token=opaque');
    expect(result.headers.get('cache-control')).toContain('no-store');
  });
  it('requires the Manager cash command with an integer amount, Origin and exact method/path', async () => {
    const path = `manager/cash-orders/${id}/confirm`;
    for (const amount of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '3000000'])
      expect((await proxyApi(request(path, 'POST', { receivedAmount: amount }), path)).status).toBe(
        422,
      );
    expect(
      (await proxyApi(request(path, 'POST', { receivedAmount: 1, status: 'PAID' }), path)).status,
    ).toBe(422);
    expect(
      (
        await proxyApi(
          request(path, 'POST', { receivedAmount: 3000000 }, { Origin: 'https://evil.test' }),
          path,
        )
      ).status,
    ).toBe(403);
    for (const [method, candidate] of [
      ['GET', path],
      ['PATCH', path],
      ['POST', `mentor/cash-orders/${id}/confirm`],
      ['POST', `manager/cash-orders/${id}/confirm/extra`],
      ['POST', 'manager/cash-orders/bad/confirm'],
    ])
      expect((await proxyApi(request(candidate, method), candidate)).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(Response.json(paid));
    const result = await proxyApi(request(path, 'POST', { receivedAmount: 3000000 }), path);
    expect(result.status).toBe(200);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      receivedAmount: 3000000,
    });
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has('Idempotency-Key')).toBe(false);
  });
  it('never accepts a confirmation for a different order or a response still pending', async () => {
    const path = `manager/cash-orders/${id}/confirm`;
    for (const response of [
      { ...paid, id: other },
      { ...paid, status: 'PENDING', paidAt: null },
      { ...paid, paymentType: 'PAYOS' },
    ]) {
      fetchMock.mockResolvedValueOnce(Response.json(response));
      expect(
        (await proxyApi(request(path, 'POST', { receivedAmount: 3000000 }), path)).status,
      ).toBe(502);
    }
  });
  it('propagates conflicts and denied permissions without retry or changing amounts', async () => {
    const path = `manager/cash-orders/${id}/confirm`;
    for (const status of [409, 403]) {
      fetchMock.mockResolvedValueOnce(
        Response.json(
          { code: status === 409 ? 'CASH_ORDER_CLOSED' : 'ORDER_ACCESS_DENIED', message: 'Denied' },
          { status },
        ),
      );
      expect(
        (await proxyApi(request(path, 'POST', { receivedAmount: 3000000 }), path)).status,
      ).toBe(status);
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('exposes only the required class picker and order detail reads', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], page: 1, pageSize: 100, total: 0 }));
    expect(
      (await proxyApi(request('manager/classes?pageSize=100'), 'manager/classes')).status,
    ).toBe(200);
    const path = `manager/orders/${id}`;
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ...paid,
        student: { id: other, displayName: 'An', passwordHash: 'hidden' },
        payment: null,
        secret: 'hidden',
      }),
    );
    const result = await proxyApi(request(path), path);
    expect(result.status).toBe(200);
    expect(JSON.stringify(await result.json())).not.toContain('hidden');
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ...paid,
        id: other,
        student: { id: other, displayName: 'An' },
        payment: null,
      }),
    );
    expect((await proxyApi(request(path), path)).status).toBe(502);
  });
});
