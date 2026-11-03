import { expect, test } from '@playwright/test';
import { mockAdminApi } from './admin-fixtures';

test('User search starts at two characters, debounces and searches beyond the current page', async ({
  page,
}) => {
  await mockAdminApi(page);
  const calls: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/admin/users') calls.push(url);
  });
  await page.goto('/admin/users');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(10);
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('member11@example.test');
  const clockTime = new Date('2026-11-03T00:00:00Z');
  await page.clock.install({ time: clockTime });
  await page.clock.pauseAt(new Date(clockTime.getTime() + 1000));
  calls.length = 0;
  const search = page.getByRole('textbox', { name: 'Tìm người dùng', exact: true });
  await search.fill('m');
  await page.clock.runFor(300);
  expect(calls).toHaveLength(0);
  await expect(page.getByText('Nhập ít nhất 2 ký tự để tìm người dùng.')).toBeVisible();
  await search.fill('me');
  await page.clock.runFor(249);
  expect(calls).toHaveLength(0);
  await page.clock.runFor(1);
  await expect.poll(() => calls.length).toBe(1);
  expect(calls[0]?.searchParams.get('q')).toBe('me');
  expect(calls[0]?.searchParams.get('page')).toBe('1');
  await search.fill('member');
  await page.clock.runFor(100);
  await search.fill('member23');
  await page.clock.runFor(250);
  await page.clock.resume();
  await expect(page.getByRole('table')).toContainText('member23@example.test');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  expect(calls.map((url) => url.searchParams.get('q'))).toEqual(['me', 'member23']);
  await search.fill('');
  await page.clock.runFor(250);
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(10);
  await expect(search).toHaveValue('');
});
