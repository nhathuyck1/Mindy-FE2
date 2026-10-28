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
      '/admin/unsupported',
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
  it('Keeps supported admin destinations without accepting arbitrary admin routes', () => {
    expect(safeReturnPath('/admin/users?redirect=https://evil.test')).toBe('/admin/users');
    const path = '/admin/classes/11111111-1111-4111-8111-111111111111/students';
    expect(safeReturnPath(path)).toBe(path);
    expect(safeReturnPath('/admin/classes/bad/students')).toBe('/');
    expect(safeReturnPath('/user/materials')).toBe('/user/materials');
  });
  it('Keeps the new admin screens and only validated Manager inventory filters', () => {
    const material = '/manager/materials/11111111-1111-4111-8111-111111111111';
    expect(safeReturnPath(`${material}?redirect=https://evil.test`)).toBe(material);
    expect(safeReturnPath('/manager/materials/bad')).toBe('/');
    expect(safeReturnPath('/admin/tracking')).toBe('/admin/tracking');
    expect(safeReturnPath('/admin/payments/reconciliation')).toBe('/admin/payments/reconciliation');
    expect(safeReturnPath('/manager/materials?view=inventory&reviewStatus=PENDING_REVIEW')).toBe(
      '/manager/materials?view=inventory&reviewStatus=PENDING_REVIEW',
    );
    expect(safeReturnPath('/manager/materials?view=inventory&reviewStatus=UNKNOWN')).toBe(
      '/manager/materials',
    );
    expect(safeReturnPath('/manager/materials?view=inventory&redirect=https://evil.test')).toBe(
      '/manager/materials',
    );
  });
  it('Keeps only validated Manager leave filters and UUID details', () => {
    const mentorId = '22222222-2222-4222-8222-222222222222';
    const requestId = '11111111-1111-4111-8111-111111111111';
    expect(
      safeReturnPath(`/manager/leave-requests?status=APPROVED&page=2&mentorId=${mentorId}`),
    ).toBe(`/manager/leave-requests?status=APPROVED&page=2&mentorId=${mentorId}`);
    expect(safeReturnPath('/manager/leave-requests?status=ALL')).toBe(
      '/manager/leave-requests?status=ALL',
    );
    expect(safeReturnPath(`/manager/leave-requests/${requestId}?redirect=https://evil.test`)).toBe(
      `/manager/leave-requests/${requestId}`,
    );
    expect(safeReturnPath('/manager/leave-requests?status=PAID')).toBe('/manager/leave-requests');
    expect(safeReturnPath('/manager/leave-requests?mentorId=bad')).toBe('/manager/leave-requests');
    expect(safeReturnPath('/manager/leave-requests/not-a-uuid')).toBe('/');
  });
});
