import 'server-only';
import { z } from 'zod';
import { getServerEnv } from '@/lib/env.server';
import { addCartItemSchema, cartSchema } from '@/features/cart/schemas/cart-contracts';
import {
  checkoutInputSchema,
  checkoutResultSchema,
  orderFiltersSchema,
  orderPageSchema,
  orderPaymentSchema,
} from '@/features/orders/schemas/order-contracts';
import {
  emptyPaymentSchema,
  paymentResultQuerySchema,
  paymentSchema,
} from '@/features/payments/schemas/payment-contracts';
import {
  registerSchema,
  registrationAcceptedSchema,
  verifyEmailSchema,
} from '@/features/auth/schemas/registration-contracts';
import {
  categoryPageSchema,
  classDetailSchema,
  classFiltersQuerySchema,
  classPageSchema,
  courseDetailSchema,
  courseFiltersQuerySchema,
  coursePageSchema,
  paginationQuerySchema,
} from '@/features/courses/schemas/course-contracts';
import { authResponseSchema, loginSchema, userSchema } from './contracts';
import { requestCookies, responseCookies } from './cookie-policy';

const privateHeaders = {
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie',
  'Referrer-Policy': 'no-referrer',
};
const sessionCookies = ['access_token', 'refresh_token'] as const;
const rules = {
  'GET courses': { response: coursePageSchema, cookies: [] },
  'GET course-categories': { response: categoryPageSchema, cookies: [] },
  'GET me/cart': { response: cartSchema, cookies: ['access_token'] },
  'GET me/orders': { response: orderPageSchema, cookies: ['access_token'] },
  'GET me/orders/payment-result': { response: orderPaymentSchema, cookies: ['access_token'] },
  'POST me/cart/checkout': {
    response: checkoutResultSchema,
    body: checkoutInputSchema,
    cookies: ['access_token'],
  },
  'POST me/cart/items': {
    response: cartSchema,
    body: addCartItemSchema,
    cookies: ['access_token'],
  },
  'GET auth/me': { response: userSchema, cookies: ['access_token'] },
  'POST auth/login': { response: authResponseSchema, body: loginSchema, cookies: [] },
  'POST auth/register': { response: registrationAcceptedSchema, body: registerSchema, cookies: [] },
  'POST auth/email/verify': { response: authResponseSchema, body: verifyEmailSchema, cookies: [] },
  'POST auth/refresh': { response: authResponseSchema, cookies: ['refresh_token'] },
  'POST auth/logout': { response: z.null(), cookies: ['access_token'] },
} satisfies Record<string, { response: z.ZodType; body?: z.ZodType; cookies: string[] }>;

type ApiRule = { response: z.ZodType; body?: z.ZodType; cookies: string[] };
function resolveRule(method: string, path: string): ApiRule | undefined {
  const key = `${method} ${path}`;
  if (Object.hasOwn(rules, key)) return rules[key as keyof typeof rules];
  const parts = path.split('/');
  if (parts[0] === 'me') {
    if (
      method === 'DELETE' &&
      parts.length === 4 &&
      parts[1] === 'cart' &&
      parts[2] === 'items' &&
      z.uuid().safeParse(parts[3]).success
    )
      return { response: z.null(), cookies: ['access_token'] };
    if (parts[1] === 'orders' && z.uuid().safeParse(parts[2]).success) {
      if (method === 'GET' && parts.length === 3)
        return { response: orderPaymentSchema, cookies: ['access_token'] };
      if (
        method === 'POST' &&
        parts.length === 5 &&
        parts[3] === 'payments' &&
        parts[4] === 'payos'
      )
        return { response: paymentSchema, body: emptyPaymentSchema, cookies: ['access_token'] };
    }
    return undefined;
  }
  if (method !== 'GET') return undefined;
  if (!z.uuid().safeParse(parts[1]).success) return undefined;
  if (parts[0] === 'courses' && parts.length === 2)
    return { response: courseDetailSchema, cookies: [] };
  if (parts[0] === 'courses' && parts.length === 3 && parts[2] === 'classes')
    return { response: classPageSchema, cookies: [] };
  if (parts[0] === 'classes' && parts.length === 2)
    return { response: classDetailSchema, cookies: [] };
  return undefined;
}

function error(status: number, code: string, message: string) {
  return Response.json({ code, message }, { status, headers: privateHeaders });
}

async function upstream(
  request: Request,
  path: string,
  cookies: readonly string[],
  search = '',
  body?: unknown,
) {
  const env = getServerEnv();
  const headers = new Headers({ Accept: 'application/json', Origin: env.appOrigin });
  const cookie = requestCookies(request.headers.get('cookie'), cookies);
  if (cookie) headers.set('Cookie', cookie);
  const userAgent = request.headers.get('user-agent');
  if (userAgent) headers.set('User-Agent', userAgent);
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  return fetch(`${env.apiBaseUrl}/${path}${search}`, {
    method: request.method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
}

export async function proxyApi(request: Request, path: string) {
  const env = getServerEnv();
  const rule = resolveRule(request.method, path);
  if (!rule) return error(404, 'ENDPOINT_NOT_ALLOWED', 'API không thuộc phạm vi được hỗ trợ.');
  if (request.method === 'POST' || request.method === 'DELETE') {
    if (request.headers.get('origin') !== env.appOrigin)
      return error(403, 'ORIGIN_NOT_ALLOWED', 'Yêu cầu không hợp lệ.');
  }
  let body: unknown;
  if (rule.body) {
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      return error(415, 'JSON_REQUIRED', 'Yêu cầu JSON.');
    if (Number(request.headers.get('content-length') ?? 0) > 16_384)
      return error(413, 'PAYLOAD_TOO_LARGE', 'Dữ liệu quá lớn.');
    const raw = await request.text();
    if (raw.length > 16_384) return error(413, 'PAYLOAD_TOO_LARGE', 'Dữ liệu quá lớn.');
    try {
      const parsed = rule.body.safeParse(JSON.parse(raw));
      if (!parsed.success)
        return error(422, 'INVALID_INPUT', 'Vui lòng kiểm tra thông tin đã nhập.');
      body = parsed.data;
    } catch {
      return error(400, 'INVALID_JSON', 'Dữ liệu không hợp lệ.');
    }
  }
  if (path === 'auth/me' && !requestCookies(request.headers.get('cookie'), ['access_token']))
    return error(401, 'AUTHENTICATION_REQUIRED', 'Bạn chưa đăng nhập.');
  if (path.startsWith('me/') && !requestCookies(request.headers.get('cookie'), ['access_token']))
    return error(401, 'AUTHENTICATION_REQUIRED', 'Vui lòng đăng nhập để đăng ký lớp.');
  if (path === 'auth/refresh' && !requestCookies(request.headers.get('cookie'), ['refresh_token']))
    return error(401, 'AUTHENTICATION_REQUIRED', 'Phiên đăng nhập đã hết hạn.');
  let search = '';
  if (path === 'me/orders' || path === 'me/orders/payment-result') {
    const input = new URL(request.url).searchParams;
    if ([...input.keys()].some((key) => input.getAll(key).length !== 1))
      return error(422, 'INVALID_QUERY', 'Tham số bị lặp.');
    const schema = path === 'me/orders' ? orderFiltersSchema : paymentResultQuerySchema;
    const parsed = schema.safeParse(Object.fromEntries(input));
    if (!parsed.success) return error(422, 'INVALID_QUERY', 'Tham số đơn hàng không hợp lệ.');
    search = `?${new URLSearchParams(Object.entries(parsed.data).map(([key, value]) => [key, String(value)]))}`;
  }
  if (['courses', 'course-categories'].includes(path) || /^courses\/[^/]+\/classes$/.test(path)) {
    const input = new URL(request.url).searchParams;
    const schema =
      path === 'courses'
        ? courseFiltersQuerySchema
        : path === 'course-categories'
          ? paginationQuerySchema
          : classFiltersQuerySchema;
    const parsed = schema.safeParse(Object.fromEntries(input));
    if (!parsed.success) return error(422, 'INVALID_QUERY', 'Bộ lọc không hợp lệ.');
    search = `?${new URLSearchParams(Object.entries(parsed.data).map(([key, value]) => [key, String(value)]))}`;
  }
  try {
    const response = await upstream(request, path, rule.cookies, search, body);
    const headers = new Headers(privateHeaders);
    const cookies = responseCookies(
      response.headers.getSetCookie(),
      env.appOrigin.startsWith('https:'),
      path.startsWith('auth/') ? sessionCookies : [],
    );
    for (const cookie of cookies) headers.append('Set-Cookie', cookie);
    if (path === 'auth/logout' && response.status === 401) {
      headers.append('Set-Cookie', 'access_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
      headers.append(
        'Set-Cookie',
        'refresh_token=; Path=/api/v1/auth/refresh; Max-Age=0; HttpOnly; SameSite=Lax',
      );
    }
    if (response.status === 204) return new Response(null, { status: 204, headers });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const parsed = z
        .object({ code: z.string(), message: z.union([z.string(), z.array(z.string())]) })
        .safeParse(payload);
      return Response.json(
        parsed.success
          ? parsed.data
          : { code: 'UPSTREAM_ERROR', message: 'Không thể hoàn tất yêu cầu.' },
        { status: response.status >= 400 ? response.status : 502, headers },
      );
    }
    const result = rule.response.safeParse(payload);
    if (!result.success) return error(502, 'INVALID_RESPONSE', 'Dữ liệu hệ thống chưa phù hợp.');
    if (
      ['auth/login', 'auth/refresh', 'auth/email/verify'].includes(path) &&
      !sessionCookies.every((name) => cookies.some((cookie) => cookie.startsWith(`${name}=`)))
    )
      return error(502, 'SESSION_COOKIE_MISSING', 'Không thể thiết lập phiên đăng nhập.');
    return Response.json(result.data, { status: response.status, headers });
  } catch {
    return error(503, 'API_UNAVAILABLE', 'Không thể kết nối hệ thống.');
  }
}
