import { expect, test } from '@playwright/test';
import { testUser } from './api-fixtures';
import { dashboardFixture } from './dashboard-fixtures';

for (const audience of ['admin', 'manager', 'mentor'] as const) {
  test(audience + ' analytics filters and responsive layout', async ({ page }, info) => {
    const calls: string[] = [];
    const base = {
      scope: audience.toUpperCase(),
      timeZone: 'Asia/Ho_Chi_Minh',
      generatedAt: '2026-11-03T10:00:00Z',
      from: '2026-08-05T17:00:00Z',
      to: '2026-11-03T10:00:00Z',
    };
    const manager = {
      ...base,
      summary: {
        collectedAmount: '1200000',
        paidOrders: 2,
        pendingAmount: '500000',
        pendingOrders: 1,
      },
      paymentMethods: [{ id: 'CASH', name: 'CASH', amount: '1200000', orders: 2 }],
      courses: [{ id: 'course', name: 'ReactJS thực chiến', amount: '1200000', orders: 2 }],
      classes: [{ id: 'class', name: 'React K01', amount: '1200000', orders: 2 }],
      trend: [{ date: '2026-11-03', amount: '1200000', orders: 2 }],
      reconciliation: [],
      openingAlerts: [],
    };
    const mentor = {
      ...base,
      summary: {
        primaryClasses: 2,
        students: 12,
        assignedSessions: 8,
        substituteSessions: 2,
        completedSessions: 6,
        actualTeachingHours: 9,
      },
      upcoming: [],
      leaveRequests: [
        { status: 'APPROVED', count: 2 },
        { status: 'PENDING', count: 1 },
      ],
    };
    await page.route('**/api/v1/**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/auth/me'))
        return route.fulfill({ json: { ...testUser, role: audience.toUpperCase() } });
      if (url.pathname.endsWith('/dashboard')) {
        calls.push(url.search);
        return route.fulfill({
          json:
            audience === 'admin' ? dashboardFixture() : audience === 'manager' ? manager : mentor,
        });
      }
      if (audience === 'manager' && url.pathname.endsWith('/manager/materials')) {
        const status = url.searchParams.get('reviewStatus');
        return route.fulfill({
          json: {
            items: [],
            page: 1,
            pageSize: Number(url.searchParams.get('pageSize') ?? 20),
            total: status === 'PENDING_REVIEW' ? 1 : status === 'APPROVED' ? 25 : 0,
          },
        });
      }
      return route.fulfill({
        json: { items: [], page: 1, pageSize: 20, total: 0, asOf: base.generatedAt },
      });
    });
    await page.goto(audience === 'mentor' ? '/mentor/dashboard' : '/' + audience);
    const dashboard = page.getByRole('region', {
      name: audience === 'admin' ? 'Dashboard đào tạo' : 'Dashboard theo vai trò',
      exact: true,
    });
    await expect(dashboard).toBeVisible();
    if (audience === 'manager') {
      const materials = page.getByRole('region', { name: 'Thống kê tài liệu', exact: true });
      await expect(materials.getByRole('link')).toHaveCount(3);
      await expect(
        materials.getByRole('link', { name: 'Chờ duyệt: 1', exact: true }),
      ).toHaveAttribute('href', '/manager/materials?view=inventory&reviewStatus=PENDING_REVIEW');
      await expect(
        materials.getByRole('link', { name: 'Đã duyệt: 25', exact: true }),
      ).toBeVisible();
      await expect(materials.getByRole('link', { name: 'Bản nháp: 0', exact: true })).toBeVisible();
      await expect(page.getByText('Mở danh sách lọc', { exact: true })).toHaveCount(0);
      await expect(dashboard.getByText('Thực thu', { exact: true }).first()).toBeVisible();
      await expect(dashboard.getByText('1.200.000', { exact: false }).first()).toBeVisible();
      for (const name of [
        'Biểu đồ thực thu theo ngày',
        'Biểu đồ theo phương thức',
        'Biểu đồ theo khóa học',
        'Biểu đồ theo lớp',
      ]) {
        await expect(dashboard.locator(`[aria-label="${name}"] .recharts-surface`)).toBeVisible();
      }
      const course = dashboard.getByRole('region', { name: 'Theo khóa học', exact: true });
      await course.getByText('Xem số liệu chi tiết', { exact: true }).click();
      await expect(
        course.getByRole('cell', { name: 'ReactJS thực chiến', exact: true }),
      ).toBeVisible();
    } else if (audience === 'mentor') {
      await expect(dashboard.getByText('Giờ dạy thực tế', { exact: true })).toBeVisible();
      await expect(dashboard.getByText('Thực thu', { exact: true })).toHaveCount(0);
      await expect(
        dashboard.locator('[aria-label="Biểu đồ số buổi giảng dạy"] .recharts-surface'),
      ).toBeVisible();
      await expect(
        dashboard.locator('[aria-label="Biểu đồ trạng thái đơn nghỉ"] .recharts-surface'),
      ).toBeVisible();
    } else
      await expect(
        dashboard.getByRole('heading', { name: 'Khóa học được đăng ký nhiều nhất' }),
      ).toBeVisible();
    const filter = dashboard.getByRole('combobox', {
      name: audience === 'admin' ? 'Khoảng thời gian đăng ký' : 'Khoảng thời gian',
      exact: true,
    });
    await filter.selectOption('30');
    await expect.poll(() => calls.at(-1)).toContain('days=30');
    await filter.selectOption('365');
    await expect.poll(() => calls.at(-1)).toContain('days=365');
    await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1440, height: 950 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath('dashboard-' + audience + '.png'),
      fullPage: true,
    });
  });
}

test('failed dashboard shows retry without fabricated zeros and recovers', async ({ page }) => {
  let failed = true;
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ json: { ...testUser, role: 'ADMIN' } }),
  );
  await page.route('**/api/v1/admin/dashboard?**', (route) =>
    failed
      ? route.fulfill({ status: 503, json: { message: 'Unavailable' } })
      : route.fulfill({ json: dashboardFixture() }),
  );
  await page.goto('/admin');
  await expect(
    page.getByRole('region', { name: 'Dashboard đào tạo' }).getByRole('alert'),
  ).toContainText('Chưa tải được dashboard');
  await expect(page.getByRole('heading', { name: 'Học viên riêng biệt', exact: true })).toHaveCount(
    0,
  );
  failed = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Học viên riêng biệt', exact: true }),
  ).toBeVisible();
});

test('empty dashboard shows real zeros and a descriptive empty state', async ({ page }) => {
  const data = dashboardFixture();
  data.summary = {
    courses: 0,
    classes: 0,
    openClasses: 0,
    activeClasses: 0,
    registrations: 0,
    students: 0,
  };
  data.courses = [];
  data.mentors = [];
  data.classes = [];
  data.trend = [{ date: '2026-11-03', registrations: 0 }];
  data.classStatuses = [];
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ json: { ...testUser, role: 'ADMIN' } }),
  );
  await page.route('**/api/v1/admin/dashboard?**', (route) => route.fulfill({ json: data }));
  await page.goto('/admin');
  await expect(
    page.getByText('Chưa có đăng ký đã xác nhận trong khoảng thời gian này.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByText('Chưa có dữ liệu để so sánh.', { exact: true })).toHaveCount(2);
});
