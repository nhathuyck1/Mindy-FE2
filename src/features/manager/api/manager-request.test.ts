import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { managerRequest } from './manager-request';

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

describe('Manager session recovery', () => {
  it('refreshes expired access cookies and replays the rejected request exactly once', async () => {
    vi.stubGlobal('navigator', {});
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(Response.json({ user, accessTokenExpiresAt: '2030-01-01T00:00:00Z' }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await managerRequest(options)).toEqual({ ok: true });
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
    await Promise.all([
      managerRequest(options),
      managerRequest({ ...options, path: 'manager/materials' }),
    ]);
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/v1/auth/refresh')).toHaveLength(1);
  });

  it.each([403, 409, 500])('does not refresh or replay HTTP %s', async (status) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ code: 'REJECTED', message: 'Rejected' }, { status }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(managerRequest(options)).rejects.toMatchObject({ status });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not replay an ambiguous network failure', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(managerRequest(options)).rejects.toThrow('Failed to fetch');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stops when the refresh session has expired', async () => {
    vi.stubGlobal('navigator', {});
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => unauthorized());
    vi.stubGlobal('fetch', fetchMock);
    await expect(managerRequest(options)).rejects.toMatchObject({ status: 401 });
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
    await expect(managerRequest(options)).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not refresh or replay after the upload is cancelled', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn<typeof fetch>().mockImplementationOnce(async () => {
      controller.abort();
      return unauthorized();
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(managerRequest({ ...options, signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
