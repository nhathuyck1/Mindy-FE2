import { test, expect } from '@playwright/test';
import { mockAdminApi, adminUsers } from '../../../tests/e2e/admin-fixtures';

test('Admin live screens and filter persistence', async ({ page }, info) => {
  test.skip(!process.env.MINDY_QA_PASSWORD, 'Requires QA credentials');
  await page.goto('/admin/login?returnTo=%2Fadmin');
  await page.getByLabel('Email', { exact: true }).fill(process.env.MINDY_QA_EMAIL!);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.MINDY_QA_PASSWORD!);
  const pending = page.waitForResponse((r) => r.url().endsWith('/api/v1/auth/login'));
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  const response = await pending;
  console.log('LIVE_LOGIN_STATUS', response.status());
  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(/\/admin$/, { timeout: 25000 });
  for (const route of ['users', 'courses', 'classes', 'tracking', 'payments/reconciliation']) {
    await page.goto('/admin/' + route);
    await expect(page.locator('main h1')).toBeVisible();
    await page.screenshot({
      path: `docs/qa/admin-2026-11-04/live-${route.replaceAll('/', '-')}-${info.project.name}.png`,
      fullPage: true,
    });
  }
  await page.goto('/admin/users');
  const role = page.getByLabel('Tất cả vai trò', { exact: true });
  await role.selectOption('MENTOR');
  await expect(role).toHaveValue('MENTOR');
  await page.reload();
  await expect(role).toHaveValue('');
  console.log('ADMIN-01 reproduced live: MENTOR role filter resets on reload');
  await page.screenshot({
    path: `docs/qa/admin-2026-11-04/users-filter-reset-${info.project.name}.png`,
    fullPage: true,
  });
});

test('ADMIN-02 current page is not corrected when the active-user total shrinks', async ({
  page,
}, info) => {
  await mockAdminApi(page);
  let shrinking = false;
  const users = adminUsers.slice(0, 21).map((u) => ({ ...u, status: 'ACTIVE' }));
  await page.route('**/api/v1/admin/users?**', (route) => {
    const q = new URL(route.request().url()).searchParams;
    const number = Number(q.get('page') ?? 1),
      size = Number(q.get('pageSize') ?? 10);
    const current = shrinking ? users.slice(0, 20) : users;
    return route.fulfill({
      json: {
        items: current.slice((number - 1) * size, number * size),
        page: number,
        pageSize: size,
        total: current.length,
      },
    });
  });
  await page.goto('/admin/users');
  await page.getByRole('button', { name: 'Hoạt động', exact: true }).click();
  await expect(page.getByText('1 / 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByText('2 / 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByText('3 / 3', { exact: true })).toBeVisible();
  shrinking = true;
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  await expect(page.getByText('3 / 2', { exact: true })).toBeVisible();
  await expect(page.getByText('Không có kết quả phù hợp', { exact: true })).toBeVisible();
  await page.screenshot({
    path: `docs/qa/admin-2026-11-04/page-out-of-range-${info.project.name}.png`,
    fullPage: true,
  });
  console.log('ADMIN-02 reproduced: 20 matching users but empty page 3 / 2');
});
