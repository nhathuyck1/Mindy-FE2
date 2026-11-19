import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { adminClasses, adminCourses, adminUsers, mockAdminApi } from './admin-fixtures';

const resources = [
  { route: 'users', name: adminUsers[0].displayName, detail: adminUsers[0].email },
  {
    route: 'courses',
    name: adminCourses[0].title,
    detail: adminCourses[0].description ?? 'Chưa có mô tả',
  },
  { route: 'classes', name: adminClasses[0].name, detail: 'Trực tuyến' },
];

for (const resource of resources) {
  test(`${resource.route} table expands records independently of selection with keyboard and responsive details`, async ({
    page,
  }, info) => {
    await mockAdminApi(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const requests: { path: string; method: string }[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/admin/')) {
        requests.push({ path: new URL(request.url()).pathname, method: request.method() });
      }
    });
    await page.setViewportSize({
      width: info.project.name === 'mobile' ? 320 : 1440,
      height: 1000,
    });
    await page.goto(`/admin/${resource.route}`);
    const table = page.getByRole('table');
    const toggle = table.getByRole('button', {
      name: `Xem thông tin: ${resource.name}`,
      exact: true,
    });
    const row = table.locator('tbody').filter({
      has: page.getByRole('button', { name: `Xem thông tin: ${resource.name}`, exact: true }),
    });
    const checkbox = row.getByRole('checkbox', { name: `Chọn ${resource.name}`, exact: true });
    const details = row.getByRole('region');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.focus();
    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(details).toContainText(resource.detail);
    await expect(checkbox).not.toBeChecked();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await checkbox.check();
    await expect(details).toBeVisible();
    await expect(
      table.getByRole('checkbox', { name: 'Chọn tất cả dòng trong trang' }),
    ).toHaveAttribute('aria-checked', 'mixed');
    const selectAll = table.getByRole('checkbox', { name: 'Chọn tất cả dòng trong trang' });
    await expect(selectAll.locator('.lucide-minus')).toBeVisible();
    await expect(selectAll.locator('.lucide-check')).toBeHidden();
    await selectAll.click();
    await expect(selectAll).toBeChecked();
    await expect(selectAll.locator('.lucide-check')).toBeVisible();
    await expect(selectAll.locator('.lucide-minus')).toBeHidden();
    await selectAll.click();
    await expect(selectAll).not.toBeChecked();
    await expect(selectAll.locator('[data-slot="checkbox-indicator"]')).toHaveCount(0);
    await checkbox.check();
    const columnCount = await table.locator('thead th').count();
    await expect(row.locator('.admin-details-row td')).toHaveAttribute(
      'colspan',
      String(columnCount),
    );
    const secondToggle = table.getByRole('button', { name: /^Xem thông tin:/ }).nth(1);
    await secondToggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(checkbox).toBeChecked();
    await toggle.click();
    await expect(details).toBeVisible();
    // Leave the table at its start so the disclosure and its content are captured together.
    await page.getByRole('region', { name: /^Bảng / }).evaluate((node) => {
      node.scrollLeft = 0;
    });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('img:visible').evaluateAll(async (nodes) => {
      await Promise.all(
        nodes.map((node) =>
          node instanceof HTMLImageElement ? node.decode().catch(() => {}) : Promise.resolve(),
        ),
      );
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const bounds = await details.boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await mkdir('.impeccable/review', { recursive: true });
    await page.screenshot({
      path: `.impeccable/review/${resource.route}-${info.project.name}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    if (info.project.name === 'desktop') {
      for (const width of [768, 1024]) {
        await page.setViewportSize({ width, height: 1000 });
        const panel = await details.boundingBox();
        expect(panel!.x + panel!.width).toBeLessThanOrEqual(width);
        await page.screenshot({
          path: `.impeccable/review/${resource.route}-${width}.png`,
          fullPage: true,
          animations: 'disabled',
        });
      }
    }
    await page.getByRole('button', { name: 'Cột hiển thị' }).click();
    await page.getByRole('checkbox', { name: 'Trạng thái', exact: true }).uncheck();
    await page.keyboard.press('Escape');
    await expect(row.locator('.admin-details-row td')).toHaveAttribute(
      'colspan',
      String(columnCount - 1),
    );
    await toggle.focus();
    await toggle.press('Space');
    await expect(details).toHaveCount(0);
    await expect(toggle).toBeFocused();
    expect(requests.every((request) => request.method === 'GET')).toBe(true);
    expect(
      requests.some((request) => request.path.startsWith(`/api/v1/admin/${resource.route}/`)),
    ).toBe(false);
  });
}
