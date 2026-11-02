import { expect, test } from '@playwright/test';
import { mockHomepageApi, testUser } from './api-fixtures';

test.beforeEach(async ({ page }) => {
  await mockHomepageApi(page);
});

test('Logs in through the cookie-backed API and returns home', async ({ page }, testInfo) => {
  await page.route('**/api/v1/auth/login', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: testUser.email,
      password: 'sample-password',
    });
    await route.fulfill({ json: { user: testUser, accessTokenExpiresAt: '2026-10-15T23:59:59Z' } });
  });
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tiếp tục hành trình');
  await expect(page.getByRole('link', { name: /Google/ })).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath('login.png'), fullPage: true });
  await page.getByLabel('Email', { exact: true }).fill(testUser.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('sample-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(
    page.getByRole('button', { name: `Tài khoản của ${testUser.displayName}`, exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 });
});

test('Displays rejected credentials without leaving the login page', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 401,
      json: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
    }),
  );
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(testUser.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.locator('form').getByRole('alert')).toContainText('Đăng nhập chưa thành công');
  await expect(page).toHaveURL('/login');
});

test('Opens the account dropdown and handles dismissal and logout retry', async ({
  page,
}, testInfo) => {
  let authenticated = true;
  let logoutCalls = 0;
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: authenticated ? 200 : 401,
      json: authenticated ? testUser : { code: 'AUTHENTICATION_REQUIRED', message: 'Signed out' },
    }),
  );
  await page.route('**/api/v1/auth/logout', async (route) => {
    logoutCalls++;
    if (logoutCalls === 1) {
      await route.fulfill({ status: 500, json: { message: 'Try again' } });
      return;
    }
    authenticated = false;
    await route.fulfill({ status: 204 });
  });
  await page.goto('/');
  const trigger = page.getByRole('button', {
    name: `Tài khoản của ${testUser.displayName}`,
    exact: true,
  });
  const dropdown = page.getByRole('region', { name: 'Thông tin tài khoản' });
  await expect(trigger).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toHaveCount(0);
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(dropdown).toBeVisible();
  await expect(dropdown).toContainText(testUser.email);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(
    dropdown.getByRole('link', { name: 'Thông tin cá nhân', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dropdown).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator('main').click({ position: { x: 5, y: 400 } });
  await expect(dropdown).not.toBeVisible();
  await trigger.click();
  const bounds = await dropdown.boundingBox();
  expect(bounds).not.toBeNull();
  if (bounds) {
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await page.screenshot({ path: testInfo.outputPath('account-dropdown.png') });
  await dropdown.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(
    page.getByText('Chưa thể đăng xuất. Vui lòng thử lại.', { exact: true }),
  ).toBeVisible();
  await trigger.click();
  await dropdown.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await expect(dropdown).not.toBeVisible();
  expect(logoutCalls).toBe(2);
});

test('Registers an email account without treating accepted registration as a login', async ({
  page,
}) => {
  let submitted = false;
  await page.route('**/api/v1/auth/register', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      displayName: 'Học viên mới',
      email: 'new@example.test',
      password: 'sample-password',
    });
    submitted = true;
    await route.fulfill({ status: 202, json: { message: 'Verification requested.' } });
  });
  const destination =
    '/courses/33333333-3333-4333-8333-333333333333?classId=44444444-4444-4444-8444-444444444444';
  await page.goto(`/login?returnTo=${encodeURIComponent(destination)}`);
  await page.getByRole('link', { name: /Chưa có tài khoản/ }).click();
  await page.getByLabel('Họ và tên', { exact: true }).fill('Học viên mới');
  await page.getByLabel('Email', { exact: true }).fill('new@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('sample-password');
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('liên kết xác thực');
  expect(submitted).toBe(true);
  await page.getByRole('link', { name: /Đã có tài khoản/ }).click();
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe(destination);
});

test('Verifies email only after an explicit click and starts a session', async ({ page }) => {
  const token = 'a'.repeat(64);
  let calls = 0;
  await page.route('**/api/v1/auth/email/verify', async (route) => {
    calls++;
    expect(route.request().postDataJSON()).toEqual({ token });
    await route.fulfill({ json: { user: testUser, accessTokenExpiresAt: '2026-10-15T23:59:59Z' } });
  });
  await page.goto(`/verify-email?token=${token}`);
  await expect(
    page.getByRole('button', { name: 'Xác thực và tiếp tục', exact: true }),
  ).toBeVisible();
  expect(calls).toBe(0);
  await page.getByRole('button', { name: 'Xác thực và tiếp tục', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('button', { name: `Tài khoản của ${testUser.displayName}`, exact: true }),
  ).toBeVisible();
  expect(calls).toBe(1);
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 });
});

for (const scenario of [
  {
    path: '/login',
    user: { ...testUser, role: 'MENTOR' },
    message: 'vui lòng đăng nhập tại trang nội bộ',
    link: '/admin/login',
  },
  {
    path: '/admin/login',
    user: testUser,
    message: 'vui lòng đăng nhập tại trang dành cho học viên',
    link: '/login',
  },
])
  test(`Signs out ${scenario.user.role} accounts that use ${scenario.path}`, async ({ page }) => {
    let loggedOut = false;
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        json: { user: scenario.user, accessTokenExpiresAt: '2026-10-15T23:59:59Z' },
      }),
    );
    await page.route('**/api/v1/auth/logout', async (route) => {
      loggedOut = true;
      await route.fulfill({ status: 204 });
    });
    await page.goto(scenario.path);
    await page.getByLabel('Email', { exact: true }).fill(scenario.user.email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill('sample-password');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    const alert = page.locator('form').getByRole('alert');
    await expect(alert).toContainText(scenario.message);
    await expect(alert.getByRole('link')).toHaveAttribute('href', scenario.link);
    await expect(page).toHaveURL(scenario.path);
    await expect.poll(() => loggedOut).toBe(true);
  });
