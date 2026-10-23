import { expect, test, type Page } from '@playwright/test';
import { mockHomepageApi } from './api-fixtures';
import { adminUser, mockAdminApi } from './admin-fixtures';

async function publicStyles(page: Page) {
  return page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const header = document.querySelector('header');
    const hero = document.querySelector('main section');
    return {
      font: body.fontFamily,
      color: body.color,
      background: body.backgroundColor,
      headerHeight: header?.getBoundingClientRect().height,
      heroBackground: hero ? getComputedStyle(hero).backgroundColor : null,
    };
  });
}

test('Admin styles and portals do not change the public site after client navigation', async ({
  page,
}, testInfo) => {
  await mockHomepageApi(page);
  await mockAdminApi(page);
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const before = await publicStyles(page);
  expect(before.font).toContain('Nunito');
  await page.getByRole('button', { name: `Tài khoản của ${adminUser.displayName}` }).click();
  await page.getByRole('link', { name: 'Trang quản trị', exact: true }).click();
  await expect(page).toHaveURL('/admin');
  await expect(page.getByLabel('Tổng người dùng: 23', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Inter');
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-admin-root]')).toHaveCount(0);
  expect(await publicStyles(page)).toEqual(before);
  await page.screenshot({ path: testInfo.outputPath('public-after-admin.png') });
});
