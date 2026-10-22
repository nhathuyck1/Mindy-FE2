import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContentUnit } from '../schemas/mentor-contracts';
import { fetchMentorUnitSessions } from './mentor-unit-sessions';

const classId = '11111111-1111-4111-8111-111111111111';
const unitId = '22222222-2222-4222-8222-222222222222';
const unit: ContentUnit = {
  id: unitId,
  classId,
  courseUnitId: classId,
  title: 'HTML',
  position: 1,
  status: 'OPEN',
  unlockAt: null,
};
const lesson = (number: number) => ({
  id: `33333333-3333-4333-8333-${String(number).padStart(12, '0')}`,
  classUnitId: unitId,
  title: `Buổi ${number}`,
  sessionNumber: number,
  status: 'SCHEDULED',
});
const timetable = (number: number) => ({
  ...lesson(number),
  sessionId: lesson(number).id,
  classId,
  startsAt: '2026-10-13T08:00:00Z',
  endsAt: '2026-10-13T10:00:00Z',
  primaryMentor: { id: classId, displayName: 'Mentor' },
  effectiveMentor: { id: classId, displayName: 'Mentor' },
  assignmentType: 'PRIMARY',
  version: 1,
  actualStartedAt: null,
  actualEndedAt: null,
  editableUntil: null,
  asOf: '2026-10-22T00:00:00Z',
  timeZone: 'Asia/Ho_Chi_Minh',
  capabilities: { readSessionContext: number === 1, writeTeachingNotes: false },
});
const signal = () => new AbortController().signal;

afterEach(() => vi.unstubAllGlobals());
describe('mentor chapter session sources', () => {
  it('joins all authorized pages by session ID without reading unit detail or a current-week range', async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = new URL(String(input), 'http://localhost');
      const page = Number(url.searchParams.get('page'));
      const isUnit = url.pathname.includes('/units/');
      return Response.json({
        items: [isUnit ? lesson(page) : timetable(3 - page)],
        page,
        pageSize: 1,
        total: 2,
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchMentorUnitSessions(unit, signal());
    expect(
      result.sessions.map((item) => [item.id, item.sessionNumber, item.canReadContext]),
    ).toEqual([
      [lesson(1).id, 1, true],
      [lesson(2).id, 2, false],
    ]);
    expect(result.sessions[0].startsAt).toBe(timetable(1).startsAt);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (const [input] of fetchMock.mock.calls) {
      const url = new URL(String(input), 'http://localhost');
      expect(url.pathname.endsWith('/sessions')).toBe(true);
      expect(url.searchParams.has('from')).toBe(false);
      if (!url.pathname.includes('/units/')) expect(url.searchParams.get('unitId')).toBe(unitId);
    }
  });

  it.each(['missing', 'foreign-unit', 'duplicate'] as const)(
    'rejects a %s timetable instead of presenting a false empty or partial roster',
    async (failure) => {
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>(async (input) => {
          const isUnit = String(input).includes('/units/');
          const item = timetable(1);
          if (failure === 'foreign-unit') item.classUnitId = classId;
          const items = isUnit
            ? [lesson(1)]
            : failure === 'missing'
              ? []
              : failure === 'duplicate'
                ? [item, item]
                : [item];
          return Response.json({ items, page: 1, pageSize: 100, total: items.length });
        }),
      );
      await expect(fetchMentorUnitSessions(unit, signal())).rejects.toThrow('Chưa tải đủ');
    },
  );

  it('fails when a later timetable page is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const url = new URL(String(input), 'http://localhost');
        if (!url.pathname.includes('/units/') && url.searchParams.get('page') === '2')
          return Response.json({ message: 'Chưa tải được lịch.' }, { status: 503 });
        const number = Number(url.searchParams.get('page'));
        return Response.json({
          items: [url.pathname.includes('/units/') ? lesson(number) : timetable(number)],
          page: number,
          pageSize: 1,
          total: 2,
        });
      }),
    );
    await expect(fetchMentorUnitSessions(unit, signal())).rejects.toThrow('Chưa tải được lịch.');
  });
});
