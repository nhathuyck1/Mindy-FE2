import type { Dashboard } from '../../src/features/dashboard/schemas/dashboard-contracts';

export function dashboardFixture(scope: Dashboard['scope'] = 'ADMIN'): Dashboard {
  const rank = {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Lập trình Web',
    registrations: 24,
    students: 18,
    classes: 2,
  };
  return {
    scope,
    timeZone: 'Asia/Ho_Chi_Minh',
    generatedAt: '2026-11-03T10:00:00Z',
    from: '2026-08-05T17:00:00Z',
    to: '2026-11-03T10:00:00Z',
    summary: {
      courses: 2,
      classes: 3,
      openClasses: 1,
      activeClasses: 2,
      registrations: 30,
      students: 20,
    },
    courses: [
      rank,
      {
        ...rank,
        id: '33333333-3333-4333-8333-333333333334',
        name: 'JavaScript căn bản',
        registrations: 6,
        students: 5,
        classes: 1,
      },
    ],
    mentors: scope === 'MENTOR' ? [] : [{ ...rank, name: 'Mentor Minh' }],
    classes: [{ ...rank, name: 'Web tháng 11', classes: 1 }],
    trend: [
      { date: '2026-11-02', registrations: 12 },
      { date: '2026-11-03', registrations: 18 },
    ],
    classStatuses: [
      { status: 'OPEN', count: 1 },
      { status: 'IN_PROGRESS', count: 2 },
    ],
  };
}
