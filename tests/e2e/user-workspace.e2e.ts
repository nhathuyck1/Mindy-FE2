import { expect, test } from '@playwright/test';
import { mockCommerce } from './commerce-fixtures';
import { testUser } from './api-fixtures';
const classId = '44444444-4444-4444-8444-444444444444';
const courseId = '33333333-3333-4333-8333-333333333333';
const mentor = { id: '55555555-5555-4555-8555-555555555555', displayName: 'Mentor Mindy' };
const myClass = {
  enrollmentId: '77777777-7777-4777-8777-777777777777',
  enrollmentStatus: 'ACTIVE',
  enrolledAt: '2026-10-10T00:00:00Z',
  createdAt: '2026-10-10T00:00:00Z',
  isHoldExpired: false,
  courseId,
  courseCode: 'WEB101',
  courseTitle: 'Khóa học Web cá nhân',
  courseImageUrl: null,
  classId,
  classCode: 'WEB-A',
  className: 'Lớp Web buổi tối',
  classStatus: 'IN_PROGRESS',
  deliveryMode: 'ONLINE',
  startDate: '2026-10-01',
  endDate: '2026-12-01',
  mentor,
  order: null,
  accessMode: 'FULL',
  accessReason: 'ACTIVE_ENROLLMENT',
  canViewClass: true,
  canViewSchedule: true,
};
async function fixture(page: import('@playwright/test').Page) {
  const state = await mockCommerce(page);
  state.hasOrder = true;
  await page.route('**/api/v1/me/classes?**', (route) =>
    route.fulfill({
      json: {
        items: [myClass],
        page: 1,
        pageSize: 10,
        total: 1,
        asOf: '2026-10-15T00:00:00Z',
      },
    }),
  );
  await page.route('**/api/v1/me/schedule?**', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const from = params.get('from')!;
    const to = params.get('to')!;
    const pageNumber = Number(params.get('page'));
    const start = new Date(new Date(from).getTime() + 86400000 + 19 * 3600000);
    const event = {
      sessionId:
        pageNumber === 1
          ? '88888888-8888-4888-8888-888888888888'
          : '99999999-9999-4999-8999-999999999999',
      sessionNumber: pageNumber,
      sessionTitle: pageNumber === 1 ? 'Thực hành Web' : 'Buổi đã hủy',
      sessionStatus: pageNumber === 1 ? 'SCHEDULED' : 'CANCELLED',
      startsAt: start.toISOString(),
      endsAt: new Date(start.getTime() + 7200000).toISOString(),
      dayOfWeek: 'Tuesday',
      startTime: '19:00',
      endTime: '21:00',
      roomName: null,
      classId,
      classCode: 'WEB-A',
      className: 'Lớp Web buổi tối',
      classStatus: 'IN_PROGRESS',
      courseId,
      courseTitle: 'Khóa học Web cá nhân',
      classUnitId: '66666666-6666-4666-8666-666666666666',
      unitTitle: 'Unit Web',
      deliveryMode: 'ONLINE',
      mentor,
      assignmentType: 'PRIMARY',
      enrollmentId: '77777777-7777-4777-8777-777777777777',
      attendanceStatus: pageNumber === 1 ? 'PRESENT' : 'ABSENT',
      attendanceApplicability: 'ELIGIBLE',
      attendanceExcluded: false,
      creditedAttendanceStatus: pageNumber === 1 ? 'PRESENT' : null,
      makeupForSessionId: null,
      makeupRootSessionId: null,
      sourceClassId: null,
      sourceSessionId: null,
      makeupPlacementId: null,
      accessMode: 'FULL',
    };
    const events: Record<string, unknown>[] = [event];
    if (pageNumber === 1) {
      events.push(
        {
          ...event,
          sessionTitle: 'Buổi học bù',
          mentor: null,
          assignmentType: 'SUBSTITUTE',
          attendanceStatus: 'UNMARKED',
          accessMode: 'SESSION_MAKEUP',
          makeupForSessionId: event.sessionId,
          makeupRootSessionId: event.sessionId,
          sourceClassId: classId,
          sourceSessionId: event.sessionId,
          makeupPlacementId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        },
        {
          ...event,
          sessionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab',
          sessionTitle: 'Chưa điểm danh',
          mentor: null,
          attendanceStatus: null,
        },
      );
    }
    return route.fulfill({
      json: {
        items: events,
        page: pageNumber,
        pageSize: 100,
        total: 101,
        timeZone: 'Asia/Ho_Chi_Minh',
        from,
        to,
        asOf: '2026-10-15T00:00:00Z',
      },
    });
  });
  return state;
}
test('Dropdown opens personal workspace, four navigation entries and collapsible/mobile sidebar', async ({
  page,
}, testInfo) => {
  await fixture(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Tài khoản của ' + testUser.displayName }).click();
  const dropdown = page.getByRole('region', { name: 'Thông tin tài khoản' });
  await expect(dropdown.getByRole('link', { name: 'Lịch học', exact: true })).toHaveAttribute(
    'href',
    '/user/schedule',
  );
  await dropdown.getByRole('link', { name: 'Thông tin cá nhân', exact: true }).click();
  await expect(page).toHaveURL('/user/profile');
  await expect(page.getByRole('heading', { name: 'Thông tin cá nhân', exact: true })).toBeVisible();
  await expect(page.getByRole('definition').filter({ hasText: testUser.email })).toBeVisible();
  if (testInfo.project.name === 'desktop') {
    await page.getByRole('button', { name: 'Thu gọn thanh điều hướng' }).click();
    await expect(page.getByRole('button', { name: 'Mở rộng thanh điều hướng' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await page.getByRole('button', { name: 'Mở rộng thanh điều hướng' }).click();
  } else {
    await page.getByRole('button', { name: 'Mở menu tài khoản', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Menu tài khoản' })).toBeVisible();
  }
  const nav = page
    .getByRole('navigation', { name: 'Điều hướng tài khoản' })
    .filter({ visible: true });
  for (const label of ['Thông tin cá nhân', 'Đơn hàng của tôi', 'Lịch học', 'Khóa học của tôi'])
    await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible();
  await nav.getByRole('link', { name: 'Khóa học của tôi', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Khóa học Web cá nhân' })).toBeVisible();
  await expect(page.getByText('Đang học', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('row').filter({ hasText: 'Khóa học Web cá nhân' }).getByRole('link', {
      name: 'Vào học',
    }),
  ).toHaveAttribute('href', `/user/materials/${classId}`);
  await page.screenshot({ path: testInfo.outputPath('user-courses.png'), fullPage: true });
});
test('Weekly schedule has Monday through Sunday columns, all API pages and week navigation', async ({
  page,
}, testInfo) => {
  await fixture(page);
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/user/schedule');
  await page.getByLabel('Chọn ngày xem lịch', { exact: true }).fill('2026-10-14');
  const table = page.getByRole('table');
  await expect(table.getByRole('columnheader')).toHaveCount(7);
  await expect(table.getByRole('columnheader').first()).toContainText('Thứ 2');
  await expect(table.getByRole('columnheader').last()).toContainText('Chủ nhật');
  await expect(table.getByRole('columnheader').first()).toContainText('12/10/2026');
  await expect(table.getByRole('article', { name: 'Thực hành Web' })).toContainText(
    '19:00 – 21:00',
  );
  await expect(table.getByRole('article', { name: 'Buổi đã hủy' })).toContainText('Đã hủy');
  await expect(table.getByRole('article', { name: 'Thực hành Web' })).toContainText(
    'Điểm danh: Có mặt',
  );
  await expect(table.getByRole('article', { name: 'Buổi đã hủy' })).toContainText(
    'Điểm danh: Vắng',
  );
  const makeup = table.getByRole('article', { name: 'Buổi học bù' });
  await expect(makeup).toContainText('Chưa xác định giảng viên');
  await expect(makeup).not.toContainText('Điểm danh:');
  await expect(table.getByRole('article', { name: 'Chưa điểm danh' })).not.toContainText(
    'Điểm danh:',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('user-schedule.png'), fullPage: true });
  await page.getByRole('button', { name: 'Tuần sau', exact: true }).click();
  await expect(table.getByRole('columnheader').first()).toContainText('19/10/2026');
  await page.getByRole('button', { name: 'Tuần trước', exact: true }).click();
  await expect(table.getByRole('columnheader').first()).toContainText('12/10/2026');
});
test('Orders use existing order API, preserve server statuses and show an empty result', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/user/orders');
  const orderRow = page.getByRole('row').filter({ hasText: 'MDTESTCHECKOUT' });
  await expect(orderRow).toBeVisible();
  await orderRow.getByRole('button', { name: 'Xem chi tiết', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Chi tiết đơn hàng' })).toContainText(
    'MDTESTCHECKOUT',
  );
  await expect(page.getByRole('link', { name: 'Xem trạng thái thanh toán' })).toHaveAttribute(
    'href',
    /checkout/,
  );
  await page.getByRole('button', { name: 'Đóng chi tiết' }).click();
  await page.route('**/api/v1/me/orders?**', (route) =>
    route.fulfill({ json: { items: [], page: 1, pageSize: 10, total: 0 } }),
  );
  await page.getByLabel('Trạng thái đơn hàng').selectOption('PAID');
  await expect(page.getByText('Chưa có đơn hàng phù hợp.')).toBeVisible();
});
test('Workspace blocks guests before any private data request and handles errors with retry', async ({
  page,
}) => {
  const state = await fixture(page);
  state.loggedIn = false;
  const requests: string[] = [];
  page.on('request', (request) => {
    if (
      request.url().includes('/api/v1/me/classes') ||
      request.url().includes('/api/v1/me/schedule')
    )
      requests.push(request.url());
  });
  await page.goto('/user/schedule');
  await expect(page).toHaveURL('/');
  expect(requests).toEqual([]);
  state.loggedIn = true;
  await page.route('**/api/v1/me/schedule?**', (route) =>
    route.fulfill({ status: 503, json: { code: 'API_UNAVAILABLE', message: 'Unavailable' } }),
  );
  await page.goto('/user/schedule');
  await expect(page.getByRole('alert').filter({ hasText: 'Chưa thể tải dữ liệu' })).toBeVisible();
  await page.route('**/api/v1/me/schedule?**', (route) => {
    const p = new URL(route.request().url()).searchParams;
    return route.fulfill({
      json: {
        items: [],
        page: 1,
        pageSize: 100,
        total: 0,
        from: p.get('from'),
        to: p.get('to'),
        timeZone: 'Asia/Ho_Chi_Minh',
        asOf: '2026-10-15T00:00:00Z',
      },
    });
  });
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByText('Tuần này bạn chưa có lịch học.')).toBeVisible();
});

test('Compact course rows open full details and restore focus on Escape at desktop and 320px', async ({
  page,
}, testInfo) => {
  await fixture(page);
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/user/courses');
  const row = page.getByRole('row').filter({ hasText: 'Khóa học Web cá nhân' });
  await expect(row).toBeVisible();
  expect((await row.boundingBox())!.height).toBeLessThan(110);
  await page.screenshot({ path: testInfo.outputPath('compact-courses.png'), fullPage: true });
  const trigger = row.getByRole('button', { name: 'Xem chi tiết', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Chi tiết khóa học của tôi', exact: true });
  await expect(dialog).toContainText('Mentor Mindy');
  await expect(dialog).toContainText('Lớp Web buổi tối');
  await expect(dialog.getByRole('link', { name: 'Thông tin khóa học' })).toHaveAttribute(
    'href',
    '/courses/' + courseId,
  );
  await expect(dialog.getByRole('link', { name: 'Xem lịch học' })).toHaveAttribute(
    'href',
    '/user/schedule',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('course-row-details.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('Course rows open only the class access granted by the API', async ({ page }) => {
  await fixture(page);
  await page.route('**/api/v1/me/classes?**', (route) =>
    route.fulfill({
      json: {
        items: [
          myClass,
          {
            ...myClass,
            enrollmentId: '77777777-7777-4777-8777-777777777778',
            courseId: '33333333-3333-4333-8333-333333333334',
            courseCode: 'WEB102',
            courseTitle: 'Khóa học xem trước',
            classId: '44444444-4444-4444-8444-444444444445',
            accessMode: 'CASH_PREVIEW',
          },
          {
            ...myClass,
            enrollmentId: '77777777-7777-4777-8777-777777777779',
            courseId: '33333333-3333-4333-8333-333333333335',
            courseCode: 'WEB103',
            courseTitle: 'Khóa học chưa cấp quyền',
            classId: '44444444-4444-4444-8444-444444444446',
            accessMode: 'NONE',
            canViewClass: false,
            canViewSchedule: false,
          },
        ],
        page: 1,
        pageSize: 10,
        total: 3,
        asOf: '2026-10-15T00:00:00Z',
      },
    }),
  );
  await page.goto('/user/courses');
  const full = page.getByRole('row').filter({ hasText: 'Khóa học Web cá nhân' });
  await expect(full.getByRole('link', { name: 'Vào học' })).toHaveAttribute(
    'href',
    `/user/materials/${classId}`,
  );
  const preview = page.getByRole('row').filter({ hasText: 'Khóa học xem trước' });
  await expect(preview.getByRole('link', { name: 'Xem trước chương' })).toHaveAttribute(
    'href',
    '/user/materials/44444444-4444-4444-8444-444444444445?preview=true',
  );
  const none = page.getByRole('row').filter({ hasText: 'Khóa học chưa cấp quyền' });
  await expect(none.getByRole('link', { name: 'Vào học' })).toHaveCount(0);
  await expect(none.getByRole('link', { name: 'Xem trước chương' })).toHaveCount(0);
  await expect(none.getByRole('button', { name: 'Xem chi tiết' })).toBeVisible();
});

test('Compact orders include details for CASH and PAYOS without initiating a payment', async ({
  page,
}, testInfo) => {
  const state = await fixture(page);
  const cash = {
    ...state.order,
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    orderCode: 'MDCASH',
    paymentType: 'CASH',
    status: 'EXPIRED',
  };
  await page.route('**/api/v1/me/orders?**', (route) =>
    route.fulfill({ json: { items: [state.order, cash], page: 1, pageSize: 10, total: 2 } }),
  );
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/user/orders');
  const row = page.getByRole('row').filter({ hasText: 'MDCASH' });
  await expect(row).toBeVisible();
  expect((await row.boundingBox())!.height).toBeLessThan(100);
  await page.screenshot({ path: testInfo.outputPath('compact-orders.png'), fullPage: true });
  const trigger = row.getByRole('button', { name: 'Xem chi tiết', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Chi tiết đơn hàng', exact: true });
  await expect(dialog).toContainText('MDCASH');
  await expect(dialog).toContainText('Tiền mặt');
  await expect(dialog).toContainText('Lập trình Web');
  await expect(dialog.getByRole('link', { name: 'Xem trạng thái thanh toán' })).toHaveCount(0);
  expect(state.creates).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('order-row-details.png') });
  await dialog.getByRole('button', { name: 'Đóng chi tiết' }).click();
  await expect(trigger).toBeFocused();
});

test('Schedule tiles stay compact and open full class/session details in a modal', async ({
  page,
}, testInfo) => {
  await fixture(page);
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/user/schedule');
  const tile = page.getByRole('article', { name: 'Thực hành Web', exact: true });
  await expect(tile).toBeVisible();
  await expect(tile).toContainText('Mentor Mindy');
  await expect(tile).toContainText('Online');
  await expect(tile).not.toContainText('Sắp diễn ra');
  await expect(tile).not.toContainText('Lớp Web buổi tối');
  expect((await tile.boundingBox())!.height).toBeLessThan(210);
  await page.screenshot({ path: testInfo.outputPath('compact-schedule.png'), fullPage: true });
  const trigger = tile.getByRole('button', { name: 'Xem chi tiết Thực hành Web', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Chi tiết lớp học', exact: true });
  await expect(dialog).toContainText('Lớp Web buổi tối');
  await expect(dialog).toContainText('Thực hành Web');
  await expect(dialog).toContainText('Mentor Mindy');
  await expect(dialog).toContainText('19:00');
  await expect(dialog).toContainText('21:00');
  await expect(dialog).toContainText('Điểm danh: Có mặt');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('schedule-class-details.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.getByRole('article', { name: 'Buổi đã hủy', exact: true }).getByRole('button').click();
  await expect(dialog).toContainText('Đã hủy');
});
