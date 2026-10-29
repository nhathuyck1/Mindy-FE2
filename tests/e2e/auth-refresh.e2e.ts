import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { mockHomepageApi, testUser } from './api-fixtures';
import { mockCommerce } from './commerce-fixtures';
import { adminUser, mockAdminApi } from './admin-fixtures';
import { mockMentor } from './mentor-fixtures';

async function cookieRecovery(page: Page, context: BrowserContext, user = testUser) {
  await context.addCookies([
    {
      name: 'access_token',
      value: 'old-access',
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'refresh_token',
      value: 'refresh-one',
      domain: '127.0.0.1',
      path: '/api/v1/auth/refresh',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  const state = { expired: false, refreshes: 0, refreshStatus: 200, rotated: false };
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill(
      state.expired
        ? { status: 401, json: { code: 'AUTHENTICATION_REQUIRED', message: 'Expired' } }
        : { json: user },
    ),
  );
  await page.route('**/api/v1/auth/refresh', async (route) => {
    state.refreshes++;
    expect(route.request().method()).toBe('POST');
    expect(await route.request().headerValue('cookie')).toContain('refresh_token=refresh-one');
    if (state.refreshStatus !== 200)
      return route.fulfill({
        status: state.refreshStatus,
        json: { code: 'INVALID_REFRESH_TOKEN', message: 'Rejected' },
      });
    state.expired = false;
    state.rotated = true;
    return route.fulfill({
      headers: { 'Set-Cookie': 'access_token=new-access; Path=/; HttpOnly; SameSite=Lax' },
      json: { user, accessTokenExpiresAt: '2030-01-01T00:00:00Z' },
    });
  });
  return state;
}

test('student business request replays with the new HttpOnly cookie', async ({ page, context }) => {
  await mockCommerce(page);
  const state = await cookieRecovery(page, context);
  let attempts = 0;
  await page.route('**/api/v1/me/cart', async (route) => {
    attempts++;
    if (!state.rotated) {
      state.expired = true;
      return route.fulfill({
        status: 401,
        json: { code: 'AUTHENTICATION_REQUIRED', message: 'Expired' },
      });
    }
    expect(await route.request().headerValue('cookie')).toContain('access_token=new-access');
    return route.fallback();
  });
  await page.goto('/cart');
  await expect(page.getByText('Web buổi tối', { exact: true })).toBeVisible();
  await expect(page).toHaveURL('/cart');
  expect(attempts).toBe(2);
  expect(state.refreshes).toBe(1);
  expect((await context.cookies()).find((cookie) => cookie.name === 'access_token')).toMatchObject({
    value: 'new-access',
    httpOnly: true,
  });
  expect(await page.evaluate(() => document.cookie)).not.toContain('access_token');
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 });
});

for (const role of ['ADMIN', 'MENTOR'] as const) {
  test(`${role} business requests share recovery and remain on the protected page`, async ({
    page,
    context,
  }) => {
    if (role === 'ADMIN') await mockAdminApi(page);
    else await mockMentor(page);
    const user = role === 'ADMIN' ? adminUser : { ...testUser, role: 'MENTOR' };
    const state = await cookieRecovery(page, context, user);
    await page.route(`**/api/v1/${role === 'ADMIN' ? 'admin' : 'mentor'}/**`, async (route) => {
      if (!state.rotated) {
        state.expired = true;
        return route.fulfill({
          status: 401,
          json: { code: 'AUTHENTICATION_REQUIRED', message: 'Expired' },
        });
      }
      expect(await route.request().headerValue('cookie')).toContain('access_token=new-access');
      return route.fallback();
    });
    const path = role === 'ADMIN' ? '/admin/users' : '/mentor/classes';
    await page.goto(path);
    await expect(
      page.getByRole('button', { name: `Tài khoản của ${user.displayName}`, exact: true }),
    ).toBeVisible();
    await expect.poll(() => state.refreshes).toBe(1);
    if (role === 'ADMIN') await expect(page.getByRole('table')).toBeVisible();
    else await expect(page.getByText('Chưa thể tải dữ liệu', { exact: true })).toHaveCount(0);
    await expect(page).toHaveURL(path);
  });
}

for (const staff of [false, true]) {
  test(`refresh denial clears ${staff ? 'staff' : 'student'} UI and returns to the correct login`, async ({
    page,
    context,
  }) => {
    if (staff) await mockAdminApi(page);
    else await mockCommerce(page);
    const user = staff ? adminUser : testUser;
    const state = await cookieRecovery(page, context, user);
    const path = staff ? '/admin/users' : '/cart';
    await page.goto(path);
    await expect(
      page.getByRole('button', { name: `Tài khoản của ${user.displayName}`, exact: true }),
    ).toBeVisible();
    state.expired = true;
    state.refreshStatus = 401;
    // Trigger a business request while the previously validated session is cached.
    await page.route(`**/api/v1/${staff ? 'admin/**' : 'me/cart'}`, (route) =>
      route.fulfill({ status: 401, json: { code: 'AUTHENTICATION_REQUIRED', message: 'Expired' } }),
    );
    if (staff) await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
    else {
      await page.route('**/api/v1/me/cart/items/**', (route) =>
        route.fulfill({
          status: 401,
          json: { code: 'AUTHENTICATION_REQUIRED', message: 'Expired' },
        }),
      );
      await page.getByRole('button', { name: 'Xóa Web buổi tối', exact: true }).click();
    }
    await expect(page).toHaveURL(
      `${staff ? '/admin/login' : '/login'}?returnTo=${encodeURIComponent(path)}`,
    );
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(0);
    await expect(page.getByText('Web buổi tối', { exact: true })).toHaveCount(0);
    await expect(
      page.getByText('Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.', { exact: true }),
    ).toBeVisible();
    expect(state.refreshes).toBe(1);
  });
}

test('temporary refresh failure keeps the page and allows a successful retry', async ({
  page,
  context,
}) => {
  await mockCommerce(page);
  const state = await cookieRecovery(page, context);
  state.expired = true;
  state.refreshStatus = 503;
  await page.goto('/cart');
  await expect(page.getByText('Chưa thể kiểm tra phiên đăng nhập', { exact: true })).toBeVisible();
  await expect(page).toHaveURL('/cart');
  state.refreshStatus = 200;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByText('Web buổi tối', { exact: true })).toBeVisible();
  expect(state.refreshes).toBe(2);
});

test('public page stays in place when an existing session expires', async ({ page, context }) => {
  await mockHomepageApi(page);
  const state = await cookieRecovery(page, context);
  await page.clock.install();
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: `Tài khoản của ${testUser.displayName}`, exact: true }),
  ).toBeVisible();
  state.expired = true;
  state.refreshStatus = 401;
  await page.clock.fastForward(31_000);
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await page.clock.runFor(100);
  await expect(
    page.getByText('Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.', { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL('/');
  expect(state.refreshes).toBe(1);
});

test('two tabs share rotating cookies through Web Locks', async ({ page, context }) => {
  await context.addCookies([
    {
      name: 'refresh_token',
      value: 'refresh-one',
      domain: '127.0.0.1',
      path: '/api/v1/auth/refresh',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  let refreshes = 0;
  await context.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const cookie = (await route.request().headerValue('cookie')) ?? '';
    if (path === '/api/v1/auth/refresh') {
      refreshes++;
      expect(cookie).toContain('refresh_token=refresh-one');
      return route.fulfill({
        headers: { 'Set-Cookie': 'access_token=shared-access; Path=/; HttpOnly; SameSite=Lax' },
        json: { user: testUser, accessTokenExpiresAt: '2030-01-01T00:00:00Z' },
      });
    }
    if (!cookie.includes('access_token=shared-access'))
      return route.fulfill({
        status: 401,
        json: { code: 'AUTHENTICATION_REQUIRED', message: 'Expired' },
      });
    if (path === '/api/v1/auth/me') return route.fulfill({ json: testUser });
    if (path === '/api/v1/me/cart') return route.fulfill({ json: { items: [], totalAmount: 0 } });
    return route.fulfill({ json: { items: [], page: 1, pageSize: 10, total: 0 } });
  });
  const other = await context.newPage();
  await Promise.all([page.goto('/cart'), other.goto('/cart')]);
  for (const tab of [page, other]) {
    await expect(
      tab.getByRole('heading', { name: 'Giỏ hàng đang trống', exact: true }),
    ).toBeVisible();
    await expect(tab).toHaveURL('/cart');
    expect(await tab.evaluate(() => Boolean(navigator.locks))).toBe(true);
  }
  expect(refreshes).toBe(1);
  await other.close();
});
