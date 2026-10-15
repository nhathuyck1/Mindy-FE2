import { z } from 'zod';
import { providerOrderCodeSchema } from '@/features/payments/schemas/payment-contracts';

// Only implemented local destinations, with a small allowlist of validated queries.
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
    return '/';
  try {
    const url = new URL(value, 'https://mindy.invalid');
    if (url.origin !== 'https://mindy.invalid') return '/';
    if (url.pathname === '/courses') return '/courses';
    if (url.pathname === '/cart') return '/cart';
    if (url.pathname === '/payment/result') {
      const code = providerOrderCodeSchema.safeParse(url.searchParams.get('orderCode'));
      return code.success && url.searchParams.getAll('orderCode').length === 1
        ? `/payment/result?orderCode=${code.data}`
        : '/';
    }
    const parts = url.pathname.split('/');
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
