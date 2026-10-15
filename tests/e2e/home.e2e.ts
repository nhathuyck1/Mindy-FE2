import { expect, test } from '@playwright/test';
import { mockHomepageApi } from './api-fixtures';

test.beforeEach(async ({ page }) => {
  await mockHomepageApi(page);
});

test('Renders the homepage with loaded assets and valid navigation', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle(/Mindy Coding/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Học lập trình.*Mở thế giới/);
  const mascot = page.getByRole('img', { name: /Bạn ếch Mindy/ });
  await expect(mascot).toBeVisible();
  await expect
    .poll(() => mascot.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { name: 'Khóa học kiểm thử' })).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(
    await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor),
  ).toBe('rgb(255, 255, 255)');
  const invalidLinks = await page
    .locator('a')
    .evaluateAll((anchors) =>
      anchors
        .filter(
          (anchor) =>
            anchor instanceof HTMLAnchorElement &&
            anchor.hash &&
            !document.getElementById(decodeURIComponent(anchor.hash.slice(1))),
        )
        .map((anchor) => anchor.getAttribute('href')),
    );
  expect(invalidLinks).toEqual([]);

  await page.screenshot({ path: testInfo.outputPath('homepage.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('Filters courses by a real category identifier', async ({ page }) => {
  await page.goto('/');
  const filtered = page.waitForRequest(
    (request) =>
      request.url().includes('courses?') &&
      request.url().includes('categoryId=22222222-2222-4222-8222-222222222222'),
  );
  await page.getByRole('button', { name: 'Lập trình Web', exact: true }).click();
  await filtered;
  await expect(page.getByRole('button', { name: 'Lập trình Web', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('Changes start slides with indicators and keyboard', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const section = page.locator('#bat-dau');
  const slides = section.locator('article');
  const indicator = (index: number) =>
    section.getByRole('button', { name: `Xem nội dung ${index}:`, exact: false });
  await expect(
    section.getByRole('button', { name: 'Nội dung tiếp theo', exact: true }),
  ).toHaveCount(0);
  await expect(section.getByRole('button', { name: 'Nội dung trước', exact: true })).toHaveCount(0);

  await expect(indicator(1)).toHaveAttribute('aria-current', 'true');
  await indicator(2).click();
  await expect(indicator(2)).toHaveAttribute('aria-current', 'true');
  await expect(slides.nth(1).getByRole('link')).toBeInViewport();
  await expect(slides.nth(0)).toHaveAttribute('inert', '');
  await indicator(3).click();
  await expect(indicator(3)).toHaveAttribute('aria-current', 'true');
  await indicator(2).click();
  await expect(indicator(2)).toHaveAttribute('aria-current', 'true');
  await section.getByRole('region').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(indicator(1)).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(indicator(3)).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(indicator(1)).toHaveAttribute('aria-current', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Automatically advances every three seconds even while hovered or focused', async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.mouse.move(0, 0);
  const indicator = (index: number) =>
    page.getByRole('button', { name: `Xem nội dung ${index}:`, exact: false });
  await indicator(1).hover();
  await expect(indicator(1)).toHaveAttribute('aria-current', 'true');
  for (const index of [2, 3, 1]) {
    await page.clock.runFor(3600);
    await expect(indicator(index)).toHaveAttribute('aria-current', 'true');
  }
  await indicator(2).click();
  await expect(indicator(2)).toHaveAttribute('aria-current', 'true');
  await page.clock.runFor(3600);
  await expect(indicator(3)).toHaveAttribute('aria-current', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page
    .locator('#start-slider')
    .evaluate((element) => element.scrollTo({ left: 0, behavior: 'instant' }));
  await page.getByRole('heading', { level: 1 }).click();
  await page.mouse.move(0, 0);
  await expect(indicator(1)).toHaveAttribute('aria-current', 'true');
  await page.clock.runFor(7000);
  await expect(indicator(1)).toHaveAttribute('aria-current', 'true');
});

test('Swipes between start slides on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Touch interaction');
  await page.goto('/');
  const slider = page.locator('#start-slider');
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  if (!box) throw new Error('Start slider is missing');
  const session = await page.context().newCDPSession(page);
  const y = Math.max(100, box.y + 100);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: box.x + box.width * 0.85, y }],
  });
  for (const fraction of [0.7, 0.5, 0.3, 0.1]) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: box.x + box.width * fraction, y }],
    });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByRole('button', { name: 'Xem nội dung 2:', exact: false })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await session.detach();
});

test('Opens mobile navigation and follows a section link', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile disclosure behavior');
  await page.goto('/');
  const trigger = page.locator('button[aria-controls="mobile-navigation"]');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page
    .getByRole('navigation', { name: 'Điều hướng di động' })
    .getByRole('link', { name: 'Khám phá khóa học' })
    .click();
  await expect(page).toHaveURL(/\/courses$/);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Mở trình đơn' }).click();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('Provides a return path for an unknown route', async ({ page }) => {
  const response = await page.goto('/trang-khong-ton-tai');
  expect(response?.status()).toBe(404);
  await page.getByRole('link', { name: /Về trang chủ/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Học lập trình/);
});
