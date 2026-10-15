import { describe, expect, it } from 'vitest';
import { safeReturnPath } from './return-path';

describe('Post-login course return path', () => {
  it('Keeps cart, UUID checkout and the provider code while stripping untrusted redirect flags', () => {
    const id = '55555555-5555-4555-8555-555555555555';
    expect(safeReturnPath('/cart?redirect=https://evil.test')).toBe('/cart');
    expect(safeReturnPath(`/checkout/${id}?status=PAID`)).toBe(`/checkout/${id}`);
    expect(safeReturnPath('/payment/result?orderCode=1000000000&status=PAID&cancel=true')).toBe(
      '/payment/result?orderCode=1000000000',
    );
    for (const path of [
      '/checkout/bad',
      '/payment/result?orderCode=1e9',
      '/payment/result?orderCode=1&orderCode=2',
      '/payment/result',
    ])
      expect(safeReturnPath(path)).toBe('/');
  });
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
