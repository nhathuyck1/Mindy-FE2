import { z } from 'zod';
import { providerOrderCodeSchema } from '@/features/payments/schemas/payment-contracts';

// Only implemented local destinations, with a small allowlist of validated queries.
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
    if (url.pathname === '/cart') return '/cart';
    if (url.pathname === '/payment/result') {
      const code = providerOrderCodeSchema.safeParse(url.searchParams.get('orderCode'));
      return code.success && url.searchParams.getAll('orderCode').length === 1
        ? `/payment/result?orderCode=${code.data}`
        : '/';
    }
    const parts = url.pathname.split('/');
    if (['/mentor', '/mentor/classes'].includes(url.pathname)) return url.pathname;
    if (
      parts.length === 4 &&
      parts[1] === 'mentor' &&
      ['classes', 'sessions'].includes(parts[2]) &&
      z.uuid().safeParse(parts[3]).success
    )
      return url.pathname;
    if (parts.length === 3 && parts[1] === 'checkout' && z.uuid().safeParse(parts[2]).success)
      return url.pathname;
    if (parts.length !== 3 || parts[1] !== 'courses' || !z.uuid().safeParse(parts[2]).success)
      return '/';
    const classId = url.searchParams.get('classId');
    return `${url.pathname}${classId && z.uuid().safeParse(classId).success ? `?classId=${classId}` : ''}`;
  } catch {
    return '/';
  }
}
