import { expect, test, type Page } from '@playwright/test';
import { mockHomepageApi, testUser } from './api-fixtures';
import { dashboardFixture } from './dashboard-fixtures';

const classId = '44444444-4444-4444-8444-444444444444';
const person = { id: testUser.id, displayName: 'Giảng viên Minh' };
const base = {
  timeZone: 'Asia/Ho_Chi_Minh',
  generatedAt: '2026-11-06T16:58:00Z',
  from: '2026-11-01T00:00:00Z',
  to: '2026-11-07T00:00:00Z',
};
const sessions = [
  { date: '2026-11-05T16:59:00Z', title: 'Buổi hôm qua', status: 'COMPLETED' },
  { date: '2026-11-05T17:00:00Z', title: 'Buổi đầu ngày', status: 'COMPLETED' },
  { date: '2026-11-06T03:00:00Z', title: 'Buổi sáng hôm nay', status: 'SCHEDULED' },
  { date: '2026-11-06T16:59:00Z', title: 'Buổi cuối ngày', status: 'IN_PROGRESS' },
  { date: '2026-11-06T17:00:00Z', title: 'Buổi ngày mai', status: 'SCHEDULED' },
  { date: '2026-11-06T04:00:00Z', title: 'Buổi đã hủy', status: 'CANCELLED' },
].map((item, index) => ({
  sessionId: `66666666-6666-4666-8666-${String(index + 1).padStart(12, '0')}`,
  classId,
  classUnitId: '55555555-5555-4555-8555-555555555555',
  title: item.title,
  startsAt: item.date,
  endsAt: new Date(Date.parse(item.date) + 3600000).toISOString(),
  status: item.status,
  primaryMentor: person,
  effectiveMentor: person,
  assignmentType: 'PRIMARY',
  version: 1,
  actualStartedAt: null,
  actualEndedAt: null,
  editableUntil: null,
  asOf: base.generatedAt,
  timeZone: base.timeZone,
}));
async function mockOverview(
  page: Page,
  role: 'ADMIN' | 'MANAGER' | 'MENTOR' | 'STUDENT',
  options: { empty?: boolean; failure?: boolean } = {},
) {
  await mockHomepageApi(page);
  let failed = options.failure;
  const scheduleCalls: URL[] = [];
  await page.route('**/api/v1/**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/auth/me')) return route.fulfill({ json: { ...testUser, role } });
    if (url.pathname.endsWith('/dashboard'))
      return route.fulfill({
        json:
          role === 'ADMIN'
            ? dashboardFixture()
            : role === 'MANAGER'
              ? {
                  ...base,
                  scope: 'MANAGER',
                  summary: {
                    collectedAmount: '0',
                    paidOrders: 0,
                    pendingAmount: '0',
                    pendingOrders: 0,
                  },
                  paymentMethods: [],
                  courses: [],
                  classes: [],
                  trend: [],
                  reconciliation: [],
                  openingAlerts: [],
                }
              : {
                  ...base,
                  scope: 'MENTOR',
                  summary: {
                    primaryClasses: 1,
                    students: 10,
                    assignedSessions: 6,
                    substituteSessions: 0,
                    completedSessions: 2,
                    actualTeachingHours: 2,
                  },
                  upcoming: [],
                  leaveRequests: [],
                },
      });
    if (url.pathname.endsWith('/schedule')) {
      scheduleCalls.push(url);
      if (failed) {
        failed = false;
        return route.fulfill({ status: 503, json: { code: 'UNAVAILABLE', message: 'Try again' } });
      }
      const pageNumber = Number(url.searchParams.get('page'));
      const items = options.empty
        ? []
        : role === 'MENTOR'
          ? sessions
          : sessions.map((item, index) => ({
              sessionId: item.sessionId,
              sessionNumber: index + 1,
              sessionTitle: item.title,
              sessionStatus: item.status,
              startsAt: item.startsAt,
              endsAt: item.endsAt,
              dayOfWeek: 'Friday',
              startTime: '10:00',
              endTime: '11:00',
              roomName: null,
              classId,
              classCode: 'WEB-K01',
              className: 'Lớp Web',
              classStatus: 'IN_PROGRESS',
              courseId: classId,
              courseTitle: 'Web',
              classUnitId: item.classUnitId,
              unitTitle: 'Chương 1',
              deliveryMode: 'ONLINE',
              mentor: person,
              assignmentType: 'PRIMARY',
              enrollmentId: testUser.id,
              attendanceStatus: null,
              attendanceApplicability: 'NOT_STARTED',
              attendanceExcluded: false,
              creditedAttendanceStatus: null,
              makeupForSessionId: null,
              makeupRootSessionId: null,
              sourceClassId: null,
              sourceSessionId: null,
              makeupPlacementId: null,
              accessMode: 'FULL',
            }));
      return route.fulfill({
        json: {
          items: items.slice((pageNumber - 1) * 2, pageNumber * 2),
          total: items.length,
          page: pageNumber,
          pageSize: 2,
          asOf: base.generatedAt,
          timeZone: base.timeZone,
          from: url.searchParams.get('from'),
          to: url.searchParams.get('to'),
        },
      });
    }
    return route.fulfill({
      json: { items: [], total: 0, page: 1, pageSize: 20, asOf: base.generatedAt },
    });
  });
  return scheduleCalls;
}

for (const role of ['ADMIN', 'MANAGER', 'MENTOR', 'STUDENT'] as const) {
  test(`${role} navigation starts with overview and keeps personal links last`, async ({
    page,
    isMobile,
  }) => {
    await mockOverview(page, role, { empty: true });
    const route =
      role === 'STUDENT'
        ? '/user'
        : role === 'MENTOR'
          ? '/mentor/dashboard'
          : `/${role.toLowerCase()}`;
    await page.goto(route);
    if (isMobile)
      await page
        .getByRole('button', {
          name:
            role === 'STUDENT'
              ? 'Mở menu tài khoản'
              : role === 'ADMIN'
                ? 'Mở menu quản trị'
                : `Mở menu ${role === 'MENTOR' ? 'Mentor' : 'Manager'}`,
          exact: true,
        })
        .click();
    const nav = page
      .getByRole('navigation', {
        name:
          role === 'STUDENT'
            ? 'Điều hướng tài khoản'
            : role === 'ADMIN'
              ? 'Điều hướng quản trị'
              : `Điều hướng ${role === 'MENTOR' ? 'Mentor' : 'Manager'}`,
        exact: true,
      })
      .filter({ visible: true });
    await expect(nav.getByRole('link').first()).toHaveText('Tổng quan');
    if (role === 'STUDENT' || role === 'MENTOR') {
      const names = await nav.getByRole('link').allTextContents();
      const personal = names.indexOf('Thông tin cá nhân'),
        messages = names.indexOf('Tin nhắn');
      expect(messages).toBeGreaterThan(1);
      expect(personal).toBe(messages + 1);
      if (role === 'STUDENT') {
        await nav.getByRole('link', { name: 'Thông tin cá nhân', exact: true }).click();
        await expect(
          page.getByRole('heading', { name: 'Thông tin cá nhân', exact: true }),
        ).toBeVisible();
        if (isMobile)
          await page.getByRole('button', { name: 'Mở menu tài khoản', exact: true }).click();
        const selected = page
          .getByRole('navigation', { name: 'Điều hướng tài khoản' })
          .locator('[aria-current="page"]');
        await expect(selected).toHaveCount(1);
        await expect(selected).toHaveText('Thông tin cá nhân');
      }
    }
  });
}

for (const role of ['MENTOR', 'STUDENT'] as const) {
  test(`${role} overview shows only today in Vietnam, including completed lessons, and changes at midnight`, async ({
    page,
    isMobile,
  }, info) => {
    await page.clock.install({ time: new Date('2026-11-06T16:58:00Z') });
    if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
    const calls = await mockOverview(page, role);
    await page.goto(role === 'MENTOR' ? '/mentor/dashboard' : '/user');
    const today = page.getByRole('region', { name: 'Lịch hôm nay', exact: true });
    await expect(today.getByText('Buổi đầu ngày', { exact: true })).toBeVisible();
    await expect(today.getByText('Buổi sáng hôm nay', { exact: true })).toBeVisible();
    await expect(today.getByText('Buổi cuối ngày', { exact: true })).toBeVisible();
    await expect(today.getByRole('listitem')).toHaveCount(3);
    for (const title of ['Buổi hôm qua', 'Buổi ngày mai', 'Buổi đã hủy'])
      await expect(today.getByText(title, { exact: true })).toHaveCount(0);
    if (role === 'MENTOR')
      await expect(today.getByRole('link', { name: /Buổi đầu ngày/ })).toHaveAttribute(
        'href',
        `/mentor/sessions/${sessions[1].sessionId}`,
      );
    expect(calls.length).toBe(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath(`today-${role}.png`),
      animations: 'disabled',
      fullPage: true,
    });
    await page.clock.fastForward(120100);
    await expect(today.getByText('07/11/2026', { exact: true })).toBeVisible();
    await expect(today.getByRole('listitem')).toHaveCount(1);
    await expect(today.getByText('Buổi ngày mai', { exact: true })).toBeVisible();
    if (role === 'STUDENT')
      expect(calls.at(-1)?.searchParams.get('from')).toBe('2026-11-07T00:00:00+07:00');
  });

  test(`${role} today's schedule distinguishes failure from an empty day`, async ({ page }) => {
    await mockOverview(page, role, { empty: true, failure: true });
    await page.goto(role === 'MENTOR' ? '/mentor/dashboard' : '/user');
    const today = page.getByRole('region', { name: 'Lịch hôm nay', exact: true });
    await expect(today.getByRole('alert')).toContainText('Chưa tải được lịch hôm nay.');
    await today.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await expect(today.getByRole('status')).toContainText('Hôm nay không có buổi');
  });
}
