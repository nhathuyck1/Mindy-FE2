import type { Course } from '../schemas/course-contracts';

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
export const formatTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
export const formatWeekday = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: 'Asia/Ho_Chi_Minh' }).format(
    new Date(value),
  );
export const deliveryLabel = (mode: 'ONLINE' | 'OFFLINE') =>
  mode === 'ONLINE' ? 'Trực tuyến' : 'Tại trung tâm';
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi');

export type PriceFilter = '' | 'free' | 'under-million' | 'from-million';
export type CourseSort = 'default' | 'price-asc' | 'price-desc' | 'title';

export function filterCourses(
  courses: Course[],
  search: string,
  price: PriceFilter,
  sort: CourseSort,
) {
  const term = normalize(search.trim());
  const result = courses.filter(
    (course) =>
      normalize(`${course.title} ${course.code} ${course.description ?? ''}`).includes(term) &&
      (price !== 'free' || course.priceAmount === 0) &&
      (price !== 'under-million' || course.priceAmount < 1_000_000) &&
      (price !== 'from-million' || course.priceAmount >= 1_000_000),
  );
  if (sort === 'price-asc') result.sort((a, b) => a.priceAmount - b.priceAmount);
  if (sort === 'price-desc') result.sort((a, b) => b.priceAmount - a.priceAmount);
  if (sort === 'title') result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
  return result;
}
