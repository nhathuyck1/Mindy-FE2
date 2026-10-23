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
  await page.route('**/api/v1/admin/tracking/events/**', (route) => {
    const parts = new URL(route.request().url()).pathname.split('/');
    const source = parts.at(-2);
    const id = parts.at(-1);
    return route.fulfill({
      json: {
        id,
        source,
        action: 'UPDATE',
        actor: { id: testUser.id, displayName: 'Quản trị Mindy' },
        entityType: 'attendance',
        entityId: testUser.id,
        classId: adminClasses[0].id,
        sessionId: null,
        version: 2,
        reason: 'Điều chỉnh sau khi xác minh',
        occurredAt: '2026-10-23T03:00:00Z',
        data: { oldStatus: 'UNMARKED', newStatus: 'PRESENT' },
        evidenceItems: [{ type: 'note', label: 'Biên bản xác nhận' }],
      },
    });
  });
  await page.route('**/api/v1/admin/tracking/events?**', (route) => {
    const url = new URL(route.request().url());
    const size = Number(url.searchParams.get('pageSize') ?? 20);
    const pageNumber = Number(url.searchParams.get('page') ?? 1);
    const filtered = Array.from({ length: 15 }, (_, index) => ({
      id: `55555555-5555-4555-8555-${String(index + 1).padStart(12, '0')}`,
      source: 'attendance_audits',
      action: index % 2 ? 'MARK' : 'UPDATE',
      actor: index % 3 ? { id: testUser.id, displayName: 'Quản trị Mindy' } : null,
      entityType: 'attendance',
      entityId: testUser.id,
      classId: adminClasses[0].id,
      sessionId: null,
      version: index + 1,
      reason: index % 2 ? null : 'Điều chỉnh sau khi xác minh',
      occurredAt: `2026-10-${String(23 - (index % 10)).padStart(2, '0')}T03:00:00Z`,
    }));
    const items =
      url.searchParams.get('source') && url.searchParams.get('source') !== 'attendance_audits'
        ? []
        : filtered;
    return route.fulfill({
      json: {
        items: items.slice((pageNumber - 1) * size, pageNumber * size),
        page: pageNumber,
        pageSize: size,
        total: items.length,
      },
    });
  });
  await page.route('**/api/v1/admin/payments/reconciliation?**', (route) => {
    const url = new URL(route.request().url());
    const size = Number(url.searchParams.get('pageSize') ?? 20);
    const pageNumber = Number(url.searchParams.get('page') ?? 1);
    const items = Array.from({ length: 12 }, (_, index) => ({
      id: `66666666-6666-4666-8666-${String(index + 1).padStart(12, '0')}`,
      paymentId: `77777777-7777-4777-8777-${String(index + 1).padStart(12, '0')}`,
      providerOrderCode: 1000000000 + index,
      referenceCode: `PAYOS-REF-${String(index + 1).padStart(3, '0')}`,
      amount: 1250000 + index,
      currency: 'VND',
      reason: index % 2 ? null : 'Webhook không khớp trạng thái',
      source: 'PAYOS_WEBHOOK',
      actorId: null,
      createdAt: '2026-10-23T03:00:00Z',
    }));
    return route.fulfill({
      json: {
        items: items.slice((pageNumber - 1) * size, pageNumber * size),
        page: pageNumber,
        pageSize: size,
        total: items.length,
      },
    });
  });
}
