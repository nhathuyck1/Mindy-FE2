import { proxyApi } from '@/lib/api/proxy.server';

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxyApi(request, (await context.params).path.join('/'));
}

export const POST = GET;
export const PATCH = GET;
export const PUT = GET;
