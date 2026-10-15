import { expect, test } from '@playwright/test';
import { adminUsers, mockAdminApi } from './admin-fixtures';

test('Overview charts use every page and allow changing the month range', async ({
  page,
}, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-10-15T12:00:00Z'));
  await mockAdminApi(page);
  const users = Array.from({ length: 101 }, (_, index) => ({
    ...adminUsers[0],
    id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    createdAt: index ? '2026-10-15T00:00:00Z' : '2026-09-30T10:00:00Z',
  }));
  const pages: number[] = [];
  await page.route('**/api/v1/admin/users?**', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const current = Number(params.get('page'));
    const size = Number(params.get('pageSize'));
    pages.push(current);
    return route.fulfill({
      json: {
        items: users.slice((current - 1) * size, current * size),
        page: current,
        pageSize: size,
        total: users.length,
      },
    });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/admin');
  await expect(page.getByLabel('Tổng người dùng: 101', { exact: true })).toBeVisible();
  expect(pages).toEqual([1, 2]);
  await expect(page.locator('[data-slot="chart"] svg.recharts-surface')).toHaveCount(6);
  await page.getByText('Xem số liệu theo tháng', { exact: true }).click();
  const values = page.getByLabel('Số liệu hoạt động theo tháng');
  await expect(values).toContainText('100 người dùng · 2 lớp học');
  await expect(values).toContainText('1 người dùng · 0 lớp học');
  await page.getByRole('combobox', { name: 'Khoảng thời gian biểu đồ' }).selectOption('3');
  await expect(values.locator('dt')).toHaveCount(3);
  await page.getByRole('combobox', { name: 'Khoảng thời gian biểu đồ' }).selectOption('12');
  await expect(values.locator('dt')).toHaveCount(12);
  await page.getByText('Xem số liệu trạng thái', { exact: true }).click();
  await expect(page.getByText('Đang tuyển sinh & đang học', { exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('overview-charts.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('Overview shows retry on failed data rather than a zero count', async ({ page }) => {
  await mockAdminApi(page);
  let failed = true;
  await page.route('**/api/v1/admin/users?**', (route) =>
    failed ? route.fulfill({ status: 503, json: { message: 'Unavailable' } }) : route.fallback(),
  );
  await page.goto('/admin');
  const card = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole('heading', { name: 'Tổng người dùng', exact: true }) });
  await expect(card).toContainText('Chưa tải được số liệu');
  await expect(page.getByLabel('Tổng người dùng: 0', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('alert').first()).toContainText('Chưa thể tải dữ liệu');
  failed = false;
  await card.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByLabel('Tổng người dùng: 23', { exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="chart"] svg.recharts-surface')).toHaveCount(6);
});

test('Empty overview keeps real zero values and descriptive chart empty states', async ({
  page,
}) => {
  await mockAdminApi(page);
  await page.route('**/api/v1/admin/*?**', (route) => {
    const params = new URL(route.request().url()).searchParams;
    return route.fulfill({
      json: { items: [], page: 1, pageSize: Number(params.get('pageSize')), total: 0 },
    });
  });
  await page.goto('/admin');
  await expect(page.getByLabel('Tổng người dùng: 0', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Tổng khóa học: 0', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Tổng lớp học: 0', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Đang tuyển sinh: 0', { exact: true })).toBeVisible();
  await expect(page.getByText('Chưa có hoạt động mới trong khoảng thời gian này.')).toBeVisible();
  await expect(page.getByText('Chưa có người dùng.', { exact: true })).toBeVisible();
  await expect(page.getByText('Chưa có khóa học.', { exact: true })).toBeVisible();
  await expect(page.getByText('Chưa có lớp học.', { exact: true })).toBeVisible();
});
