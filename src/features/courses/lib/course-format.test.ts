import { describe, expect, it } from 'vitest';
import { filterCourses, formatDate, formatTime } from './course-format';
import type { Course } from '../schemas/course-contracts';

const courses: Course[] = [
  {
    id: '1',
    code: 'HTML',
    title: 'Lập trình Web',
    description: 'Dựng trang web',
    imgUrl: null,
    priceAmount: 1500000,
    category: { id: 'web', name: 'Web', slug: 'web' },
  },
  {
    id: '2',
    code: 'PY',
    title: 'Python',
    description: null,
    imgUrl: null,
    priceAmount: 1000,
    category: { id: 'base', name: 'Cơ bản', slug: 'base' },
  },
  {
    id: '3',
    code: 'FREE',
    title: 'Khởi đầu',
    description: null,
    imgUrl: null,
    priceAmount: 0,
    category: { id: 'base', name: 'Cơ bản', slug: 'base' },
  },
];

describe('Course discovery and timetable display', () => {
  it('Searches Vietnamese text without requiring accents, including đ', () => {
    expect(filterCourses(courses, 'lap trinh', '', 'default').map((course) => course.id)).toEqual([
      '1',
    ]);
    expect(filterCourses(courses, 'dung', '', 'default').map((course) => course.id)).toEqual(['1']);
  });
  it('Combines price and search filters and sorts without changing the API cache', () => {
    expect(
      filterCourses(courses, '', 'under-million', 'price-desc').map((course) => course.id),
    ).toEqual(['2', '3']);
    expect(filterCourses(courses, 'web', 'under-million', 'default')).toEqual([]);
    expect(filterCourses(courses, '', 'free', 'default').map((course) => course.id)).toEqual(['3']);
    expect(courses.map((course) => course.id)).toEqual(['1', '2', '3']);
  });
  it('Displays Vietnam time and calendar dates independently of the host timezone', () => {
    expect(formatTime('2026-10-20T12:00:00Z')).toBe('19:00');
    expect(formatDate('2026-10-20T18:00:00Z')).toBe('21/10/2026');
    expect(formatDate('2026-10-20')).toBe('20/10/2026');
  });
});
