import { expect, test } from '@playwright/test';
import { mockMentorWorkspace } from './mentor-workspace-fixtures';
import { mentorIds } from './mentor-fixtures';

test('session design keeps scheduled roster read only and tools usable at desktop and 320px', async ({
  page,
}, info) => {
  await page.clock.setFixedTime(new Date('2026-10-22T03:00:00Z'));
  const { calls, session } = await mockMentorWorkspace(page);
  session.title = 'Tuần 4 · Buổi 1: React Router và gọi API';
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 780 });
  else await page.setViewportSize({ width: 1600, height: 1000 });
  await page.route('**/api/v1/mentor/class-sessions/*/assignments?**', (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 1, pageSize: 50 } }),
  );
  await page.goto('/mentor/sessions/' + mentorIds.session);
  const preview = page.getByRole('region', { name: 'Danh sách học viên dự kiến' });
  await expect(preview).toContainText('Học viên An');
  await expect(preview).toContainText('Học viên học bù');
  await expect(page.getByText('Chỉ bắt đầu được trong ngày học.', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Hiện không thể sửa điểm danh.', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Danh sách dự kiến:', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Có mặt:/ })).toHaveCount(0);
  const tools = page.getByRole('complementary', { name: 'Công cụ buổi học' });
  await expect(tools.getByRole('link', { name: 'Mở bảng vẽ', exact: true })).toHaveAttribute(
    'href',
    '/whiteboards/' + mentorIds.session + '?audience=mentor',
  );
  await expect(tools.getByRole('link', { name: 'Vào phòng học', exact: true })).toHaveAttribute(
    'href',
    'https://meet.example.test/old',
  );
  expect(calls.every((call) => call.method === 'GET')).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('mentor-session-scheduled.png'), fullPage: true });
  await tools.getByRole('button', { name: 'Sửa link buổi học', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Sửa link buổi học', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Bắt đầu buổi', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Có mặt: Học viên An', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('mentor-session-started.png'), fullPage: true });
});
