import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { mockHomepageApi, testUser } from './api-fixtures';
import { adminUser, adminClasses, mockAdminApi } from './admin-fixtures';

test('Shows shared skeletons while overview, table and class students load', async ({
  page,
}, testInfo) => {
  await mockAdminApi(page);
  let release = () => {};
  let pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/v1/admin/**', async (route) => {
    await pending;
    await route.fallback();
  });
  try {
    await page.goto('/admin');
    await expect(
      page.getByRole('status', { name: 'Đang tải tổng người dùng', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('status', { name: 'Đang tải dữ liệu…', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Chưa thể tải dữ liệu', { exact: true })).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath('admin-skeletons.png'),
      animations: 'disabled',
    });
  } finally {
    release();
  }
  await expect(page.getByLabel('Tổng người dùng: 23', { exact: true })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Đang tải dữ liệu…', exact: true })).toHaveCount(0);
  await page.goto('/admin/classes');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(2);
  pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/v1/admin/classes/*/students?**', async (route) => {
    await pending;
    await route.fulfill({ json: { items: [], page: 1, pageSize: 20, total: 0 } });
  });
  try {
    await page
      .getByRole('link', { name: `Danh sách học viên: ${adminClasses[0].name}`, exact: true })
      .click();
    await expect(page).toHaveURL(`/admin/classes/${adminClasses[0].id}/students`);
    await expect(
      page.getByRole('status', { name: 'Đang tải dữ liệu…', exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
  await expect(page.getByText('Chưa có học viên trong lớp', { exact: true })).toBeVisible();
  pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    await page.goto('/admin/users');
    await expect(
      page.getByRole('status', { name: 'Đang tải dữ liệu…', exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  } finally {
    release();
  }
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(10);
});

test('Opens a class student page from the class list and views student details', async ({
  page,
  isMobile,
}, testInfo) => {
  await mockAdminApi(page);
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  const requests: string[] = [];
  let fail = false;
  const students = Array.from({ length: 21 }, (_, index) => ({
    studentId: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    studentName: `Học viên ${index + 1}`,
    email: `student${index + 1}@example.test`,
    phone: index ? '0901234567' : null,
    studentStatus: 'ACTIVE',
    enrollmentId: `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    enrollmentStatus: index ? 'ACTIVE' : 'PENDING_PAYMENT',
    enrolledAt: index ? '2026-10-15T00:00:00Z' : null,
  }));
  await page.route('**/api/v1/admin/classes/*/students?**', (route) => {
    const url = new URL(route.request().url());
    requests.push(url.pathname);
    if (fail)
      return route.fulfill({ status: 503, json: { code: 'UNAVAILABLE', message: 'Try again' } });
    const items = url.pathname.includes(adminClasses[0].id) ? students : [];
    const current = Number(url.searchParams.get('page'));
    const size = Number(url.searchParams.get('pageSize'));
    return route.fulfill({
      json: {
        items: items.slice((current - 1) * size, current * size),
        page: current,
        pageSize: size,
        total: items.length,
      },
    });
  });
  await page.route('**/api/v1/admin/classes/*/students/*', (route) =>
    route.fulfill({
      json: {
        ...students[0],
        classId: adminClasses[0].id,
        orderDetailId: students[0].enrollmentId,
        registeredAt: '2026-10-10T00:00:00Z',
        accountCreatedAt: '2026-10-01T00:00:00Z',
        lastLoginAt: null,
      },
    }),
  );
  await page.goto('/admin');
  await expect(page.getByRole('table')).toContainText(adminClasses[0].name);
  await expect(page.getByRole('link', { name: /^Danh sách học viên:/ })).toHaveCount(0);
  await page.goto('/admin/classes');
  const firstClass = page.getByRole('link', {
    name: `Danh sách học viên: ${adminClasses[0].name}`,
    exact: true,
  });
  await expect(firstClass).toBeVisible();
  expect(requests).toEqual([]);
  await firstClass.click();
  await expect(page).toHaveURL(`/admin/classes/${adminClasses[0].id}/students`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(adminClasses[0].name);
  const table = page.getByRole('table');
  await expect(table.locator('tbody tr')).toHaveCount(10);
  await expect(table).toContainText('Chờ thanh toán');
  await expect(table).toContainText('Chưa nhập học');
  expect(requests[0]).toBe(`/api/v1/admin/classes/${adminClasses[0].id}/students`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('class-students.png'),
    animations: 'disabled',
  });
  await page.getByLabel('Số dòng mỗi trang').selectOption('20');
  await expect(table.locator('tbody tr')).toHaveCount(20);
  await page.getByRole('button', { name: 'Trang học viên sau' }).click();
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await expect(table).toContainText('Học viên 21');
  await page.getByRole('button', { name: 'Trang học viên trước' }).click();
  const view = page.getByRole('button', {
    name: 'Xem thông tin học viên: Học viên 1',
    exact: true,
  });
  await view.click();
  const dialog = page.getByRole('dialog', { name: 'Thông tin học viên' });
  await expect(dialog).toContainText('student1@example.test');
  await expect(dialog).toContainText('Ngày đăng ký');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(view).toBeFocused();
  fail = true;
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  await expect(page.getByText('Chưa thể tải dữ liệu', { exact: true })).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(table.locator('tbody tr')).toHaveCount(20);
  await page.getByRole('link', { name: 'Quay lại lớp học' }).click();
  await page
    .getByRole('link', { name: `Danh sách học viên: ${adminClasses[1].name}`, exact: true })
    .click();
  await expect(page.getByText('Chưa có học viên trong lớp', { exact: true })).toBeVisible();
  expect(requests.at(-1)).toBe(`/api/v1/admin/classes/${adminClasses[1].id}/students`);
});

test('Admin entry denies guests and non-admin accounts before requesting private lists', async ({
  page,
}) => {
  await mockHomepageApi(page);
  let calls = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/admin/')) calls++;
  });
  await page.goto('/admin/users');
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await expect(page).toHaveURL('/admin/login?returnTo=%2Fadmin%2Fusers');
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: testUser }));
  await page.goto('/admin/users');
  await expect(
    page.getByRole('heading', { name: 'Tài khoản chưa có quyền quản trị' }),
  ).toBeVisible();
  expect(calls).toBe(0);
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ json: { ...adminUser, status: 'SUSPENDED' } }),
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Tài khoản chưa có quyền quản trị' }),
  ).toBeVisible();
  expect(calls).toBe(0);
});

test('Reusable admin table supports filters, pagination, CSV, columns and accessible details', async ({
  page,
}, testInfo) => {
  await mockAdminApi(page);
  if (testInfo.project.name === 'desktop')
    await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/admin/users');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(10);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath('admin-users.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('Nguyễn An 11');
  await page.getByRole('button', { name: 'Hoạt động', exact: true }).click();
  await expect(page.getByRole('table')).not.toContainText('Tạm khóa');
  await page.getByRole('combobox', { name: 'Tất cả vai trò' }).selectOption('MENTOR');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(6);
  await expect(page.getByRole('table')).not.toContainText('Học viên');
  await page.getByRole('combobox', { name: 'Tất cả vai trò' }).selectOption('');
  await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
  await page.getByRole('textbox', { name: 'Tìm người dùng trong trang' }).fill('nguyen an');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  await page.getByRole('checkbox', { name: 'Chọn Nguyễn An', exact: true }).check();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất CSV' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const csv = await readFile(path!, 'utf8');
  expect(csv).toContain('Nguyễn An');
  expect(csv).not.toContain('Trần Minh Anh');
  await page.getByText('Cột hiển thị', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Điện thoại', exact: true }).uncheck();
  await expect(page.getByRole('columnheader', { name: 'Điện thoại' })).toHaveCount(0);
  await page.getByText('Cột hiển thị', { exact: true }).click();
  const detailsButton = page.getByRole('button', { name: 'Xem thông tin: Nguyễn An', exact: true });
  await detailsButton.click();
  const dialog = page.getByRole('dialog', { name: 'Thông tin người dùng' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('member1@example.test');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(detailsButton).toBeFocused();
  await page.getByRole('textbox', { name: 'Tìm người dùng trong trang' }).fill('khong co ket qua');
  await expect(page.getByText('Không có kết quả phù hợp', { exact: true })).toBeVisible();
});

test('Overview and resource pages use real contract totals and stay within the viewport', async ({
  page,
}, testInfo) => {
  await mockAdminApi(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  if (testInfo.project.name === 'desktop')
    await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of ['/admin', '/admin/courses', '/admin/classes', '/admin/workflow']) {
    await page.goto(route);
    await expect(page.locator('#admin-main')).toBeVisible();
    if (route === '/admin')
      await expect(page.getByLabel('Tổng người dùng: 23', { exact: true })).toBeVisible();
    if (route === '/admin/courses') {
      await expect(page.getByRole('table')).toContainText('2.500.000');
      await page.getByRole('button', { name: 'Chưa kích hoạt', exact: true }).click();
      await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
      await expect(page.getByRole('table')).toContainText('JavaScript căn bản');
    }
    if (route === '/admin/classes') {
      await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(2);
      await page.getByRole('combobox', { name: 'Tất cả hình thức' }).selectOption('OFFLINE');
      await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
      await expect(page.getByRole('table')).toContainText('JavaScript — Lớp tháng 11');
    }
    if (route === '/admin')
      await expect(page.getByRole('table').getByRole('button')).toHaveCount(0);
    if (route !== '/admin/workflow') {
      if (route !== '/admin') {
        const actions = page.getByRole('table').locator('tbody tr').first().locator('td').last();
        await expect(actions.getByRole('button')).toHaveCount(route === '/admin/users' ? 3 : 2);
        await expect(actions.getByRole('link')).toHaveCount(route === '/admin/classes' ? 1 : 0);
        await expect(actions.getByRole('button').first()).toHaveAccessibleName(/^Xem thông tin:/);
      }
      const dot = page.getByRole('table').locator('[data-slot="badge"] .animate-pulse').first();
      await expect(dot).toHaveCSS('animation-name', 'pulse');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(dot).toHaveCSS('animation-name', 'none');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: testInfo.outputPath(`${route.replaceAll('/', '-') || 'overview'}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/admin/users');
  await expect(page.getByRole('table')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('admin-users-320.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('Admin activity history filters, paginates, loads escaped detail and restores focus', async ({
  page,
}, testInfo) => {
  await mockAdminApi(page);
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 800 });
  const methods: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/admin/tracking/events')) methods.push(request.method());
  });
  await page.goto('/admin/tracking');
  await expect(page.getByRole('heading', { name: 'Lịch sử hoạt động', exact: true })).toBeVisible();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(15);
  await page.screenshot({ path: testInfo.outputPath('admin-tracking.png'), fullPage: true });
  await page.getByLabel('Nhóm hoạt động').selectOption('attendance_audits');
  await page.getByLabel('Từ thời điểm').fill('2026-10-20T10:30');
  await page.getByLabel('Đến thời điểm').fill('2026-10-23T10:30');
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('Điều chỉnh sau khi xác minh');
  const first = page.getByRole('table').getByRole('button', { name: 'Xem chi tiết' }).first();
  await first.click();
  const dialog = page.getByRole('dialog', { name: 'Chi tiết hoạt động' });
  await expect(dialog).toContainText('Dữ liệu sự kiện');
  await expect(dialog).toContainText('UNMARKED');
  await expect(dialog).toContainText('Biên bản xác nhận');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(first).toBeFocused();
  await page.getByLabel('Số dòng mỗi trang').selectOption('10');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(10);
  await page.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(5);
  await page.getByRole('button', { name: 'Xóa lọc', exact: true }).click();
  await expect(page.getByLabel('Nhóm hoạt động')).toHaveValue('');
  expect(methods.every((method) => method === 'GET')).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Reconciliation screen is paginated, read only and responsive at 320px', async ({
  page,
}, testInfo) => {
  await mockAdminApi(page);
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 800 });
  const methods: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/admin/payments/reconciliation'))
      methods.push(request.method());
  });
  await page.goto('/admin/payments/reconciliation');
  await expect(
    page.getByRole('heading', { name: 'Cần đối soát thanh toán', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(12);
  await expect(page.getByRole('table')).toContainText('PAYOS-REF-001');
  await page.screenshot({ path: testInfo.outputPath('admin-reconciliation.png'), fullPage: true });
  await page.getByLabel('Số dòng mỗi trang').selectOption('10');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(10);
  await page.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(2);
  expect(methods.length).toBeGreaterThan(0);
  expect(methods.every((method) => method === 'GET')).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Manager cannot mount Admin history or reconciliation queries and does not see those links', async ({
  page,
}) => {
  await mockAdminApi(page);
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ json: { ...testUser, role: 'MANAGER', displayName: 'Quản lý Mindy' } }),
  );
  const privateRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/api\/v1\/admin\/(tracking|payments\/reconciliation)/.test(request.url()))
      privateRequests.push(request.url());
  });
  await page.goto('/admin/tracking');
  await expect(page.getByRole('heading', { name: 'Tài khoản chưa có quyền Admin' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Lịch sử hoạt động', exact: true })).toHaveCount(0);
  await page.goto('/admin/payments/reconciliation');
  await expect(page.getByRole('heading', { name: 'Tài khoản chưa có quyền Admin' })).toBeVisible();
  expect(privateRequests).toEqual([]);
});

test('Admin navigation supports desktop collapse and a focus-managed mobile menu', async ({
  page,
  isMobile,
}) => {
  await mockAdminApi(page);
  await page.goto('/admin/users');
  if (isMobile) {
    const trigger = page.getByRole('button', { name: 'Mở menu quản trị' });
    await trigger.click();
    const menu = page.getByRole('dialog', { name: 'Mindy Admin' });
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await menu.getByRole('link', { name: 'Khóa học', exact: true }).click();
    await expect(page).toHaveURL('/admin/courses');
    await expect(menu).not.toBeVisible();
  } else {
    await page.getByRole('button', { name: 'Thu gọn thanh điều hướng' }).click();
    await expect(page.getByRole('button', { name: 'Mở rộng thanh điều hướng' })).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Điều hướng quản trị' })
      .getByRole('link', { name: 'Khóa học', exact: true })
      .click();
    await expect(page).toHaveURL('/admin/courses');
    await page.getByRole('button', { name: 'Mở rộng thanh điều hướng' }).click();
  }
});

test('Admin list handles service failure, forbidden, expired session and empty data', async ({
  page,
}) => {
  await mockAdminApi(page);
  let status = 503;
  await page.route('**/api/v1/admin/users?**', (route) =>
    route.fulfill({
      status,
      json:
        status === 200
          ? { items: [], page: 1, pageSize: 10, total: 0 }
          : { code: 'ERROR', message: 'Unavailable' },
    }),
  );
  await page.goto('/admin/users');
  await expect(page.getByText('Chưa thể tải dữ liệu', { exact: true })).toBeVisible();
  status = 200;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByText('Chưa có người dùng', { exact: true })).toBeVisible();
  {
    status = 403;
    await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
    await expect(
      page.getByText('Bạn không có quyền xem dữ liệu này', { exact: true }),
    ).toBeVisible();
  }
  status = 401;
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  await expect(page).toHaveURL('/admin/login?returnTo=%2Fadmin%2Fusers');
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
});

test('Admin login returns to the selected admin page and logout removes private UI', async ({
  page,
}) => {
  await mockHomepageApi(page);
  await mockAdminApi(page);
  let authenticated = false;
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: authenticated ? 200 : 401,
      json: authenticated ? adminUser : { code: 'UNAUTHORIZED', message: 'Sign in' },
    }),
  );
  await page.route('**/api/v1/auth/login', async (route) => {
    authenticated = true;
    await route.fulfill({
      json: { user: adminUser, accessTokenExpiresAt: '2026-10-15T23:59:59Z' },
    });
  });
  await page.route('**/api/v1/auth/logout', async (route) => {
    authenticated = false;
    await route.fulfill({ status: 204 });
  });
  await page.goto('/admin/login?returnTo=%2Fadmin%2Fclasses');
  await page.getByLabel('Email', { exact: true }).fill(adminUser.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('sample-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL('/admin/classes');
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: `Tài khoản của ${adminUser.displayName}` }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('table')).toHaveCount(0);
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 });
});
