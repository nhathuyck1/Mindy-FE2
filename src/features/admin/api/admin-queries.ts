'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest, ApiError } from '@/lib/api/client';
import {
  adminClassPageSchema,
  adminCoursePageSchema,
  adminUserPageSchema,
  adminClassStudentsPageSchema,
} from '../schemas/admin-contracts';
import {
  formatAdminDate,
  roleLabels,
  type AdminPageData,
  type AdminResource,
} from '../lib/admin-resources';

export function useAdminClassStudents(classId: string, page: number) {
  return useQuery({
    queryKey: ['admin', 'classes', classId, 'students', { page, pageSize: 20 }],
    staleTime: 0,
    retry: (count, error) =>
      !(error instanceof ApiError && [401, 403, 404].includes(error.status)) && count < 1,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `admin/classes/${classId}/students?page=${page}&pageSize=20`,
        schema: adminClassStudentsPageSchema,
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
