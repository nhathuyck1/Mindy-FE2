import { expect, test } from '@playwright/test';
import { mockCommerce, orderId } from './commerce-fixtures';
import { testUser } from './api-fixtures';

for (const path of ['/cart', `/checkout/${orderId}`, '/payment/result?orderCode=1000000000']) {
  test(`Guest is redirected home before accessing ${path}`, async ({ page }) => {
    const state = await mockCommerce(page);
    state.loggedIn = false;
    const privateRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/v1/me/'))
        privateRequests.push(request.url());
    });
    await page.goto(path);
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible();
    expect(privateRequests).toEqual([]);
  });
}

for (const role of ['ADMIN', 'MANAGER', 'MENTOR']) {
  test(`${role} is redirected home without reading an order or preparing payment`, async ({
    page,
  }) => {
    const state = await mockCommerce(page);
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({ json: { ...testUser, role } }),
    );
    await page.goto(`/checkout/${orderId}`);
    await expect(page).toHaveURL('/');
    expect(state.reads).toBe(0);
    expect(state.creates).toBe(0);
  });
}

for (const status of ['SUSPENDED', 'PENDING_VERIFICATION']) {
  test(`${status} student is redirected home before private requests`, async ({ page }) => {
    await mockCommerce(page);
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({ json: { ...testUser, status } }),
    );
    const privateRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/v1/me/'))
        privateRequests.push(request.url());
    });
    await page.goto('/cart');
    await expect(page).toHaveURL('/');
    expect(privateRequests).toEqual([]);
  });
}

test('Protected content waits for session validation and allows an active student', async ({
  page,
}) => {
  const state = await mockCommerce(page);
  state.order.payment = state.payment;
  let releaseSession = () => {};
  const sessionReady = new Promise<void>((resolve) => {
    releaseSession = resolve;
  });
  await page.route('**/api/v1/auth/me', async (route) => {
    await sessionReady;
    await route.fulfill({ json: testUser });
  });
  await page.goto(`/checkout/${orderId}`);
  await expect(page.getByText('Đang kiểm tra phiên đăng nhập…', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toHaveCount(0);
  expect(state.reads).toBe(0);
  expect(state.creates).toBe(0);
  releaseSession();
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toBeVisible();
  await expect(page).toHaveURL(`/checkout/${orderId}`);
});

test('A refresh can restore the session before the guard decides access', async ({ page }) => {
  const state = await mockCommerce(page);
  state.loggedIn = false;
  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({
      json: { user: testUser, accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString() },
    }),
  );
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Giỏ hàng của bạn' })).toBeVisible();
  await expect(page).toHaveURL('/cart');
  expect(state.checkouts).toBe(0);
});

test('Session service errors allow retry without exposing protected content', async ({ page }) => {
  const state = await mockCommerce(page);
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ status: 503, json: { message: 'Temporarily unavailable' } }),
  );
  await page.goto(`/checkout/${orderId}`);
  await expect(page.getByText('Chưa thể kiểm tra phiên đăng nhập', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(`/checkout/${orderId}`);
  expect(state.reads).toBe(0);
  expect(state.creates).toBe(0);
  await page.unroute('**/api/v1/auth/me');
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toBeVisible();
});

for (const status of [401, 403]) {
  test(`Order API ${status} redirects home without preparing payment`, async ({ page }) => {
    const state = await mockCommerce(page);
    state.orderReadStatus = status;
    await page.goto(`/checkout/${orderId}`);
    await expect(page).toHaveURL('/');
    expect(state.creates).toBe(0);
    await expect(page.locator('svg title')).toHaveCount(0);
  });
}

test('Session API denial redirects home', async ({ page }) => {
  const state = await mockCommerce(page);
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ status: 403, json: { message: 'Forbidden' } }),
  );
  await page.goto(`/checkout/${orderId}`);
  await expect(page).toHaveURL('/');
  expect(state.reads).toBe(0);
  expect(state.creates).toBe(0);
});

test('Payment result API denial redirects home', async ({ page }) => {
  const state = await mockCommerce(page);
  await page.route('**/api/v1/me/orders/payment-result?**', (route) =>
    route.fulfill({ status: 403, json: { message: 'Forbidden' } }),
  );
  await page.goto('/payment/result?orderCode=1000000000');
  await expect(page).toHaveURL('/');
  expect(state.creates).toBe(0);
});

test('Payment creation denial redirects home', async ({ page }) => {
  const state = await mockCommerce(page);
  await page.route(`**/api/v1/me/orders/${orderId}/payments/payos`, (route) =>
    route.fulfill({ status: 403, json: { message: 'Forbidden' } }),
  );
  await page.goto(`/checkout/${orderId}`);
  await expect(page).toHaveURL('/');
  expect(state.checkouts).toBe(0);
});
