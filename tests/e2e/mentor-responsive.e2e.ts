import { expect, test } from '@playwright/test';
import { mockMentor, mentorIds } from './mentor-fixtures';

test('mentor chapters adapt to available space and keep drafts while resizing', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'This test covers its own viewport matrix.');
  await mockMentor(page, { extraUnits: true });
  await page.setViewportSize({ width: 1009, height: 869 });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  const sidebar = page.getByRole('complementary', { name: 'Nội dung khóa học' });
  const content = page.getByRole('region', { name: 'Nội dung chương', exact: true });
  const selector = page.getByLabel('Chương đang xem');
  const create = page.getByRole('button', { name: 'Thêm nội dung', exact: true });
  await expect(page.getByRole('heading', { name: 'Nội dung theo buổi học' })).toBeVisible();

  for (const viewport of [
    { width: 320, height: 800, columns: false },
    { width: 390, height: 844, columns: false },
    { width: 768, height: 1024, columns: false },
    { width: 834, height: 1112, columns: true },
    { width: 1009, height: 869, columns: true },
    { width: 1024, height: 768, columns: false },
    { width: 1280, height: 800, columns: true },
    { width: 1440, height: 900, columns: true },
    { width: 1009, height: 600, columns: true },
  ]) {
    await page.setViewportSize(viewport);
    await expect(selector).toBeVisible({ visible: !viewport.columns });
    const railBox = await sidebar.boundingBox();
    const contentBox = await content.boundingBox();
    expect(railBox && contentBox).toBeTruthy();
    if (railBox && contentBox) {
      if (viewport.columns) {
        expect(railBox.x + railBox.width).toBeLessThanOrEqual(contentBox.x + 1);
        expect(Math.abs(railBox.y - contentBox.y)).toBeLessThan(1);
      } else {
        expect(railBox.height).toBeLessThan(240);
        expect(contentBox.y).toBeGreaterThanOrEqual(railBox.y + railBox.height - 1);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (viewport.width === 1009 && viewport.height === 869) {
      await expect(create).toBeInViewport();
      await page.screenshot({ path: 'test-results/mentor-responsive-1009.png', fullPage: true });
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await selector.selectOption(mentorIds.nextUnit);
  await expect(
    page.getByRole('heading', { name: 'State, sự kiện và render danh sách' }),
  ).toBeVisible();
  await create.click();
  const title = page.getByLabel('Tiêu đề', { exact: true });
  await title.fill('Bản nháp đang soạn');
  for (const width of [320, 1009, 1024, 1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(title).toHaveValue('Bản nháp đang soạn');
    await expect(page.getByRole('heading', { name: 'Thêm nội dung mới' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      await page
        .locator(
          'form input:visible, form textarea:visible, form select:visible, form button:visible',
        )
        .evaluateAll((fields) => {
          const form = fields[0]?.closest('form')?.getBoundingClientRect();
          return (
            Boolean(form) &&
            fields.every((field) => {
              const rect = field.getBoundingClientRect();
              return form && rect.left >= form.left - 1 && rect.right <= form.right + 1;
            })
          );
        }),
    ).toBe(true);
    if (width === 320)
      await page.screenshot({
        path: 'test-results/mentor-responsive-editor-320.png',
        fullPage: true,
      });
  }
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await selector.selectOption(mentorIds.unit);
  await expect(page.getByRole('heading', { name: 'Nội dung theo buổi học' })).toBeVisible();
  await page.screenshot({ path: 'test-results/mentor-responsive-390.png', fullPage: true });
});

test('mentor chapter list and material body scroll independently at tablet width', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'This test uses a tablet viewport.');
  await mockMentor(page, { sessionMaterials: true });
  await page.route('**/api/v1/mentor/classes/*/units?*', (route) =>
    route.fulfill({
      json: {
        page: 1,
        pageSize: 20,
        total: 20,
        items: Array.from({ length: 20 }, (_, index) => ({
          id:
            index === 0
              ? mentorIds.unit
              : `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
          classId: mentorIds.class,
          courseUnitId: mentorIds.material,
          title: `Chương ${index + 1}: Cấu trúc trang HTML và thẻ ngữ nghĩa trong ứng dụng`,
          position: index + 1,
          status: 'LOCKED',
          unlockAt: null,
        })),
      },
    }),
  );
  await page.setViewportSize({ width: 1009, height: 869 });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  const chapters = page.getByRole('navigation', { name: 'Chương', exact: true });
  const body = page.getByRole('region', { name: 'Nội dung chương - vùng cuộn', exact: true });
  const create = page.getByRole('button', { name: 'Thêm nội dung', exact: true });
  await expect(page.getByRole('heading', { name: 'Nội dung theo buổi học' })).toBeVisible();
  expect(await chapters.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  expect(await body.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  await chapters.scrollIntoViewIfNeeded();
  const before = await create.boundingBox();
  await chapters.focus();
  await page.keyboard.press('End');
  await expect.poll(() => chapters.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  expect(await body.evaluate((node) => node.scrollTop)).toBe(0);
  await body.focus();
  await page.keyboard.press('End');
  await expect.poll(() => body.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  expect(await create.boundingBox()).toEqual(before);
  await expect(
    page.getByRole('region', { name: 'Nội dung chưa gắn buổi học', exact: true }),
  ).toBeInViewport();
});
