'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, ApiError } from '@/lib/api/client';
import {
  adminClassPageSchema,
  adminCoursePageSchema,
  adminUserPageSchema,
} from '../schemas/admin-contracts';
import type { AdminResource } from '../lib/admin-resources';

type OverviewPage<T> = { items: T[]; page: number; pageSize: number; total: number };

// Aggregate complete lists: the first page alone cannot represent a chart's totals.
export async function fetchOverviewRecords<T extends { id: string }>(
  resource: AdminResource,
  schema: z.ZodType<OverviewPage<T>>,
  signal: AbortSignal,
): Promise<T[]> {
  const first = await apiRequest({
    path: `admin/${resource}?page=1&pageSize=100`,
    schema,
    signal,
  });
  const items = [...first.items];
  const pages = Math.ceil(first.total / first.pageSize);
  for (let page = 2; page <= pages; page++) {
    const next = await apiRequest({
      path: `admin/${resource}?page=${page}&pageSize=${first.pageSize}`,
      schema,
      signal,
    });
    if (next.total !== first.total || next.page !== page || !next.items.length) {
      throw new ApiError(409, 'OVERVIEW_CHANGED', 'Dữ liệu đã thay đổi. Vui lòng tải lại.');
    }
    items.push(...next.items);
  }
  if (
    first.page !== 1 ||
    items.length !== first.total ||
    new Set(items.map((item) => item.id)).size !== first.total
  ) {
    throw new ApiError(409, 'OVERVIEW_INCOMPLETE', 'Chưa tải được đầy đủ dữ liệu tổng quan.');
  }
  return items;
}

const overviewOptions = {
  staleTime: 60_000,
  retry: (count: number, error: Error) =>
    !(error instanceof ApiError && [401, 403].includes(error.status)) && count < 1,
};

export function useAdminOverview() {
  const users = useQuery({
    ...overviewOptions,
    queryKey: ['admin', 'users', 'overview'],
    queryFn: ({ signal }) => fetchOverviewRecords('users', adminUserPageSchema, signal),
  });
  const courses = useQuery({
    ...overviewOptions,
    queryKey: ['admin', 'courses', 'overview'],
    queryFn: ({ signal }) => fetchOverviewRecords('courses', adminCoursePageSchema, signal),
  });
  const classes = useQuery({
    ...overviewOptions,
    queryKey: ['admin', 'classes', 'overview'],
    queryFn: ({ signal }) => fetchOverviewRecords('classes', adminClassPageSchema, signal),
  });
  return { users, courses, classes };
}

export type AdminOverviewQueries = ReturnType<typeof useAdminOverview>;
