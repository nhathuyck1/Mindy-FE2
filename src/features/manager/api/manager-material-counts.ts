'use client';

import { useQueries } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import type { Course } from '@/features/courses/schemas/course-contracts';
import { apiRequest } from '@/lib/api/client';
import { managerCourseDetailSchema, materialsSchema } from '../schemas/manager-contracts';

export function useManagerMaterialCounts(courses: Course[]) {
  const session = useSession();
  return useQueries({
    queries: courses.map((course) => ({
      queryKey: ['manager', session.data?.id, 'material-count-by-course', course.id],
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const detail = await apiRequest({
          path: `manager/courses/${course.id}`,
          schema: managerCourseDetailSchema,
          signal,
        });
        let total = 0;
        // The deployed API scopes materials by unit, without a courseId query parameter.
        // Read units sequentially within each course to avoid a burst for every chapter.
        for (const unit of detail.units) {
          const materials = await apiRequest({
            path: `manager/course-units/${unit.id}/materials?page=1&pageSize=1`,
            schema: materialsSchema,
            signal,
          });
          total += materials.total;
        }
        return total;
      },
      enabled: session.data?.role === 'MANAGER' && session.data.status === 'ACTIVE',
      retry: false,
      staleTime: 30_000,
    })),
  });
}
