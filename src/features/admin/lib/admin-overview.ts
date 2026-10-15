import type { AdminClass, AdminCourse } from '../schemas/admin-contracts';

type CreatedRecord = { createdAt: string };

const monthFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
});

export function vietnamMonth(value: string | Date) {
  const parts = monthFormatter.formatToParts(new Date(value));
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}`;
}

export function monthlyActivity(
  users: readonly CreatedRecord[],
  classes: readonly CreatedRecord[],
  months: number,
  now: Date,
) {
  const [year, month] = vietnamMonth(now).split('-').map(Number);
  const buckets = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(year, month - months + index, 1));
    return {
      key: date.toISOString().slice(0, 7),
      label: `T${date.getUTCMonth() + 1}/${String(date.getUTCFullYear()).slice(2)}`,
      users: 0,
      classes: 0,
    };
  });
  for (const [key, records] of [
    ['users', users],
    ['classes', classes],
  ] as const) {
    for (const record of records) {
      const bucket = buckets.find((item) => item.key === vietnamMonth(record.createdAt));
      if (bucket && new Date(record.createdAt) <= now) bucket[key]++;
    }
  }
  return buckets;
}

export function countValues<T>(records: readonly T[], value: (record: T) => string) {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = value(record);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function coursesByClassCount(
  courses: readonly AdminCourse[],
  classes: readonly AdminClass[],
) {
  const counts = countValues(classes, (item) => item.courseId);
  return courses
    .map((course) => ({ ...course, classCount: counts.get(course.id) ?? 0 }))
    .sort((a, b) => b.classCount - a.classCount || a.title.localeCompare(b.title, 'vi'))
    .slice(0, 4);
}
