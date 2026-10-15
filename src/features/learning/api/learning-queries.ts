'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import { apiRequest } from '@/lib/api/client';
import { myClassesPageSchema } from '@/features/user/schemas/user-contracts';
import {
  materialDetailSchema,
  materialPageSchema,
  previewClassSchema,
  studentClassSchema,
} from '../schemas/learning-contracts';

export function useAccessibleClasses() {
  const session = useSession();
  return useQuery({
    queryKey: ['learning-classes', session.data?.id],
    enabled: session.data?.role === 'STUDENT' && session.data.status === 'ACTIVE',
    queryFn: async ({ signal }) => {
      const read = (page: number) =>
        apiRequest({
          path: `me/classes?view=all&page=${page}&pageSize=100`,
          schema: myClassesPageSchema,
          signal,
        });
      const first = await read(1);
      const items = [...first.items];
      for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++)
        items.push(...(await read(page)).items);
      return [...new Map(items.map((item) => [item.enrollmentId, item])).values()].filter(
        (item) => item.canViewClass && item.accessMode !== 'NONE',
      );
    },
    retry: false,
  });
}

export function useLearningClass(classId: string, preview: boolean) {
  const session = useSession();
  return useQuery({
    queryKey: ['learning', session.data?.id, classId, preview],
    enabled: session.data?.role === 'STUDENT' && session.data.status === 'ACTIVE',
    queryFn: async ({ signal }) =>
      preview
        ? apiRequest({ path: `me/classes/${classId}/preview`, schema: previewClassSchema, signal })
        : apiRequest({ path: `me/classes/${classId}`, schema: studentClassSchema, signal }),
    retry: false,
  });
}
export function useUnitMaterials(classId: string, unitId: string, enabled: boolean) {
  const session = useSession();
  return useQuery({
    queryKey: ['learning-materials', session.data?.id, classId, unitId],
    enabled: enabled && !!session.data,
    queryFn: async ({ signal }) => {
      const read = (page: number) =>
        apiRequest({
          path: `me/classes/${classId}/units/${unitId}/materials?page=${page}&pageSize=100`,
          schema: materialPageSchema,
          signal,
        });
      const first = await read(1);
      const items = [...first.items];
      for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++)
        items.push(...(await read(page)).items);
      return [...new Map(items.map((item) => [item.id, item])).values()].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
      );
    },
    retry: false,
  });
}
export function useMaterial(classId: string, materialId: string) {
  const session = useSession();
  return useQuery({
    queryKey: ['learning-material', session.data?.id, classId, materialId],
    enabled: !!session.data && !!materialId,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `me/classes/${classId}/materials/${materialId}`,
        schema: materialDetailSchema,
        signal,
      }),
    retry: false,
  });
}
