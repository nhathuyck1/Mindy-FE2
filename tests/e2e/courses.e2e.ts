import { expect, test } from '@playwright/test';
import {
  course,
  courseId,
  detail,
  fullClass,
  mockCoursesApi,
  openClass,
  timetable,
} from './course-fixtures';
import { testUser } from './api-fixtures';

test.beforeEach(async ({ page }) => {
  await mockCoursesApi(page);
});

test('Opens a real course route from home and expands the curriculum', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: course.title, exact: true }).click();
  await expect(page).toHaveURL(`/courses/${courseId}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(course.title);
  const curriculum = page.locator('#giao-trinh');
  await expect(curriculum.getByText(/Điểm yêu cầu.*80%/)).toBeVisible();
  await curriculum.getByRole('button', { name: 'Mở rộng tất cả' }).click();
  await expect(curriculum.getByText(/Điểm yêu cầu.*75%/)).toBeVisible();
  await curriculum.getByRole('button', { name: 'Thu gọn tất cả' }).click();
  await expect(curriculum.getByText(/Điểm yêu cầu.*80%/)).toBeHidden();
});

test('Searches without accents, sorts prices, switches view and filters by supported fields', async ({
  page,
}, testInfo) => {
  await page.goto('/courses');
  const main = page.locator('main');
  await expect(main.locator('article')).toHaveCount(2);
  await page.getByLabel('Sắp xếp:').selectOption('price-asc');
  await expect(main.locator('article').first()).toContainText('Python');
  await page.getByRole('button', { name: 'Chế độ danh sách', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Chế độ danh sách', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('Tìm khóa học', { exact: true }).fill('tu co ban');
  await expect(main.locator('article')).toHaveCount(1);
  await expect(main.locator('article').first()).toContainText(course.title);
  await page.getByLabel('Tìm khóa học', { exact: true }).fill('');
  if (testInfo.project.name === 'mobile')
    await page.getByText('Lọc khóa học', { exact: true }).click();
  const filters = page
    .getByRole('complementary', { name: 'Bộ lọc khóa học' })
    .filter({ visible: true });
  await filters.getByLabel('Dưới 1.000.000 ₫', { exact: true }).check();
  await expect(main.locator('article')).toHaveCount(1);
  await expect(main.locator('article').first()).toContainText('Python');
  const request = page.waitForRequest(
    (request) =>
      request.url().includes('courses?') && request.url().includes('deliveryMode=ONLINE'),
  );
  await filters.getByLabel('Trực tuyến', { exact: true }).check();
  await request;
  await page.getByRole('button', { name: 'Xóa tất cả', exact: true }).click();
  await expect(main.locator('article')).toHaveCount(2);
  await page.getByRole('button', { name: 'Chế độ lưới', exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath('course-catalog.png'), fullPage: true });
});

test('Shows available and full classes, real timetable in UTC+7 and restores dialog focus', async ({
  page,
}, testInfo) => {
  await page.goto(`/courses/${courseId}`);
  const trigger = page.getByRole('button', { name: 'Đăng ký học ngay', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Đóng chọn lớp' })).toBeFocused();
  await expect(dialog.getByText('Còn 4 chỗ', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Hết chỗ', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: `Xem lịch ${openClass.name}`, exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Lịch chi tiết · 2 buổi' })).toBeVisible();
  await expect(dialog.getByText('19:00 – 21:00').first()).toBeVisible();
  await expect(dialog.locator('ol li').first()).toContainText('Buổi đầu tiên');
  await expect(dialog.getByText('Đã hủy', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Giờ Việt Nam (UTC+7)')).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('class-timetable.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByLabel('Hình thức học', { exact: true }).selectOption('OFFLINE');
  await expect(
    dialog.getByRole('button', { name: `Xem lịch ${openClass.name}`, exact: true }),
  ).toHaveCount(0);
  await dialog.getByRole('button', { name: `Xem lịch ${fullClass.name}`, exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Lớp đã hết chỗ', exact: true })).toBeDisabled();
  await expect(dialog.getByText(/Lịch học chi tiết đang được cập nhật/)).toBeVisible();
  if (testInfo.project.name === 'mobile') {
    await dialog.getByRole('button', { name: '← Quay lại danh sách lớp', exact: true }).click();
    await expect(
      dialog.getByRole('button', { name: `Xem lịch ${fullClass.name}`, exact: true }),
    ).toBeFocused();
  }
});

test('Handles unavailable courses, no open classes and timetable failures with retry', async ({
  page,
}) => {
  await page.route(`**/api/v1/courses/${courseId}`, (route) =>
    route.fulfill({ status: 404, json: { code: 'COURSE_NOT_FOUND', message: 'Course not found' } }),
  );
  await page.goto(`/courses/${courseId}`);
  await expect(page.getByText('Không tìm thấy khóa học', { exact: true })).toBeVisible();
  await page.route(`**/api/v1/courses/${courseId}`, (route) => route.fulfill({ json: detail }));
  await page.reload();
  await page.route(`**/api/v1/courses/${courseId}/classes?**`, (route) =>
    route.fulfill({ json: { items: [], page: 1, pageSize: 10, total: 0 } }),
  );
  await page.getByRole('button', { name: 'Đăng ký học ngay', exact: true }).click();
  await expect(page.getByText('Chưa có lớp đang mở', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng chọn lớp' }).click();
  await page.route(`**/api/v1/courses/${courseId}/classes?**`, (route) =>
    route.fulfill({ json: { items: [openClass], page: 1, pageSize: 10, total: 1 } }),
  );
  await page.route(`**/api/v1/classes/${openClass.id}`, (route) =>
    route.fulfill({ status: 404, json: { code: 'CLASS_NOT_FOUND', message: 'Class closed' } }),
  );
  await page.getByRole('button', { name: 'Đăng ký học ngay', exact: true }).click();
  await page.getByRole('button', { name: `Xem lịch ${openClass.name}`, exact: true }).click();
  await expect(page.getByText('Chưa thể xem lịch lớp này', { exact: true })).toBeVisible();
  await page.route(`**/api/v1/classes/${openClass.id}`, (route) =>
    route.fulfill({ json: timetable }),
  );
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Thử lại/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Lịch chi tiết · 2 buổi' })).toBeVisible();
});

test('Search covers every API page and UI pagination changes results', async ({ page }) => {
  const items = Array.from({ length: 101 }, (_, index) => ({
    ...course,
    id: `cccccccc-cccc-4ccc-8ccc-${String(index).padStart(12, '0')}`,
    title: index === 100 ? 'Khóa học trang cuối' : `Khóa học ${index + 1}`,
  }));
  await page.route('**/api/v1/courses?**', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const currentPage = Number(params.get('page'));
    return route.fulfill({
      json: {
        items: items.slice((currentPage - 1) * 100, currentPage * 100),
        page: currentPage,
        pageSize: 100,
        total: 101,
      },
    });
  });
  await page.goto('/courses');
  await expect(page.locator('main article')).toHaveCount(9);
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(page.locator('main article').first()).toContainText('Khóa học 10');
  await page.getByLabel('Tìm khóa học', { exact: true }).fill('trang cuoi');
  await expect(page.locator('main article')).toHaveCount(1);
  await expect(page.locator('main article')).toContainText('Khóa học trang cuối');
});

test('Keeps catalog, detail and class picker within 320px and reports no script errors', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Small mobile viewport');
  await page.setViewportSize({ width: 320, height: 780 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const path of ['/courses', `/courses/${courseId}`]) {
    await page.goto(path);
    await expect(
      page.locator('main article, main aside').filter({ visible: true }).first(),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.screenshot({ path: testInfo.outputPath('course-detail-320.png'), fullPage: true });
  await page.getByRole('button', { name: 'Đăng ký học ngay', exact: true }).click();
  await page.getByRole('button', { name: `Xem lịch ${openClass.name}`, exact: true }).click();
  await expect(page.getByText('19:00 – 21:00').first()).toBeVisible();
  expect(
    await page
      .getByRole('dialog')
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('class-timetable-320.png') });
  expect(errors).toEqual([]);
});

test('Allows anonymous browsing and requires login only to register a selected class', async ({
  page,
}) => {
  let cartRequests = 0;
  await page.route('**/api/v1/me/cart/items', (route) => {
    cartRequests++;
    expect(route.request().postDataJSON()).toEqual({ classId: openClass.id });
    return route.fulfill({
      status: 201,
      json: {
        items: [
          {
            classId: openClass.id,
            classCode: openClass.code,
            className: openClass.name,
            courseId,
            courseTitle: course.title,
            deliveryMode: 'ONLINE',
            startDate: openClass.startDate,
            endDate: openClass.endDate,
            priceSnapshot: course.priceAmount,
            currentPriceAmount: course.priceAmount,
            isPurchasable: true,
            addedAt: '2026-10-15T00:00:00Z',
          },
        ],
        totalAmount: course.priceAmount,
      },
    });
  });
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ json: { user: testUser, accessTokenExpiresAt: '2026-10-15T23:59:59Z' } }),
  );
  await page.goto(`/courses/${courseId}`);
  await page.getByRole('button', { name: 'Đăng ký học ngay', exact: true }).click();
  await page.getByRole('button', { name: `Xem lịch ${openClass.name}`, exact: true }).click();
  await expect(page.getByText('19:00 – 21:00').first()).toBeVisible();
  expect(cartRequests).toBe(0);
  await page.getByRole('button', { name: 'Đăng ký lớp này', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  const destination = `/courses/${courseId}?classId=${openClass.id}`;
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe(destination);
  await expect(page.getByRole('link', { name: /Chưa có tài khoản/ })).toHaveAttribute(
    'href',
    `/register?returnTo=${encodeURIComponent(destination)}`,
  );
  await page.getByLabel('Email', { exact: true }).fill(testUser.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('sample-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(destination);
  await expect(page.getByRole('dialog').getByText('19:00 – 21:00').first()).toBeVisible();
  expect(cartRequests).toBe(0);
  await page.getByRole('button', { name: 'Đăng ký lớp này', exact: true }).click();
  await expect(
    page.getByRole('dialog').getByRole('status').filter({ hasText: 'Đã thêm lớp vào giỏ hàng' }),
  ).toBeVisible();
  expect(cartRequests).toBe(1);
});

test('Aligns card headings, descriptions and larger prices without a login prompt', async ({
  page,
}, testInfo) => {
  await page.goto('/courses');
  await expect(page.locator('main article')).toHaveCount(2);
  const cards = await page.locator('main article').evaluateAll((elements) =>
    elements.map((element) => {
      const heading = element.querySelector('h2')!;
      const description = element.querySelector('h2 + p')!;
      const price = element.querySelector('[data-course-price]')!;
      return {
        heading: heading.getBoundingClientRect().top,
        description: description.getBoundingClientRect().top,
        price: price.getBoundingClientRect().top,
        size: parseFloat(getComputedStyle(price).fontSize),
      };
    }),
  );
  if (testInfo.project.name === 'desktop') {
    expect(Math.abs(cards[0].heading - cards[1].heading)).toBeLessThan(1);
    expect(Math.abs(cards[0].description - cards[1].description)).toBeLessThan(1);
    expect(Math.abs(cards[0].price - cards[1].price)).toBeLessThan(1);
  }
  expect(cards.every((card) => card.size >= 24)).toBe(true);
  await expect(page.getByText('Đăng nhập để bắt đầu', { exact: true })).toHaveCount(0);
});
