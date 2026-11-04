import { afterEach, describe, expect, it, vi } from 'vitest';
import { readServerEnv } from './env-config';
afterEach(() => vi.unstubAllEnvs());
describe('portable backend configuration', () => {
  it('derives browser realtime origin from the configured API at runtime', () => {
    vi.stubEnv('API_BASE_URL', 'https://backend.example.test/api/v1/');
    vi.stubEnv('APP_ORIGIN', 'https://new-host.example.test');
    vi.stubEnv('REALTIME_ORIGIN', '');
    expect(readServerEnv()).toEqual({
      apiBaseUrl: 'https://backend.example.test/api/v1',
      appOrigin: 'https://new-host.example.test',
      realtimeOrigin: 'https://backend.example.test',
    });
    vi.stubEnv('API_BASE_URL', 'http://backend.internal:3000/api/v1');
    vi.stubEnv('REALTIME_ORIGIN', 'https://realtime.example.test');
    expect(readServerEnv().realtimeOrigin).toBe('https://realtime.example.test');
  });
  it.each([
    'http://backend.test',
    'https://user:secret@backend.test',
    'https://backend.test/ws',
    'https://backend.test?x=1',
    'wss://backend.test',
  ])('rejects unsafe realtime configuration %s', (origin) => {
    vi.stubEnv('APP_ORIGIN', 'https://frontend.test');
    vi.stubEnv('REALTIME_ORIGIN', origin);
    expect(() => readServerEnv()).toThrow();
  });
});
