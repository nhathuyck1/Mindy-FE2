import { describe, expect, it } from 'vitest';
import { loginDestination } from './login-destination';

describe('loginDestination', () => {
  it('only lets students use the student login and keeps them out of staff areas', () => {
    expect(loginDestination('student', 'STUDENT', '/cart')).toBe('/cart');
    expect(loginDestination('student', 'STUDENT', '/admin/users')).toBe('/');
    expect(loginDestination('student', 'STUDENT', '/mentor/classes')).toBe('/');
    for (const role of ['ADMIN', 'MANAGER', 'MENTOR'] as const)
      expect(loginDestination('student', role, '/')).toBeNull();
  });

  it('sends staff to their own workspace and rejects students', () => {
    expect(loginDestination('staff', 'STUDENT', '/admin')).toBeNull();
    expect(loginDestination('staff', 'ADMIN', '/admin/classes')).toBe('/admin/classes');
    expect(loginDestination('staff', 'MANAGER', '/')).toBe('/manager');
    expect(loginDestination('staff', 'MANAGER', '/manager/collections')).toBe(
      '/manager/collections',
    );
    expect(loginDestination('student', 'STUDENT', '/manager/materials')).toBe('/');
    expect(loginDestination('staff', 'MENTOR', '/admin/users')).toBe('/mentor');
    expect(loginDestination('staff', 'MENTOR', '/mentor/classes')).toBe('/mentor/classes');
    expect(loginDestination('staff', 'ADMIN', '/mentor')).toBe('/admin');
    expect(loginDestination('staff', 'ADMIN', '/administrator')).toBe('/admin');
  });
});
