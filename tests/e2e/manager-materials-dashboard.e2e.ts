import { expect, test, type Page } from '@playwright/test';
import { mockHomepageApi, testUser } from './api-fixtures';

const courseIds = [
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
];
const titles = ['HTML & CSS từ con số 0', 'JavaScript cơ bản', 'Khóa chưa có tài liệu'];
const unitIds = [
  '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888',
];

async function mockDashboard(page: Page, totals = [50, 25, 25]) {
  await mockHomepageApi(page);
  const calls: URL[] = [];
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ json: { ...testUser, role: 'MANAGER' } }),
  );
  await page.route('**/api/v1/manager/courses?**', (route) => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get('page'));
    return route.fulfill({
      json: {
        items: courseIds.slice((pageNumber - 1) * 2, pageNumber * 2).map((id) => ({
          id,
          code: `COURSE-${courseIds.indexOf(id) + 1}`,
          title: titles[courseIds.indexOf(id)],
          description: null,
          imgUrl: null,
          priceAmount: 100000,
          category: { id: testUser.id, name: 'Lập trình', slug: 'lap-trinh' },
        })),
        page: pageNumber,
        pageSize: 2,
        total: 3,
      },
    });
  });
  await page.route('**/api/v1/manager/courses/*', (route) => {
    const courseId = new URL(route.request().url()).pathname.split('/').at(-1);
    const index = courseIds.findIndex((id) => id === courseId);
    const units = index === 0 ? unitIds.slice(0, 2) : index === 1 ? unitIds.slice(2) : [];
    return route.fulfill({
      json: {
        id: courseId,
        code: `COURSE-${index + 1}`,
        title: titles[index],
        description: null,
        imgUrl: null,
        priceAmount: 100000,
        category: { id: testUser.id, name: 'Lập trình', slug: 'lap-trinh' },
        units: units.map((id, index) => ({
          id,
          unitNumber: index + 1,
          title: `Chương ${index + 1}`,
          description: null,
          requiredScorePercent: 0,
        })),
      },
    });
  });
  await page.route('**/api/v1/manager/materials?**', (route) => {
    calls.push(new URL(route.request().url()));
    return route.fulfill({
      status: 400,
      json: { code: 'HTTP_ERROR', message: ['property courseId should not exist'] },
    });
  });
  await page.route('**/api/v1/manager/course-units/*/materials?**', (route) => {
    const url = new URL(route.request().url());
    calls.push(url);
    const unitId = url.pathname.split('/').at(-2);
    const index = unitIds.findIndex((id) => id === unitId);
    const total = totals[index] ?? 0;
    return route.fulfill({
      json: {
        items: total
          ? [
              {
                id: '77777777-7777-4777-8777-777777777777',
                courseUnitId: unitId,
                title: 'Tài liệu đầu tiên',
                contentType: 'ARTICLE',
                description: null,
                sortOrder: 0,
                availableAt: null,
                sessionId: null,
                createdBy: testUser.id,
                createdInClassId: null,
                revision: 1,
                reviewStatus: 'DRAFT',
                approvedRevision: null,
                reviewedBy: null,
                reviewedAt: null,
                firstApprovedAt: null,
                rejectionReason: null,
                publishedAt: null,
                createdAt: testUser.createdAt,
                updatedAt: testUser.createdAt,
                canEdit: true,
                file: null,
              },
            ]
          : [],
        page: 1,
        pageSize: 1,
        total,
      },
    });
  });
  return calls;
}

test('material dashboard uses server totals across all course pages and shows course percentages', async ({
  page,
}, info) => {
  const calls = await mockDashboard(page);
  await page.setViewportSize(
    info.project.name === 'mobile' ? { width: 320, height: 850 } : { width: 1440, height: 1000 },
  );
  await page.goto('/manager/materials');
  const stats = page.getByRole('region', { name: 'Thống kê tài liệu', exact: true });
  await expect(stats.getByText('100', { exact: true })).toBeVisible();
  await expect(stats.getByText('3', { exact: true })).toBeVisible();
  await expect(stats.getByText('2', { exact: true })).toBeVisible();
  const distribution = page.getByRole('list', { name: 'Số lượng và tỷ lệ tài liệu' });
  await expect(distribution.getByRole('listitem').filter({ hasText: titles[0] })).toContainText(
    '75%',
  );
  await expect(distribution.getByRole('listitem').filter({ hasText: titles[1] })).toContainText(
    '25%',
  );
  const courses = page.getByRole('region', { name: 'Danh sách khóa học', exact: true });
  await expect(courses.getByRole('button', { name: new RegExp(titles[0]) })).toContainText(
    '75 tài liệu',
  );
  await expect(courses.getByRole('button', { name: new RegExp(titles[2]) })).toContainText(
    '0 tài liệu',
  );
  expect(calls).toHaveLength(3);
  expect(
    calls.every(
      (url) =>
        url.pathname.includes('/course-units/') &&
        url.searchParams.get('pageSize') === '1' &&
        !url.searchParams.has('reviewStatus') &&
        !url.searchParams.has('courseId'),
    ),
  ).toBe(true);
  await expect(page.locator('.recharts-sector').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('materials-dashboard.png'), fullPage: true });
});

test('material dashboard keeps unknown counts separate from zero and retries failed statistics', async ({
  page,
}) => {
  await mockDashboard(page);
  let fail = true;
  await page.route('**/api/v1/manager/course-units/*/materials?**', (route) =>
    fail && route.request().url().includes(unitIds[1])
      ? route.fulfill({ status: 503, json: { message: 'Unavailable' } })
      : route.fallback(),
  );
  await page.goto('/manager/materials');
  const chart = page.getByRole('region', { name: 'Tỷ lệ tài liệu theo khóa học', exact: true });
  await expect(chart.getByRole('alert')).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Thống kê tài liệu', exact: true })
      .getByText('—', { exact: true }),
  ).toHaveCount(2);
  await expect(chart.locator('.recharts-sector')).toHaveCount(0);
  fail = false;
  await chart.getByRole('button', { name: 'Làm mới thống kê' }).click();
  await expect(chart.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Số lượng và tỷ lệ tài liệu' })).toContainText('75%');
});

test('material dashboard shows an empty state without invalid percentages', async ({ page }) => {
  await mockDashboard(page, [0, 0, 0]);
  await page.goto('/manager/materials');
  await expect(
    page.getByText('Chưa có tài liệu để hiển thị tỷ lệ.', { exact: true }),
  ).toBeVisible();
  const stats = page.getByRole('region', { name: 'Thống kê tài liệu', exact: true });
  await expect(stats.getByText('0', { exact: true })).toHaveCount(2);
  await expect(page.locator('.recharts-sector')).toHaveCount(0);
});

test('material dashboard retries course details without turning failures into empty courses', async ({
  page,
}) => {
  await mockDashboard(page);
  let fail = true;
  await page.route('**/api/v1/manager/courses/*', (route) =>
    fail ? route.fulfill({ status: 503, json: { message: 'Unavailable' } }) : route.fallback(),
  );
  await page.goto('/manager/materials');
  const chart = page.getByRole('region', { name: 'Tỷ lệ tài liệu theo khóa học', exact: true });
  await expect(chart.getByRole('alert')).toBeVisible();
  await expect(chart.locator('.recharts-sector')).toHaveCount(0);
  const stats = page.getByRole('region', { name: 'Thống kê tài liệu', exact: true });
  await expect(stats.getByText('—', { exact: true })).toHaveCount(2);
  fail = false;
  await chart.getByRole('button', { name: 'Làm mới thống kê' }).click();
  await expect(stats.getByText('100', { exact: true })).toBeVisible();
});
