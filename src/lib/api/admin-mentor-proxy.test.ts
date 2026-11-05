import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env.server', () => ({
  getServerEnv: () => ({
    apiBaseUrl: 'https://api.example.test/api/v1',
    appOrigin: 'http://localhost:3003',
  }),
}));
import { proxyApi } from './proxy.server';
const classId = '11111111-1111-4111-8111-111111111111';
const mentorId = '22222222-2222-4222-8222-222222222222';
const path = `management/classes/${classId}`;
const key = '33333333-3333-4333-8333-333333333333';
const body = { mentorId, expectedVersion: 2, reason: ' Điều chỉnh lịch ' };
const result = {
  classId,
  primaryMentor: { id: mentorId, displayName: 'Mai Anh' },
  assignmentVersion: 3,
  affectedSessionCount: 4,
  asOf: '2026-11-06T03:00:00Z',
};
const fetchMock = vi.fn<typeof fetch>();
function request(suffix: string, data?: unknown, headers?: Record<string, string>) {
  return new Request(`http://localhost:3003/api/v1/${path}/${suffix}`, {
    method: data ? 'PATCH' : 'GET',
    headers: {
      Cookie: 'access_token=opaque; refresh_token=private',
      Origin: 'http://localhost:3003',
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
}
describe('class mentor assignment proxy', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });
  it('forwards a validated assignment and only the access cookie', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(result));
    const response = await proxyApi(
      request('mentor', body, { 'Idempotency-Key': key }),
      `${path}/mentor`,
    );
    expect(response.status).toBe(200);
    const init = fetchMock.mock.calls[0][1]!;
    expect(JSON.parse(String(init.body))).toEqual({ ...body, reason: body.reason.trim() });
    expect(new Headers(init.headers).get('cookie')).toBe('access_token=opaque');
    expect(new Headers(init.headers).get('Idempotency-Key')).toBe(key);
  });
  it('rejects missing idempotency, invalid version, blank reason and foreign origin before upstream', async () => {
    for (const [data, headers] of [
      [body, {}],
      [{ ...body, expectedVersion: 0 }, { 'Idempotency-Key': key }],
      [{ ...body, reason: ' ' }, { 'Idempotency-Key': key }],
      [body, { 'Idempotency-Key': key, Origin: 'https://foreign.test' }],
    ] as const) {
      expect(
        (await proxyApi(request('mentor', data, headers), `${path}/mentor`)).status,
      ).toBeGreaterThanOrEqual(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rejects a response belonging to another class', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ...result, classId: mentorId }));
    expect(
      (await proxyApi(request('mentor', body, { 'Idempotency-Key': key }), `${path}/mentor`))
        .status,
    ).toBe(502);
  });
  it('validates candidate pagination and refuses unknown filters', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        classId,
        assignmentVersion: 2,
        affectedSessionCount: 4,
        items: [],
        total: 0,
        page: 2,
        pageSize: 10,
        asOf: result.asOf,
        timeZone: 'Asia/Ho_Chi_Minh',
        availabilityBasis: 'TEACHING_SCHEDULE_AND_APPROVED_LEAVE',
      }),
    );
    expect(
      (await proxyApi(request('available-mentors?page=2&pageSize=10'), `${path}/available-mentors`))
        .status,
    ).toBe(200);
    fetchMock.mockClear();
    expect(
      (await proxyApi(request('available-mentors?mentorId=x'), `${path}/available-mentors`)).status,
    ).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
