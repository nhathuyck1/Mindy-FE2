import { z } from 'zod';

const envSchema = z.object({
  API_BASE_URL: z.url().default('https://api.quanh123.id.vn/api/v1'),
  REALTIME_ORIGIN: z.url().optional(),
  APP_ORIGIN: z.url().default('http://localhost:3003'),
});

export function readServerEnv() {
  const env = envSchema.parse({
    API_BASE_URL: process.env.API_BASE_URL,
    APP_ORIGIN:
      process.env.APP_ORIGIN ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
    REALTIME_ORIGIN: process.env.REALTIME_ORIGIN || undefined,
  });
  const api = new URL(env.API_BASE_URL);
  const app = new URL(env.APP_ORIGIN);
  const realtime = new URL(env.REALTIME_ORIGIN ?? api.origin);
  if (
    ![api, app, realtime].every(
      (url) =>
        ['http:', 'https:'].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash,
    )
  )
    throw new Error('Invalid API/app URL');
  if (app.pathname !== '/') throw new Error('APP_ORIGIN must be an origin');
  if (realtime.pathname !== '/') throw new Error('REALTIME_ORIGIN must be an origin');
  if (app.protocol === 'https:' && realtime.protocol !== 'https:')
    throw new Error('HTTPS frontend requires HTTPS realtime origin');
  return {
    apiBaseUrl: env.API_BASE_URL.replace(/\/$/, ''),
    appOrigin: app.origin,
    realtimeOrigin: realtime.origin,
  };
}
