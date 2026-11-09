import { expect, test } from '@playwright/test';
import { adminUser, mockAdminApi } from './admin-fixtures';

test('Admin toggles the schedule rule for demo and restores it with an audit reason', async ({
  page,
  isMobile,
}, testInfo) => {
  await mockAdminApi(page);
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  let rule = {
    key: 'session_start_time_enforced',
    value: true,
    version: 1,
    updatedAt: '2026-11-09T03:00:00Z',
    updatedBy: null as string | null,
  };
  const writes: unknown[] = [];
  await page.route('**/api/v1/admin/system-rules**', async (route) => {
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON();
      writes.push(body);
      rule = { ...rule, value: body.value, version: rule.version + 1, updatedBy: adminUser.id };
      return route.fulfill({ json: rule });
    }
    return route.fulfill({ json: [rule] });
  });
  await page.goto('/admin/settings');
  await expect(page.getByRole('heading', { name: 'Cấu hình hệ thống' })).toBeVisible();
  const disable = page.getByRole('button', { name: 'Tắt rule để demo' });
  await expect(disable).toBeDisabled();
  await page.getByLabel('Lý do thay đổi').fill('Demo cho giảng viên');
  await disable.click();
  await expect(page.getByRole('button', { name: 'Bật lại rule theo lịch' })).toBeVisible();
  await expect(page.getByText('Chế độ demo đang áp dụng', { exact: false })).toBeVisible();
  expect(writes[0]).toEqual({ value: false, expectedVersion: 1, reason: 'Demo cho giảng viên' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('admin-system-rules-demo.png'),
    fullPage: true,
  });
  await page.getByLabel('Lý do thay đổi').fill('Kết thúc demo');
  await page.getByRole('button', { name: 'Bật lại rule theo lịch' }).click();
  await expect(page.getByText('Đang bật · Bắt đầu theo lịch học', { exact: true })).toBeVisible();
  expect(writes[1]).toEqual({ value: true, expectedVersion: 2, reason: 'Kết thúc demo' });
});
