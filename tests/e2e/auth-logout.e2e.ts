import { expect, test, type Page } from '@playwright/test';
import { mockHomepageApi, testUser } from './api-fixtures';

async function mockManagerLogout(page: Page) {
  await mockHomepageApi(page);
  const user = { ...testUser, role: 'MANAGER', displayName: 'Quản lý kiểm thử' };
  const state = {
    loggedIn: true,
    logoutStatus: 204,
    logoutCalls: 0,
    sessionReads: 0,
    refreshes: 0,
  };
  await page.route('**/api/v1/auth/me', (route) => {
    state.sessionReads++;
    return route.fulfill(
      state.loggedIn
        ? { json: user }
        : { status: 401, json: { code: 'AUTHENTICATION_REQUIRED', message: 'Signed out' } },
    );
  });
  await page.route('**/api/v1/auth/refresh', (route) => {
    state.refreshes++;
    return route.fulfill({
      status: 401,
      json: { code: 'INVALID_REFRESH_TOKEN', message: 'Signed out' },
    });
  });
  const pageResponse = (url: URL) => ({
    items: [],
    total: 0,
    page: Number(url.searchParams.get('page') ?? 1),
    pageSize: Number(url.searchParams.get('pageSize') ?? 20),
  });
  for (const path of ['manager/materials', 'management/mentor-leave-requests'])
    await page.route(`**/api/v1/${path}?**`, (route) =>
      route.fulfill({ json: pageResponse(new URL(route.request().url())) }),
    );
  await page.route('**/api/v1/auth/logout', (route) => {
    state.logoutCalls++;
    if ([204, 401].includes(state.logoutStatus)) state.loggedIn = false;
    return route.fulfill(
      state.logoutStatus === 204
        ? { status: 204 }
        : { status: state.logoutStatus, json: { code: 'LOGOUT_FAILED', message: 'Unavailable' } },
    );
  });
  return { state, user, pageResponse };
}

async function clickLogout(page: Page) {
  await page.getByRole('button', { name: 'Tài khoản của Quản lý kiểm thử', exact: true }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
}

test('manager logout hides pending dashboard requests and waits on a neutral screen', async ({
  page,
}, info) => {
  const { state, pageResponse } = await mockManagerLogout(page);
  let releaseReads!: () => void;
  let releaseLogout!: () => void;
  const reads = new Promise<void>((resolve) => {
    releaseReads = resolve;
  });
  const logout = new Promise<void>((resolve) => {
    releaseLogout = resolve;
  });
  let pendingReads = 0;
  await page.route('**/api/v1/manager/materials?**', async (route) => {
    pendingReads++;
    await reads;
    await route.fulfill({ json: pageResponse(new URL(route.request().url())) });
  });
  await page.route('**/api/v1/auth/logout', async (route) => {
    state.logoutCalls++;
    await logout;
    state.loggedIn = false;
    await route.fulfill({ status: 204 });
  });
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/manager');
  await expect.poll(() => pendingReads).toBeGreaterThan(0);
  await page.evaluate(() => {
    document.body.dataset.logoutError = 'false';
    new MutationObserver(() => {
      if (/Session changed|Chưa thể kiểm tra tài khoản/.test(document.body.innerText))
        document.body.dataset.logoutError = 'true';
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  try {
    await clickLogout(page);
    await expect(page.getByRole('status', { name: 'Đang đăng xuất…', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Điều hướng Manager' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Tổng quan Manager', exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toHaveCount(0);
    await expect.poll(() => state.logoutCalls).toBe(1);
    expect(state.sessionReads).toBe(1);
    await expect(page.locator('body')).toHaveAttribute('data-logout-error', 'false');
    await expect(page.getByText('Session changed', { exact: false })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath('logout-transition.png') });
    releaseReads();
    releaseLogout();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible();
    await expect(page.getByRole('status', { name: 'Đang đăng xuất…', exact: true })).toHaveCount(0);
    await expect(page.locator('body')).toHaveAttribute('data-logout-error', 'false');
    expect(state.refreshes).toBe(0);
  } finally {
    releaseReads();
    releaseLogout();
  }
});

test('failed logout restores the manager screen with a friendly error and allows retry', async ({
  page,
}) => {
  const { state } = await mockManagerLogout(page);
  state.logoutStatus = 503;
  await page.goto('/manager');
  await clickLogout(page);
  await expect(
    page.getByText('Chưa thể đăng xuất. Vui lòng thử lại.', { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL('/manager');
  await expect(page.getByRole('heading', { name: 'Tổng quan Manager', exact: true })).toBeVisible();
  await expect(page.getByText('Session changed', { exact: false })).toHaveCount(0);
  state.logoutStatus = 204;
  await clickLogout(page);
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible();
  expect(state.logoutCalls).toBe(2);
});

test('an already expired manager logout goes home without refresh or an expiry warning', async ({
  page,
}) => {
  const { state } = await mockManagerLogout(page);
  state.logoutStatus = 401;
  await page.goto('/manager');
  await clickLogout(page);
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await expect(
    page.getByText('Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.', { exact: true }),
  ).toHaveCount(0);
  expect(state.refreshes).toBe(0);
  expect(state.logoutCalls).toBe(1);
});

test('a later wrong-audience login keeps its warning after a header logout', async ({ page }) => {
  const { state, user } = await mockManagerLogout(page);
  await page.route('**/api/v1/auth/login', (route) => {
    state.loggedIn = true;
    return route.fulfill({ json: { user, accessTokenExpiresAt: '2030-01-01T00:00:00Z' } });
  });
  await page.goto('/manager');
  await clickLogout(page);
  await expect(page).toHaveURL('/');
  await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('sample-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Đến trang đăng nhập nội bộ →', exact: true }),
  ).toBeVisible();
  await expect.poll(() => state.logoutCalls).toBe(2);
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('status', { name: 'Đang đăng xuất…', exact: true })).toHaveCount(0);
});
