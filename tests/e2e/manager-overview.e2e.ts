import { expect, test, type Page } from '@playwright/test';
import type { z } from 'zod';
import type { managerDashboardSchema } from '../../src/features/dashboard/schemas/role-dashboard-contracts';
import { testUser } from './api-fixtures';

const classId = '33333333-3333-4333-8333-333333333333';
const orderId = '44444444-4444-4444-8444-444444444444';
function dashboardFixture(): z.infer<typeof managerDashboardSchema> {
  const amounts = [
    0, 1200000, 2400000, 0, 1800000, 3200000, 800000, 3600000, 2400000, 1800000, 0, 4200000,
  ];
  const collected = amounts.reduce((sum, amount) => sum + BigInt(amount), BigInt(0));
  return {
    scope: 'MANAGER',
    timeZone: 'Asia/Ho_Chi_Minh',
    generatedAt: '2026-11-19T10:00:00Z',
    from: '2026-08-22T00:00:00Z',
    to: '2026-11-19T10:00:00Z',
    summary: {
      collectedAmount: String(collected),
      paidOrders: 18,
      pendingAmount: '7800000',
      pendingOrders: 6,
    },
    trend: amounts.map((amount, index) => ({
      date: `2026-11-${String(index + 8).padStart(2, '0')}`,
      amount: String(amount),
      orders: amount ? 2 : 0,
    })),
    paymentMethods: [
      { id: 'PAYOS', name: 'PAYOS', amount: String(collected - BigInt(8000000)), orders: 12 },
      { id: 'CASH', name: 'CASH', amount: '8000000', orders: 6 },
    ],
    courses: [
      { id: 'react', name: 'React và phát triển giao diện', amount: '8000000', orders: 6 },
      {
        id: 'web',
        name: 'Lập trình Web căn bản',
        amount: String(collected - BigInt(8000000)),
        orders: 12,
      },
    ],
    classes: [
      {
        id: classId,
        name: 'Web cơ bản — Lớp tối thứ Ba và thứ Năm',
        amount: String(collected),
        orders: 18,
      },
    ],
    openingAlerts: [
      {
        classId,
        className: 'JavaScript — Lớp khai giảng tháng 11',
        scheduledStartAt: '2026-11-22T11:00:00Z',
        activeStudentCount: 2,
        missingStudents: 1,
      },
    ],
    reconciliation: [
      { orderId, amount: '1800000', reason: 'Khoản thanh toán cần kiểm tra lại trạng thái' },
    ],
  };
}
async function setup(
  page: Page,
  options: { empty?: boolean; failed?: boolean; large?: boolean } = {},
) {
  const data = dashboardFixture();
  if (options.empty) {
    data.summary = { collectedAmount: '0', paidOrders: 0, pendingAmount: '0', pendingOrders: 0 };
    data.trend = [];
    data.paymentMethods = [];
    data.courses = [];
    data.classes = [];
    data.openingAlerts = [];
    data.reconciliation = [];
  }
  if (options.large) data.summary.collectedAmount = '12345678901234567890';
  let failed = options.failed ?? false;
  const calls: string[] = [];
  await page.route('**/api/v1/**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/auth/me'))
      return route.fulfill({ json: { ...testUser, role: 'MANAGER', displayName: 'Quản lý Minh' } });
    if (url.pathname.endsWith('/manager/dashboard')) {
      calls.push(url.search);
      return failed
        ? route.fulfill({ status: 503, json: { message: 'Unavailable' } })
        : route.fulfill({ json: data });
    }
    const review = url.searchParams.get('reviewStatus');
    return route.fulfill({
      json: {
        items: [],
        page: 1,
        pageSize: Number(url.searchParams.get('pageSize') ?? 20),
        total:
          url.pathname.endsWith('/materials') && url.searchParams.get('pageSize') === '1'
            ? review === 'APPROVED'
              ? 28
              : review === 'DRAFT'
                ? 2
                : 5
            : 0,
        asOf: data.generatedAt,
      },
    });
  });
  await page.goto('/manager');
  const dashboard = page.getByRole('region', { name: 'Dashboard theo vai trò', exact: true });
  return {
    data,
    calls,
    dashboard,
    recover: () => {
      failed = false;
    },
  };
}
test('revenue leads the overview and preserves filters and operational destinations', async ({
  page,
  isMobile,
}, info) => {
  const api = await setup(page);
  const summary = page.getByRole('definition').first();
  await expect(summary).toBeVisible();
  const methods = api.dashboard
    .getByRole('region', { name: 'Theo phương thức', exact: true })
    .getByRole('list');
  await expect(methods.getByText('PayOS', { exact: true })).toBeVisible();
  await expect(methods.getByText('Tiền mặt', { exact: true })).toBeVisible();
  await expect(api.dashboard.getByText('đơn đã thu', { exact: true })).toBeVisible();
  await expect(
    api.dashboard.getByRole('link', { name: /JavaScript — Lớp khai giảng/ }),
  ).toHaveAttribute('href', `/manager/schedule?classId=${classId}`);
  await expect(api.dashboard.getByRole('link', { name: 'Xem thu tiền' })).toHaveAttribute(
    'href',
    '/manager/collections',
  );
  await api.dashboard.getByText('Mã đơn', { exact: true }).click();
  await expect(api.dashboard.getByText(orderId, { exact: true })).toBeVisible();
  const filter = api.dashboard.getByRole('combobox', { name: 'Khoảng thời gian', exact: true });
  await filter.selectOption('30');
  await expect.poll(() => api.calls.at(-1)).toContain('days=30');
  const revenuePosition = await api.dashboard.boundingBox();
  const materialPosition = await page
    .getByRole('region', { name: 'Thống kê tài liệu', exact: true })
    .boundingBox();
  expect(revenuePosition!.y).toBeLessThan(materialPosition!.y);
  for (const width of isMobile ? [320, 768] : [1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(
      api.dashboard.locator('[aria-label="Biểu đồ thực thu theo ngày"] .recharts-surface'),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath(`manager-overview-${width}.png`),
      animations: 'disabled',
      scale: 'css',
      fullPage: true,
    });
    const filterBox = await filter.boundingBox();
    expect(filterBox!.height).toBeGreaterThanOrEqual(44);
  }
});
test('empty manager revenue shows zero amounts without invented chart slices', async ({ page }) => {
  const { dashboard } = await setup(page, { empty: true });
  await expect(dashboard.getByText('0 ₫', { exact: true })).toHaveCount(2);
  await expect(dashboard.getByText('Chưa có khoản thu trong kỳ.', { exact: true })).toHaveCount(4);
  await expect(dashboard.locator('.recharts-surface')).toHaveCount(0);
  await expect(dashboard.getByText('Không có cảnh báo.', { exact: true })).toBeVisible();
});
test('manager revenue errors recover without presenting fabricated totals', async ({ page }) => {
  const api = await setup(page, { failed: true });
  await expect(api.dashboard.getByRole('alert')).toContainText('Chưa tải được dashboard');
  await expect(api.dashboard.getByRole('term')).toHaveCount(0);
  api.recover();
  await api.dashboard.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(api.dashboard.getByText('Thực thu', { exact: true }).first()).toBeVisible();
});
test('large money values retain exact digits and fit narrow viewports', async ({
  page,
  isMobile,
}) => {
  const { dashboard } = await setup(page, { large: true });
  const amount = dashboard.getByText('12.345.678.901.234.567.890 ₫', { exact: true });
  await expect(amount).toBeVisible();
  for (const width of isMobile ? [320, 768] : [1024, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const bounds = await amount.boundingBox();
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
  }
});
