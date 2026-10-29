import { z } from 'zod';
import { ApiError } from './api-error';
import { authResponseSchema, userSchema } from './contracts';
import {
  assertSessionAvailable,
  expireSession,
  recoverSession,
  sessionExpiredError,
  sessionSignal,
  waitForRecovery,
} from './session-coordinator';

export { ApiError } from './api-error';

const errorSchema = z.object({
  code: z.string().optional(),
  message: z.union([z.string(), z.array(z.string())]).optional(),
});

export type ApiRequestOptions<T> = {
  path: string;
  schema: z.ZodType<T>;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  idempotencyKey?: string;
};

function needsSession(props: ApiRequestOptions<unknown>) {
  const path = props.path.split('?')[0];
  if (path.startsWith('auth/')) return path === 'auth/me';
  return !(
    (props.method ?? 'GET') === 'GET' &&
    /^(courses(?:\/.*)?|course-categories|classes\/[^/]+)$/.test(path)
  );
}

// This primitive never attempts refresh. Probes/rotation must bypass recovery.
async function sendRequest<T>(
  props: ApiRequestOptions<T>,
  signal?: AbortSignal,
  serializedBody = props.body === undefined ? undefined : JSON.stringify(props.body),
) {
  signal?.throwIfAborted();
  const requestSignal = AbortSignal.any([AbortSignal.timeout(15_000), ...(signal ? [signal] : [])]);
  const response = await fetch(`/api/v1/${props.path}`, {
    method: props.method ?? 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      ...(props.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(props.idempotencyKey ? { 'Idempotency-Key': props.idempotencyKey } : {}),
    },
    body: serializedBody,
    signal: requestSignal,
  });
  requestSignal.throwIfAborted();
  if (response.status === 204) return props.schema.parse(null);
  const body: unknown = await response.json().catch(() => null);
  requestSignal.throwIfAborted();
  if (!response.ok) {
    const error = errorSchema.safeParse(body);
    const message = error.success ? error.data.message : undefined;
    throw new ApiError(
      response.status,
      error.success ? (error.data.code ?? 'HTTP_ERROR') : 'HTTP_ERROR',
      Array.isArray(message) ? message.join(' ') : (message ?? 'Không thể kết nối hệ thống.'),
    );
  }
  return props.schema.parse(body);
}

export async function apiRequest<T>(props: ApiRequestOptions<T>): Promise<T> {
  if (!needsSession(props)) return sendRequest(props, props.signal);
  props.signal?.throwIfAborted();
  assertSessionAvailable();
  const epoch = sessionSignal();
  const signal = AbortSignal.any([epoch, ...(props.signal ? [props.signal] : [])]);
  const serializedBody = props.body === undefined ? undefined : JSON.stringify(props.body);
  try {
    return await sendRequest(props, signal, serializedBody);
  } catch (error) {
    signal.throwIfAborted();
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }

  await waitForRecovery(
    recoverSession(epoch, async () => {
      epoch.throwIfAborted();
      try {
        try {
          // A different request/tab may already have rotated the cookies.
          await sendRequest({ path: 'auth/me', schema: userSchema }, epoch);
          return;
        } catch (error) {
          epoch.throwIfAborted();
          if (!(error instanceof ApiError) || error.status !== 401) throw error;
        }
        // Once dispatched, await cookie rotation before releasing the auth lock.
        // Logout/login can invalidate its result, but must not overtake Set-Cookie.
        await sendRequest({
          path: 'auth/refresh',
          method: 'POST',
          schema: authResponseSchema,
        });
        epoch.throwIfAborted();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) expireSession(epoch);
        throw error;
      }
    }),
    signal,
  );

  signal.throwIfAborted();
  try {
    return await sendRequest(props, signal, serializedBody);
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof ApiError && error.status === 401) {
      expireSession(epoch);
      throw sessionExpiredError();
    }
    throw error;
  }
}
