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
const other = '22222222-2222-4222-8222-222222222222';
const date = '2026-10-22T03:00:00.000Z';
const fetchMock = vi.fn<typeof fetch>();
function request(path: string, method = 'GET', body?: unknown, key?: string) {
  return new Request(`http://localhost:3003/api/v1/${path}`, {
    method,
    headers: {
      Origin: 'http://localhost:3003',
      Cookie: 'access_token=opaque; refresh_token=hidden',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
describe('new mentor API contracts', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });
  it('forwards assignment filters and validates class scope capabilities', async () => {
    const path = `mentor/classes/${id}`;
    fetchMock.mockResolvedValueOnce(
      Response.json({
        id,
        classId: id,
        code: 'JS',
        name: 'JavaScript',
        status: 'IN_PROGRESS',
        course: { id: other, title: 'JavaScript' },
        accessScope: 'SESSION',
        assignmentType: 'SUBSTITUTE',
        readonly: false,
        capabilities: {
          readClass: true,
          readClassRoster: false,
          readClassReports: false,
          authorMaterials: false,
        },
        visibleUnitCount: 1,
        visibleSessionCount: 1,
        asOf: date,
        timeZone: 'Asia/Ho_Chi_Minh',
        meetingUrl: 'private',
      }),
    );
    const response = await proxyApi(request(path), path);
    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty('meetingUrl');
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], page: 1, pageSize: 20, total: 0 }));
    expect(
      (await proxyApi(request('mentor/classes?assignment=SUBSTITUTE'), 'mentor/classes')).status,
    ).toBe(200);
    expect(String(fetchMock.mock.calls[1][0])).toContain('assignment=SUBSTITUTE');
  });
  it('supports each report and progress read, preserving unknown data and policy metadata', async () => {
    const metadata = { classId: id, asOf: date, timeZone: 'Asia/Ho_Chi_Minh', readonly: true };
    const counts = {
      present: 0,
      absent: 0,
      unmarked: 0,
      excluded: 0,
      makeupPending: 0,
      finalizedEligibleCount: 0,
      rate: null,
    };
    const page = { items: [], total: 0, page: 1, pageSize: 20 };
    const progress = {
      ...page,
      asOf: date,
      timeZone: metadata.timeZone,
      readonly: true,
      completionPolicy: 'UNDEFINED',
      policyVersion: null,
      assignmentSummary: { availability: 'NOT_IMPLEMENTED', counts: null },
    };
    for (const [path, payload] of [
      [`mentor/classes/${id}/attendance-summary`, { ...metadata, ...page }],
      [`mentor/classes/${id}/students/${other}/attendance`, { ...metadata, ...page }],
      [
        `mentor/classes/${id}/students/${other}/attendance-summary`,
        { ...metadata, ...counts, aggregationScope: 'STUDENT_CLASS_HISTORY' },
      ],
      [`mentor/classes/${id}/progress`, progress],
      [`mentor/classes/${id}/students/${other}/progress`, progress],
    ] as const) {
      fetchMock.mockResolvedValueOnce(Response.json(payload));
      const response = await proxyApi(request(path), path);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toContain('no-store');
      expect(await response.json()).toEqual(payload);
    }
    for (const query of [
      '?from=2026-10-22T00:00:00Z',
      '?from=2026-10-23T00:00:00Z&to=2026-10-22T00:00:00Z',
      '?from=2026-01-01T00:00:00Z&to=2026-12-01T00:00:00Z',
    ])
      expect(
        (
          await proxyApi(
            request(`mentor/classes/${id}/attendance-summary${query}`),
            `mentor/classes/${id}/attendance-summary`,
          )
        ).status,
      ).toBe(422);
    expect(
      (
        await proxyApi(
          request(`mentor/classes/${id}/progress?from=${date}`),
          `mentor/classes/${id}/progress`,
        )
      ).status,
    ).toBe(422);
  });
  it('supports guest-only attendance and bulk commands without treating unchecked as unmarked', async () => {
    for (const [action, body] of [
      [
        'attendance',
        {
          expectedVersion: 2,
          records: [],
          guestRecords: [{ makeupPlacementId: other, status: 'PRESENT' }],
        },
      ],
      ['attendance/bulk', { expectedVersion: 2, checked: false }],
    ] as const) {
      const path = `class-sessions/${id}/${action}`;
      expect((await proxyApi(request(path, 'PUT', body), path)).status).toBe(422);
      fetchMock.mockResolvedValueOnce(
        Response.json({ code: 'SESSION_VERSION_CONFLICT', message: 'Refetch' }, { status: 409 }),
      );
      expect((await proxyApi(request(path, 'PUT', body, other), path)).status).toBe(409);
      expect(JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body))).toEqual(body);
      expect(new Headers(fetchMock.mock.calls.at(-1)?.[1]?.headers).get('Idempotency-Key')).toBe(
        other,
      );
    }
    const path = `class-sessions/${id}/attendance-candidates`;
    fetchMock.mockResolvedValueOnce(
      Response.json({ items: [], total: 0, page: 1, pageSize: 20, provisional: true, asOf: date }),
    );
    expect((await proxyApi(request(path), path)).status).toBe(200);
  });
  it('keeps teaching notes private and accepts the documented UTF-8 body limit', async () => {
    const path = `class-sessions/${id}/teaching-notes`;
    const body = { expectedVersion: 0, content: 'ế'.repeat(10000), nextSteps: 'ế'.repeat(5000) };
    fetchMock.mockResolvedValueOnce(
      Response.json({ sessionId: id, note: null, version: 0, privateReceipt: 'hidden' }),
    );
    const response = await proxyApi(request(path, 'PUT', body, other), path);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sessionId: id, note: null, version: 0 });
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Cookie')).toBe(
      'access_token=opaque',
    );
    expect(
      (await proxyApi(request(path, 'PUT', { ...body, content: 'a'.repeat(10001) }, other), path))
        .status,
    ).toBe(422);
    expect(
      (await proxyApi(request(path, 'PUT', { ...body, userId: other }, other), path)).status,
    ).toBe(422);
    expect(
      (await proxyApi(request(path, 'PUT', { ...body, nextSteps: 'b'.repeat(70000) }, other), path))
        .status,
    ).toBe(413);
    expect(
      (await proxyApi(request(path, 'PUT', body, '00000000-0000-7000-8000-000000000000'), path))
        .status,
    ).toBe(422);
  });
  it('validates meeting URLs and rejects retired release or staff routes', async () => {
    const path = `mentor/class-sessions/${id}/meeting-url`;
    for (const meetingUrl of ['', 'javascript:alert(1)', 'https://user:password@example.test/'])
      expect(
        (await proxyApi(request(path, 'PATCH', { meetingUrl, expectedVersion: 1 }), path)).status,
      ).toBe(422);
    fetchMock.mockResolvedValueOnce(
      Response.json({
        sessionId: id,
        classId: other,
        meetingUrl: null,
        effectiveMeetingUrl: null,
        version: 2,
      }),
    );
    expect(
      (await proxyApi(request(path, 'PATCH', { meetingUrl: null, expectedVersion: 1 }), path))
        .status,
    ).toBe(200);
    for (const [method, forbidden] of [
      ['PATCH', `mentor/classes/${id}/units/${other}/release`],
      ['PUT', `management/class-sessions/${id}/teaching-notes`],
      ['POST', `management/mentor-leave-requests/${id}/approve`],
      ['GET', 'admin/tracking/events'],
    ] as const)
      expect((await proxyApi(request(forbidden, method), forbidden)).status).toBe(404);
  });
  it('validates leave preview/slots and forwards create/withdraw versions and keys', async () => {
    for (const [path, body] of [
      [
        'mentor/leave-requests/preview',
        { fromDate: '2026-11-02', toDate: '2026-11-02', period: 'FULL_DAY' },
      ],
      [
        'mentor/leave-requests/makeup-slots',
        { sourceSessionId: id, targetDate: '2026-11-04', targetPeriod: 'MORNING' },
      ],
      [
        'mentor/leave-requests',
        {
          fromDate: '2026-11-02',
          toDate: '2026-11-02',
          period: 'FULL_DAY',
          reason: 'Leave',
          sourceVersions: [{ sessionId: id, version: 1 }],
          dayMappings: [{ sourceDate: '2026-11-02', targetDate: '2026-11-04' }],
        },
      ],
      [`mentor/leave-requests/${id}/withdraw`, { expectedVersion: 3, reason: 'Withdraw' }],
    ] as const) {
      fetchMock.mockResolvedValueOnce(
        Response.json({ code: 'LEAVE_REQUEST_STALE', message: 'Changed' }, { status: 409 }),
      );
      expect((await proxyApi(request(path, 'POST', body, other), path)).status).toBe(409);
      expect(JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body))).toEqual(body);
    }
    for (const path of ['mentor/leave-requests', `mentor/leave-requests/${id}`]) {
      fetchMock.mockResolvedValueOnce(
        Response.json({ code: 'LEAVE_NOT_FOUND', message: 'Not found' }, { status: 404 }),
      );
      expect((await proxyApi(request(path), path)).status).toBe(404);
    }
    expect(
      (await proxyApi(request('mentor/leave-requests?mentorId=' + id), 'mentor/leave-requests'))
        .status,
    ).toBe(422);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
