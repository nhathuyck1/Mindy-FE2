import { afterEach, describe, expect, it, vi } from 'vitest';
import { readServerEnv } from './env-config';

afterEach(() => vi.unstubAllEnvs());

describe('readServerEnv', () => {
  it('uses the deployment origin for Vercel previews without an explicit origin', () => {
    vi.stubEnv('APP_ORIGIN', undefined);
    vi.stubEnv('VERCEL_URL', 'mindy-preview.vercel.app');
    expect(readServerEnv().appOrigin).toBe('https://mindy-preview.vercel.app');
  });

  it('keeps an explicitly configured application origin', () => {
    vi.stubEnv('APP_ORIGIN', 'https://mindy.example.test');
    vi.stubEnv('VERCEL_URL', 'mindy-preview.vercel.app');
    expect(readServerEnv().appOrigin).toBe('https://mindy.example.test');
  });

  it('keeps the local development origin outside Vercel', () => {
    vi.stubEnv('APP_ORIGIN', undefined);
    vi.stubEnv('VERCEL_URL', undefined);
    expect(readServerEnv().appOrigin).toBe('http://localhost:3001');
  });
});
