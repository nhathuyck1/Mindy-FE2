import { expect, test } from '@playwright/test';
import { mockMentor, mentorIds } from './mentor-fixtures';

test('mentor cannot create a chapter with a past availability or a time that elapsed while editing', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-22T03:00:30Z'));
  const { calls } = await mockMentor(page);
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Tạo chương', exact: true }).click();
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

test('mentor access scheduling rejects past times across Vietnam midnight and rechecks on save', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-22T16:59:30Z'));
  const { calls } = await mockMentor(page);
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Quyền truy cập', exact: true }).click();
  await page.getByLabel('Hẹn giờ mở').check();
  const date = page.getByLabel('Thời điểm mở (UTC+7)', { exact: true });
  await expect(date).toHaveAttribute('min', '2026-10-23T00:00');
  await date.fill('2026-10-22T23:59');
  await page.getByRole('button', { name: 'Lưu quyền truy cập', exact: true }).click();
  expect(await date.evaluate((node: HTMLInputElement) => node.validity.rangeUnderflow)).toBe(true);
  expect(calls.filter((call) => call.path.endsWith('/release'))).toHaveLength(0);
  await date.fill('2026-10-23T00:01');
  await page.clock.setFixedTime(new Date('2026-10-22T17:02:10Z'));
  await page.getByRole('button', { name: 'Lưu quyền truy cập', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Thời điểm mở không được ở trong quá khứ' }),
  ).toBeVisible();
  expect(calls.filter((call) => call.path.endsWith('/release'))).toHaveLength(0);
  await expect(date).toHaveAttribute('min', '2026-10-23T00:03');
  await date.fill('2026-10-23T00:03');
  await page.getByRole('button', { name: 'Lưu quyền truy cập', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(calls.find((call) => call.path.endsWith('/release'))?.body).toEqual({
    status: 'LOCKED',
    unlockAt: '2026-10-23T00:03:00+07:00',
  });
});
