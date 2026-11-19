import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';

const sessionId = '11111111-1111-4111-8111-111111111111';
const classId = '22222222-2222-4222-8222-222222222222';
const mentorId = '33333333-3333-4333-8333-333333333333';
const key = '44444444-4444-4444-8444-444444444444';
const path = `management/class-sessions/${sessionId}`;
const body = { mentorId, reason: ' Mentor chính bận ', expectedVersion: 2 };
const person = { id: mentorId, displayName: 'Mai Anh' };
const session = {
  sessionId,
  classId,
  classUnitId: classId,
  title: 'Buổi học',
  startsAt: '2026-11-20T03:00:00Z',
  endsAt: '2026-11-20T05:00:00Z',
  status: 'SCHEDULED',
  primaryMentor: person,
  effectiveMentor: person,
  assignmentType: 'SUBSTITUTE',
  version: 3,
  actualStartedAt: null,
  actualEndedAt: null,
  editableUntil: null,
  asOf: '2026-11-19T03:00:00Z',
  timeZone: 'Asia/Ho_Chi_Minh',
};
const candidates = {
  sessionId,
  sessionVersion: 2,
  checkedFrom: session.startsAt,
  checkedTo: session.endsAt,
  items: [],
  page: 1,
  pageSize: 10,
  total: 0,
  asOf: session.asOf,
  timeZone: session.timeZone,
  availabilityBasis: 'TEACHING_SCHEDULE_AND_APPROVED_LEAVE',
};
const fetchMock = vi.fn<typeof fetch>();
function request(target: string, data?: unknown, headers?: Record<string, string>) {
  return new Request(`http://localhost:3003/api/v1/${target}`, {
    method: data === undefined ? 'GET' : 'PATCH',
    headers: {
      Cookie: 'access_token=opaque; refresh_token=private',
      Origin: 'http://localhost:3003',
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
      ...headers,
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
}
describe('session mentor assignment proxy', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });
  it.each([mentorId, null])(
    'forwards assignment or removal with access cookie and receipt (%s)',
    async (id) => {
      fetchMock.mockResolvedValueOnce(Response.json(session));
      expect(
        (await proxyApi(request(`${path}/mentor`, { ...body, mentorId: id }), `${path}/mentor`))
          .status,
      ).toBe(200);
      const init = fetchMock.mock.calls[0][1]!;
      expect(JSON.parse(String(init.body))).toEqual({
        ...body,
        mentorId: id,
        reason: body.reason.trim(),
      });
      expect(new Headers(init.headers).get('cookie')).toBe('access_token=opaque');
      expect(new Headers(init.headers).get('Idempotency-Key')).toBe(key);
    },
  );
  it('refuses missing receipt, unknown fields, invalid version, blank reason and foreign origin', async () => {
    for (const [data, headers] of [
      [body, { 'Idempotency-Key': '' }],
      [{ ...body, expectedVersion: 0 }, {}],
      [{ ...body, reason: ' ' }, {}],
      [{ ...body, classId }, {}],
      [body, { Origin: 'https://foreign.test' }],
    ] as const)
      expect(
        (await proxyApi(request(`${path}/mentor`, data, headers), `${path}/mentor`)).status,
      ).toBeGreaterThanOrEqual(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('validates candidate pagination/search and binds responses to the requested session', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(candidates));
    expect(
      (
        await proxyApi(
          request(`${path}/available-mentors?page=1&pageSize=10&search=Mai`),
          `${path}/available-mentors`,
        )
      ).status,
    ).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toContain('search=Mai');
    fetchMock.mockResolvedValueOnce(Response.json({ ...candidates, sessionId: classId }));
    expect(
      (await proxyApi(request(`${path}/available-mentors`), `${path}/available-mentors`)).status,
    ).toBe(502);
    fetchMock.mockResolvedValueOnce(Response.json({ ...session, sessionId: classId }));
    expect((await proxyApi(request(`${path}/mentor`, body), `${path}/mentor`)).status).toBe(502);
    fetchMock.mockClear();
    for (const query of ['mentorId=anything', 'page=0', 'pageSize=101'])
      expect(
        (await proxyApi(request(`${path}/available-mentors?${query}`), `${path}/available-mentors`))
          .status,
      ).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('paginates class sessions and rejects cross-class data and unsupported query filters', async () => {
    const target = `management/classes/${classId}`;
    const detail = {
      class: {
        id: classId,
        name: 'Lớp Web',
        code: 'WEB',
        status: 'OPEN',
        primaryMentor: person,
        assignmentVersion: 1,
      },
      sessions: { items: [session], page: 1, pageSize: 20, total: 1 },
    };
    fetchMock.mockResolvedValueOnce(Response.json(detail));
    expect((await proxyApi(request(`${target}?page=1&pageSize=20`), target)).status).toBe(200);
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ...detail,
        sessions: { ...detail.sessions, items: [{ ...session, classId: mentorId }] },
      }),
    );
    expect((await proxyApi(request(target), target)).status).toBe(502);
    fetchMock.mockClear();
    expect((await proxyApi(request(`${target}?mentorId=${mentorId}`), target)).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
