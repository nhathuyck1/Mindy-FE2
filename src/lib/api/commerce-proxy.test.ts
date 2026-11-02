import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';
import { checkoutResultSchema } from '@/features/orders/schemas/order-contracts';

const id = '55555555-5555-4555-8555-555555555555';
const fetchMock = vi.fn<typeof fetch>();
const request = (path: string, method = 'GET', body?: unknown, origin = 'http://localhost:3003') =>
  new Request(`http://localhost:3003/api/v1/${path}`, {
    method,
    headers: {
      Origin: origin,
      Cookie: 'access_token=opaque; refresh_token=hidden; other=secret',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
describe('Commerce proxy boundary', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });
  it('Allows authenticated cart GET and DELETE with 204, forwards only access cookie', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], totalAmount: 0 }));
    expect((await proxyApi(request('me/cart'), 'me/cart')).status).toBe(200);
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Cookie')).toBe(
      'access_token=opaque',
    );
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const path = `me/cart/items/${id}`;
    const response = await proxyApi(request(path, 'DELETE'), path);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(fetchMock.mock.calls[1][1]?.method).toBe('DELETE');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
  it('Requires cookie and same Origin; rejects non-allowlisted IDs/methods/admin operations', async () => {
    expect(
      (await proxyApi(new Request('http://localhost:3003/api/v1/me/cart'), 'me/cart')).status,
    ).toBe(401);
    const path = `me/cart/items/${id}`;
    expect(
      (await proxyApi(request(path, 'DELETE', undefined, 'https://foreign.test'), path)).status,
    ).toBe(403);
    for (const [method, path] of [
      ['GET', 'me/orders/bad'],
      ['DELETE', `me/orders/${id}`],
      ['POST', 'payment-callbacks/payos'],
      ['POST', 'admin/payments/a/reconcile'],
      ['DELETE', 'me/cart/items/bad'],
    ])
      expect((await proxyApi(request(path, method), path)).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('Validates checkout body and refuses client-owned amounts/student IDs', async () => {
    for (const body of [
      { paymentType: 'CARD' },
      { paymentType: 'PAYOS', totalAmount: 1 },
      { paymentType: 'PAYOS', studentId: id },
    ])
      expect(
        (await proxyApi(request('me/cart/checkout', 'POST', body), 'me/cart/checkout')).status,
      ).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('Restricts cancellation to an authenticated same-origin POST with empty input', async () => {
    const path = `me/orders/${id}/cancel`;
    expect((await proxyApi(request(path, 'POST', {}, 'https://foreign.test'), path)).status).toBe(
      403,
    );
    expect((await proxyApi(request(path, 'POST', { studentId: id }), path)).status).toBe(422);
    expect(
      (
        await proxyApi(
          new Request(`http://localhost:3003/api/v1/${path}`, {
            method: 'POST',
            headers: { Origin: 'http://localhost:3003', 'Content-Type': 'application/json' },
            body: '{}',
          }),
          path,
        )
      ).status,
    ).toBe(401);
    expect(
      (await proxyApi(request('me/orders/bad/cancel', 'POST', {}), 'me/orders/bad/cancel')).status,
    ).toBe(404);
    expect((await proxyApi(request(path, 'DELETE'), path)).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(Response.json({ id, status: 'CANCELLED' }));
    expect((await proxyApi(request(path, 'POST', {}), path)).status).toBe(502);
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Cookie')).toBe(
      'access_token=opaque',
    );
  });
  it('Forwards CASH checkout and accepts multiple cash orders, while rejecting mixed results', async () => {
    const cash = {
      id,
      orderCode: 'MD-CASH-1',
      paymentType: 'CASH',
      status: 'PENDING',
      totalAmount: 100000,
      expiresAt: '2026-11-03T10:00:00Z',
      paidAt: null,
      mentorId: null,
      createdAt: '2026-11-02T10:00:00Z',
      details: [],
    };
    const second = { ...cash, id: '66666666-6666-4666-8666-666666666666', orderCode: 'MD-CASH-2' };
    fetchMock.mockResolvedValueOnce(Response.json({ orders: [cash, second] }, { status: 201 }));
    const response = await proxyApi(
      request('me/cart/checkout', 'POST', { paymentType: 'CASH' }),
      'me/cart/checkout',
    );
    expect(response.status).toBe(201);
    expect((await response.json()).orders).toHaveLength(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ paymentType: 'CASH' });
    for (const orders of [
      [],
      [cash, cash],
      [cash, { ...second, paymentType: 'PAYOS' }],
      [
        { ...cash, paymentType: 'PAYOS' },
        { ...second, paymentType: 'PAYOS' },
      ],
    ]) {
      expect(checkoutResultSchema.safeParse({ orders }).success).toBe(false);
    }
  });
  it('Validates mapping/pagination queries instead of forwarding redirect status', async () => {
    for (const query of ['orderCode=1e9', 'orderCode=1&status=PAID', 'orderCode=1&orderCode=2', ''])
      expect(
        (await proxyApi(request(`me/orders/payment-result?${query}`), 'me/orders/payment-result'))
          .status,
      ).toBe(422);
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], page: 2, pageSize: 10, total: 0 }));
    expect(
      (await proxyApi(request('me/orders?status=PENDING&page=2&pageSize=10'), 'me/orders')).status,
    ).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toContain('status=PENDING&page=2&pageSize=10');
    expect((await proxyApi(request('me/orders?pageSize=101'), 'me/orders')).status).toBe(422);
  });
  it('Allows only an empty create/reuse request and validates upstream payment data', async () => {
    const path = `me/orders/${id}/payments/payos`;
    expect((await proxyApi(request(path, 'POST', { amount: 1 }), path)).status).toBe(422);
    fetchMock.mockResolvedValueOnce(
      Response.json({ checkoutUrl: 'https://evil.test' }, { status: 201 }),
    );
    expect((await proxyApi(request(path, 'POST', {}), path)).status).toBe(502);
  });
});
