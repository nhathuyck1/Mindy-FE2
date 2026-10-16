import { afterEach, describe, expect, it, vi } from 'vitest';
import { teachingSessionSchema } from '../schemas/mentor-contracts';
import { fetchMentorWeek } from './mentor-schedule';

function lesson(id: number) {
  const uuid = `10000000-0000-4000-8000-${String(id).padStart(12, '0')}`;
  const person = { id: uuid, displayName: 'Mentor' };
  return teachingSessionSchema.parse({
    sessionId: uuid,
    classId: uuid,
    classUnitId: uuid,
    title: `Buổi ${id}`,
    startsAt: '2026-10-16T03:00:00Z',
    endsAt: '2026-10-16T05:00:00Z',
    status: 'SCHEDULED',
    primaryMentor: person,
    effectiveMentor: person,
    assignmentType: 'PRIMARY',
    version: 1,
    actualStartedAt: null,
    actualEndedAt: null,
    editableUntil: null,
    asOf: '2026-10-16T03:00:00Z',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}
const pageResult = (page: number, total: number, items: ReturnType<typeof lesson>[]) =>
  Response.json({
    page,
    pageSize: 100,
    total,
    items,
    from: '2026-10-12T00:00:00+07:00',
    to: '2026-10-19T00:00:00+07:00',
    asOf: '2026-10-16T03:00:00Z',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
afterEach(() => vi.unstubAllGlobals());
describe('complete mentor calendar week', () => {
  it('collects every page with a Monday-to-Monday timezone-aware interval', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        pageResult(
          1,
          101,
          Array.from({ length: 100 }, (_, i) => lesson(i + 1)),
        ),
      )
      .mockResolvedValueOnce(pageResult(2, 101, [lesson(101)]));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchMentorWeek('2026-10-12', new AbortController().signal);
    expect(result).toHaveLength(101);
    const url = new URL(String(fetchMock.mock.calls[1][0]), 'http://localhost');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('from')).toBe('2026-10-12T00:00:00+07:00');
    expect(url.searchParams.get('to')).toBe('2026-10-19T00:00:00+07:00');
  });
  it('does not present a partial calendar when pagination changes or repeats a session', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(pageResult(1, 2, [lesson(1)]))
      .mockResolvedValueOnce(pageResult(2, 3, [lesson(2)]));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchMentorWeek('2026-10-12', new AbortController().signal)).rejects.toThrow(
      'Lịch dạy vừa thay đổi',
    );
    fetchMock
      .mockResolvedValueOnce(pageResult(1, 2, [lesson(1)]))
      .mockResolvedValueOnce(pageResult(2, 2, [lesson(1)]));
    await expect(fetchMentorWeek('2026-10-12', new AbortController().signal)).rejects.toThrow(
      'Lịch dạy vừa thay đổi',
    );
  });
});
