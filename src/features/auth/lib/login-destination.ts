import type { User } from '@/lib/api/contracts';

export type LoginAudience = 'student' | 'staff';

const staffHomes = { ADMIN: '/admin', MANAGER: '/admin', MENTOR: '/mentor' } as const;

function isWithin(path: string, home: string) {
  return path === home || path.startsWith(`${home}/`);
}

// `returnTo` must already pass safeReturnPath. null: role does not belong to this login page.
export function loginDestination(
  audience: LoginAudience,
  role: User['role'],
  returnTo: string,
): string | null {
  if (audience === 'student') {
    if (role !== 'STUDENT') return null;
    return Object.values(staffHomes).some((home) => isWithin(returnTo, home)) ? '/' : returnTo;
  }
  if (role === 'STUDENT') return null;
  const home = staffHomes[role];
  return isWithin(returnTo, home) ? returnTo : home;
}
