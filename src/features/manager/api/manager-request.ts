import { withAuthLock } from '@/features/auth/api/auth-queries';
import { ApiError, apiRequest, type ApiRequestOptions } from '@/lib/api/client';
import { authResponseSchema, userSchema } from '@/lib/api/contracts';

// Only replay an explicit 401: network/5xx responses can have an unknown mutation outcome.
export async function managerRequest<T>(options: ApiRequestOptions<T>): Promise<T> {
  try {
    return await apiRequest(options);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    options.signal?.throwIfAborted();
    return withAuthLock(async () => {
      options.signal?.throwIfAborted();
      try {
        // Another request or auth/me may already have refreshed while we waited for the lock.
        await apiRequest({ path: 'auth/me', schema: userSchema, signal: options.signal });
      } catch (sessionError) {
        if (!(sessionError instanceof ApiError) || sessionError.status !== 401) throw sessionError;
        await apiRequest({
          path: 'auth/refresh',
          method: 'POST',
          schema: authResponseSchema,
          signal: options.signal,
        });
      }
      options.signal?.throwIfAborted();
      return apiRequest(options);
    });
  }
}
