import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';

const id = '11111111-1111-4111-8111-111111111111';
const mentorId = '22222222-2222-4222-8222-222222222222';
const classId = '33333333-3333-4333-8333-333333333333';
const studentId = '44444444-4444-4444-8444-444444444444';
const date = '2026-10-26T03:00:00Z';
const item = {
  sourceSessionId: '55555555-5555-4555-8555-555555555555',
  classId,
  sourceVersion: 2,
  sourceStartsAt: date,
  sourceEndsAt: '2026-10-26T04:00:00Z',
  startsAt: '2026-10-28T03:00:00Z',
  endsAt: '2026-10-28T04:00:00Z',
  replacementSessionId: null,
};
const requestDto = {
  id,
  mentorId,
  fromDate: '2026-10-26',
  toDate: '2026-10-26',
  period: 'FULL_DAY',
  reason: 'Personal appointment',
  status: 'PENDING',
  version: 1,
  submittedAt: '2026-10-20T03:00:00Z',
  expiresAt: date,
  itemCount: 1,
  items: [],
  page: 1,
  pageSize: 20,
  studentConflictCount: null,
  classExtensions: [{ classId, endDate: '2026-10-28' }],
  review: null,
  asOf: '2026-10-20T04:00:00Z',
  timeZone: 'Asia/Ho_Chi_Minh',
};
const detailDto = {
  ...requestDto,
  items: [item],
  studentConflictCount: 1,
  studentConflicts: [
    {
      sourceSessionId: item.sourceSessionId,
      studentId,
      conflictingSessionId: '66666666-6666-4666-8666-666666666666',
    },
  ],
  sourcesCurrent: true,
};
const fetchMock = vi.fn<typeof fetch>();
function request(
  path: string,
  method = 'GET',
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return new Request(`http://localhost:3003/api/v1/${path}`, {
    method,
    headers: {
      Cookie: 'access_token=opaque; refresh_token=private',
      Origin: 'http://localhost:3003',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe('Manager mentor leave proxy', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('lists and reads management requests with strict filters, detail and private cookies', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        items: [{ ...requestDto, studentConflictCount: null }],
        total: 1,
        page: 2,
        pageSize: 20,
        asOf: requestDto.asOf,
      }),
    );
    const listPath = 'management/mentor-leave-requests';
    const listed = await proxyApi(
      request(`${listPath}?page=2&pageSize=20&status=PENDING&mentorId=${mentorId}`),
      listPath,
    );
    expect(listed.status).toBe(200);
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('page')).toBe('2');
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('mentorId')).toBe(mentorId);
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Cookie')).toBe(
      'access_token=opaque',
    );
    expect(listed.headers.get('cache-control')).toContain('no-store');

    fetchMock.mockResolvedValueOnce(Response.json(detailDto));
    const detailPath = `${listPath}/${id}`;
    const detail = await proxyApi(request(`${detailPath}?page=2&pageSize=20`), detailPath);
    expect(detail.status).toBe(200);
    expect(await detail.json()).toMatchObject({ sourcesCurrent: true, studentConflictCount: 1 });
  });

  it.each([
    ['approve', { expectedVersion: 1, reason: '  Approved  ', acknowledgeStudentConflicts: true }],
    ['reject', { expectedVersion: 1, reason: '  Please resubmit  ' }],
  ] as const)(
    'forwards %s with a UUIDv4 idempotency key and its distinct response',
    async (action, body) => {
      const path = `management/mentor-leave-requests/${id}/${action}`;
      const key = '77777777-7777-4777-8777-777777777777';
      const responseBody =
        action === 'approve'
          ? {
              request: { ...requestDto, status: 'APPROVED', studentConflictCount: null },
              replacements: [
                {
                  makeupForSessionId: item.sourceSessionId,
                  makeupRootSessionId: item.sourceSessionId,
                  actualStartedAt: null,
                  actualEndedAt: null,
                  editableUntil: null,
                  sessionId: '88888888-8888-4888-8888-888888888888',
                  classId,
                  classUnitId: '99999999-9999-4999-8999-999999999999',
                  title: 'Buổi học 1',
                  startsAt: item.startsAt,
                  endsAt: item.endsAt,
                  status: 'SCHEDULED',
                  primaryMentor: { id: mentorId, displayName: 'Mentor An' },
                  effectiveMentor: { id: mentorId, displayName: 'Mentor An' },
                  assignmentType: 'PRIMARY',
                  version: 1,
                  asOf: requestDto.asOf,
                  timeZone: requestDto.timeZone,
                },
              ],
              classExtensions: requestDto.classExtensions,
              studentConflictCount: 1,
            }
          : { ...requestDto, status: 'REJECTED', studentConflictCount: null };
      fetchMock.mockResolvedValueOnce(Response.json(responseBody));
      const response = await proxyApi(
        request(path, 'POST', body, { 'Idempotency-Key': key }),
        path,
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(responseBody);
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toBe(`https://api.example.test/api/v1/${path}`);
      expect(JSON.parse(String(init?.body))).toEqual({ ...body, reason: body.reason.trim() });
      expect(new Headers(init?.headers).get('Idempotency-Key')).toBe(key);

      expect((await proxyApi(request(path, 'POST', body), path)).status).toBe(422);
      expect(
        (await proxyApi(request(path, 'POST', body, { 'Idempotency-Key': 'not-a-uuid' }), path))
          .status,
      ).toBe(422);
    },
  );

  it('opens only the supporting manager people/class reads and validates their identities', async () => {
    const mentor = {
      id: mentorId,
      email: 'mentor@example.test',
      displayName: 'Mentor An',
      phone: null,
      role: 'MENTOR',
      status: 'ACTIVE',
      lastLoginAt: null,
      createdAt: requestDto.submittedAt,
    };
    fetchMock.mockResolvedValueOnce(
      Response.json({ items: [mentor], page: 1, pageSize: 20, total: 1 }),
    );
    expect(
      (await proxyApi(request('manager/mentors?page=1&pageSize=20&q=An'), 'manager/mentors'))
        .status,
    ).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toContain('q=An');

    fetchMock.mockResolvedValueOnce(Response.json(mentor));
    expect(
      (await proxyApi(request(`manager/mentors/${mentorId}`), `manager/mentors/${mentorId}`))
        .status,
    ).toBe(200);

    fetchMock.mockResolvedValueOnce(
      Response.json({
        id: classId,
        courseId: mentorId,
        code: 'JS101-A',
        name: 'JavaScript',
        startDate: '2026-10-01',
        endDate: '2026-12-01',
        deliveryMode: 'ONLINE',
        maxStudents: 20,
        availableSeats: 12,
        mentor: { id: mentorId, displayName: 'Mentor An' },
      }),
    );
    expect(
      (await proxyApi(request(`manager/classes/${classId}`), `manager/classes/${classId}`)).status,
    ).toBe(200);
    expect(
      (await proxyApi(request('manager/classes/not-a-uuid'), 'manager/classes/not-a-uuid')).status,
    ).toBe(404);
    expect(
      (
        await proxyApi(
          request(`manager/mentors/${classId}`, 'GET', undefined, { Cookie: '' }),
          `manager/mentors/${classId}`,
        )
      ).status,
    ).toBe(401);
  });

  it('rejects duplicate/unknown query, bad bodies and cross-origin actions without upstream calls', async () => {
    const list = 'management/mentor-leave-requests';
    expect((await proxyApi(request(`${list}?page=1&page=2`), list)).status).toBe(422);
    expect((await proxyApi(request(`${list}?status=UNKNOWN`), list)).status).toBe(422);
    expect((await proxyApi(request(`${list}?studentId=${studentId}`), list)).status).toBe(422);
    const path = `management/mentor-leave-requests/${id}/approve`;
    expect(
      (
        await proxyApi(
          request(path, 'POST', {
            expectedVersion: 1,
            reason: ' ',
            acknowledgeStudentConflicts: false,
          }),
          path,
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await proxyApi(
          request(
            path,
            'POST',
            { expectedVersion: 1, reason: 'Valid', acknowledgeStudentConflicts: false },
            {
              Origin: 'https://other.test',
              'Idempotency-Key': '77777777-7777-4777-8777-777777777777',
            },
          ),
          path,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await proxyApi(
          request(
            path,
            'POST',
            { expectedVersion: 1, reason: 'Valid', acknowledgeStudentConflicts: false },
            { Cookie: '', 'Idempotency-Key': '77777777-7777-4777-8777-777777777777' },
          ),
          path,
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await proxyApi(
          request(`management/mentor-leave-requests/not-a-uuid/approve`, 'POST'),
          `management/mentor-leave-requests/not-a-uuid/approve`,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await proxyApi(
          request(`management/mentor-leave-requests/${id}/withdraw`),
          `management/mentor-leave-requests/${id}/withdraw`,
        )
      ).status,
    ).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
