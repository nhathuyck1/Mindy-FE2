import { apiRequest } from '@/lib/api/client';
import { scheduleSchema, type TeachingSession } from '../schemas/mentor-contracts';
import { shiftDate } from '../lib/weekly-timetable';

// A week is displayed as one calendar, so collect every API page before showing it.
export async function fetchMentorWeek(monday: string, signal: AbortSignal) {
  const items: TeachingSession[] = [];
  const ids = new Set<string>();
  let total: number | undefined;
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: '100',
      from: `${monday}T00:00:00+07:00`,
      to: `${shiftDate(monday, 7)}T00:00:00+07:00`,
    });
    const result = await apiRequest({
      path: `mentor/schedule?${query}`,
      schema: scheduleSchema,
      signal,
    });
    total ??= result.total;
    if (
      result.page !== page ||
      result.total !== total ||
      result.items.some((item) => ids.has(item.sessionId))
    )
      throw new Error('Lịch dạy vừa thay đổi. Vui lòng tải lại tuần để xem đầy đủ.');
    for (const item of result.items) {
      if (ids.has(item.sessionId))
        throw new Error('Lịch dạy vừa thay đổi. Vui lòng tải lại tuần để xem đầy đủ.');
      ids.add(item.sessionId);
      items.push(item);
    }
    if (items.length === total) return items;
    if (!result.items.length || items.length > total)
      throw new Error('Chưa thể tải đầy đủ lịch tuần. Vui lòng thử lại.');
  }
}
