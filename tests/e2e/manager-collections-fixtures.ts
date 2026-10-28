import type { Page } from '@playwright/test';
import { testUser } from './api-fixtures';

export const cashIds = {
  order: '44444444-4444-4444-8444-444444444444',
  class: '55555555-5555-4555-8555-555555555555',
  secondClass: '66666666-6666-4666-8666-666666666666',
  payment: '77777777-7777-4777-8777-777777777777',
};
const date = '2026-10-16T03:00:00Z';
export async function mockCollections(
  page: Page,
  options: {
    conflict?: boolean;
    lostResponse?: boolean;
    denied?: boolean;
    expired?: boolean;
    role?: string;
  } = {},
) {
  const calls: { path: string; search: string; method: string; body: unknown }[] = [];
  const details = [
    {
      id: cashIds.class,
      classId: cashIds.class,
      courseTitle: 'JavaScript',
      className: 'JS101-A',
      priceAmount: 1000000,
      quantity: 1,
      totalAmount: 1000000,
    },
    {
      id: cashIds.secondClass,
      classId: cashIds.secondClass,
      courseTitle: 'React',
      className: 'REACT101-B',
      priceAmount: 2000000,
      quantity: 1,
      totalAmount: 2000000,
    },
  ];
  const rows = Array.from({ length: 23 }, (_, index) => ({
    id: index === 0 ? cashIds.order : `40000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    orderCode: `CASH-${String(index + 1).padStart(3, '0')}`,
    paymentType: 'CASH',
    status: index === 21 ? 'PAID' : index === 22 ? 'EXPIRED' : 'PENDING',
    totalAmount: index === 0 ? 3000000 : 1000000,
    expiresAt: options.expired || index === 22 ? '2026-10-15T03:00:00Z' : '2026-10-17T03:00:00Z',
    paidAt: index === 21 ? date : (null as string | null),
    createdAt: '2026-10-15T03:00:00Z',
    mentorId: null,
    details: index === 0 ? details : details.slice(0, 1),
    student: { id: testUser.id, displayName: index === 0 ? 'Nguyễn An' : `Học viên ${index + 1}` },
    payment: null as null | {
      id: string;
      orderId: string;
      amount: number;
      status: string;
      paidAt: string;
      confirmedBy: { id: string; displayName: string; source: string };
      review: null;
    },
  }));
  let confirmed = 0;
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1/', '');
    const method = request.method();
    calls.push({
      path,
      search: url.search,
      method,
      body: request.postData() ? request.postDataJSON() : null,
    });
    if (path === 'auth/me')
      return route.fulfill({
        json: { ...testUser, role: options.role ?? 'MANAGER', displayName: 'Quản lý Minh' },
      });
    if (path === 'manager/classes')
      return route.fulfill({
        json: {
          items: [
            {
              id: cashIds.class,
              courseId: cashIds.payment,
              code: 'JS101-A',
              name: 'JavaScript tháng 10',
              startDate: '2026-10-01',
              endDate: '2026-12-01',
              deliveryMode: 'ONLINE',
              maxStudents: 20,
              availableSeats: 10,
              mentor: { id: testUser.id, displayName: 'Mentor Minh' },
              status: 'IN_PROGRESS',
              assignmentType: 'PRIMARY',
              accessScope: 'CLASS',
            },
          ],
          page: 1,
          pageSize: 100,
          total: 1,
        },
      });
    if (path === 'manager/orders') {
      const matching = rows.filter(
        (order) =>
          (!url.searchParams.get('status') || order.status === url.searchParams.get('status')) &&
          (!url.searchParams.get('orderCode') ||
            order.orderCode === url.searchParams.get('orderCode')) &&
          (!url.searchParams.get('classId') ||
            order.details.some((detail) => detail.classId === url.searchParams.get('classId'))),
      );
      const pageNumber = Number(url.searchParams.get('page') ?? 1);
      const size = Number(url.searchParams.get('pageSize') ?? 20);
      return route.fulfill({
        json: {
          items: matching.slice((pageNumber - 1) * size, pageNumber * size),
          total: matching.length,
          page: pageNumber,
          pageSize: size,
        },
      });
    }
    if (path.startsWith('manager/orders/')) {
      const order = rows.find((order) => order.id === path.split('/')[2]);
      return order
        ? route.fulfill({ json: order })
        : route.fulfill({ status: 404, json: { code: 'ORDER_NOT_FOUND', message: 'Missing' } });
    }
    if (path === `manager/cash-orders/${cashIds.order}/confirm` && method === 'POST') {
      confirmed++;
      if (options.denied)
        return route.fulfill({
          status: 403,
          json: { code: 'ORDER_ACCESS_DENIED', message: 'Denied' },
        });
      if (options.conflict)
        return route.fulfill({
          status: 409,
          json: { code: 'CASH_ORDER_CLOSED', message: 'Closed' },
        });
      rows[0].status = 'PAID';
      rows[0].paidAt = date;
      rows[0].payment = {
        id: cashIds.payment,
        orderId: cashIds.order,
        amount: 3000000,
        status: 'SUCCEEDED',
        paidAt: date,
        confirmedBy: { id: testUser.id, displayName: 'Quản lý Minh', source: 'MANAGER' },
        review: null,
      };
      if (options.lostResponse) return route.abort('failed');
      return route.fulfill({ json: rows[0] });
    }
    return route.fulfill({ status: 404, json: { code: 'NOT_FOUND', message: path } });
  });
  return { calls, confirmed: () => confirmed };
}
