import { expect, test, type Page } from '@playwright/test';
import { adminUser, mockAdminApi } from './admin-fixtures';

async function mockRules(page: Page, options: { conflict?: boolean; error?: boolean } = {}) {
  await mockAdminApi(page);
  let rule = {
    key: 'session_start_time_enforced',
    value: true,
    version: 1,
    updatedAt: '2026-11-09T03:00:00Z',
    updatedBy: null as string | null,
  };
  const writes: unknown[] = [];
  await page.route('**/api/v1/admin/system-rules**', async (route) => {
    if (options.error) return route.fulfill({ status: 500, json: { message: 'Unavailable' } });
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON();
      writes.push(body);
      if (options.conflict) {
        rule = { ...rule, version: 2 };
        return route.fulfill({ status: 409, json: { message: 'Version conflict' } });
      }
      rule = { ...rule, value: body.value, version: rule.version + 1, updatedBy: adminUser.id };
      return route.fulfill({ json: rule });
    }
    return route.fulfill({ json: [rule] });
  });
  return writes;
}

test('Admin toggles demo and restores the schedule with an audit reason', async ({
  page,
  isMobile,
}, info) => {
  const writes = await mockRules(page);
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/admin/settings');
  const toggle = page.getByRole('switch', { name: 'Chế độ demo' });
  await expect(toggle).not.toBeChecked();
  await expect(page.getByLabel('Lý do thay đổi')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('settings-default.png'), fullPage: true });
  await toggle.click();
  const save = page.getByRole('button', { name: 'Lưu thay đổi' });
  await expect(save).toBeDisabled();
  expect(writes).toHaveLength(0);
  await page.getByLabel('Lý do thay đổi').fill('Demo cho giảng viên');
  await save.click();
  await expect(toggle).toBeChecked();
  await expect(page.getByText('Demo đang bật cho tất cả lớp học.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Lý do thay đổi')).toHaveCount(0);
  expect(writes[0]).toEqual({ value: false, expectedVersion: 1, reason: 'Demo cho giảng viên' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('settings-demo.png'), fullPage: true });
  await toggle.click();
  await page.getByLabel('Lý do thay đổi').fill('Kết thúc demo');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(toggle).not.toBeChecked();
  await expect(page.getByText('Buổi học hiện bắt đầu theo lịch.', { exact: true })).toBeVisible();
  expect(writes[1]).toEqual({ value: true, expectedVersion: 2, reason: 'Kết thúc demo' });
});

test('Admin cancels a demo change without writing and can read the conditions', async ({
  page,
}, info) => {
  const writes = await mockRules(page);
  await page.goto('/admin/settings');
  const toggle = page.getByRole('switch', { name: 'Chế độ demo' });
  await toggle.focus();
  await page.keyboard.press('Space');
  await page.getByLabel('Lý do thay đổi').fill('Không lưu thay đổi này');
  await page.screenshot({ path: info.outputPath('settings-edit.png'), fullPage: true });
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(toggle).not.toBeChecked();
  await expect(page.getByLabel('Lý do thay đổi')).toHaveCount(0);
  expect(writes).toHaveLength(0);
  await page.getByText('Điều kiện và lưu ý', { exact: true }).click();
  await expect(
    page.getByText('Lớp vẫn cần ít nhất 3 học viên đã thanh toán và đang hoạt động.'),
  ).toBeVisible();
});

test('Admin sees a conflict without a false success and cancels the unsaved draft', async ({
  page,
}) => {
  const writes = await mockRules(page, { conflict: true });
  await page.goto('/admin/settings');
  await page.getByRole('switch', { name: 'Chế độ demo' }).click();
  await page.getByLabel('Lý do thay đổi').fill('Thử thay đổi cấu hình');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Cấu hình đã được người khác thay đổi',
  );
  await expect(page.getByText('Đã lưu thay đổi', { exact: true })).toHaveCount(0);
  expect(writes).toHaveLength(1);
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Chế độ demo' })).not.toBeChecked();
});

test('Unavailable system rules never expose a writable demo control', async ({ page }) => {
  await mockRules(page, { error: true });
  await page.goto('/admin/settings');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Chưa tải được cấu hình');
  await expect(page.getByRole('switch')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
});
