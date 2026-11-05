import { describe, expect, it } from 'vitest';
import { makeupMinDate } from './leave-display';

describe('makeup calendar lower bound', () => {
  it('blocks every day before and within the entire full-day leave range', () => {
    expect(
      makeupMinDate(
        '2026-11-05T03:00:00Z',
        'Asia/Ho_Chi_Minh',
        Date.parse('2026-11-05T03:00:00Z'),
        {
          period: 'FULL_DAY',
          toDate: '2026-11-14',
          sourceStartsAt: '2026-11-11T12:30:00Z',
        },
      ),
    ).toBe('2026-11-15');
  });
  it('blocks dates before a partial-day source while preserving same-day makeup', () => {
    expect(
      makeupMinDate(
        '2026-11-05T03:00:00Z',
        'Asia/Ho_Chi_Minh',
        Date.parse('2026-11-05T03:00:00Z'),
        {
          period: 'MORNING',
          toDate: '2026-11-14',
          sourceStartsAt: '2026-11-10T18:30:00Z',
        },
      ),
    ).toBe('2026-11-11');
  });
  it('rolls the full-day range over a year boundary and still rejects dates before today', () => {
    const leave = {
      period: 'FULL_DAY',
      toDate: '2026-12-31',
      sourceStartsAt: '2026-12-31T03:00:00Z',
    };
    expect(
      makeupMinDate(
        '2026-12-05T03:00:00Z',
        'Asia/Ho_Chi_Minh',
        Date.parse('2026-12-05T03:00:00Z'),
        leave,
      ),
    ).toBe('2027-01-01');
    expect(
      makeupMinDate(
        '2027-01-03T03:00:00Z',
        'Asia/Ho_Chi_Minh',
        Date.parse('2027-01-03T03:00:00Z'),
        leave,
      ),
    ).toBe('2027-01-03');
  });
  it('uses the teaching timezone at the UTC day boundary', () => {
    expect(
      makeupMinDate('2026-11-05T16:00:00Z', 'Asia/Ho_Chi_Minh', Date.parse('2026-11-05T17:30:00Z')),
    ).toBe('2026-11-06');
  });
  it('uses server time when the client clock is behind and client time when preview is stale', () => {
    expect(
      makeupMinDate('2026-11-06T01:00:00Z', 'Asia/Ho_Chi_Minh', Date.parse('2026-11-04T01:00:00Z')),
    ).toBe('2026-11-06');
    expect(
      makeupMinDate('2026-11-04T01:00:00Z', 'Asia/Ho_Chi_Minh', Date.parse('2026-11-06T01:00:00Z')),
    ).toBe('2026-11-06');
  });
});
