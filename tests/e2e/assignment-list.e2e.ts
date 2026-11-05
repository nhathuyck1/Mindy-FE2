import { expect, test } from '@playwright/test';
import { mockAssignments } from './assignment-fixtures';
import { assignment, ids, pageOf } from '../fixtures/assignment-data';

test('assignment rows show the matching session and Vietnam deadlines', async ({ page }, info) => {
  await page.clock.install({ time: new Date('2026-11-05T03:00:00Z') });
  await mockAssignments(page);
  const items = [
    { ...assignment, status: 'PUBLISHED', dueAt: '2026-11-05T03:30:00Z' },
    {
      ...assignment,
      id: ids.question,
      status: 'PUBLISHED',
      title: 'Thực hành biến và toán tử',
      type: 'ZIP',
      dueAt: '2026-11-04T11:00:00Z',
    },
    {
      ...assignment,
      id: ids.file,
      sessionId: ids.file,
      status: 'PUBLISHED',
      title: 'Bài luyện tập tự chọn',
      dueAt: null,
    },
    {
      ...assignment,
      id: ids.submission,
      status: 'ARCHIVED',
      title: 'Bài ôn tập đã lưu trữ',
      dueAt: '2026-11-04T11:00:00Z',
    },
  ];
  await page.route('**/api/v1/me/classes/*/assignments?*', (route) =>
    route.fulfill({ json: pageOf(items) }),
  );
  await page.goto(`/user/classes/${ids.class}/assignments`);
  const list = page.getByRole('region', { name: 'Bài tập', exact: true });
  const row = list.getByRole('listitem').filter({ hasText: assignment.title });
  await expect(row.getByText('Buổi 1', { exact: true })).toBeVisible();
  await expect(row.getByText('Chương 1', { exact: true })).toBeVisible();
  await expect(row.locator(`time[datetime="2026-11-02T03:00:00.000Z"]`)).toContainText('10:00');
  await expect(row.locator(`time[datetime="2026-11-05T03:30:00Z"]`)).toContainText('10:30');
  await expect(row.getByText('Còn 30 phút', { exact: true })).toBeVisible();
  await expect(list.getByText('Đã qua hạn', { exact: true })).toHaveCount(1);
  const unlimited = list.getByRole('listitem').filter({ hasText: 'Bài luyện tập tự chọn' });
  await expect(unlimited.getByText('Không giới hạn', { exact: true })).toBeVisible();
  await expect(unlimited.getByText('Chưa có thông tin buổi học', { exact: true })).toBeVisible();
  await expect(list.getByText('Đã lưu trữ', { exact: true })).toBeVisible();
  await expect(row.getByRole('link')).toHaveAttribute(
    'href',
    `/user/assignments/${ids.assignment}?classId=${ids.class}`,
  );
  await page.screenshot({ path: info.outputPath('assignment-list.png'), fullPage: true });
  await page.clock.fastForward(31 * 60_000);
  await expect(row.getByText('Đã qua hạn', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('assignment-list-320.png'), fullPage: true });
});

test('session details can be retried without hiding assignments', async ({ page }) => {
  await mockAssignments(page);
  let failed = true;
  await page.route(`**/api/v1/me/classes/${ids.class}`, (route) =>
    failed ? route.fulfill({ status: 503, json: { message: 'Unavailable' } }) : route.fallback(),
  );
  await page.goto(`/user/classes/${ids.class}/assignments`);
  await expect(page.getByRole('heading', { name: assignment.title, exact: true })).toBeVisible();
  await expect(page.getByText('Chưa tải được thông tin buổi học.')).toBeVisible();
  failed = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByText('Chương 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Buổi học', exact: true })).toBeEnabled();
});
