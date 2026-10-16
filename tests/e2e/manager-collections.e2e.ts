import { expect, test } from '@playwright/test';
import { mockCollections, cashIds } from './manager-collections-fixtures';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-16T03:00:00Z'));
});

test('cash collection uses server orders, filters, pagination and page CSV', async ({
  page,
}, info) => {
  const { calls } = await mockCollections(page);
  await page.goto('/manager/collections');
  await expect(page.getByRole('heading', { name: 'Thu tiền', exact: true })).toBeVisible();
  await expect(page.getByText('Chế độ cục bộ', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('table').getByRole('rowheader')).toHaveCount(20);
  await expect(page.getByRole('row', { name: /CASH-001/ })).toContainText('Nguyễn An');
  expect(
    calls
      .filter((call) => call.path === 'manager/orders')
      .every((call) => new URLSearchParams(call.search).get('paymentType') === 'CASH'),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/manager-cash-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole('navigation', { name: 'Phân trang đơn thu tiền' })
    .getByRole('button', { name: 'Sau', exact: true })
    .click();
  await expect(page.getByRole('table').getByRole('rowheader')).toHaveCount(1);
  await page.getByLabel('Trạng thái đơn thu tiền').selectOption('PAID');
  await expect(page.getByRole('row', { name: /CASH-022/ })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Phân trang đơn thu tiền' })).toContainText(
    'Trang 1/1',
  );
  await page.getByLabel('Trạng thái đơn thu tiền').selectOption('');
  await page.getByLabel('Tìm theo mã đơn').fill('CASH-001');
  await page.getByRole('button', { name: 'Tìm đơn', exact: true }).click();
  await expect(page.getByRole('table').getByRole('rowheader')).toHaveCount(1);
  await page.getByLabel('Lọc đơn theo lớp').selectOption(cashIds.class);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất trang CSV', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('mindy-don-tien-mat-trang-1.csv');
  expect(
    calls.some(
      (call) =>
        new URLSearchParams(call.search).get('classId') === cashIds.class &&
        new URLSearchParams(call.search).get('orderCode') === 'CASH-001',
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('manager confirms the full multi-class order only after checking received cash', async ({
  page,
}, info) => {
  const fixture = await mockCollections(page);
  await page.goto('/manager/collections');
  await page
    .getByRole('row', { name: /CASH-001/ })
    .getByRole('button', { name: 'Xem đơn' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Chi tiết & thu tiền', exact: true });
  await expect(dialog.getByText('Toàn bộ 2 lớp trong đơn')).toBeVisible();
  await expect(dialog.getByText('REACT101-B', { exact: true })).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Xác nhận đã thu tiền', exact: true }),
  ).toBeDisabled();
  await page.getByLabel('Tiền đã nhận (VND)').fill('1000000');
  await page.getByRole('checkbox').check();
  await expect(
    dialog.getByRole('button', { name: 'Xác nhận đã thu tiền', exact: true }),
  ).toBeDisabled();
  expect(fixture.confirmed()).toBe(0);
  await page.getByLabel('Tiền đã nhận (VND)').fill('3000000');
  await page.screenshot({
    path: `test-results/manager-cash-confirm-${info.project.name}.png`,
    fullPage: true,
  });
  await dialog.getByRole('button', { name: 'Xác nhận đã thu tiền', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const success = page.getByRole('dialog', { name: 'Đã thu tiền thành công', exact: true });
  await expect(success).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(success).toContainText('CASH-001');
  await expect(success).toContainText('3.000.000');
  await expect(
    dialog.getByRole('button', { name: 'Xác nhận đã thu tiền', exact: true }),
  ).toHaveCount(0);
  expect(fixture.confirmed()).toBe(1);
  expect(fixture.calls.find((call) => call.method === 'POST')?.body).toEqual({
    receivedAmount: 3000000,
  });
  await page.screenshot({
    path: `test-results/manager-cash-success-${info.project.name}.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await success.getByRole('button', { name: 'Hoàn tất', exact: true }).click();
  await expect(success).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Làm mới', exact: true })).toBeFocused();
  await expect(page.getByRole('row', { name: /CASH-001/ })).toHaveCount(0);
  await page.getByLabel('Trạng thái đơn thu tiền').selectOption('PAID');
  await page
    .getByRole('row', { name: /CASH-001/ })
    .getByRole('button', { name: 'Xem đơn' })
    .click();
  await expect(dialog.getByText('Quản lý Minh', { exact: true })).toBeVisible();
  await expect(success).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('closed orders, permission revocation and conflicts never auto-confirm or retry', async ({
  page,
}) => {
  const fixture = await mockCollections(page, { conflict: true });
  await page.goto('/manager/collections');
  await page
    .getByRole('row', { name: /CASH-001/ })
    .getByRole('button', { name: 'Xem đơn' })
    .click();
  await page.getByLabel('Tiền đã nhận (VND)').fill('3000000');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Xác nhận đã thu tiền', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Đơn không thể xác nhận');
  await expect(
    page.getByRole('dialog', { name: 'Đã thu tiền thành công', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Xác nhận đã thu tiền', exact: true }),
  ).toBeDisabled();
  expect(fixture.confirmed()).toBe(1);
  await page.unrouteAll({ behavior: 'wait' });
  const expired = await mockCollections(page, { expired: true });
  await page.goto('/manager/collections');
  await page
    .getByRole('row', { name: /CASH-001/ })
    .getByRole('button', { name: 'Xem đơn' })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Đơn đã quá hạn thu tiền');
  await expect(page.getByRole('button', { name: 'Xác nhận đã thu tiền', exact: true })).toHaveCount(
    0,
  );
  expect(expired.confirmed()).toBe(0);
});

test('a lost confirmation response is resolved by reading the order without repeating collection', async ({
  page,
}) => {
  const fixture = await mockCollections(page, { lostResponse: true });
  await page.goto('/manager/collections');
  await page
    .getByRole('row', { name: /CASH-001/ })
    .getByRole('button', { name: 'Xem đơn' })
    .click();
  await page.getByLabel('Tiền đã nhận (VND)').fill('3000000');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Xác nhận đã thu tiền', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Chưa xác định');
  await expect(
    page.getByRole('dialog', { name: 'Đã thu tiền thành công', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('dialog').getByText('Đơn hàng đã được thanh toán.', { exact: true }),
  ).toBeVisible();
  expect(fixture.confirmed()).toBe(1);
  expect(
    fixture.calls.filter((call) => call.path === `manager/orders/${cashIds.order}`).length,
  ).toBeGreaterThan(1);
});

test('only active managers can use collection and a denied command stops the form', async ({
  page,
}) => {
  await mockCollections(page, { role: 'STUDENT' });
  await page.goto('/manager/collections');
  await expect(
    page.getByRole('heading', { name: 'Tài khoản chưa có quyền Manager' }),
  ).toBeVisible();
  await page.unrouteAll({ behavior: 'wait' });
  const fixture = await mockCollections(page, { denied: true });
  await page.goto('/manager/collections');
  await page
    .getByRole('row', { name: /CASH-001/ })
    .getByRole('button', { name: 'Xem đơn' })
    .click();
  await page.getByLabel('Tiền đã nhận (VND)').fill('3000000');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Xác nhận đã thu tiền', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'quyền thu tiền đã thay đổi',
  );
  await expect(
    page.getByRole('button', { name: 'Xác nhận đã thu tiền', exact: true }),
  ).toBeDisabled();
  expect(fixture.confirmed()).toBe(1);
});
