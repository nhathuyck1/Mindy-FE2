import { expect, test } from '@playwright/test';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { mockCommerce, orderId, qrPayload } from './commerce-fixtures';
import { testUser } from './api-fixtures';

test('Guest logs in and returns to cart without submitting checkout', async ({ page }) => {
  const state = await mockCommerce(page);
  state.loggedIn = false;
  await page.goto('/cart');
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fcart/);
  await page.getByLabel('Email', { exact: true }).fill(testUser.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('sample-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL('/cart');
  await expect(page.getByRole('heading', { name: 'Giỏ hàng của bạn' })).toBeVisible();
  expect(state.checkouts).toBe(0);
});

test('Cart displays current price, removes a class and updates header badge', async ({ page }) => {
  await mockCommerce(page);
  await page.goto('/cart');
  await expect(page.getByRole('link', { name: 'Giỏ hàng, 1 lớp' })).toBeVisible();
  await expect(page.getByText('Học phí đã cập nhật từ')).toBeVisible();
  await page.getByRole('button', { name: 'Xóa Web buổi tối' }).click();
  await expect(page.getByRole('heading', { name: 'Giỏ hàng đang trống' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Giỏ hàng', exact: true })).toBeVisible();
});

test('Checkout once, render a decodable QR, reload the same order, then confirm PAID', async ({
  page,
}, testInfo) => {
  const state = await mockCommerce(page);
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Thanh toán', exact: true }).dblclick();
  await expect(page).toHaveURL(`/checkout/${orderId}`);
  const qr = page
    .locator('svg')
    .filter({ has: page.locator('title', { hasText: 'QR thanh toán đơn' }) });
  await expect(qr).toBeVisible();
  const png = PNG.sync.read(await qr.screenshot());
  expect(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data).toBe(qrPayload);
  await page.screenshot({ path: testInfo.outputPath('checkout-qr.png'), fullPage: true });
  expect(state.checkouts).toBe(1);
  expect(state.creates).toBe(1);
  await page.reload();
  await expect(qr).toBeVisible();
  expect(state.checkouts).toBe(1);
  expect(state.creates).toBe(1);
  state.order.status = 'PAID';
  state.order.paidAt = new Date().toISOString();
  await page.getByRole('button', { name: 'Kiểm tra thanh toán', exact: true }).click();
  await expect(page.getByText('Thanh toán thành công', { exact: true })).toBeVisible();
  await expect(qr).toHaveCount(0);
});

test('A lost checkout response recovers through pending orders instead of creating another order', async ({
  page,
}) => {
  const state = await mockCommerce(page);
  state.loseCheckoutResponse = true;
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Thanh toán', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Giỏ hàng đang trống' })).toBeVisible();
  await page.getByRole('link', { name: 'Tiếp tục thanh toán', exact: true }).click();
  await expect(page).toHaveURL(`/checkout/${orderId}`);
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toBeVisible();
  expect(state.checkouts).toBe(1);
});

test('Unavailable provider retries the same order; CREATING then recovers', async ({ page }) => {
  const state = await mockCommerce(page);
  state.hasOrder = true;
  state.paymentFailures = 1;
  await page.goto(`/checkout/${orderId}`);
  await expect(page.getByRole('alert')).toContainText('Thanh toán đang tạm gián đoạn');
  state.creatingResponses = 1;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toBeVisible({
    timeout: 12000,
  });
  expect(state.checkouts).toBe(0);
  expect(state.creates).toBe(3);
});

test('CREATING retries are bounded and navigation stops further attempts', async ({ page }) => {
  test.setTimeout(30000);
  const state = await mockCommerce(page);
  state.creatingResponses = 100;
  await page.goto(`/checkout/${orderId}`);
  await expect(page.getByRole('button', { name: 'Lấy lại mã QR' })).toBeVisible({ timeout: 22000 });
  expect(state.creates).toBe(4);
  await page.getByRole('button', { name: 'Lấy lại mã QR' }).click();
  await expect.poll(() => state.creates).toBe(5);
  await page.getByRole('link', { name: 'Quay lại giỏ hàng' }).click();
  await expect(page).toHaveURL('/cart');
  await page.waitForTimeout(2500);
  expect(state.creates).toBe(5);
});

test('Missing QR uses payOS URL, never generates a bank QR from an ID or URL', async ({ page }) => {
  const state = await mockCommerce(page);
  state.payment.qrCode = null;
  state.order.payment = state.payment;
  await page.goto(`/checkout/${orderId}`);
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toHaveAttribute(
    'href',
    state.payment.checkoutUrl!,
  );
  await expect(page.locator('svg title')).toHaveCount(0);
  expect(state.creates).toBe(0);
});

test('PayOS redirect flags cannot confirm or cancel an order; only orderCode is forwarded', async ({
  page,
}) => {
  const state = await mockCommerce(page);
  state.order.payment = state.payment;
  await page.goto('/payment/result?orderCode=1000000000&status=PAID&cancel=true&id=untrusted');
  await expect(page.getByText('Quét mã để thanh toán', { exact: true })).toBeVisible();
  await expect(page.getByText('Thanh toán thành công', { exact: true })).toHaveCount(0);
  expect(state.mappings).toEqual(['?orderCode=1000000000']);
  expect(state.checkouts).toBe(0);
  expect(state.creates).toBe(0);
});

for (const status of ['PAID', 'EXPIRED', 'CANCELLED', 'REQUIRES_REVIEW', 'SUCCEEDED'] as const) {
  test(`Handles ${status} without offering a second payment`, async ({ page }) => {
    const state = await mockCommerce(page);
    state.order.payment = { ...state.payment };
    if (status === 'REQUIRES_REVIEW' || status === 'SUCCEEDED') state.order.payment.status = status;
    else state.order.status = status;
    await page.goto(`/checkout/${orderId}`);
    const titles = {
      PAID: 'Thanh toán thành công',
      EXPIRED: 'Đơn hàng đã hết hạn',
      CANCELLED: 'Đơn hàng đã hủy',
      REQUIRES_REVIEW: 'Giao dịch đang cần đối soát',
      SUCCEEDED: 'Đang đồng bộ kết quả thanh toán',
    };
    await expect(page.getByText(titles[status], { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toHaveCount(0);
    await expect(page.locator('svg title')).toHaveCount(0);
    expect(state.creates).toBe(0);
  });
}

test('Countdown hides a stale QR and refetches without inventing payment success', async ({
  page,
}) => {
  const state = await mockCommerce(page);
  state.order.expiresAt = new Date(Date.now() + 4000).toISOString();
  state.order.payment = state.payment;
  await page.goto(`/checkout/${orderId}`);
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toBeVisible();
  await expect(page.getByText('Thời gian thanh toán đã kết thúc', { exact: true })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toHaveCount(0);
  expect(state.reads).toBeGreaterThan(1);
  expect(state.order.status).toBe('PENDING');
});

test('Session logout clears private QR; denied orders do not prepare a payment', async ({
  page,
}) => {
  const state = await mockCommerce(page);
  state.order.payment = state.payment;
  await page.goto(`/checkout/${orderId}`);
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toBeVisible();
  await page
    .getByRole('button', { name: `Tài khoản của ${testUser.displayName}`, exact: true })
    .click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await expect(page.locator('svg title')).toHaveCount(0);
  state.loggedIn = true;
  state.orderReadStatus = 403;
  await page.goto(`/checkout/${orderId}`);
  await expect(page.getByRole('alert')).toContainText('Bạn không có quyền');
  expect(state.creates).toBe(0);
});

test('Unpurchasable classes block checkout and 320px cart/QR have no horizontal overflow', async ({
  page,
}, testInfo) => {
  const state = await mockCommerce(page);
  state.cart.items[0].isPurchasable = false;
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/cart');
  await expect(page.getByRole('button', { name: 'Thanh toán', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('cart-320.png'), fullPage: true });
  state.order.payment = state.payment;
  await page.goto(`/checkout/${orderId}`);
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('qr-320.png'), fullPage: true });
});
