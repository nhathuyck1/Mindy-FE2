import { expect, test, type Page } from '@playwright/test';
import { testUser } from '../../../tests/e2e/api-fixtures';

const ids = {
  request: '77777777-7777-4777-8777-777777777777',
  mentor: '22222222-2222-4222-8222-222222222222',
  class: '33333333-3333-4333-8333-333333333333',
  student: '44444444-4444-4444-8444-444444444444',
  source: '55555555-5555-4555-8555-555555555555',
  conflicting: '66666666-6666-4666-8666-666666666666',
  replacement: '88888888-8888-4888-8888-888888888888',
  classUnit: '99999999-9999-4999-8999-999999999999',
};
const submitted = '2026-10-20T03:00:00Z';
const asOf = '2026-10-23T03:00:00Z';
const sourceItem = {
  sourceSessionId: ids.source,
  classId: ids.class,
  sourceVersion: 2,
  sourceStartsAt: '2026-10-27T02:00:00Z',
  sourceEndsAt: '2026-10-27T03:00:00Z',
  startsAt: '2026-10-29T02:00:00Z',
  endsAt: '2026-10-29T03:00:00Z',
  replacementSessionId: null as string | null,
};
function makeRequest(index: number) {
  const requestId =
    index === 0 ? ids.request : `aaaaaaaa-aaaa-4aaa-8aaa-${String(index).padStart(12, '0')}`;
  return {
    id: requestId,
    mentorId: ids.mentor,
    fromDate: '2026-10-27',
    toDate: '2026-10-27',
    period: 'FULL_DAY',
    reason: `Việc cá nhân ${index + 1}`,
    status: index === 3 ? 'APPROVED' : 'PENDING',
    version: 1,
    submittedAt: submitted,
    expiresAt: '2026-10-27T02:00:00Z',
    itemCount: 1,
    items: [] as (typeof sourceItem)[],
    page: 1,
    pageSize: 100,
    studentConflictCount: null as number | null,
    classExtensions: [{ classId: ids.class, endDate: '2026-10-29' }],
    review: index === 3 ? { reviewerId: testUser.id, reason: 'Approved', reviewedAt: asOf } : null,
    asOf,
    timeZone: 'Asia/Ho_Chi_Minh',
  };
}

export async function mockManagerLeave(
  page: Page,
  options: {
    period?: 'FULL_DAY' | 'MORNING';
    uncertainFirstResponse?: boolean;
    sourcesCurrent?: boolean;
    expired?: boolean;
    versionConflictFirstResponse?: boolean;
    holdAction?: boolean;
  } = {},
) {
  const requests = Array.from({ length: 23 }, (_, index) => makeRequest(index));
  let uncertainResponseSent = false;
  let versionConflictSent = false;
  let releaseAction = () => {};
  const actionGate = options.holdAction
    ? new Promise<void>((resolve) => {
        releaseAction = resolve;
      })
    : null;
  if (options.expired) Object.assign(requests[0], { expiresAt: '2026-10-22T02:00:00Z' });
  const calls: {
    path: string;
    search: string;
    method: string;
    body: unknown;
    key: string | null;
  }[] = [];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1/', '');
    const method = request.method();
    const body: unknown = request.postData() ? request.postDataJSON() : null;
    const key = request.headers()['idempotency-key'] ?? null;
    calls.push({ path, search: url.search, method, body, key });

    if (path === 'auth/me')
      return route.fulfill({ json: { ...testUser, role: 'MANAGER', displayName: 'Quản lý Minh' } });
    if (path === 'manager/materials')
      return route.fulfill({ json: { items: [], page: 1, pageSize: 1, total: 0 } });
    if (path === 'manager/mentors' && method === 'GET') {
      const query = url.searchParams.get('q')?.toLocaleLowerCase('vi');
      const mentor = {
        ...testUser,
        id: ids.mentor,
        role: 'MENTOR',
        displayName: 'Trần Mentor',
        email: 'mentor@example.test',
      };
      const items =
        !query ||
        mentor.displayName.toLocaleLowerCase('vi').includes(query) ||
        mentor.email.includes(query)
          ? [mentor]
          : [];
      return route.fulfill({ json: { items, page: 1, pageSize: 20, total: items.length } });
    }
    if (path === `manager/mentors/${ids.mentor}`)
      return route.fulfill({
        json: {
          ...testUser,
          id: ids.mentor,
          role: 'MENTOR',
          displayName: 'Trần Mentor',
          email: 'mentor@example.test',
        },
      });
    if (path === `manager/students/${ids.student}`)
      return route.fulfill({
        json: {
          ...testUser,
          id: ids.student,
          role: 'STUDENT',
          displayName: 'Nguyễn Học Viên',
          email: 'student@example.test',
        },
      });
    if (path === `manager/classes/${ids.class}`)
      return route.fulfill({
        json: {
          id: ids.class,
          courseId: ids.classUnit,
          code: 'WEB101-A',
          name: 'Lớp Web tháng 10',
          startDate: '2026-10-01',
          endDate: '2026-11-30',
          deliveryMode: 'ONLINE',
          maxStudents: 20,
          availableSeats: 10,
          mentor: { id: ids.mentor, displayName: 'Trần Mentor' },
        },
      });

    const managementPath = 'management/mentor-leave-requests';
    if (path === managementPath && method === 'GET') {
      const status = url.searchParams.get('status');
      const mentorId = url.searchParams.get('mentorId');
      const matching = requests.filter(
        (leave) =>
          (!status || leave.status === status) && (!mentorId || leave.mentorId === mentorId),
      );
      const pageNumber = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
      const items = matching
        .slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
        .map((leave) => ({ ...leave, items: [], studentConflictCount: null }));
      return route.fulfill({
        json: { items, total: matching.length, page: pageNumber, pageSize, asOf },
      });
    }
    if (path.startsWith(`${managementPath}/`)) {
      const [, , requestId, action] = path.split('/');
      const leave = requests.find((entry) => entry.id === requestId);
      if (!leave)
        return route.fulfill({
          status: 404,
          json: { code: 'LEAVE_NOT_FOUND', message: 'Missing' },
        });
      if (method === 'GET') {
        const pageNumber = Number(url.searchParams.get('page') ?? 1);
        return route.fulfill({
          json: {
            ...leave,
            period: options.period ?? leave.period,
            items: pageNumber === 1 ? [{ ...sourceItem }] : [],
            studentConflictCount: 1,
            studentConflicts:
              pageNumber === 1
                ? [
                    {
                      sourceSessionId: ids.source,
                      studentId: ids.student,
                      conflictingSessionId: ids.conflicting,
                    },
                  ]
                : [],
            sourcesCurrent: options.sourcesCurrent ?? true,
            page: pageNumber,
            pageSize: 20,
          },
        });
      }
      if (actionGate) await actionGate;
      if (action === 'approve' && options.versionConflictFirstResponse && !versionConflictSent) {
        versionConflictSent = true;
        Object.assign(leave, { version: leave.version + 1 });
        return route.fulfill({
          status: 409,
          json: { code: 'LEAVE_VERSION_CONFLICT', message: 'Version changed' },
        });
      }
      if (action === 'approve' && options.uncertainFirstResponse && !uncertainResponseSent) {
        uncertainResponseSent = true;
        return route.fulfill({
          status: 503,
          json: { code: 'UPSTREAM_ERROR', message: 'Try again' },
        });
      }
      if (action === 'approve') {
        const approvedRequest = {
          ...leave,
          period: options.period ?? leave.period,
          status: 'APPROVED',
          version: leave.version + 1,
          review: {
            reviewerId: testUser.id,
            reason: String((body as Record<string, unknown>)?.reason),
            reviewedAt: asOf,
          },
          items: [{ ...sourceItem, replacementSessionId: ids.replacement }],
        };
        Object.assign(leave, approvedRequest);
        return route.fulfill({
          json: {
            request: approvedRequest,
            replacements: [
              {
                makeupForSessionId: ids.source,
                makeupRootSessionId: ids.source,
                actualStartedAt: null,
                actualEndedAt: null,
                editableUntil: null,
                sessionId: ids.replacement,
                classId: ids.class,
                classUnitId: ids.classUnit,
                title: 'Buổi dạy bù',
                startsAt: sourceItem.startsAt,
                endsAt: sourceItem.endsAt,
                status: 'SCHEDULED',
                primaryMentor: { id: ids.mentor, displayName: 'Trần Mentor' },
                effectiveMentor: { id: ids.mentor, displayName: 'Trần Mentor' },
                assignmentType: 'PRIMARY',
                version: 1,
                asOf,
                timeZone: 'Asia/Ho_Chi_Minh',
              },
            ],
            classExtensions: leave.classExtensions,
            studentConflictCount: 1,
          },
        });
      }
      if (action === 'reject') {
        Object.assign(leave, {
          status: 'REJECTED',
          version: leave.version + 1,
          review: {
            reviewerId: testUser.id,
            reason: String((body as Record<string, unknown>)?.reason),
            reviewedAt: asOf,
          },
        });
        return route.fulfill({ json: { ...leave, items: [], studentConflictCount: null } });
      }
    }
    return route.fulfill({ status: 404, json: { code: 'NOT_FOUND', message: path } });
  });
  return { calls, releaseAction };
}
