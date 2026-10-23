import { expect, test, type Page } from '@playwright/test';
import { mockCommerce, classId } from './commerce-fixtures';
const unitId = '66666666-6666-4666-8666-666666666666';
const lockedId = '66666666-6666-4666-8666-666666666667';
const articleId = '77777777-7777-4777-8777-777777777777';
const videoId = '77777777-7777-4777-8777-777777777778';
const fileId = '88888888-8888-4888-8888-888888888888';
const imageId = '88888888-8888-4888-8888-888888888889';
const courseId = '33333333-3333-4333-8333-333333333333';
const now = '2026-10-16T00:00:00Z';
const mentor = { id: '55555555-5555-4555-8555-555555555555', displayName: 'Mentor Mindy' };
const file = {
  id: fileId,
  originalFilename: 'bai-tap.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 2048,
  kind: 'PDF',
};
const image = {
  ...file,
  id: imageId,
  originalFilename: 'diagram.png',
  mimeType: 'image/png',
  kind: 'IMAGE',
};
const baseMaterial = {
  id: articleId,
  classId,
  classUnitId: unitId,
  courseUnitId: unitId,
  contentType: 'ARTICLE',
  title: 'Biến và kiểu dữ liệu',
  description: 'Làm quen với những dòng mã đầu tiên.',
  sortOrder: 1,
  revision: 1,
  sessionId: null,
  availableAt: null,
  publishedAt: now,
  updatedAt: now,
  file: null,
  attachmentCount: 1,
};
const video = {
  ...baseMaterial,
  id: videoId,
  contentType: 'VIDEO',
  title: 'Video thực hành',
  sortOrder: 2,
  file: { ...file, kind: 'VIDEO', mimeType: 'video/mp4', originalFilename: 'bai-hoc.mp4' },
  attachmentCount: 0,
};
async function fixture(page: Page) {
  await mockCommerce(page);
  const state = {
    preview: false,
    failure: false,
    signed: 0,
    lists: [] as string[],
    pages: [] as string[],
    detailFailure: false,
    hiddenOnly: false,
  };
  const context = {
    id: classId,
    courseId,
    code: 'WEB-A',
    name: 'Lập trình Web căn bản',
    startDate: '2026-10-01',
    endDate: '2026-12-01',
    deliveryMode: 'ONLINE',
    maxStudents: 20,
    availableSeats: 5,
    mentor,
    classStatus: 'IN_PROGRESS',
    enrollmentId: articleId,
    enrollmentStatus: 'ACTIVE',
    enrolledAt: now,
    accessMode: 'FULL',
    meetingUrl: null,
    units: [
      {
        id: unitId,
        position: 1,
        title: 'Bắt đầu với lập trình',
        status: 'OPEN',
        sessions: [
          {
            id: fileId,
            sessionNumber: 1,
            title: 'Thực hành cùng mentor',
            startsAt: now,
            endsAt: '2026-10-16T02:00:00Z',
            roomName: null,
            status: 'SCHEDULED',
            meetingUrl: 'https://meet.example.test/class',
          },
        ],
      },
      { id: lockedId, position: 2, title: 'Cấu trúc điều khiển', status: 'LOCKED', sessions: [] },
    ],
  };
  await page.route('**/api/v1/me/classes**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.endsWith('/assignments'))
      return route.fulfill({ json: { items: [], page: 1, pageSize: 100, total: 0 } });
    if (path === '/api/v1/me/classes')
      return route.fulfill({
        json: {
          items: [
            {
              enrollmentId: articleId,
              enrollmentStatus: 'ACTIVE',
              enrolledAt: now,
              createdAt: now,
              isHoldExpired: false,
              courseId,
              courseCode: 'WEB101',
              courseTitle: context.name,
              courseImageUrl: null,
              classId,
              classCode: context.code,
              className: 'Lớp Web buổi tối',
              classStatus: 'IN_PROGRESS',
              deliveryMode: 'ONLINE',
              startDate: context.startDate,
              endDate: context.endDate,
              mentor,
              order: null,
              accessMode: state.preview ? 'CASH_PREVIEW' : 'FULL',
              accessReason: state.preview ? 'PENDING_CASH' : 'ACTIVE_ENROLLMENT',
              canViewClass: true,
              canViewSchedule: true,
            },
          ].flatMap((item) =>
            state.hiddenOnly
              ? [{ ...item, accessMode: 'NONE', canViewClass: false }]
              : [
                  item,
                  {
                    ...item,
                    enrollmentId: videoId,
                    courseTitle: 'Khóa học không có quyền',
                    accessMode: 'NONE',
                    canViewClass: false,
                  },
                ],
          ),
          page: 1,
          pageSize: 100,
          total: state.hiddenOnly ? 1 : 2,
          asOf: now,
        },
      });
    if (path.endsWith('/preview'))
      return route.fulfill({
        json: {
          ...context,
          accessMode: 'CASH_PREVIEW',
          enrollmentStatus: 'PENDING_PAYMENT',
          expiresAt: '2026-10-17T00:00:00Z',
          orderId: fileId,
          orderCode: 'MDCASH',
        },
      });
    if (path === `/api/v1/me/classes/${classId}`) return route.fulfill({ json: context });
    if (path.endsWith('/materials') && path.includes('/units/')) {
      state.lists.push(path);
      state.pages.push(url.searchParams.get('page') ?? '');
      if (state.failure)
        return route.fulfill({
          status: 403,
          json: { code: 'CLASS_ACCESS_DENIED', message: 'No access' },
        });
      return route.fulfill({
        json: {
          items: url.searchParams.get('page') === '1' ? [baseMaterial] : [video],
          page: Number(url.searchParams.get('page')),
          pageSize: 100,
          total: 101,
          asOf: now,
        },
      });
    }
    if (path.endsWith('/access')) {
      state.signed++;
      const inline = path.includes(`/files/${imageId}/`);
      return route.fulfill({
        json: {
          materialId: path.includes(articleId) ? articleId : videoId,
          fileId: inline ? imageId : fileId,
          role: inline ? 'INLINE_IMAGE' : path.includes(articleId) ? 'ATTACHMENT' : 'PRIMARY',
          revision: 1,
          url: `https://files.example.test/${inline ? 'diagram.png' : 'file'}?signature=${state.signed}`,
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        },
      });
    }
    if (state.detailFailure)
      return route.fulfill({
        status: 404,
        json: { code: 'MATERIAL_NOT_FOUND', message: 'hidden' },
      });
    return route.fulfill({
      json: path.endsWith(videoId)
        ? {
            ...video,
            contentHtml: null,
            contentSchemaVersion: null,
            inlineImages: [],
            attachments: [],
          }
        : {
            ...baseMaterial,
            contentHtml:
              '<h2>Mục tiêu bài học</h2><p>Hiểu cách khai báo biến và sử dụng kiểu dữ liệu.</p><ul><li>Đặt tên biến rõ ràng</li><li>Thực hành với ví dụ</li></ul><img data-file-id="' +
              imageId +
              '" alt="Sơ đồ biến"><a href="javascript:alert(1)">Liên kết không hợp lệ</a><script>window.hacked=true</script>',
            contentSchemaVersion: 1,
            inlineImages: [image],
            attachments: [file],
          },
    });
  });
  await page.route('https://files.example.test/**', (route) =>
    route.request().url().includes('diagram.png')
      ? route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="560" height="120"><rect width="560" height="120" rx="12" fill="#eef6f5"/><text x="30" y="68" font-size="22" fill="#1d5b57">name = "Mindy"</text></svg>',
        })
      : route.fulfill({ status: 503, body: '' }),
  );
  return state;
}

test('Student opens materials, reads article and attachments, changes lessons and locked units', async ({
  page,
}, info) => {
  const state = await fixture(page);
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/user/materials');
  await expect(page.getByRole('heading', { name: 'Tài liệu học tập' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Khóa học không có quyền' })).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('link', { name: 'Vào học', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mục tiêu bài học' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Sơ đồ biến' })).toBeVisible();
  expect(state.pages).toEqual(['1', '2']);
  expect(await page.evaluate(() => document.querySelector('.learning-article script'))).toBeNull();
  await expect(page.locator('.learning-article a')).not.toHaveAttribute('href', /javascript/);
  await expect(page.getByRole('link', { name: 'Tham gia buổi học' })).toHaveAttribute(
    'href',
    'https://meet.example.test/class',
  );
  await page.getByRole('button', { name: 'Chuẩn bị tải tệp' }).click();
  await expect(page.getByRole('link', { name: 'Tải tệp đính kèm' })).toHaveAttribute(
    'href',
    /signature=/,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('learning-article.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Bài tiếp theo' }).click();
  await expect(page.getByRole('heading', { name: 'Video thực hành', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mở nội dung', exact: true }).click();
  await expect(page.locator('video')).toHaveAttribute('src', /signature=/);
  const before = state.signed;
  await page.getByRole('button', { name: 'Làm mới liên kết' }).click();
  await expect.poll(() => state.signed).toBeGreaterThan(before);
  await page.getByRole('button', { name: /Cấu trúc điều khiển/ }).click();
  await expect(page.getByRole('status')).toContainText('Chương chưa được mở');
  expect(state.lists.every((path) => path.includes(unitId))).toBe(true);
});

test('Cash preview shows curriculum without loading private materials', async ({ page }) => {
  const state = await fixture(page);
  state.preview = true;
  await page.goto('/user/materials');
  await page.getByRole('link', { name: 'Xem trước chương' }).click();
  await expect(page.getByRole('status')).toContainText('chế độ xem trước');
  await expect(page.getByRole('link', { name: 'Tham gia buổi học' })).toHaveCount(0);
  expect(state.lists).toHaveLength(0);
  expect(state.signed).toBe(0);
});

test('Hides inaccessible classes and shows an empty state without pagination', async ({ page }) => {
  const state = await fixture(page);
  state.hiddenOnly = true;
  await page.goto('/user/materials');
  await expect(page.getByRole('status')).toContainText('Chưa có lớp học nào có quyền truy cập');
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByText('Chưa có quyền truy cập', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Vào học' })).toHaveCount(0);
});

test('Access revocation and hidden material have recoverable states', async ({ page }) => {
  const state = await fixture(page);
  state.failure = true;
  await page.goto(`/user/materials/${classId}`);
  await expect(page.getByRole('main').getByRole('alert')).toContainText('chưa có quyền học');
  state.failure = false;
  state.detailFailure = true;
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('không còn khả dụng');
  state.detailFailure = false;
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('heading', { name: 'Mục tiêu bài học' })).toBeVisible();
});
