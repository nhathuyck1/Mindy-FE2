import 'server-only';
import { z } from 'zod';
import { userSchema } from './contracts';
import {
  adminUserPageSchema,
  adminCoursePageSchema,
  adminClassPageSchema,
  adminUserFiltersSchema,
  adminCourseFiltersSchema,
  adminClassFiltersSchema,
  adminClassStudentsPageSchema,
  adminClassStudentDetailSchema,
} from '@/features/admin/schemas/admin-contracts';
import { paginationQuerySchema } from '@/features/courses/schemas/course-contracts';
import { categoryPageSchema } from '@/features/courses/schemas/course-contracts';
import {
  createAdminUserSchema,
  updateAdminUserStatusSchema,
  createAdminCategorySchema,
  createAdminCourseSchema,
  updateAdminCourseSchema,
  addAdminCourseUnitSchema,
  reorderAdminCourseUnitsSchema,
  createAdminClassSchema,
  updateAdminClassSchema,
  scheduleAdminSessionSchema,
  emptyAdminCommandSchema,
  adminCourseDetailSchema,
  adminCourseUnitSchema,
  adminClassDetailSchema,
  updateAdminSessionTimeSchema,
} from '@/features/admin/schemas/admin-write-contracts';
import {
  adminReconciliationPageSchema,
  adminReconciliationQuerySchema,
  adminTrackingDetailSchema,
  adminTrackingPageSchema,
  adminTrackingQuerySchema,
  trackingSourceSchema,
} from '@/features/admin/schemas/admin-read-contracts';

type Rule = {
  response: z.ZodType;
  body?: z.ZodType;
  cookies: string[];
  query?: z.ZodType<Record<string, string | number>>;
};
const rule = (response: z.ZodType, body?: z.ZodType): Rule => ({
  response,
  body,
  cookies: ['access_token'],
});

export function resolveAdminCrudRule(method: string, path: string): Rule | undefined {
  const parts = path.split('/');
  if (parts[0] !== 'admin') return undefined;
  const resource = parts[1];
  if (method === 'GET' && resource === 'tracking' && parts[2] === 'events') {
    if (parts.length === 3)
      return { ...rule(adminTrackingPageSchema), query: adminTrackingQuerySchema };
    if (
      parts.length === 5 &&
      trackingSourceSchema.safeParse(parts[3]).success &&
      z.uuid().safeParse(parts[4]).success
    )
      return rule(adminTrackingDetailSchema);
    return undefined;
  }
  if (method === 'GET' && resource === 'payments' && parts[2] === 'reconciliation') {
    if (parts.length === 3)
      return { ...rule(adminReconciliationPageSchema), query: adminReconciliationQuerySchema };
    return undefined;
  }
  if (method === 'GET' && parts.length === 2) {
    if (resource === 'users')
      return { ...rule(adminUserPageSchema), query: adminUserFiltersSchema };
    if (resource === 'courses')
      return { ...rule(adminCoursePageSchema), query: adminCourseFiltersSchema };
    if (resource === 'classes')
      return { ...rule(adminClassPageSchema), query: adminClassFiltersSchema };
  }
  if (method === 'POST' && parts.length === 2) {
    if (resource === 'users') return rule(userSchema, createAdminUserSchema);
    if (resource === 'course-categories')
      return rule(categoryPageSchema.shape.items.element, createAdminCategorySchema);
    if (resource === 'courses') return rule(adminCourseDetailSchema, createAdminCourseSchema);
    if (resource === 'classes') return rule(adminClassDetailSchema, createAdminClassSchema);
  }
  if (!z.uuid().safeParse(parts[2]).success) return undefined;
  if (method === 'GET' && resource === 'classes' && parts[3] === 'students') {
    if (parts.length === 4)
      return { ...rule(adminClassStudentsPageSchema), query: paginationQuerySchema.strict() };
    if (parts.length === 5 && z.uuid().safeParse(parts[4]).success)
      return rule(adminClassStudentDetailSchema);
  }
  if (parts.length === 3) {
    if (method === 'GET') {
      if (resource === 'users') return rule(userSchema);
      if (resource === 'courses') return rule(adminCourseDetailSchema);
      if (resource === 'classes') return rule(adminClassDetailSchema);
    }
    if (method === 'PATCH') {
      if (resource === 'courses') return rule(adminCourseDetailSchema, updateAdminCourseSchema);
      if (resource === 'classes') return rule(adminClassDetailSchema, updateAdminClassSchema);
    }
  }
  if (parts.length === 4) {
    if (method === 'PATCH' && resource === 'users' && parts[3] === 'status')
      return rule(userSchema, updateAdminUserStatusSchema);
    if (method === 'POST') {
      if (resource === 'courses' && parts[3] === 'units')
        return rule(adminCourseUnitSchema, addAdminCourseUnitSchema);
      if (resource === 'courses' && parts[3] === 'activate')
        return rule(adminCourseDetailSchema, emptyAdminCommandSchema);
      if (resource === 'classes' && parts[3] === 'sessions')
        return rule(adminClassDetailSchema, scheduleAdminSessionSchema);
      if (resource === 'classes' && ['open', 'start', 'complete', 'cancel'].includes(parts[3]))
        return rule(adminClassDetailSchema, emptyAdminCommandSchema);
    }
  }
  if (
    method === 'PUT' &&
    resource === 'courses' &&
    parts.length === 5 &&
    parts[3] === 'units' &&
    parts[4] === 'order'
  )
    return rule(adminCourseDetailSchema, reorderAdminCourseUnitsSchema);
  if (
    method === 'PATCH' &&
    resource === 'classes' &&
    parts.length === 5 &&
    parts[3] === 'sessions' &&
    z.uuid().safeParse(parts[4]).success
  )
    return rule(adminClassDetailSchema, updateAdminSessionTimeSchema);
  return undefined;
}
