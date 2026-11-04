import { afterEach, describe, expect, it, vi } from 'vitest';
const { apiRequest, io } = vi.hoisted(() => ({ apiRequest: vi.fn(), io: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ apiRequest }));
vi.mock('socket.io-client', () => ({ io }));
import { createRealtimeSocket } from './client';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
const connection = () => ({
  url: 'https://backend.test',
  ticket: 'memory-only',
  expiresAt: new Date(Date.now() + 60000).toISOString(),
});
describe('direct realtime connections', () => {
  it('uses configured backend for both channels without cookies or URL credentials', async () => {
    vi.stubGlobal('window', { location: { protocol: 'https:' } });
    apiRequest.mockImplementation(async () => connection());
    for (const channel of ['chat', 'whiteboards'] as const)
      await createRealtimeSocket(channel, new AbortController().signal);
    expect(io.mock.calls[0]).toEqual([
      'https://backend.test/chat',
      expect.objectContaining({
        path: '/socket.io',
        auth: { ticket: 'memory-only' },
        withCredentials: false,
        autoConnect: false,
        reconnection: false,
        addTrailingSlash: false,
      }),
    ]);
    expect(io.mock.calls[1][0]).toBe('https://backend.test');
    expect(io.mock.calls[1][1].path).toBe('/ws/whiteboards');
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });
  it('does not open a socket after logout/cancellation or with insecure/expired credentials', async () => {
    vi.stubGlobal('window', { location: { protocol: 'https:' } });
    const controller = new AbortController();
    apiRequest.mockImplementation(async () => {
      controller.abort();
      return connection();
    });
    await expect(createRealtimeSocket('chat', controller.signal)).rejects.toThrow();
    apiRequest.mockResolvedValue({ ...connection(), url: 'http://backend.test' });
    await expect(createRealtimeSocket('chat', new AbortController().signal)).rejects.toThrow(
      'Invalid realtime origin',
    );
    apiRequest.mockResolvedValue({ ...connection(), expiresAt: new Date(0).toISOString() });
    await expect(createRealtimeSocket('chat', new AbortController().signal)).rejects.toThrow(
      'expired',
    );
    expect(io).not.toHaveBeenCalled();
  });
});
