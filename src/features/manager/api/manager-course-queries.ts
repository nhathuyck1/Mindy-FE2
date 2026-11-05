'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import { coursePageSchema } from '@/features/courses/schemas/course-contracts';
import { apiRequest } from '@/lib/api/client';

export function useManagerCourseOptions() {
  const session = useSession();
  return useQuery({
    queryKey: ['manager', session.data?.id, 'course-options'],
    enabled: session.data?.role === 'MANAGER' && session.data.status === 'ACTIVE',
    retry: false,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const first = await apiRequest({
        path: 'manager/courses?page=1&pageSize=100',
        schema: coursePageSchema,
        signal,
      });
      const items = [...first.items];
      for (let page = 2; (page - 1) * first.pageSize < first.total; page++) {
        const next = await apiRequest({
          path: `manager/courses?page=${page}&pageSize=100`,
          schema: coursePageSchema,
          signal,
        });
        items.push(...next.items);
      }
      return items;
    },
  });
}
