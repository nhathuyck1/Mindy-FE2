import { z } from 'zod';
import { apiRequest } from '@/lib/api/client';
import {
  unitSessionsSchema,
  unitTimetableSchema,
  type ContentSession,
  type ContentUnit,
} from '../schemas/mentor-contracts';

const incomplete = () => new Error('Chưa tải đủ danh sách buổi học. Vui lòng thử lại.');

async function readPages<T>(
  path: string,
  schema: z.ZodType<{ items: T[]; page: number; pageSize: number; total: number }>,
  signal: AbortSignal,
) {
  const read = (page: number) =>
    apiRequest({ path: `${path}page=${page}&pageSize=100`, schema, signal });
  const first = await read(1);
  if (first.page !== 1) throw incomplete();
  const items = [...first.items];
  for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++) {
    const next = await read(page);
    if (next.page !== page || next.total !== first.total || next.pageSize !== first.pageSize)
      throw incomplete();
    items.push(...next.items);
  }
  if (items.length !== first.total) throw incomplete();
  return items;
}

export async function fetchMentorUnitSessions(unit: ContentUnit, signal: AbortSignal) {
  const prefix = `mentor/classes/${unit.classId}`;
  const [sessions, timetable] = await Promise.all([
    readPages(`${prefix}/units/${unit.id}/sessions?`, unitSessionsSchema, signal),
    readPages(`${prefix}/sessions?unitId=${unit.id}&`, unitTimetableSchema, signal),
  ]);
  const byId = new Map(timetable.map((item) => [item.sessionId, item]));
  if (
    byId.size !== timetable.length ||
    new Set(sessions.map((item) => item.id)).size !== sessions.length ||
    sessions.length !== timetable.length ||
    timetable.some((item) => item.classId !== unit.classId || item.classUnitId !== unit.id)
  )
    throw incomplete();
  const items: ContentSession[] = sessions.map((item) => {
    const time = byId.get(item.id);
    if (!time || item.classUnitId !== unit.id) throw incomplete();
    return {
      ...item,
      title: time.title,
      status: time.status,
      startsAt: time.startsAt,
      endsAt: time.endsAt,
      canReadContext: time.capabilities.readSessionContext,
    };
  });
  return { sessions: items.sort((a, b) => a.sessionNumber - b.sessionNumber) };
}
