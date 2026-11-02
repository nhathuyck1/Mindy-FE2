import { expect, it } from 'vitest';
import { sessionLoginTarget } from './session-login-target';

it.each(['/user/profile', '/cart', '/payment/result?orderCode=1000000000'])(
  'sends %s to the student login with a safe return path',
  (path) => {
    expect(sessionLoginTarget(path)).toBe(`/login?returnTo=${encodeURIComponent(path)}`);
  },
);
it.each(['/admin', '/manager/materials?view=inventory', '/mentor/classes'])(
  'sends %s to staff login',
  (path) => {
    expect(sessionLoginTarget(path)).toBe(`/admin/login?returnTo=${encodeURIComponent(path)}`);
  },
);
it.each(['/', '/courses', '/login', '/admin/login', '/register'])(
  'leaves public page %s in place',
  (path) => expect(sessionLoginTarget(path)).toBeNull(),
);
it('sanitizes unsupported queries and return paths', () => {
  expect(sessionLoginTarget('/manager/materials?returnTo=https://evil.test')).toBe(
    '/admin/login?returnTo=%2Fmanager%2Fmaterials',
  );
  expect(sessionLoginTarget('/user/unknown')).toBe('/login?returnTo=%2F');
});
