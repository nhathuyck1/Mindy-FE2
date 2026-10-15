import { z } from 'zod';

// Login may return only to an implemented local course route, never an external URL.
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
    return '/';
  try {
    const url = new URL(value, 'https://mindy.invalid');
    if (url.origin !== 'https://mindy.invalid') return '/';
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
