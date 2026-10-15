import type { Page } from '@playwright/test';
import { testUser } from './api-fixtures';

export const adminUser = {
  ...testUser,
  role: 'ADMIN',
  displayName: 'Quản trị Mindy',
  email: 'admin@example.test',
};
export const adminUsers = Array.from({ length: 23 }, (_, index) => ({
  ...testUser,
  id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  displayName:
    [
      'Nguyễn An',
      'Trần Minh Anh',
      'Lê Hoàng Nam',
      'Phạm Thảo Nguyên',
      'Đỗ Bảo Châu',
      'Vũ Đức Minh',
      'Nguyễn Hà Linh',
      'Bùi Quốc Huy',
      'Trịnh Ngọc Mai',
      'Hoàng Gia Bảo',
    ][index % 10] + (index >= 10 ? ` ${index + 1}` : ''),
  email: `member${index + 1}@example.test`,
  phone: index % 3 ? '0901234567' : null,
  role: ['STUDENT', 'MENTOR', 'MANAGER', 'STUDENT'][index % 4],
  status: ['ACTIVE', 'ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'][index % 4],
}));
const category = { id: '22222222-2222-4222-8222-222222222222', name: 'Lập trình Web', slug: 'web' };
export const adminCourses = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    code: 'WEB101',
    title: 'Lập trình Web với HTML & CSS',
    description: 'Khóa học dành cho người mới bắt đầu.',
    imgUrl: null,
    category,
    priceAmount: 2500000,
    isActive: true,
    createdAt: testUser.createdAt,
    updatedAt: testUser.createdAt,
  },
  {
    id: '33333333-3333-4333-8333-333333333334',
    code: 'JS101',
    title: 'JavaScript căn bản',
    description: null,
    imgUrl: null,
    category,
    priceAmount: 3000000,
    isActive: false,
    createdAt: testUser.createdAt,
    updatedAt: testUser.createdAt,
  },
];
export const adminClasses = [
  {
    id: '44444444-4444-4444-8444-444444444444',
    courseId: adminCourses[0].id,
    code: 'WEB101-2026A',
    name: 'HTML & CSS — Lớp tháng 10',
    startDate: '2026-10-20',
    endDate: '2026-12-20',
    deliveryMode: 'ONLINE',
    maxStudents: 20,
    availableSeats: 8,
    mentor: { id: testUser.id, displayName: 'Trần Minh Anh' },
    status: 'OPEN',
    assignmentVersion: 1,
    createdAt: testUser.createdAt,
    updatedAt: testUser.createdAt,
  },
  {
    id: '44444444-4444-4444-8444-444444444445',
    courseId: adminCourses[1].id,
    code: 'JS101-2026B',
    name: 'JavaScript — Lớp tháng 11',
    startDate: '2026-11-01',
    endDate: '2026-12-30',
    deliveryMode: 'OFFLINE',
    maxStudents: 15,
    availableSeats: 15,
    mentor: { id: testUser.id, displayName: 'Lê Hoàng Nam' },
    status: 'DRAFT',
    assignmentVersion: 1,
    createdAt: testUser.createdAt,
    updatedAt: testUser.createdAt,
  },
];

export async function mockAdminApi(page: Page) {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: adminUser }));
  await page.route('**/api/v1/admin/classes/*', (route) => {
    const id = new URL(route.request().url()).pathname.split('/').at(-1);
    const item = adminClasses.find((candidate) => candidate.id === id);
    return item
      ? route.fulfill({ json: { ...item, meetingUrl: null, units: [] } })
      : route.fulfill({ status: 404, json: { code: 'NOT_FOUND', message: 'Not found' } });
  });
  await page.route('**/api/v1/admin/*?**', (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams;
    let items;
    if (url.pathname.endsWith('/users'))
      items = adminUsers.filter(
        (item) =>
          (!query.get('role') || item.role === query.get('role')) &&
          (!query.get('status') || item.status === query.get('status')),
      );
    else if (url.pathname.endsWith('/courses'))
      items = adminCourses.filter(
        (item) => !query.has('isActive') || String(item.isActive) === query.get('isActive'),
      );
    else
      items = adminClasses.filter(
        (item) =>
          (!query.get('status') || item.status === query.get('status')) &&
          (!query.get('deliveryMode') || item.deliveryMode === query.get('deliveryMode')),
      );
    const current = Number(query.get('page') ?? 1);
    const size = Number(query.get('pageSize') ?? 10);
    return route.fulfill({
      json: {
        items: items.slice((current - 1) * size, current * size),
        page: current,
        pageSize: size,
        total: items.length,
      },
    });
  });
}
