import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const errorSchema = z.object({
  code: z.string().optional(),
  message: z.union([z.string(), z.array(z.string())]).optional(),
});

export async function apiRequest<T>(props: {
  path: string;
  schema: z.ZodType<T>;
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}) {
  const response = await fetch(`/api/v1/${props.path}`, {
    method: props.method ?? 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: props.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: props.body === undefined ? undefined : JSON.stringify(props.body),
    signal: props.signal
      ? AbortSignal.any([props.signal, AbortSignal.timeout(15_000)])
      : AbortSignal.timeout(15_000),
  });
  if (response.status === 204) return props.schema.parse(null);
  const body: unknown = await response.json().catch(() => null);
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
