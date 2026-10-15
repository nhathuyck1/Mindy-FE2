'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, ApiError } from '@/lib/api/client';
import { userSchema, type User } from '@/lib/api/contracts';
import { sessionKey } from '@/features/auth/api/auth-queries';
import { adminCoursePageSchema, adminUserPageSchema } from '../schemas/admin-contracts';
import {
  adminClassDetailSchema,
  adminCourseDetailSchema,
  type AdminClassDetail,
  type AdminCourseDetail,
} from '../schemas/admin-write-contracts';
import type { AdminResource } from '../lib/admin-resources';

type Detail =
  | { resource: 'users'; value: User }
  | { resource: 'courses'; value: AdminCourseDetail }
  | { resource: 'classes'; value: AdminClassDetail };
const retryRead = (count: number, error: Error) =>
  !(error instanceof ApiError && [401, 403, 404].includes(error.status)) && count < 1;

export function useAdminDetail(resource: AdminResource, id?: string) {
  return useQuery({
    queryKey: ['admin', resource, 'detail', id],
    enabled: Boolean(id),
    staleTime: 0,
    retry: retryRead,
    queryFn: async ({ signal }): Promise<Detail> => {
      if (!id) throw new Error('Thiếu ID.');
      const path = `admin/${resource}/${id}`;
      if (resource === 'users')
        return { resource, value: await apiRequest({ path, schema: userSchema, signal }) };
      if (resource === 'courses')
        return {
          resource,
          value: await apiRequest({ path, schema: adminCourseDetailSchema, signal }),
        };
      return {
        resource,
        value: await apiRequest({ path, schema: adminClassDetailSchema, signal }),
      };
    },
  });
}

export function useAdminWrite() {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    gcTime: 0,
    mutationFn: (request: { path: string; method: 'POST' | 'PATCH' | 'PUT'; body: unknown }) =>
      apiRequest({ ...request, schema: z.object({ id: z.uuid() }) }),
    onSuccess: async (_result, request) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['admin'] }),
        client.invalidateQueries({ queryKey: ['catalog'] }),
        ...(request.path.endsWith('/status')
          ? [client.invalidateQueries({ queryKey: sessionKey })]
          : []),
      ]);
    },
  });
}

export function useAdminCreateOptions() {
  const courses = useQuery({
    queryKey: ['admin', 'course-options', 'active'],
    retry: retryRead,
    queryFn: async ({ signal }) => {
      const first = await apiRequest({
        path: 'admin/courses?isActive=true&page=1&pageSize=100',
        schema: adminCoursePageSchema,
        signal,
      });
      const items = [...first.items];
      for (let page = 2; (page - 1) * first.pageSize < first.total; page++) {
        const next = await apiRequest({
          path: `admin/courses?isActive=true&page=${page}&pageSize=100`,
          schema: adminCoursePageSchema,
          signal,
        });
        items.push(...next.items);
      }
      return items;
    },
  });
  const mentors = useQuery({
    queryKey: ['admin', 'mentor-options', 'active'],
    retry: retryRead,
    queryFn: async ({ signal }) => {
      const first = await apiRequest({
        path: 'admin/users?role=MENTOR&status=ACTIVE&page=1&pageSize=100',
        schema: adminUserPageSchema,
        signal,
      });
      const items = [...first.items];
      for (let page = 2; (page - 1) * first.pageSize < first.total; page++) {
        const next = await apiRequest({
          path: `admin/users?role=MENTOR&status=ACTIVE&page=${page}&pageSize=100`,
          schema: adminUserPageSchema,
          signal,
        });
        items.push(...next.items);
      }
      return items;
    },
  });
  return { courses, mentors };
}
