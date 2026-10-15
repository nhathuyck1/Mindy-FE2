import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
  API_BASE_URL: z.url().default('https://api.quanh123.id.vn/api/v1'),
  APP_ORIGIN: z.url().default('http://localhost:3003'),
});

export function getServerEnv() {
  const env = envSchema.parse({
    API_BASE_URL: process.env.API_BASE_URL,
    APP_ORIGIN: process.env.APP_ORIGIN,
  });
  const api = new URL(env.API_BASE_URL);
  const app = new URL(env.APP_ORIGIN);
  if (
    ![api, app].every(
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
  return { apiBaseUrl: env.API_BASE_URL.replace(/\/$/, ''), appOrigin: app.origin };
}
