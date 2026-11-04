import { expect, test } from '@playwright/test';
import { mockCommerce, orderId } from './commerce-fixtures';

test('Student confirms cancellation in checkout; QR disappears and status survives reload', async ({
  page,
}, testInfo) => {
  const state = await mockCommerce(page);
  state.hasOrder = true;
  state.order.payment = state.payment;
  await page.goto(`/checkout/${orderId}`);
  await page.getByRole('button', { name: 'Hủy đơn hàng', exact: true }).click();
  expect(state.cancellations).toBe(0);
  await page.getByRole('button', { name: 'Giữ đơn hàng' }).click();
  expect(state.cancellations).toBe(0);
  await page.getByRole('button', { name: 'Hủy đơn hàng', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('cancel-confirmation.png'), fullPage: true });
  await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).dblclick();
  await expect(page.getByText('Đơn hàng đã hủy', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toHaveCount(0);
  await expect(page.locator('svg title')).toHaveCount(0);
  expect(state.cancellations).toBe(1);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Hủy đơn hàng', exact: true })).toHaveCount(0);
});

test('Student can cancel from order detail and pending orders in cart', async ({ page }) => {
  const state = await mockCommerce(page);
  state.hasOrder = true;
  await page.goto('/user/orders');
  await page.getByRole('button', { name: 'Xem chi tiết' }).click();
  const detail = page.getByRole('dialog');
  await detail.getByRole('button', { name: 'Hủy đơn hàng', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Hủy đơn hàng?' })
    .getByRole('button', { name: 'Xác nhận hủy', exact: true })
    .click();
  await expect(detail.getByText('Đã hủy', { exact: true })).toBeVisible();
  await detail.getByRole('button', { name: 'Đóng chi tiết' }).click();
  await expect(page.getByRole('button', { name: 'Hủy đơn hàng', exact: true })).toHaveCount(0);
  state.order.status = 'PENDING';
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Hủy đơn hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đơn đang chờ thanh toán' })).toHaveCount(0);
  expect(state.cancellations).toBe(2);
});

test('Cancellation stays centered without resizing the row, including inside order detail', async ({
  page,
}, info) => {
  const state = await mockCommerce(page);
  state.hasOrder = true;
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/user/orders');
  const trigger = page.getByRole('button', { name: 'Hủy đơn hàng', exact: true });
  const row = trigger.locator('xpath=ancestor::tr');
  const before = await row.boundingBox();
  await trigger.click();
  const confirm = page.getByRole('dialog', { name: 'Hủy đơn hàng?' });
  await expect(confirm).toBeVisible();
  await expect(confirm.getByRole('button', { name: 'Giữ đơn hàng' })).toBeFocused();
  const box = await confirm.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs(box!.x + box!.width / 2 - 160)).toBeLessThan(2);
  expect(Math.abs(box!.y + box!.height / 2 - 370)).toBeLessThan(2);
  expect((await row.boundingBox())?.height).toBe(before?.height);
  await page.screenshot({ path: info.outputPath('cancel-centered-320.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Xem chi tiết' }).click();
  const detail = page.getByRole('dialog', { name: 'Chi tiết đơn hàng' });
  const nestedTrigger = detail.getByRole('button', { name: 'Hủy đơn hàng', exact: true });
  await nestedTrigger.click();
  await expect(confirm).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(detail).toBeVisible();
  await expect(nestedTrigger).toBeFocused();
  expect(state.cancellations).toBe(0);
});

test('Cancellation failure retains the pending order and allows retry', async ({ page }) => {
  const state = await mockCommerce(page);
  state.hasOrder = true;
  state.cancelFails = true;
  await page.goto('/user/orders');
  await page.getByRole('button', { name: 'Hủy đơn hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click();
  await expect(
    page.getByText('Chưa xác nhận được kết quả hủy đơn.', { exact: false }),
  ).toBeVisible();
  expect(state.order.status).toBe('PENDING');
  state.cancelFails = false;
  await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Bảng đơn hàng' }).getByText('Đã hủy', { exact: true }),
  ).toBeVisible();
});
