import { safeReturnPath } from './return-path';

export function sessionLoginTarget(path: string): string | null {
  const pathname = path.split('?')[0];
  if (pathname === '/admin/login') return null;
  const whiteboard = /^\/whiteboards\/[^/]+$/.test(pathname);
  const mentorBoard =
    whiteboard && new URL(path, 'https://mindy.invalid').searchParams.get('audience') === 'mentor';
  const staff = mentorBoard || /^\/(admin|manager|mentor)(\/|$)/.test(pathname);
  const student = /^\/(user|cart|checkout)(\/|$)/.test(pathname) || pathname === '/payment/result';
  if (!staff && !student && !whiteboard) return null;
  return `${staff ? '/admin/login' : '/login'}?returnTo=${encodeURIComponent(safeReturnPath(path))}`;
}
