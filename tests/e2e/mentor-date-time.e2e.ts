import { expect, test } from '@playwright/test';
import { mockMentor, mentorIds } from './mentor-fixtures';

test('mentor cannot create a chapter with a past availability or a time that elapsed while editing', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-22T03:00:30Z'));
  const { calls } = await mockMentor(page);
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Thêm nội dung', exact: true }).click();
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Chương có hẹn giờ');
  await page.getByLabel('Nội dung bài viết', { exact: true }).fill('Nội dung thử nghiệm');
  const date = page.getByLabel('Khả dụng từ (UTC+7)', { exact: true });
  await expect(date).toHaveAttribute('min', '2026-10-22T10:01');
  await date.fill('2026-10-21T10:00');
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
  expect(await date.evaluate((node: HTMLInputElement) => node.validity.rangeUnderflow)).toBe(true);
  expect(
    calls.filter((call) => call.method === 'POST' && call.path.endsWith('/materials')),
  ).toHaveLength(0);
  await date.fill('2026-10-22T10:02');
  await page.clock.setFixedTime(new Date('2026-10-22T03:03:30Z'));
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Thời gian khả dụng không được ở trong quá khứ' }),
  ).toBeVisible();
  expect(
    calls.filter((call) => call.method === 'POST' && call.path.endsWith('/materials')),
  ).toHaveLength(0);
  await expect(date).toHaveAttribute('min', '2026-10-22T10:04');
  await date.fill('2026-10-22T10:04');
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Chương có hẹn giờ', exact: true })).toBeVisible();
  expect(
    calls.find((call) => call.method === 'POST' && call.path.endsWith('/materials'))?.body
      ?.availableAt,
  ).toBe('2026-10-22T10:04:00+07:00');
});
