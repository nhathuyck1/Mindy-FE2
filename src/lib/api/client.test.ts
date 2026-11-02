import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
let apiRequest: typeof import('./client').apiRequest;

beforeEach(async () => {
  vi.resetModules();
  ({ apiRequest } = await import('./client'));
});

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'manager@example.test',
  displayName: 'Manager',
  phone: null,
  role: 'MANAGER',
  status: 'ACTIVE',
  lastLoginAt: null,
  createdAt: '2026-10-16T00:00:00Z',
};
const unauthorized = () =>
  Response.json(
    { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required' },
    { status: 401 },
  );
const options = {
  path: 'files/upload-intents',
  method: 'POST' as const,
  body: { originalFilename: 'lesson.pdf' },
  schema: z.object({ ok: z.boolean() }),
};

afterEach(() => vi.unstubAllGlobals());

describe('Shared API session recovery', () => {
  it.each([
    'auth/login',
    'auth/register',
    'auth/email/verify',
    'auth/logout',
    'auth/refresh',
    'courses?page=1',
    'course-categories',
    'courses/id/classes',
    'classes/id',
  ])('never refreshes %s', async (path) => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => unauthorized());
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      apiRequest({ ...options, path, method: path.startsWith('auth/') ? 'POST' : 'GET' }),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes expired access cookies and replays the rejected request exactly once', async () => {
    vi.stubGlobal('navigator', {});
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(Response.json({ user, accessTokenExpiresAt: '2030-01-01T00:00:00Z' }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await apiRequest(options)).toEqual({ ok: true });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/v1/files/upload-intents',
      '/api/v1/auth/me',
      '/api/v1/auth/refresh',
      '/api/v1/files/upload-intents',
    ]);
    expect(fetchMock.mock.calls[3][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify(options.body),
      credentials: 'same-origin',
    });
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: 'POST',
      credentials: 'same-origin',
    });
  });

  it('serializes concurrent recovery and refreshes only once', async () => {
    vi.stubGlobal('navigator', {});
    let valid = false;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (url) => {
      if (url === '/api/v1/auth/refresh') {
        valid = true;
        return Response.json({ user, accessTokenExpiresAt: '2030-01-01T00:00:00Z' });
      }
      if (!valid) return unauthorized();
      return Response.json(url === '/api/v1/auth/me' ? user : { ok: true });
    });
    vi.stubGlobal('fetch', fetchMock);
    await Promise.all([apiRequest(options), apiRequest({ ...options, path: 'manager/materials' })]);
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/v1/auth/refresh')).toHaveLength(1);
  });

  it.each([403, 409, 500])('does not refresh or replay HTTP %s', async (status) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ code: 'REJECTED', message: 'Rejected' }, { status }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest(options)).rejects.toMatchObject({ status });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not replay an ambiguous network failure', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest(options)).rejects.toThrow('Failed to fetch');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not refresh or replay a timeout with an unknown mutation outcome', async () => {
    const timeout = new DOMException('Request timed out', 'TimeoutError');
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValueOnce(timeout);
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest(options)).rejects.toBe(timeout);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stops when the refresh session has expired', async () => {
    vi.stubGlobal('navigator', {});
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => unauthorized());
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest(options)).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not loop when the replay still returns 401', async () => {
    vi.stubGlobal('navigator', {});
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(Response.json(user))
      .mockResolvedValueOnce(unauthorized());
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest(options)).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not refresh or replay after the upload is cancelled', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn<typeof fetch>().mockImplementationOnce(async () => {
      controller.abort();
      return unauthorized();
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest({ ...options, signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('preserves query, method, serialized body and idempotency key on replay', async () => {
    const body = { version: 1 };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(unauthorized())
      .mockImplementationOnce(async () => {
        body.version = 2;
        return Response.json(user);
      })
      .mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    await apiRequest({
      ...options,
      path: 'mentor/action?mode=x',
      method: 'PATCH',
      body,
      idempotencyKey: 'same-key',
    });
    expect(fetchMock.mock.calls[2][0]).toBe(fetchMock.mock.calls[0][0]);
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: fetchMock.mock.calls[0][1]?.method,
      headers: fetchMock.mock.calls[0][1]?.headers,
      body: fetchMock.mock.calls[0][1]?.body,
    });
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      body: '{"version":1}',
      headers: { 'Idempotency-Key': 'same-key' },
    });
  });

  it('allows retry after a temporary refresh failure without ending the session', async () => {
    const { subscribeSessionExpiry } = await import('./session-coordinator');
    const expired = vi.fn();
    subscribeSessionExpiry(expired);
    let unavailable = true;
    let valid = false;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (url) => {
      if (url === '/api/v1/auth/refresh') {
        if (unavailable) return Response.json({}, { status: 503 });
        valid = true;
        return Response.json({ user, accessTokenExpiresAt: '2030-01-01T00:00:00Z' });
      }
      return valid
        ? Response.json(url === '/api/v1/auth/me' ? user : { ok: true })
        : unauthorized();
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest(options)).rejects.toMatchObject({ status: 503 });
    unavailable = false;
    await expect(apiRequest(options)).resolves.toEqual({ ok: true });
    expect(expired).not.toHaveBeenCalled();
  });

  it('ends the session once, blocks further rotations and permits a new login', async () => {
    const { subscribeSessionExpiry, withAuthChange } = await import('./session-coordinator');
    const expired = vi.fn();
    subscribeSessionExpiry(expired);
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => unauthorized());
    vi.stubGlobal('fetch', fetchMock);
    await Promise.allSettled([apiRequest(options), apiRequest(options)]);
    const calls = fetchMock.mock.calls.length;
    await expect(apiRequest(options)).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
    expect(fetchMock).toHaveBeenCalledTimes(calls);
    expect(expired).toHaveBeenCalledTimes(1);
    await withAuthChange(async () => undefined, true);
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }));
    await expect(apiRequest(options)).resolves.toEqual({ ok: true });
  });

  it('lets one caller abort while another finishes the shared rotation', async () => {
    const controller = new AbortController();
    let release!: () => void;
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let valid = false;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (url) => {
      if (url === '/api/v1/auth/refresh') {
        started();
        await gate;
        valid = true;
        return Response.json({ user, accessTokenExpiresAt: '2030-01-01T00:00:00Z' });
      }
      return valid ? Response.json({ ok: true }) : unauthorized();
    });
    vi.stubGlobal('fetch', fetchMock);
    const cancelled = apiRequest({ ...options, signal: controller.signal });
    const rejected = expect(cancelled).rejects.toMatchObject({ name: 'AbortError' });
    const waiting = apiRequest(options);
    await ready;
    controller.abort();
    await rejected;
    release();
    await expect(waiting).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/v1/auth/refresh')).toHaveLength(1);
    expect(
      fetchMock.mock.calls.filter(([url]) => url === '/api/v1/files/upload-intents'),
    ).toHaveLength(3);
  });

  it.each([true, false])(
    'serializes auth change (signedIn=%s) behind rotation and discards its stale result',
    async (signedIn) => {
      const { withAuthChange } = await import('./session-coordinator');
      let release!: () => void;
      let started!: () => void;
      const ready = new Promise<void>((resolve) => {
        started = resolve;
      });
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (url) => {
        if (url === '/api/v1/auth/refresh') {
          started();
          await gate;
          return Response.json({ user, accessTokenExpiresAt: '2030-01-01T00:00:00Z' });
        }
        return unauthorized();
      });
      vi.stubGlobal('fetch', fetchMock);
      const pending = apiRequest(options);
      const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
      await ready;
      const change = vi.fn(async () => undefined);
      const changed = withAuthChange(change, signedIn);
      await rejected;
      expect(change).not.toHaveBeenCalled();
      release();
      await changed;
      expect(change).toHaveBeenCalledTimes(1);
      expect(
        fetchMock.mock.calls.filter(([url]) => url === '/api/v1/files/upload-intents'),
      ).toHaveLength(1);
    },
  );

  it('rejects a late successful response from the previous account', async () => {
    const { withAuthChange } = await import('./session-coordinator');
    let release!: (value: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(
        () =>
          new Promise((resolve) => {
            release = resolve;
          }),
      ),
    );
    const request = apiRequest(options);
    const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' });
    await withAuthChange(async () => undefined, true);
    release(Response.json({ ok: true }));
    await rejected;
  });

  it('coordinates independent tabs through Web Locks and rechecks cookies under the lock', async () => {
    let lock: Promise<unknown> = Promise.resolve();
    const requestLock = vi.fn((_name: string, operation: () => Promise<unknown>) => {
      const result = lock.then(operation);
      lock = result.catch(() => undefined);
      return result;
    });
    vi.stubGlobal('navigator', { locks: { request: requestLock } });
    const firstTab = apiRequest;
    vi.resetModules();
    const secondTab = (await import('./client')).apiRequest;
    let valid = false;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (url) => {
      if (url === '/api/v1/auth/refresh') {
        valid = true;
        return Response.json({ user, accessTokenExpiresAt: '2030-01-01T00:00:00Z' });
      }
      return valid
        ? Response.json(url === '/api/v1/auth/me' ? user : { ok: true })
        : unauthorized();
    });
    vi.stubGlobal('fetch', fetchMock);
    await Promise.all([firstTab(options), secondTab(options)]);
    expect(requestLock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/v1/auth/refresh')).toHaveLength(1);
  });
});
