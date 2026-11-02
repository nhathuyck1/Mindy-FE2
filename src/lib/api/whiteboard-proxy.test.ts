import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { proxyApi } from './proxy.server';
const id = '11111111-1111-4111-8111-111111111111',
  key = '22222222-2222-4222-8222-222222222222';
beforeEach(() => {
  vi.stubEnv('API_BASE_URL', 'http://localhost:3000/api/v1');
  vi.stubEnv('APP_ORIGIN', 'http://localhost:3001');
});
it('denies anonymous/private, unknown routes, malformed IDs and duplicate queries before upstream', async () => {
  const upstream = vi.fn();
  vi.stubGlobal('fetch', upstream);
  for (const [path, status] of [
    [`whiteboards/${id}`, 401],
    ['whiteboards/not-a-uuid', 404],
    [`whiteboards/${id}/unknown`, 404],
  ] as const) {
    expect((await proxyApi(new Request('http://localhost:3001/api/v1/' + path), path)).status).toBe(
      status,
    );
  }
  const path = `whiteboards/${id}/snapshots`;
  expect(
    (
      await proxyApi(
        new Request('http://localhost:3001/api/v1/' + path + '?page=1&page=2', {
          headers: { cookie: 'access_token=test' },
        }),
        path,
      )
    ).status,
  ).toBe(422);
  expect(upstream).not.toHaveBeenCalled();
});
it('forwards a body-bound command key with only the access cookie and blocks bad Origin', async () => {
  const response = {
    id,
    sessionId: id,
    title: 'Bảng',
    mode: 'PRESENTATION',
    epoch: id,
    controlVersion: '2',
    sequence: '0',
    schemaVersion: 1,
    lastPersistedAt: '2026-11-02T12:00:00Z',
  };
  const upstream = vi.fn().mockResolvedValue(Response.json(response));
  vi.stubGlobal('fetch', upstream);
  const path = `whiteboards/${id}/control`,
    request = (origin: string) =>
      new Request('http://localhost:3001/api/v1/' + path, {
        method: 'PATCH',
        headers: {
          origin,
          cookie: 'access_token=private; refresh_token=never; unrelated=never',
          'content-type': 'application/json',
          'idempotency-key': key,
        },
        body: JSON.stringify({ expectedControlVersion: '1', mode: 'PRESENTATION' }),
      });
  expect((await proxyApi(request('https://evil.test'), path)).status).toBe(403);
  const result = await proxyApi(request('http://localhost:3001'), path);
  expect(result.status).toBe(200);
  const headers = upstream.mock.calls[0][1].headers as Headers;
  expect(headers.get('Idempotency-Key')).toBe(key);
  expect(headers.get('Cookie')).toBe('access_token=private');
  expect(result.headers.get('Cache-Control')).toContain('no-store');
});
