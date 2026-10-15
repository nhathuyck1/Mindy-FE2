import { describe, expect, it } from 'vitest';
import { safeReturnPath } from './return-path';

describe('Post-login course return path', () => {
  it('Keeps a validated course and selected class', () => {
    const path =
      '/courses/33333333-3333-4333-8333-333333333333?classId=44444444-4444-4444-8444-444444444444';
    expect(safeReturnPath(path)).toBe(path);
    expect(safeReturnPath('/courses')).toBe('/courses');
  });
  it('Rejects external destinations, backslashes, unsupported routes and malformed identifiers', () => {
    for (const path of [
      'https://evil.test',
      '//evil.test',
      '/\\evil.test',
      '/admin/users',
      '/courses/bad',
      'javascript:alert(1)',
    ])
      expect(safeReturnPath(path)).toBe('/');
    expect(
      safeReturnPath(
        '/courses/33333333-3333-4333-8333-333333333333?classId=bad&redirect=https://evil.test',
      ),
    ).toBe('/courses/33333333-3333-4333-8333-333333333333');
  });
});
