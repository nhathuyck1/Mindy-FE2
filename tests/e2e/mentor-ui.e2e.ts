import { expect, test } from '@playwright/test';
import { mockMentorWorkspace } from './mentor-workspace-fixtures';

test('leave creation focuses on three steps and keeps the list separate', async ({
  page,
}, info) => {
  await mockMentorWorkspace(page);
  await page.clock.setFixedTime(new Date('2026-10-22T03:00:00Z'));
  await page.goto('/mentor/leave-requests');
  await expect(page.getByRole('heading', { name: 'Bạn chưa có đơn xin nghỉ' })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo đơn xin nghỉ', exact: true }).click();
  const steps = page.getByRole('list', { name: 'Các bước tạo đơn' });
  await expect(steps.locator('[aria-current="step"]')).toContainText('Khoảng nghỉ');
  await expect(page.getByRole('heading', { name: 'Bạn chưa có đơn xin nghỉ' })).toHaveCount(0);
  await page.getByLabel('Nghỉ từ ngày').fill('2026-10-26');
  await page.getByLabel('Nghỉ đến ngày').fill('2026-10-26');
  await page.getByRole('button', { name: 'Kiểm tra lịch dạy' }).click();
  await expect(steps.locator('[aria-current="step"]')).toContainText('Lịch dạy bù');
  await page.getByLabel('Ngày dạy bù', { exact: true }).fill('2026-10-28');
  await page.getByRole('button', { name: 'Tìm giờ phù hợp' }).click();
  await page.getByRole('radio').check();
  await expect(steps.locator('[aria-current="step"]')).toContainText('Gửi đơn');
  await page.getByLabel('Lý do xin nghỉ').fill('Xin nghỉ để giải quyết việc gia đình.');
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1440, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: `test-results/mentor-leave-steps-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Gửi đơn xin nghỉ', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Chi tiết đơn xin nghỉ' })).toBeVisible();
  await page.screenshot({
    path: `test-results/mentor-leave-detail-${info.project.name}.png`,
    fullPage: true,
  });
});
