import { safeReturnPath } from './return-path';

export function sessionLoginTarget(path: string): string | null {
  const pathname = path.split('?')[0];
  if (pathname === '/admin/login') return null;
  const staff = /^\/(admin|manager|mentor)(\/|$)/.test(pathname);
  const student = /^\/(user|cart|checkout)(\/|$)/.test(pathname) || pathname === '/payment/result';
  if (!staff && !student) return null;
  return `${staff ? '/admin/login' : '/login'}?returnTo=${encodeURIComponent(safeReturnPath(path))}`;
}
