import { expect, test, type Page } from '@playwright/test';
import { mockCommerce, classId } from './commerce-fixtures';
const unitId = '66666666-6666-4666-8666-666666666666';
const lockedId = '66666666-6666-4666-8666-666666666667';
const articleId = '77777777-7777-4777-8777-777777777777';
const videoId = '77777777-7777-4777-8777-777777777778';
const fileId = '88888888-8888-4888-8888-888888888888';
const imageId = '88888888-8888-4888-8888-888888888889';
const secondSessionId = '88888888-8888-4888-8888-888888888890';
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
  sessionId: fileId,
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
async function fixture(
  page: Page,
  options: {
    unassigned?: boolean;
    unresolved?: boolean;
    empty?: boolean;
    secondSession?: boolean;
  } = {},
) {
  await mockCommerce(page);
  const state = {
    preview: false,
    failure: false,
    signed: 0,
    lists: [] as string[],
    pages: [] as string[],
    detailFailure: false,
    hiddenOnly: false,
    opens: [] as { path: string; body: unknown }[],
    details: [] as string[],
  };
  await page.route('**/api/v1/materials/*/open', (route) => {
    state.opens.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON(),
    });
    return route.fulfill({ status: 204 });
  });
  const article = {
    ...baseMaterial,
    sessionId: options.unassigned ? null : baseMaterial.sessionId,
  };
  const clip = { ...video, sessionId: options.unresolved ? articleId : video.sessionId };
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
          ...(options.secondSession
            ? [
                {
                  id: secondSessionId,
                  sessionNumber: 2,
                  title: 'Luyện tập độc lập',
                  startsAt: now,
                  endsAt: '2026-10-16T02:00:00Z',
                  roomName: null,
                  status: 'SCHEDULED',
                },
              ]
            : []),
        ],
      },
      { id: lockedId, position: 2, title: 'Cấu trúc điều khiển', status: 'LOCKED', sessions: [] },
    ],
  };
  await page.route('**/api/v1/me/classes**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
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
          items: options.empty ? [] : url.searchParams.get('page') === '1' ? [article] : [clip],
          page: Number(url.searchParams.get('page')),
          pageSize: 100,
          total: options.empty ? 0 : 101,
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
    state.details.push(path);
    if (state.detailFailure)
      return route.fulfill({
        status: 404,
        json: { code: 'MATERIAL_NOT_FOUND', message: 'hidden' },
      });
    return route.fulfill({
      json: path.endsWith(videoId)
        ? {
            ...clip,
            contentHtml: null,
            contentSchemaVersion: null,
            inlineImages: [],
            attachments: [],
          }
        : {
            ...article,
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
  const state = await fixture(page, { secondSession: true });
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/user/materials');
  await expect(page.getByRole('heading', { name: 'Tài liệu học tập' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Khóa học không có quyền' })).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(1);
  expect(state.opens).toHaveLength(0);
  await page.getByRole('link', { name: 'Vào học', exact: true }).click();
  const tabs = page.getByRole('group', { name: 'Nội dung lớp học' });
  await expect(tabs.getByRole('button', { name: 'Chương', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(tabs.getByRole('link', { name: 'Bài tập', exact: true })).toHaveAttribute(
    'href',
    `/user/classes/${classId}/assignments`,
  );
  await expect(tabs.getByRole('link', { name: 'Bài tập', exact: true })).toBeInViewport({
    ratio: 1,
  });
  await page.screenshot({ path: info.outputPath('learning-chapter-header.png'), fullPage: true });
  const session = page.getByRole('region', { name: 'Nội dung buổi 1', exact: true });
  const disclosure = session.getByRole('button', { name: 'Tài liệu buổi học', exact: true });
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  expect(state.lists).toHaveLength(0);
  await disclosure.click();
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  const first = page.getByRole('button', { name: /1\. Biến và kiểu dữ liệu/ });
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  expect(state.details).toHaveLength(0);
  await first.click();
  await expect(page.getByRole('heading', { name: 'Mục tiêu bài học' })).toBeVisible();
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  const articleHeading = page.getByRole('heading', { name: 'Mục tiêu bài học' });
  await articleHeading.scrollIntoViewIfNeeded();
  await expect(articleHeading).toBeInViewport();
  expect(state.details.every((path) => path.endsWith(articleId))).toBe(true);
  await page.screenshot({ path: info.outputPath('learning-inline-initial.png'), fullPage: true });
  await expect(page.getByRole('img', { name: 'Sơ đồ biến' })).toBeVisible();
  await expect.poll(() => state.opens.length).toBe(1);
  expect(state.opens[0]).toEqual({
    path: `/api/v1/materials/${articleId}/open`,
    body: { classId, expectedRevision: 1 },
  });
  expect([...new Set(state.pages)]).toEqual(['1', '2']);
  expect(await page.evaluate(() => document.querySelector('.learning-article script'))).toBeNull();
  await expect(page.locator('.learning-article a[href^="javascript:"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Tham gia buổi học' })).toHaveAttribute(
    'href',
    'https://meet.example.test/class',
  );
  await page.getByRole('button', { name: 'Chuẩn bị tải tệp' }).click();
  await expect(page.getByRole('link', { name: 'Tải tệp đính kèm' })).toHaveAttribute(
    'href',
    /signature=/,
  );
  expect(state.opens).toHaveLength(1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('learning-article.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await first.click();
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('heading', { name: 'Mục tiêu bài học' })).toHaveCount(0);
  await first.press('Enter');
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('heading', { name: 'Mục tiêu bài học' })).toBeVisible();
  await page.getByRole('button', { name: /2\. Video thực hành/ }).click();
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('article', { name: 'Video thực hành', exact: true })).toBeVisible();
  await expect(page.locator('video')).toHaveAttribute('src', /signature=/);
  const before = state.signed;
  await page.getByRole('button', { name: 'Làm mới liên kết' }).click();
  await expect.poll(() => state.signed).toBeGreaterThan(before);
  await page.getByRole('button', { name: /2\. Video thực hành/ }).click();
  await expect(page.locator('video')).toHaveCount(0);
  const reads = state.lists.length;
  const secondSession = page.getByRole('region', { name: 'Nội dung buổi 2', exact: true });
  await secondSession.getByRole('button', { name: 'Tài liệu buổi học', exact: true }).click();
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  await expect(
    secondSession.getByText('Chưa có nội dung được phát hành cho buổi học này.'),
  ).toBeVisible();
  await expect(first).toHaveCount(0);
  expect(state.lists).toHaveLength(reads);
  await tabs.getByRole('button', { name: 'Tài liệu chung', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Nội dung buổi 1', exact: true })).toHaveCount(0);
  if (info.project.name === 'mobile')
    await page.getByRole('combobox', { name: 'Chương đang xem' }).selectOption(lockedId);
  else await page.getByRole('button', { name: /Cấu trúc điều khiển/ }).click();
  await expect(page.getByRole('status')).toContainText('Chương chưa được mở');
  expect(state.lists.every((path) => path.includes(unitId))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('shared and unresolved materials remain in their chapter and toggle inline', async ({
  page,
}, info) => {
  await fixture(page, { unassigned: true, unresolved: true });
  await page.goto(`/user/materials/${classId}`);
  const shared = page.getByRole('region', { name: 'Nội dung chung của chương', exact: true });
  const unknown = page.getByRole('region', { name: 'Buổi học chưa xác định', exact: true });
  await page.getByRole('button', { name: 'Tài liệu chung', exact: true }).click();
  await shared.getByRole('button', { name: /Biến và kiểu dữ liệu/ }).click();
  await expect(shared.getByRole('heading', { name: 'Mục tiêu bài học' })).toBeVisible();
  if (info.project.name === 'desktop')
    await expect(shared.getByRole('heading', { name: 'Mục tiêu bài học' })).toBeInViewport();
  await expect(unknown).toHaveCount(0);
  await page.getByRole('button', { name: 'Chương', exact: true }).click();
  const second = unknown.getByRole('button', { name: /Video thực hành/ });
  await second.click();
  await expect(unknown.getByRole('article', { name: 'Video thực hành' })).toBeVisible();
  await expect(shared.getByRole('heading', { name: 'Mục tiêu bài học' })).toHaveCount(0);
  await second.press('Space');
  await expect(second).toHaveAttribute('aria-expanded', 'false');
  await expect(unknown.getByRole('article')).toHaveCount(0);
});

test('a session without published content keeps its schedule and meeting links', async ({
  page,
}) => {
  const state = await fixture(page, { empty: true });
  await page.goto(`/user/materials/${classId}`);
  const session = page.getByRole('region', { name: 'Nội dung buổi 1', exact: true });
  await expect(session.getByRole('link', { name: 'Tham gia buổi học' })).toBeVisible();
  expect(state.lists).toHaveLength(0);
  await session.getByRole('button', { name: 'Tài liệu buổi học', exact: true }).click();
  await expect(
    session.getByText('Chưa có nội dung được phát hành cho buổi học này.'),
  ).toBeVisible();
  expect(state.details).toHaveLength(0);
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
  const session = page.getByRole('region', { name: 'Nội dung buổi 1', exact: true });
  await session.getByRole('button', { name: 'Tài liệu buổi học', exact: true }).click();
  await expect(session.getByRole('alert')).toContainText('chưa có quyền học');
  await expect(session.getByRole('heading', { name: 'Thực hành cùng mentor' })).toBeVisible();
  state.failure = false;
  state.detailFailure = true;
  await session.getByRole('button', { name: 'Thử lại' }).click();
  await page.getByRole('button', { name: /1\. Biến và kiểu dữ liệu/ }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('không còn khả dụng');
  state.detailFailure = false;
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('heading', { name: 'Mục tiêu bài học' })).toBeVisible();
});
