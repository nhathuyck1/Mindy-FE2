import { expect, test } from '@playwright/test';
import { mockMentor, mentorIds } from './mentor-fixtures';

test('mentor loads lessons independently of empty unit detail and creates from the header', async ({
  page,
}, testInfo) => {
  const { calls } = await mockMentor(page, { sessionMaterials: true });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  const first = page.getByRole('region', { name: 'Nội dung buổi 1', exact: true });
  const second = page.getByRole('region', { name: 'Nội dung buổi 2', exact: true });
  const shared = page.getByRole('region', { name: 'Nội dung chưa gắn buổi học', exact: true });
  await expect(first).toContainText('Bài viết đầu tiên');
  await expect(first).toContainText('Tài liệu thực hành HTML');
  await expect(first).not.toContainText('Video làm quen biểu mẫu');
  await expect(second).toContainText('Video làm quen biểu mẫu');
  await expect(shared).toContainText('Tài liệu dùng chung');
  await expect(
    page.getByRole('region', { name: 'Nội dung có buổi học chưa xác định' }),
  ).toContainText('Nội dung cần kiểm tra buổi');
  await expect(first.getByRole('link', { name: 'Điểm danh' })).toHaveAttribute(
    'href',
    `/mentor/sessions/${mentorIds.session}`,
  );
  await expect(page.getByRole('button', { name: /bài tập/i })).toHaveCount(0);
  await expect(first).toContainText('10:00 16/10/26');
  expect(
    calls.some((call) => call.path === `mentor/classes/${mentorIds.class}/units/${mentorIds.unit}`),
  ).toBe(false);
  const create = page.getByRole('button', { name: /Thêm nội dung/ });
  await expect(create).toHaveCount(1);
  await create.click();
  await expect(page.getByLabel('Gắn với buổi học (tùy chọn)')).toHaveValue('');
  await page.getByLabel('Gắn với buổi học (tùy chọn)').selectOption(mentorIds.nextUnit);
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Hướng dẫn buổi 2');
  await page.getByLabel('Nội dung bài viết', { exact: true }).fill('Nội dung chuẩn bị cho buổi 2');
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Buổi học của tài liệu' })).toContainText(
    'Thực hành biểu mẫu',
  );
  expect(
    calls.find((call) => call.method === 'POST' && call.path.endsWith('/materials'))?.body
      ?.sessionId,
  ).toBe(mentorIds.nextUnit);
  await page.getByRole('button', { name: 'Về danh sách buổi học' }).click();
  await expect(second).toContainText('Hướng dẫn buổi 2');
  await page.getByLabel('Trạng thái nội dung').selectOption('APPROVED');
  await expect(first).toContainText('Tài liệu thực hành HTML');
  await expect(second).toContainText('Không có nội dung khớp trạng thái đang lọc.');
  await first.getByRole('button', { name: /Tài liệu thực hành HTML/ }).click();
  await expect(
    page.getByRole('toolbar', { name: 'Thao tác nội dung' }).getByRole('button'),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Về danh sách buổi học' }).click();
  await page.getByLabel('Trạng thái nội dung').selectOption('');
  if (testInfo.project.name === 'desktop')
    await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(first).toBeVisible();
  await page.screenshot({
    path: `test-results/mentor-sessions-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(create).toHaveCount(1);
  await create.click();
  await expect(page.getByLabel('Gắn với buổi học (tùy chọn)')).toHaveValue('');
  await page.getByLabel('Gắn với buổi học (tùy chọn)').selectOption(mentorIds.nextUnit);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('mentor includes later API pages when grouping session content and retries failed reads', async ({
  page,
}) => {
  await mockMentor(page);
  const pages: number[] = [];
  let fail = true;
  await page.route('**/api/v1/mentor/classes/*/units/*/materials?*', async (route) => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get('page'));
    pages.push(pageNumber);
    if (pageNumber === 2 && fail) {
      fail = false;
      return route.fulfill({
        status: 503,
        json: { message: 'Chưa tải đủ nội dung.', code: 'UNAVAILABLE' },
      });
    }
    return route.fulfill({
      json: {
        page: pageNumber,
        pageSize: 1,
        total: 2,
        items: [
          {
            id: pageNumber === 1 ? mentorIds.material : mentorIds.file,
            courseUnitId: mentorIds.material,
            title: pageNumber === 1 ? 'Nội dung trang đầu' : 'Tài liệu ở trang sau',
            contentType: 'ARTICLE',
            sessionId: mentorIds.session,
            sortOrder: pageNumber,
            description: null,
            availableAt: null,
            createdBy: mentorIds.unit,
            createdInClassId: mentorIds.class,
            revision: 1,
            reviewStatus: 'DRAFT',
            approvedRevision: null,
            reviewedBy: null,
            reviewedAt: null,
            firstApprovedAt: null,
            rejectionReason: null,
            publishedAt: null,
            createdAt: '2026-10-16T03:00:00Z',
            updatedAt: '2026-10-16T03:00:00Z',
            canEdit: false,
            file: null,
          },
        ],
      },
    });
  });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await expect(page.getByRole('alert').filter({ hasText: 'Chưa tải đủ nội dung.' })).toBeVisible();
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Nội dung buổi 1', exact: true })).toContainText(
    'Tài liệu ở trang sau',
  );
  expect(pages).toEqual([1, 2, 1, 2]);
});
