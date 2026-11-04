import { test, expect } from '@playwright/test';
import { mockManagerLeave } from './manager-leave-fixtures';
test('live manager read-only screens and material filter regressions', async ({ page }, info) => {
  test.skip(!process.env.MINDY_QA_PASSWORD, 'Requires user-provided credentials');
  await page.goto('/admin/login?returnTo=%2Fmanager');
  await page.getByLabel('Email', { exact: true }).fill(process.env.MINDY_QA_EMAIL!);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.MINDY_QA_PASSWORD!);
  const loginResponse = page.waitForResponse((r) => r.url().endsWith('/api/v1/auth/login'));
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  const loginResult = await loginResponse;
  const loginBody = await loginResult.json();
  console.log('LIVE_LOGIN', JSON.stringify({ status: loginResult.status(), code: loginBody.code }));
  expect(loginResult.status()).toBe(200);
  await expect(page).toHaveURL(/\/manager$/, { timeout: 25000 });
  await expect(page.getByRole('heading', { name: 'Tổng quan Manager', exact: true })).toBeVisible();
  await expect(page.getByText('Đang tải dữ liệu…', { exact: true })).toHaveCount(0, {
    timeout: 25000,
  });
  await page.screenshot({
    path: `docs/qa/manager-2026-11-04/live-overview-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto('/manager/materials?view=inventory&reviewStatus=PENDING_REVIEW');
  const status = page.getByLabel('Trạng thái duyệt', { exact: true });
  await expect(status).toHaveValue('PENDING_REVIEW');
  await status.selectOption('REJECTED');
  await expect(page).toHaveURL(/reviewStatus=REJECTED/);
  await expect(status).toHaveValue('PENDING_REVIEW');
  console.log('MANAGER-01 reproduced: REJECTED URL displays PENDING_REVIEW filter');
  await expect(page.getByText('Đang tải dữ liệu…', { exact: true })).toHaveCount(0, {
    timeout: 25000,
  });
  await page.screenshot({
    path: `docs/qa/manager-2026-11-04/rejected-filter-${info.project.name}.png`,
    fullPage: true,
  });
  await status.selectOption('');
  await expect(page).toHaveURL(/\?view=inventory$/);
  await expect(status).toHaveValue('PENDING_REVIEW');
  console.log('MANAGER-01 reproduced: All status falls back to PENDING_REVIEW');
  const type = page.getByLabel('Loại tài liệu', { exact: true });
  await type.selectOption('FILE');
  await expect(type).toHaveValue('FILE');
  await page.reload();
  await expect(type).toHaveValue('');
  console.log('MANAGER-02 reproduced: FILE filter is lost on reload');
  await page.screenshot({
    path: `docs/qa/manager-2026-11-04/type-filter-reset-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto('/manager/collections');
  await expect(page.getByRole('heading', { name: 'Thu tiền', exact: true })).toBeVisible();
  await page.screenshot({
    path: `docs/qa/manager-2026-11-04/live-collections-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto('/manager/leave-requests');
  await expect(
    page.getByRole('heading', { name: 'Đơn xin nghỉ mentor', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `docs/qa/manager-2026-11-04/live-leaves-${info.project.name}.png`,
    fullPage: true,
  });
});

test('MANAGER-03 full-day student conflicts still expose approval confirmation', async ({
  page,
}, info) => {
  await page.clock.setFixedTime(new Date('2026-10-23T03:00:00Z'));
  await mockManagerLeave(page);
  await page.goto('/manager/leave-requests/77777777-7777-4777-8777-777777777777');
  await expect(page.getByRole('region', { name: 'Xung đột lịch học viên' })).toContainText(
    'Nguyễn Học Viên',
  );
  const approve = page.getByRole('button', { name: 'Duyệt đơn', exact: true });
  await expect(approve).toBeEnabled();
  await approve.click();
  const dialog = page.getByRole('dialog', { name: 'Xác nhận duyệt đơn' });
  await dialog.getByRole('checkbox', { name: 'Xác nhận đã xem xung đột lịch học viên' }).check();
  await dialog.getByLabel('Lý do xử lý').fill('Kiểm tra giao diện bằng fixture');
  await expect(dialog.getByRole('button', { name: 'Xác nhận duyệt', exact: true })).toBeEnabled();
  await page.screenshot({
    path: `docs/qa/manager-2026-11-04/full-day-conflict-approval-${info.project.name}.png`,
    fullPage: true,
  });
  console.log('MANAGER-03 reproduced with fixtures: full-day conflict still allows approval');
});
