'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest, ApiError } from '@/lib/api/client';
import { useSession } from '@/features/auth/api/auth-queries';
import {
  adminClassPageSchema,
  adminCoursePageSchema,
  adminUserPageSchema,
  adminClassStudentsPageSchema,
  adminClassStudentDetailSchema,
} from '../schemas/admin-contracts';
import {
  adminReconciliationPageSchema,
  adminTrackingDetailSchema,
  adminTrackingPageSchema,
  type AdminTrackingQuery,
} from '../schemas/admin-read-contracts';
import {
  formatAdminDate,
  roleLabels,
  type AdminPageData,
  type AdminResource,
} from '../lib/admin-resources';

const retryRead = (count: number, error: Error) =>
  !(error instanceof ApiError && [401, 403, 404].includes(error.status)) && count < 1;

export function useAdminClassStudents(classId: string, page: number, pageSize: number) {
  return useQuery({
    queryKey: ['admin', 'classes', classId, 'students', { page, pageSize }],
    staleTime: 0,
    retry: retryRead,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `admin/classes/${classId}/students?page=${page}&pageSize=${pageSize}`,
        schema: adminClassStudentsPageSchema,
        signal,
      }),
  });
}

export function useAdminClassStudent(classId: string, studentId: string) {
  return useQuery({
    queryKey: ['admin', 'classes', classId, 'students', 'detail', studentId],
    staleTime: 0,
    retry: retryRead,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `admin/classes/${classId}/students/${studentId}`,
        schema: adminClassStudentDetailSchema,
        signal,
      }),
  });
}

export function useAdminTracking(filters: AdminTrackingQuery) {
  const session = useSession();
  const search = new URLSearchParams(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
  return useQuery({
    queryKey: ['admin', 'tracking', session.data?.id, filters],
    enabled: session.data?.role === 'ADMIN' && session.data.status === 'ACTIVE',
    staleTime: 0,
    retry: retryRead,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `admin/tracking/events?${search}`,
        schema: adminTrackingPageSchema,
        signal,
      }),
  });
}

export function useAdminTrackingDetail(source: string, eventId: string, enabled: boolean) {
  const session = useSession();
  return useQuery({
    queryKey: ['admin', 'tracking', session.data?.id, 'detail', source, eventId],
    enabled: enabled && session.data?.role === 'ADMIN' && session.data.status === 'ACTIVE',
    staleTime: 0,
    retry: retryRead,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `admin/tracking/events/${source}/${eventId}`,
        schema: adminTrackingDetailSchema,
        signal,
      }),
  });
}

export function useAdminReconciliation(page: number, pageSize: number) {
  const session = useSession();
  return useQuery({
    queryKey: ['admin', 'payments', 'reconciliation', session.data?.id, { page, pageSize }],
    enabled: session.data?.role === 'ADMIN' && session.data.status === 'ACTIVE',
    staleTime: 0,
    retry: retryRead,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `admin/payments/reconciliation?page=${page}&pageSize=${pageSize}`,
        schema: adminReconciliationPageSchema,
        signal,
      }),
  });
}

export function useAdminList(resource: AdminResource, filters: Record<string, string | number>) {
  return useQuery({
    queryKey: ['admin', resource, filters],
    staleTime: 15_000,
    retry: (count, error) =>
      !(error instanceof ApiError && [401, 403].includes(error.status)) && count < 1,
    queryFn: async ({ signal }): Promise<AdminPageData> => {
      const search = new URLSearchParams(
        Object.entries(filters)
          .filter(([, value]) => value !== '')
          .map(([key, value]) => [key, String(value)]),
      );
      const path = `admin/${resource}?${search}`;
      if (resource === 'users') {
        const data = await apiRequest({ path, signal, schema: adminUserPageSchema });
        return {
          ...data,
          items: data.items.map((user) => ({
            id: user.id,
            name: user.displayName,
            subtitle: user.email,
            secondary: roleLabels[user.role],
            status: user.status,
            metric: user.phone || 'Chưa cập nhật',
            date: user.createdAt,
            fields: [
              { label: 'Email', value: user.email },
              { label: 'Điện thoại', value: user.phone || 'Chưa cập nhật' },
              { label: 'Vai trò', value: roleLabels[user.role] },
              { label: 'Lần đăng nhập cuối', value: formatAdminDate(user.lastLoginAt) },
            ],
          })),
        };
      }
      if (resource === 'courses') {
        const data = await apiRequest({ path, signal, schema: adminCoursePageSchema });
        return {
          ...data,
          items: data.items.map((course) => ({
            id: course.id,
            name: course.title,
            subtitle: course.code,
            secondary: course.category.name,
            status: String(course.isActive),
            metric: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
              course.priceAmount,
            ),
            date: course.createdAt,
            fields: [
              { label: 'Danh mục', value: course.category.name },
              { label: 'Mô tả', value: course.description || 'Chưa có mô tả' },
              { label: 'Cập nhật gần nhất', value: formatAdminDate(course.updatedAt) },
            ],
          })),
        };
      }
      const data = await apiRequest({ path, signal, schema: adminClassPageSchema });
      return {
        ...data,
        items: data.items.map((item) => ({
          id: item.id,
          name: item.name,
          subtitle: item.code,
          secondary: item.mentor.displayName || 'Chưa cập nhật tên',
          status: item.status,
          metric: `${item.availableSeats} / ${item.maxStudents}`,
          date: item.startDate,
          capacity: { available: item.availableSeats, max: item.maxStudents },
          fields: [
            { label: 'Giảng viên', value: item.mentor.displayName || 'Chưa cập nhật tên' },
            {
              label: 'Hình thức',
              value: item.deliveryMode === 'ONLINE' ? 'Trực tuyến' : 'Tại trung tâm',
            },
            { label: 'Khai giảng', value: formatAdminDate(item.startDate) },
            { label: 'Kết thúc', value: formatAdminDate(item.endDate) },
            {
              label: 'Chỗ còn lại / Sĩ số tối đa',
              value: `${item.availableSeats} / ${item.maxStudents}`,
            },
          ],
        })),
      };
    },
  });
}
