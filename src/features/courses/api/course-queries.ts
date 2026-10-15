'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api/client';
import {
  categoryPageSchema,
  classDetailSchema,
  classPageSchema,
  courseDetailSchema,
  coursePageSchema,
} from '../schemas/course-contracts';

export interface CourseFilters {
  categoryId?: string;
  deliveryMode?: 'ONLINE' | 'OFFLINE';
}

function queryString(filters: CourseFilters, page: number, pageSize: number) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.deliveryMode) params.set('deliveryMode', filters.deliveryMode);
  return params.toString();
}

export function useCourseCategories() {
  return useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: async ({ signal }) => {
      const first = await apiRequest({
        path: 'course-categories?page=1&pageSize=100',
        schema: categoryPageSchema,
        signal,
      });
      const items = [...first.items];
      for (let page = 2; (page - 1) * first.pageSize < first.total; page++) {
        const next = await apiRequest({
          path: `course-categories?page=${page}&pageSize=100`,
          schema: categoryPageSchema,
          signal,
        });
        items.push(...next.items);
      }
      return items.filter((category) => category.isActive);
    },
  });
}

export function useCoursePage(filters: CourseFilters = {}, pageSize = 4) {
  return useQuery({
    queryKey: ['catalog', 'courses', { ...filters, page: 1, pageSize }],
    queryFn: ({ signal }) =>
      apiRequest({
        path: `courses?${queryString(filters, 1, pageSize)}`,
        schema: coursePageSchema,
        signal,
      }),
  });
}

// Search/price sorting are local because the public API has no q or sort parameter.
// Load every matching API page first, so these controls cover the whole result set.
export function useCourseCatalog(filters: CourseFilters) {
  return useQuery({
    queryKey: ['catalog', 'all-courses', filters],
    queryFn: async ({ signal }) => {
      const first = await apiRequest({
        path: `courses?${queryString(filters, 1, 100)}`,
        schema: coursePageSchema,
        signal,
      });
      const items = [...first.items];
      for (let page = 2; (page - 1) * first.pageSize < first.total; page++) {
        const next = await apiRequest({
          path: `courses?${queryString(filters, page, 100)}`,
          schema: coursePageSchema,
          signal,
        });
        items.push(...next.items);
      }
      return items;
    },
  });
}

export function useCourseDetail(courseId: string) {
  return useQuery({
    queryKey: ['catalog', 'course', courseId],
    retry: false,
    queryFn: ({ signal }) =>
      apiRequest({ path: `courses/${courseId}`, schema: courseDetailSchema, signal }),
  });
}

export function useOpenClasses(courseId: string, deliveryMode: string, page: number) {
  return useQuery({
    queryKey: ['catalog', 'open-classes', courseId, { deliveryMode, page }],
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `courses/${courseId}/classes?page=${page}&pageSize=10${deliveryMode ? `&deliveryMode=${deliveryMode}` : ''}`,
        schema: classPageSchema,
        signal,
      }),
  });
}

export function useClassDetail(classId: string | undefined, courseId: string) {
  return useQuery({
    queryKey: ['catalog', 'class', classId],
    enabled: Boolean(classId),
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
    queryFn: async ({ signal }) => {
      const detail = await apiRequest({
        path: `classes/${classId}`,
        schema: classDetailSchema,
        signal,
      });
      if (detail.courseId !== courseId) throw new Error('Lớp học không thuộc khóa học này.');
      return detail;
    },
  });
}
