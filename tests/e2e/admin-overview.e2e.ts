import { expect, test } from '@playwright/test';
import { testUser } from './api-fixtures';
import { dashboardFixture } from './dashboard-fixtures';

for (const audience of ['admin', 'manager', 'mentor'] as const) {
  test(`${audience} analytics filters, ranking and responsive layout`, async ({ page }, info) => {
    const calls: string[] = [];
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/v1/**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/auth/me'))
        return route.fulfill({ json: { ...testUser, role: audience.toUpperCase() } });
      if (url.pathname.endsWith('/dashboard')) {
        calls.push(`${route.request().method()} ${url.pathname}${url.search}`);
        return route.fulfill({
          json: dashboardFixture(audience.toUpperCase() as 'ADMIN' | 'MANAGER' | 'MENTOR'),
        });
      }
      return route.fulfill({ json: { items: [], page: 1, pageSize: 20, total: 0 } });
    });
    await page.goto(audience === 'mentor' ? '/mentor/dashboard' : `/${audience}`);
    const dashboard = page.getByRole('region', { name: 'Dashboard đào tạo', exact: true });
    await expect(dashboard.getByText('Chỉ tính đăng ký đã xác nhận', { exact: false })).toHaveCount(
      0,
    );
    if (audience === 'manager') {
      await expect(
        dashboard.getByRole('heading', { name: 'Khóa học được đăng ký nhiều nhất' }),
      ).toHaveCount(0);
      await expect(
        dashboard.getByRole('heading', { name: 'Mentor có nhiều học viên nhất' }),
      ).toHaveCount(0);
      await expect(dashboard.locator('svg.recharts-surface')).toHaveCount(2);
    } else {
      await expect(
        dashboard.getByRole('heading', { name: 'Khóa học được đăng ký nhiều nhất' }),
      ).toBeVisible();
      await expect(dashboard.locator('svg.recharts-surface')).toHaveCount(4);
      await dashboard
        .getByRole('region', { name: 'Khóa học được đăng ký nhiều nhất', exact: true })
        .getByText('Xem bảng xếp hạng')
        .click();
      await expect(dashboard.getByText('24 lượt đăng ký', { exact: true }).first()).toBeVisible();
      await expect(
        dashboard.getByRole('heading', {
          name: audience === 'mentor' ? 'So sánh các lớp của tôi' : 'Mentor có nhiều học viên nhất',
        }),
      ).toBeVisible();
    }
    if (audience === 'mentor') await expect(dashboard.getByText('Mentor Minh')).toHaveCount(0);
    await dashboard.getByRole('combobox', { name: 'Khoảng thời gian đăng ký' }).selectOption('30');
    await expect.poll(() => calls.at(-1)).toContain('days=30');
    await dashboard.getByRole('combobox', { name: 'Khoảng thời gian đăng ký' }).selectOption('365');
    await expect.poll(() => calls.at(-1)).toContain('days=365');
    await dashboard.getByText('Xem số liệu theo ngày').click();
    await expect(dashboard.getByRole('table')).toContainText('2026-11-03');
    await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1440, height: 950 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`dashboard-${audience}.png`), fullPage: true });
    expect(errors).toEqual([]);
    expect(calls.every((call) => call.startsWith(`GET /api/v1/${audience}/dashboard?`))).toBe(true);
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
