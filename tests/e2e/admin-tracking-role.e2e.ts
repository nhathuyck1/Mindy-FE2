import { expect, test } from '@playwright/test';
import { adminUser, mockAdminApi } from './admin-fixtures';

test('Admin filters consolidated rule audits by actor role and clears pagination', async ({
  page,
  isMobile,
}, testInfo) => {
  await mockAdminApi(page);
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  const events = Array.from({ length: 22 }, (_, index) => ({
    id: `90000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    source: index % 2 ? 'attendance_audits' : 'system_rule_audits',
    action: 'UPDATE',
    actor: {
      id: adminUser.id,
      displayName: index % 2 ? 'Giảng viên Mai' : 'Admin An',
      role: index % 2 ? 'MENTOR' : 'ADMIN',
    },
    entityType: index % 2 ? 'attendance' : 'system_rule',
    entityId: null,
    classId: null,
    sessionId: null,
    version: index + 1,
    reason: index % 2 ? 'Điểm danh' : 'Demo giảng viên',
    occurredAt: '2026-11-09T03:00:00Z',
  }));
  const requests: URL[] = [];
  await page.route('**/api/v1/admin/tracking/events**', async (route) => {
    const url = new URL(route.request().url());
    if (/events\/[^/]+\//.test(url.pathname)) {
      const event = events.find((item) => item.id === url.pathname.split('/').at(-1));
      return route.fulfill({
        json: {
          ...event,
          data: { rule_key: 'session_start_time_enforced', old_value: true, new_value: false },
          evidenceItems: [],
        },
      });
    }
    requests.push(url);
    const role = url.searchParams.get('actorRole');
    const source = url.searchParams.get('source');
    const filtered = events.filter(
      (event) => (!role || event.actor.role === role) && (!source || event.source === source),
    );
    const pageNumber = Number(url.searchParams.get('page'));
    const pageSize = Number(url.searchParams.get('pageSize'));
    return route.fulfill({
      json: {
        items: filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
        total: filtered.length,
        page: pageNumber,
        pageSize,
      },
    });
  });
  await page.goto('/admin/tracking');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(20);
  await page.getByLabel('Số dòng mỗi trang').selectOption('10');
  await page.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.get('page')).toBe('2');
  await page.getByLabel('Vai trò người thực hiện').selectOption('ADMIN');
  await page.getByLabel('Nhóm hoạt động').selectOption('system_rule_audits');
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.get('actorRole')).toBe('ADMIN');
  expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
  await expect(page.getByRole('table')).toContainText('Cấu hình hệ thống');
  await expect(page.getByRole('table')).not.toContainText('Giảng viên Mai');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('tracking-role-filter.png'), fullPage: true });
  await page.getByRole('button', { name: 'Xem chi tiết' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Quản trị viên');
  await expect(dialog).toContainText('old_value');
  await expect(dialog).toContainText('new_value');
  await page.keyboard.press('Escape');
  await page.getByLabel('Vai trò người thực hiện').selectOption('MENTOR');
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect(page.getByText('Không có hoạt động phù hợp với bộ lọc.')).toBeVisible();
  await page.getByRole('button', { name: 'Xóa lọc', exact: true }).click();
  await expect(page.getByLabel('Vai trò người thực hiện')).toHaveValue('');
  await expect(page.getByLabel('Nhóm hoạt động')).toHaveValue('');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(10);
  expect(requests.at(-1)?.searchParams.has('actorRole')).toBe(false);
});
