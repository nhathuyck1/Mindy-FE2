import { expect, test, type Page } from '@playwright/test';
import { course, courseId, detail, mockCoursesApi, openClass, timetable } from './course-fixtures';
import { testUser } from './api-fixtures';

const trialClass = {
  ...openClass,
  id: '44444444-4444-4444-8444-444444444445',
  name: 'Buổi học thử HTML',
  code: 'HTML-TRIAL-CLASS-101',
};
const otherId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

async function fixture(page: Page, options: { empty?: boolean; free?: boolean } = {}) {
  await mockCoursesApi(page);
  const calls: string[] = [];
  const state = { failure: false };
  await page.route(`**/api/v1/courses/${otherId}/classes?**`, (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 1, pageSize: 100 } }),
  );
  await page.route(`**/api/v1/courses/${courseId}/classes?**`, (route) => {
    const url = new URL(route.request().url());
    calls.push(url.pathname + url.search);
    if (state.failure)
      return route.fulfill({ status: 503, json: { code: 'UNAVAILABLE', message: 'Unavailable' } });
    const pageNumber = Number(url.searchParams.get('page'));
    return route.fulfill({
      json: {
        items: pageNumber === 1 ? [openClass] : [trialClass],
        page: pageNumber,
        pageSize: 1,
        total: options.empty ? 1 : 2,
      },
    });
  });
  await page.route(`**/api/v1/classes/${trialClass.id}`, (route) =>
    route.fulfill({ json: { ...timetable, ...trialClass } }),
  );
  if (options.free) {
    await page.route('**/api/v1/courses?**', (route) =>
      route.fulfill({
        json: { items: [{ ...course, priceAmount: 0 }], total: 1, page: 1, pageSize: 100 },
      }),
    );
    await page.route(`**/api/v1/courses/${courseId}`, (route) =>
      route.fulfill({ json: { ...detail, priceAmount: 0 } }),
    );
  }
  return { calls, state };
}

test('Trial invitation finds a trial on a later class page without a visible trial filter', async ({
  page,
  isMobile,
}, testInfo) => {
  const { calls } = await fixture(page);
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Mở trình đơn' }).click();
  await page
    .getByRole('navigation', {
      name: isMobile ? 'Điều hướng di động' : 'Điều hướng chính',
      exact: true,
    })
    .getByRole('link', { name: 'Bạn muốn học thử?', exact: true })
    .click();
  await expect(page).toHaveURL('/trial');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bạn muốn học thử?');
  await expect(page.locator('main article')).toHaveCount(1);
  expect(calls.some((call) => call.includes('page=2'))).toBe(true);
  await expect(page.getByRole('checkbox', { name: /học thử/ })).toHaveCount(0);
  await expect(page.locator('[data-course-filters]')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Sắp xếp:' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /lọc.*học thử|chỉ xem.*học thử/i })).toHaveCount(0);
  for (const width of isMobile ? [320, 390] : [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: testInfo.outputPath(`trial-${width}.png`),
      fullPage: true,
      animations: 'disabled',
    });
  }
  await page.getByRole('link', { name: course.title, exact: true }).click();
  const picker = page.getByRole('dialog');
  await expect(
    picker.getByRole('heading', { name: 'Chọn lớp học thử phù hợp với bạn' }),
  ).toBeVisible();
  await expect(
    picker.getByRole('button', { name: `Xem lịch ${openClass.name}`, exact: true }),
  ).toHaveCount(0);
  await picker.getByRole('button', { name: `Xem lịch ${trialClass.name}`, exact: true }).click();
  await expect(picker.getByRole('button', { name: 'Đăng ký học thử', exact: true })).toBeVisible();
  // A trial marker never rewrites a paid course's price.
  await expect(picker.getByText('Học thử · 0đ', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('trial-picker.png'), animations: 'disabled' });
});

test('Zero-priced trial uses the existing cart request without inventing free enrollment', async ({
  page,
}) => {
  await fixture(page, { free: true });
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: testUser }));
  const writes: { path: string; body: unknown }[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/v1/me/'))
      writes.push({ path: new URL(request.url()).pathname, body: request.postDataJSON() });
  });
  await page.route('**/api/v1/me/cart/items', (route) =>
    route.fulfill({ json: { items: [], totalAmount: 0 } }),
  );
  await page.goto(`/courses/${courseId}?trial=true`);
  const picker = page.getByRole('dialog');
  await expect(picker.getByText('Học thử · 0đ', { exact: true })).toBeVisible();
  await picker.getByRole('button', { name: `Xem lịch ${trialClass.name}`, exact: true }).click();
  await picker.getByRole('button', { name: 'Đăng ký học thử', exact: true }).click();
  await expect(
    picker.getByText('Đã thêm lớp vào giỏ hàng. Chỗ học được giữ khi bạn tạo đơn thanh toán.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(writes).toEqual([{ path: '/api/v1/me/cart/items', body: { classId: trialClass.id } }]);
});

test('Trial discovery distinguishes failed lookup, retry and an empty result', async ({ page }) => {
  const { state } = await fixture(page, { empty: true });
  state.failure = true;
  await page.goto('/trial');
  await expect(page.getByText('Chưa thể tải khóa học', { exact: true })).toBeVisible();
  state.failure = false;
  await page.getByRole('button', { name: /Thử lại/ }).click();
  await expect(page.getByText('Chưa có lớp học thử phù hợp', { exact: true })).toBeVisible();
  await expect(page.locator('main article')).toHaveCount(0);
});
