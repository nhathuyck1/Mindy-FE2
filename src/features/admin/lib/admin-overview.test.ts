import { describe, expect, it } from 'vitest';
import { monthlyActivity, vietnamMonth, coursesByClassCount } from './admin-overview';
import { adminClassSchema, adminCourseSchema } from '../schemas/admin-contracts';

describe('Overview aggregation', () => {
  it('Buckets records across year boundaries using Vietnam time and excludes future activity', () => {
    const users = [
      { createdAt: '2025-12-31T18:00:00Z' },
      { createdAt: '2025-12-15T00:00:00Z' },
      { createdAt: '2025-10-01T00:00:00Z' },
      { createdAt: '2026-01-03T00:00:00Z' },
    ];
    const rows = monthlyActivity(
      users,
      [{ createdAt: '2025-11-02T00:00:00Z' }],
      3,
      new Date('2026-01-02T00:00:00Z'),
    );
    expect(vietnamMonth('2025-12-31T18:00:00Z')).toBe('2026-01');
    expect(rows).toEqual([
      { key: '2025-11', label: 'T11/25', users: 0, classes: 1 },
      { key: '2025-12', label: 'T12/25', users: 1, classes: 0 },
      { key: '2026-01', label: 'T1/26', users: 1, classes: 0 },
    ]);
    expect(
      monthlyActivity([], [], 12, new Date('2026-01-02')).every(
        (item) => !item.users && !item.classes,
      ),
    ).toBe(true);
  });

  it('Ranks courses by actual related classes, including courses without a class', () => {
    const course = adminCourseSchema.parse({
      id: '33333333-3333-4333-8333-333333333333',
      code: 'WEB',
      title: 'Web',
      description: null,
      imgUrl: null,
      category: { id: '22222222-2222-4222-8222-222222222222', name: 'Web', slug: 'web' },
      priceAmount: 0,
      isActive: true,
      createdAt: '2026-10-15T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z',
    });
    const other = { ...course, id: '33333333-3333-4333-8333-333333333334', title: 'JavaScript' };
    const classroom = adminClassSchema.parse({
      id: '44444444-4444-4444-8444-444444444444',
      courseId: course.id,
      code: 'WEB1',
      name: 'Web 1',
      startDate: '2026-10-20',
      endDate: '2026-12-20',
      deliveryMode: 'ONLINE',
      maxStudents: 20,
      availableSeats: 8,
      mentor: { id: '11111111-1111-4111-8111-111111111111', displayName: 'Mentor' },
      status: 'OPEN',
      assignmentVersion: 1,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    });
    expect(
      coursesByClassCount([other, course], [classroom]).map((item) => [item.id, item.classCount]),
    ).toEqual([
      [course.id, 1],
      [other.id, 0],
    ]);
  });
});
