import { z } from 'zod';

// Return only to implemented, explicitly allowlisted local routes.
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
    return '/';
  try {
    const url = new URL(value, 'https://mindy.invalid');
    if (url.origin !== 'https://mindy.invalid') return '/';
    if (
      ['/admin', '/admin/users', '/admin/courses', '/admin/classes', '/admin/workflow'].includes(
        url.pathname,
      )
    )
      return url.pathname;
    const adminParts = url.pathname.split('/');
    if (
      adminParts.length === 5 &&
      adminParts[1] === 'admin' &&
      adminParts[2] === 'classes' &&
      adminParts[4] === 'students' &&
      z.uuid().safeParse(adminParts[3]).success
    )
      return url.pathname;
    if (url.pathname === '/courses') return '/courses';
    const parts = url.pathname.split('/');
    if (parts.length !== 3 || parts[1] !== 'courses' || !z.uuid().safeParse(parts[2]).success)
      return '/';
    const classId = url.searchParams.get('classId');
    return `${url.pathname}${classId && z.uuid().safeParse(classId).success ? `?classId=${classId}` : ''}`;
  } catch {
    return '/';
  }
}
