import {
  dashboardQuerySchema,
  dashboardSchemaFor,
} from '@/features/dashboard/schemas/dashboard-contracts';

export function resolveDashboardRule(method: string, path: string) {
  if (method !== 'GET') return undefined;
  for (const audience of ['admin', 'manager', 'mentor'] as const) {
    if (path === `${audience}/dashboard`)
      return {
        response: dashboardSchemaFor(audience),
        query: dashboardQuerySchema,
        cookies: ['access_token'],
      };
  }
  return undefined;
}
