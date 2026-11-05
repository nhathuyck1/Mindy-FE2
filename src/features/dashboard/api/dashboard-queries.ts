'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import { apiRequest } from '@/lib/api/client';
import { dashboardSchema } from '../schemas/dashboard-contracts';

export function useDashboard(audience: 'admin', days: number) {
  const session = useSession();
  return useQuery({
    queryKey: ['dashboard', session.data?.id, audience, days],
    enabled:
      !session.isError &&
      session.data?.status === 'ACTIVE' &&
      session.data.role === audience.toUpperCase(),
    staleTime: 60_000,
    retry: false,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `${audience}/dashboard?days=${days}`,
        schema: dashboardSchema,
        signal,
      }),
  });
}
