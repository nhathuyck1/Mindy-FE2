import { describe, expect, it } from 'vitest';
import { assignmentDeadline } from './assignment-deadline';

const now = Date.parse('2026-11-05T03:00:00Z');
const inMinutes = (minutes: number) => new Date(now + minutes * 60_000).toISOString();

describe('assignment deadline labels', () => {
  it('keeps an unlimited deadline separate from a past deadline', () => {
    expect(assignmentDeadline(null, now)).toEqual({ label: 'Không giới hạn', urgent: false });
    expect(assignmentDeadline(inMinutes(-1), now)).toEqual({ label: 'Đã qua hạn', urgent: true });
    expect(assignmentDeadline(inMinutes(0), now)).toEqual({ label: 'Đã qua hạn', urgent: true });
  });

  it('rounds remaining time up and marks the final 24 hours as urgent', () => {
    expect(assignmentDeadline(inMinutes(0.1), now).label).toBe('Còn 1 phút');
    expect(assignmentDeadline(inMinutes(30), now).label).toBe('Còn 30 phút');
    expect(assignmentDeadline(inMinutes(60), now).label).toBe('Còn 1 giờ · Sắp đến hạn');
    expect(assignmentDeadline(inMinutes(1440), now).urgent).toBe(true);
    expect(assignmentDeadline(inMinutes(1441), now)).toEqual({
      label: 'Còn 2 ngày',
      urgent: false,
    });
  });
});
