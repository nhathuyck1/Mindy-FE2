import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/client';
import { cashCollectionError, collectionOrdersCsv } from './manager-collections';
import {
  collectionFiltersSchema,
  confirmCashSchema,
  type CollectionOrder,
} from '../schemas/manager-collections-contracts';

describe('Manager collections', () => {
  it('validates cash amounts without rounding or accepting numeric strings', () => {
    expect(confirmCashSchema.parse({ receivedAmount: 3000000 })).toEqual({
      receivedAmount: 3000000,
    });
    for (const receivedAmount of [0, -1, 2.5, '3000000', Number.MAX_SAFE_INTEGER + 1])
      expect(confirmCashSchema.safeParse({ receivedAmount }).success).toBe(false);
    expect(collectionFiltersSchema.safeParse({ receivedAmount: 1 }).success).toBe(false);
  });
  it('keeps CSV exports safe and describes an unknown confirmation outcome', () => {
    const order: CollectionOrder = {
      id: '11111111-1111-4111-8111-111111111111',
      orderCode: '=SUM(1)',
      totalAmount: 3000000,
      paymentType: 'CASH',
      status: 'PAID',
      expiresAt: '2026-10-17T03:00:00Z',
      paidAt: '2026-10-16T03:00:00Z',
      createdAt: '2026-10-15T03:00:00Z',
      student: { id: '22222222-2222-4222-8222-222222222222', displayName: '+HYPERLINK("bad")' },
      payment: null,
    };
    expect(collectionOrdersCsv([order])).toContain('"\'=SUM(1)"');
    expect(collectionOrdersCsv([order])).toContain("'+HYPERLINK");
    expect(cashCollectionError(new Error('offline'))).toContain('Chưa xác định');
    expect(cashCollectionError(new ApiError(409, 'CASH_ORDER_CLOSED', 'Closed'))).toContain(
      'Đơn không thể xác nhận',
    );
  });
});
