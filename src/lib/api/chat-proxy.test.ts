import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { proxyApi } from './proxy.server';
import { resolveChatRule } from './chat-rules.server';
const id = '11111111-1111-4111-8111-111111111111';
beforeEach(() => {
  vi.stubEnv('API_BASE_URL', 'http://localhost:3000/api/v1');
  vi.stubEnv('APP_ORIGIN', 'http://localhost:3001');
});
it('blocks unauthenticated, malformed, duplicate, unknown and cross-origin chat requests before upstream', async () => {
  const upstream = vi.fn();
  vi.stubGlobal('fetch', upstream);
  const path = `chat/conversations/${id}/messages`;
  for (const [url, headers, status] of [
    [path, {}, 401],
    [path + '?limit=1&limit=2', { cookie: 'access_token=x' }, 422],
    [path + '?peerUserId=' + id, { cookie: 'access_token=x' }, 422],
    ['chat/conversations/not-an-id', { cookie: 'access_token=x' }, 404],
    [path + '/unknown', { cookie: 'access_token=x' }, 404],
  ] as const) {
    expect(
      (
        await proxyApi(
          new Request('http://localhost:3001/api/v1/' + url, { headers }),
          url.split('?')[0],
        )
      ).status,
    ).toBe(status);
  }
  expect(
    (
      await proxyApi(
        new Request('http://localhost:3001/api/v1/' + path, {
          method: 'POST',
          headers: { origin: 'https://evil.test', 'content-type': 'application/json' },
          body: JSON.stringify({ clientMessageId: id, type: 'TEXT', body: 'Hi' }),
        }),
        path,
      )
    ).status,
  ).toBe(403);
  expect(upstream).not.toHaveBeenCalled();
});
it('forwards cursor and read commands with only the access cookie', async () => {
  const upstream = vi.fn().mockResolvedValue(
    Response.json({
      conversationId: id,
      lastReadSequence: '9007199254740993',
      lastReadAt: null,
      unreadCount: 0,
    }),
  );
  vi.stubGlobal('fetch', upstream);
  const path = `chat/conversations/${id}/read`;
  const result = await proxyApi(
    new Request('http://localhost:3001/api/v1/' + path, {
      method: 'PUT',
      headers: {
        origin: 'http://localhost:3001',
        cookie: 'access_token=x; refresh_token=no; other=no',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ throughSequence: '9007199254740993' }),
    }),
    path,
  );
  expect(result.status).toBe(200);
  expect(upstream.mock.calls[0][1].headers.get('Cookie')).toBe('access_token=x');
  expect(result.headers.get('Cache-Control')).toContain('no-store');
  upstream.mockResolvedValue(
    Response.json({ data: [], meta: { hasMore: false, nextCursor: null } }),
  );
  const history = `chat/conversations/${id}/messages`;
  expect(
    (
      await proxyApi(
        new Request('http://localhost:3001/api/v1/' + history + '?limit=50&cursor=a%2Bb', {
          headers: { cookie: 'access_token=x' },
        }),
        history,
      )
    ).status,
  ).toBe(200);
  expect(upstream.mock.calls[1][0]).toContain('cursor=a%2Bb');
});
it('requires and forwards a valid receipt for edit/delete and validates text', async () => {
  const path = `chat/conversations/${id}/messages/${id}`;
  const upstream = vi
    .fn()
    .mockResolvedValue(
      Response.json({ code: 'CHAT_VERSION_CONFLICT', message: 'Conflict' }, { status: 409 }),
    );
  vi.stubGlobal('fetch', upstream);
  const request = (key?: string, body = 'Updated') =>
    new Request('http://localhost:3001/api/v1/' + path, {
      method: 'PATCH',
      headers: {
        origin: 'http://localhost:3001',
        cookie: 'access_token=x',
        'content-type': 'application/json',
        ...(key ? { 'idempotency-key': key } : {}),
      },
      body: JSON.stringify({ body, expectedVersion: 1 }),
    });
  expect((await proxyApi(request(), path)).status).toBe(422);
  expect((await proxyApi(request(id, '  '), path)).status).toBe(422);
  expect((await proxyApi(request(id), path)).status).toBe(409);
  expect(upstream.mock.calls[0][1].headers.get('Idempotency-Key')).toBe(id);
  expect(resolveChatRule('DELETE', `chat/conversations/${id}`)).toBeUndefined();
});
