import { expect, test, type Page } from '@playwright/test';
import { testUser, mockHomepageApi } from './api-fixtures';
import type { MaterialDetail } from '../../src/features/manager/schemas/manager-contracts';

const id = '77777777-7777-4777-8777-777777777777';
const unitId = '55555555-5555-4555-8555-555555555555';
const emptyUnitId = '66666666-6666-4666-8666-666666666666';
const courseId = '33333333-3333-4333-8333-333333333333';
const date = '2026-10-16T03:00:00Z';
async function mockManager(
  page: Page,
  options: {
    role?: string;
    conflict?: boolean;
    ownDraft?: boolean;
    unitPaging?: boolean;
    fileMaterial?: boolean;
    scrollContent?: boolean;
  } = {},
) {
  await mockHomepageApi(page);
  const calls: {
    path: string;
    search: string;
    method: string;
    body: Record<string, unknown> | null;
  }[] = [];
  let material: MaterialDetail = {
    id,
    courseUnitId: unitId,
    title: 'Hướng dẫn JavaScript cơ bản',
    description: 'Tài liệu thực hành cho học viên',
    contentType: 'ARTICLE',
    contentHtml:
      '<h2>Biến và kiểu dữ liệu</h2><p>Nội dung học liệu cần kiểm duyệt.</p><script>parent.alert("unsafe")</script>',
    contentSchemaVersion: 1,
    inlineImages: [],
    attachments: [],
    file: null,
    sortOrder: 0,
    availableAt: null,
    sessionId: null,
    createdBy: options.ownDraft ? testUser.id : unitId,
    createdInClassId: options.ownDraft ? null : courseId,
    reviewStatus: options.ownDraft ? 'DRAFT' : 'PENDING_REVIEW',
    revision: 3,
    approvedRevision: null,
    reviewedBy: null,
    reviewedAt: null,
    firstApprovedAt: null,
    rejectionReason: null,
    publishedAt: null,
    createdAt: date,
    updatedAt: date,
    canEdit: true,
  };
  if (options.fileMaterial) {
    material = {
      ...material,
      title: 'Yêu cầu bài thuyết trình',
      description: 'Hướng dẫn chuẩn bị nội dung và tiêu chí đánh giá.',
      contentType: 'FILE',
      contentHtml: null,
      reviewStatus: 'APPROVED',
      approvedRevision: 3,
      publishedAt: date,
      availableAt: '2026-10-27T09:00:00Z',
      file: {
        id: '88888888-8888-4888-8888-888888888888',
        originalFilename: 'CP1 Presentation Requirements EXE101SU26.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 136315,
        kind: 'PDF',
      },
    };
  }
  if (options.scrollContent) {
    material.attachments = Array.from({ length: 12 }, (_, index) => ({
      id: `aaaaaaaa-aaaa-4aaa-8aaa-${String(index).padStart(12, '0')}`,
      originalFilename: `Tài liệu thực hành ${index + 1}.pdf`,
      mimeType: 'application/pdf',
      kind: 'PDF',
      sizeBytes: 136315,
    }));
  }
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1/', '');
    const body: Record<string, unknown> | null = request.postData() ? request.postDataJSON() : null;
    const method = request.method();
    calls.push({ path, search: url.search, method, body });
    if (path === 'auth/me')
      return route.fulfill({
        json: { ...testUser, role: options.role ?? 'MANAGER', displayName: 'Quản lý Minh' },
      });
    if (path === 'auth/login')
      return route.fulfill({
        json: { user: { ...testUser, role: 'MANAGER' }, accessTokenExpiresAt: date },
      });
    if (method === 'GET' && ['manager/orders', 'manager/classes'].includes(path))
      return route.fulfill({ json: { items: [], page: 1, pageSize: 20, total: 0 } });
    const unitList = /^manager\/course-units\/([^/]+)\/materials$/.exec(path);
    if (method === 'GET' && (path === 'manager/materials' || unitList)) {
      const status = url.searchParams.get('reviewStatus');
      const type = url.searchParams.get('contentType');
      const matching =
        (!unitList || unitList[1] === unitId) &&
        (!status || status === material.reviewStatus) &&
        (!type || type === material.contentType)
          ? [material]
          : [];
      const allItems =
        matching.length && unitList && options.unitPaging
          ? Array.from({ length: 21 }, (_, index) => ({
              ...material,
              id: index === 0 ? id : `99999999-9999-4999-8999-${String(index).padStart(12, '0')}`,
              title: index === 20 ? 'Học liệu trang 2' : `${material.title} ${index + 1}`,
            }))
          : matching;
      const pageNumber = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
      return route.fulfill({
        json: {
          items: allItems.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
          page: pageNumber,
          pageSize,
          total: allItems.length,
        },
      });
    }
    if (options.unitPaging && method === 'GET' && /^manager\/materials\/99999999-/.test(path))
      return route.fulfill({
        json: { ...material, id: path.split('/').at(-1), title: 'Học liệu trang 2' },
      });
    if (path === `manager/materials/${id}` && method === 'GET')
      return route.fulfill({ json: material });
    if (path === `manager/course-units/${unitId}/materials` && method === 'POST') {
      material = {
        ...material,
        ...body,
        createdBy: testUser.id,
        createdInClassId: null,
        reviewStatus: 'DRAFT',
        revision: 1,
      };
      if (typeof body?.contentText === 'string')
        material.contentHtml =
          '<p>' +
          body.contentText
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('\n', '<br>') +
          '</p>';
      return route.fulfill({ status: 201, json: material });
    }
    if (path === `manager/materials/${id}` && method === 'PATCH') {
      material = {
        ...material,
        ...body,
        reviewStatus: 'DRAFT',
        revision: material.revision + 1,
        publishedAt: null,
        approvedRevision: null,
      };
      return route.fulfill({ json: material });
    }
    if (path.startsWith(`manager/materials/${id}/`)) {
      if (options.conflict) {
        material = { ...material, revision: 4 };
        return route.fulfill({
          status: 409,
          json: { code: 'MATERIAL_REVIEW_CONFLICT', message: 'Changed' },
        });
      }
      const action = path.split('/').at(-1);
      if (action === 'approve')
        material = {
          ...material,
          reviewStatus: 'APPROVED',
          approvedRevision: material.revision,
          publishedAt: date,
          firstApprovedAt: date,
        };
      if (action === 'reject')
        material = {
          ...material,
          reviewStatus: 'REJECTED',
          rejectionReason: String(body?.reason),
          publishedAt: null,
        };
      if (action === 'unpublish') material = { ...material, publishedAt: null };
      if (action === 'publish') material = { ...material, publishedAt: date };
      return route.fulfill({ json: material });
    }
    if (path === `courses/${courseId}`)
      return route.fulfill({
        json: {
          id: courseId,
          code: 'JS-101',
          title: 'Khóa học kiểm thử',
          description: null,
          imgUrl: null,
          priceAmount: 100000,
          category: { id: unitId, name: 'Web', slug: 'web' },
          units: [
            {
              id: unitId,
              unitNumber: 1,
              title: 'JavaScript căn bản',
              description: null,
              requiredScorePercent: 0,
            },
            {
              id: emptyUnitId,
              unitNumber: 2,
              title: 'Học phần chưa có tài liệu',
              description: null,
              requiredScorePercent: 0,
            },
            ...(options.scrollContent
              ? Array.from({ length: 22 }, (_, index) => ({
                  id: `bbbbbbbb-bbbb-4bbb-8bbb-${String(index).padStart(12, '0')}`,
                  unitNumber: index + 3,
                  title: `Chương thực hành ${index + 3}`,
                  description: null,
                  requiredScorePercent: 0,
                }))
              : []),
          ],
          openClasses: [],
        },
      });
    return route.fallback();
  });
  return { calls };
}

test('manager reviews a material, controls publication and has a responsive workspace', async ({
  page,
}, info) => {
  const { calls } = await mockManager(page);
  await page.goto('/manager');
  await expect(page).toHaveURL(/\/manager\/materials$/);
  await expect(page.getByRole('heading', { name: 'Quản lý tài liệu', exact: true })).toBeVisible();
  await page.screenshot({
    path: `test-results/manager-materials-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Toàn bộ tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Xem chi tiết' }).click();
  await expect(page.getByRole('dialog')).toContainText('Phiên bản 3');
  await expect(
    page
      .frameLocator('iframe[title="Xem trước bài viết"]')
      .getByRole('heading', { name: 'Biến và kiểu dữ liệu' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Duyệt tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Đã cập nhật tài liệu.');
  expect(calls.find((call) => call.path.endsWith('/approve'))?.body).toEqual({
    expectedRevision: 3,
  });
  await page.getByRole('button', { name: 'Ẩn tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Xuất bản', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Xuất bản', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Ẩn tài liệu', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Mở menu Manager' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Thu tiền', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thu tiền', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('manager rejects with a reason and never retries a revision conflict', async ({ page }) => {
  const { calls } = await mockManager(page, { conflict: true });
  await page.goto('/manager/materials');
  await page.getByRole('button', { name: 'Toàn bộ tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Xem chi tiết' }).click();
  await page.getByRole('button', { name: 'Yêu cầu chỉnh sửa', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Xác nhận', exact: true })).toBeDisabled();
  await page.getByLabel('Lý do chỉnh sửa').fill('Cần thêm ví dụ minh họa.');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Tài liệu đã thay đổi');
  await expect(page.getByRole('button', { name: 'Xác nhận', exact: true })).toBeDisabled();
  expect(calls.filter((call) => call.path.endsWith('/reject'))).toHaveLength(1);
  expect(calls.find((call) => call.path.endsWith('/reject'))?.body).toEqual({
    expectedRevision: 3,
    reason: 'Cần thêm ví dụ minh họa.',
  });
});

test('manager creates an article in a real course unit and edits a draft', async ({
  page,
}, info) => {
  const { calls } = await mockManager(page);
  await page.goto('/manager/materials');
  await page.getByRole('button', { name: 'Toàn bộ tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài liệu', exact: true }).click();
  await page.getByLabel('Khóa học', { exact: true }).selectOption(courseId);
  await page.getByLabel('Học phần', { exact: true }).selectOption(unitId);
  await page.screenshot({
    path: `test-results/manager-editor-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Bài viết mới');
  await page.getByLabel('Nội dung bài viết (HTML)', { exact: false }).fill('<p>Nội dung mới</p>');
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Trạng thái duyệt', { exact: true }).selectOption('DRAFT');
  await page.getByRole('button', { name: 'Xem chi tiết' }).click();
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Bài viết đã chỉnh sửa');
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bài viết đã chỉnh sửa' })).toBeVisible();
  expect(calls.find((call) => call.method === 'PATCH')?.body?.expectedRevision).toBe(1);
  expect(
    calls.find((call) => call.path === `manager/course-units/${unitId}/materials`)?.body,
  ).toMatchObject({
    title: 'Bài viết mới',
    contentType: 'ARTICLE',
    contentHtml: '<p>Nội dung mới</p>',
  });
});

test('old local receipts remain readable and exportable without changing payments', async ({
  page,
}) => {
  const { calls } = await mockManager(page);
  await page.addInitScript(
    ({ userId }) =>
      localStorage.setItem(
        `mindy:manager:receipt-drafts:v1:${userId}`,
        JSON.stringify([
          {
            id: '99999999-9999-4999-8999-999999999999',
            studentName: 'Học viên cũ',
            className: 'Lớp lưu cũ',
            orderCode: 'OLD-1',
            amount: 1200000,
            method: 'CASH',
            note: '',
            createdAt: '2026-10-16T03:00:00Z',
            status: 'RECORDED_LOCAL',
          },
        ]),
      ),
    { userId: testUser.id },
  );
  await page.goto('/manager/collections');
  await page.getByRole('button', { name: 'Phiếu cũ trên thiết bị', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Học viên cũ');
  await expect(page.getByRole('dialog')).toContainText('không xác nhận thanh toán');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất phiếu cũ CSV', exact: true }).click();
  expect((await downloading).suggestedFilename()).toBe('mindy-phieu-cu-cuc-bo.csv');
  await expect(page.getByRole('button', { name: /Lập phiếu|Ghi nhận phiếu/ })).toHaveCount(0);
  expect(calls.some((call) => call.method !== 'GET')).toBe(false);
});

test('student cannot mount manager data', async ({ page }) => {
  const { calls } = await mockManager(page, { role: 'STUDENT' });
  await page.goto('/manager/materials');
  await expect(
    page.getByRole('heading', { name: 'Tài khoản chưa có quyền Manager' }),
  ).toBeVisible();
  expect(calls.some((call) => call.path.startsWith('manager/'))).toBe(false);
});

async function mockFileUpload(
  page: Page,
  initialState: 'READY' | 'PROCESSING' | 'FAILED' = 'READY',
) {
  let state = initialState;
  const fileId = '88888888-8888-4888-8888-888888888888';
  const files = new Map<string, string>();
  const fileSizes = new Map<string, number>();
  const stageCalls: string[] = [];
  const declarations: unknown[] = [];
  const storedBodies: (Buffer | null)[] = [];
  await page.route('https://storage.example.test/upload', async (route) => {
    stageCalls.push(`storage:${route.request().method()}`);
    storedBodies.push(route.request().postDataBuffer());
    await route.fulfill({
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type',
      },
    });
  });
  await page.route('**/api/v1/files/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    stageCalls.push(path);
    if (path.endsWith('/upload-intents')) {
      const nextId =
        files.size === 0
          ? fileId
          : `88888888-8888-4888-8888-${String(files.size).padStart(12, '0')}`;
      const input: { originalFilename: string; declaredSizeBytes: number } = route
        .request()
        .postDataJSON();
      declarations.push(route.request().postDataJSON());
      files.set(nextId, input.originalFilename);
      fileSizes.set(nextId, input.declaredSizeBytes);
      return route.fulfill({
        status: 201,
        json: {
          fileId: nextId,
          uploadUrl: 'https://storage.example.test/upload',
          requiredHeaders: { 'content-type': 'application/pdf' },
          uploadUrlExpiresAt: '2030-01-01T00:00:00Z',
          intentExpiresAt: '2030-01-01T01:00:00Z',
        },
      });
    }
    const currentFileId = path.split('/')[4];
    return route.fulfill({
      status: path.endsWith('/complete') && state === 'PROCESSING' ? 202 : 200,
      json: {
        id: currentFileId,
        status: state,
        originalFilename: files.get(currentFileId) ?? 'lesson.pdf',
        courseUnitId: unitId,
        declaredSizeBytes: fileSizes.get(currentFileId) ?? 12,
        sizeBytes: state === 'READY' ? (fileSizes.get(currentFileId) ?? 12) : null,
        mimeType: 'application/pdf',
        kind: 'PDF',
        intentExpiresAt: '2030-01-01T01:00:00Z',
        readyAt: state === 'READY' ? date : null,
        metadataStatus: 'PENDING',
        errorCode: state === 'FAILED' ? 'FILE_RETRY_EXHAUSTED' : null,
      },
    });
  });
  return {
    calls: stageCalls,
    declarations,
    storedBodies,
    ready: () => {
      state = 'READY';
    },
  };
}

test('manager uploads a primary file before saving a FILE material', async ({ page }) => {
  const { calls } = await mockManager(page);
  const { calls: stageCalls } = await mockFileUpload(page);
  const fileId = '88888888-8888-4888-8888-888888888888';
  await page.goto('/manager/materials');
  await page.getByRole('button', { name: 'Toàn bộ tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài liệu', exact: true }).click();
  await page.getByLabel('Khóa học', { exact: true }).selectOption(courseId);
  await page.getByLabel('Học phần', { exact: true }).selectOption(unitId);
  await page.getByRole('dialog').getByLabel('Loại tài liệu', { exact: true }).selectOption('FILE');
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Tài liệu PDF kiểm thử');
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /^Chọn tệp để tải lên/ }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: 'lesson.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%%EOF'),
  });
  await expect(
    page.getByRole('dialog').getByText('Đã tải lên thành công', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('dialog').getByText('lesson.pdf', { exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Thay tệp', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(stageCalls).toContain('storage:PUT');
  expect(stageCalls).toContain(`/api/v1/files/${fileId}/complete`);
  expect(
    calls.find(
      (call) => call.path === `manager/course-units/${unitId}/materials` && call.method === 'POST',
    )?.body,
  ).toMatchObject({ fileId, contentType: 'FILE' });
});

test('manager detects PDF metadata and polls automatically after complete', async ({
  page,
}, info) => {
  await mockManager(page);
  const upload = await mockFileUpload(page, 'PROCESSING');
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 780 });
  await page.clock.install();
  await page.goto('/manager/materials');
  await page.getByRole('button', { name: 'Toàn bộ tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài liệu', exact: true }).click();
  await page.getByLabel('Khóa học', { exact: true }).selectOption(courseId);
  await page.getByLabel('Học phần', { exact: true }).selectOption(unitId);
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Loại tài liệu', { exact: true }).selectOption('FILE');
  const bytes = Buffer.from('%PDF-1.4\nTiếng Việt\n%%EOF');
  await dialog.locator('input[type="file"]').first().setInputFiles({
    name: 'Bài học.PDF',
    mimeType: 'application/octet-stream',
    buffer: bytes,
  });
  await expect(dialog.getByText('Đang kiểm tra tệp…', { exact: true })).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Dừng kiểm tra tự động', exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText('application/pdf', { exact: true })).toHaveCount(0);
  await expect(dialog.getByText(`${bytes.length} B`, { exact: true })).toBeVisible();
  await expect(dialog.getByText('Loại đã xác minh:', { exact: true })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Lưu bản nháp', exact: true })).toBeDisabled();
  upload.ready();
  await page.clock.runFor(3001);
  await expect(dialog.getByText('Đã tải lên thành công', { exact: true })).toBeVisible();
  await expect(dialog.getByText(`PDF · ${bytes.length} B`, { exact: true })).toBeVisible();
  await expect(dialog.getByText('Bài học.PDF', { exact: true })).toHaveCount(1);
  await expect(dialog.getByRole('button', { name: 'Lưu bản nháp', exact: true })).toBeInViewport();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const scrollArea = dialog.locator('form > div').first();
  const layout = await scrollArea.evaluate((element) => ({
    width: element.clientWidth,
    scroll: element.scrollWidth,
    children: Array.from(element.querySelectorAll('*'))
      .filter(
        (child) => child.getBoundingClientRect().right > element.getBoundingClientRect().right,
      )
      .map((child) => ({
        tag: child.tagName,
        type: child.getAttribute('type'),
        width: child.getBoundingClientRect().width,
        class: child.className,
      })),
  }));
  expect(layout).toMatchObject({ scroll: layout.width });
  expect(upload.declarations).toEqual([
    {
      courseUnitId: unitId,
      originalFilename: 'Bài học.PDF',
      declaredMimeType: 'application/pdf',
      declaredSizeBytes: bytes.length,
    },
  ]);
  expect(upload.storedBodies).toEqual([bytes]);
  expect(upload.calls).toEqual([
    '/api/v1/files/upload-intents',
    'storage:PUT',
    '/api/v1/files/88888888-8888-4888-8888-888888888888/complete',
    '/api/v1/files/88888888-8888-4888-8888-888888888888',
  ]);
  await dialog.getByText('Đã tải lên thành công', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/manager-file-metadata-${info.project.name}.png`,
    fullPage: true,
  });
});

test('manager drops a file, sees a compact success card and adds or removes an attachment', async ({
  page,
}, info) => {
  await mockManager(page);
  const upload = await mockFileUpload(page);
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/manager/materials');
  await page.getByRole('button', { name: 'Toàn bộ tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài liệu', exact: true }).click();
  await page.getByLabel('Khóa học', { exact: true }).selectOption(courseId);
  await page.getByLabel('Học phần', { exact: true }).selectOption(unitId);
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Loại tài liệu', { exact: true }).selectOption('FILE');
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(
      new File(
        ['%PDF-1.4\n', new Uint8Array(230655), '\n%%EOF'],
        'CP2 Requirements EXE101SU26.pdf',
      ),
    );
    return data;
  });
  await dialog
    .getByRole('button', { name: /^Chọn tệp để tải lên/ })
    .dispatchEvent('drop', { dataTransfer: transfer });
  await transfer.dispose();
  await expect(dialog.getByText('Đã tải lên thành công', { exact: true })).toHaveCount(1);
  await expect(dialog.getByText('CP2 Requirements EXE101SU26.pdf', { exact: true })).toHaveCount(1);
  await expect(dialog.getByText('PDF · 225,3 KB', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Thay tệp', exact: true })).toBeEnabled();
  await expect(dialog.getByRole('button', { name: 'Lưu bản nháp', exact: true })).toBeInViewport();
  expect(upload.storedBodies[0]?.byteLength).toBe(230670);
  await dialog.getByText('Đã tải lên thành công', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/manager-upload-ready-${info.project.name}.png`,
    fullPage: true,
  });
  const chooserPromise = page.waitForEvent('filechooser');
  await dialog.getByRole('button', { name: /^Thêm tệp đính kèm/ }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: 'attachment.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%%EOF'),
  });
  await expect(dialog.getByText('Đã tải lên thành công', { exact: true })).toHaveCount(2);
  await expect(dialog.getByText('attachment.pdf', { exact: true })).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Bỏ tệp attachment.pdf', exact: true }).click();
  await expect(dialog.getByText('attachment.pdf', { exact: true })).toHaveCount(0);
  await expect(dialog.getByText('Đã tải lên thành công', { exact: true })).toHaveCount(1);
});

test('manager refreshes expired authentication during intent, complete and status polling', async ({
  page,
}) => {
  await mockManager(page);
  const upload = await mockFileUpload(page, 'PROCESSING');
  let expired = false;
  let refreshes = 0;
  const attempts = new Map<string, number>();
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill(
      expired
        ? {
            status: 401,
            json: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required' },
          }
        : { json: { ...testUser, role: 'MANAGER' } },
    ),
  );
  await page.route('**/api/v1/auth/refresh', (route) => {
    refreshes++;
    expired = false;
    return route.fulfill({
      json: {
        user: { ...testUser, role: 'MANAGER' },
        accessTokenExpiresAt: '2030-01-01T00:00:00Z',
      },
    });
  });
  await page.route('**/api/v1/files/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    const count = (attempts.get(path) ?? 0) + 1;
    attempts.set(path, count);
    if (count > 1) return route.fallback();
    expired = true;
    return route.fulfill({
      status: 401,
      json: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required' },
    });
  });
  await page.clock.install();
  await page.goto('/manager/materials');
  await page.getByRole('button', { name: 'Toàn bộ tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài liệu', exact: true }).click();
  await page.getByLabel('Khóa học', { exact: true }).selectOption(courseId);
  await page.getByLabel('Học phần', { exact: true }).selectOption(unitId);
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Loại tài liệu', { exact: true }).selectOption('FILE');
  await dialog
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: 'lesson.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n%%EOF'),
    });
  await expect(dialog.getByText('Đang kiểm tra tệp…', { exact: true })).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Dừng kiểm tra tự động', exact: true }),
  ).toBeVisible();
  upload.ready();
  await page.clock.runFor(3001);
  await expect(dialog.getByText('Đã tải lên thành công', { exact: true })).toBeVisible();
  expect(refreshes).toBe(3);
  expect([...attempts.values()]).toEqual([2, 2, 2]);
  expect(upload.calls.filter((call) => call === 'storage:PUT')).toHaveLength(1);
  expect(upload.calls.filter((call) => call.endsWith('/complete'))).toHaveLength(1);
});

test('pending uploads can pause and check the existing file without sending it again', async ({
  page,
}) => {
  await mockManager(page);
  const upload = await mockFileUpload(page, 'PROCESSING');
  await page.clock.install();
  await page.goto('/manager/materials');
  await page.getByRole('button', { name: 'Toàn bộ tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài liệu', exact: true }).click();
  await page.getByLabel('Khóa học', { exact: true }).selectOption(courseId);
  await page.getByLabel('Học phần', { exact: true }).selectOption(unitId);
  await page.getByRole('dialog').getByLabel('Loại tài liệu', { exact: true }).selectOption('FILE');
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Tệp chờ kiểm tra');
  await page
    .getByRole('dialog')
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: 'lesson.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n%%EOF'),
    });
  await page.getByRole('button', { name: 'Dừng kiểm tra tự động', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lưu bản nháp', exact: true })).toBeDisabled();
  const statusPath = '/api/v1/files/88888888-8888-4888-8888-888888888888';
  const countBefore = upload.calls.filter((call) => call === statusPath).length;
  await page.clock.runFor(90_000);
  expect(upload.calls.filter((call) => call === statusPath)).toHaveLength(countBefore);
  await page.getByRole('button', { name: 'Kiểm tra lại', exact: true }).click();
  await expect(
    page.getByText('Tệp đã tải lên, máy chủ vẫn đang kiểm tra.', { exact: false }),
  ).toBeVisible();
  await page.clock.runFor(90_000);
  expect(upload.calls.filter((call) => call === statusPath)).toHaveLength(countBefore + 1);
  upload.ready();
  await page.getByRole('button', { name: 'Kiểm tra lại', exact: true }).click();
  await expect(page.getByText('Đã tải lên thành công', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lưu bản nháp', exact: true })).toBeEnabled();
  expect(upload.calls.filter((call) => call.endsWith('/upload-intents'))).toHaveLength(1);
  expect(upload.calls.filter((call) => call === 'storage:PUT')).toHaveLength(1);
  expect(upload.calls.filter((call) => call.endsWith('/complete'))).toHaveLength(1);
});

test('failed backend validation stops checks and keeps an unusable file out of the draft', async ({
  page,
}, info) => {
  await mockManager(page);
  const upload = await mockFileUpload(page, 'FAILED');
  await page.clock.install();
  await page.goto('/manager/materials');
  await page.getByRole('button', { name: 'Toàn bộ tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài liệu', exact: true }).click();
  await page.getByLabel('Khóa học', { exact: true }).selectOption(courseId);
  await page.getByLabel('Học phần', { exact: true }).selectOption(unitId);
  await page.getByRole('dialog').getByLabel('Loại tài liệu', { exact: true }).selectOption('FILE');
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Tệp bị máy chủ từ chối');
  await page
    .getByRole('dialog')
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: 'lesson.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n%%EOF'),
    });
  const failure = page.getByRole('alert').filter({ hasText: 'FILE_RETRY_EXHAUSTED' });
  await expect(failure).toContainText('máy chủ xử lý thất bại');
  await expect(page.getByRole('button', { name: 'Lưu bản nháp', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Kiểm tra lại', exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog').locator('input[type="file"]').first()).toBeEnabled();
  const countBefore = upload.calls.length;
  await page.clock.runFor(90_000);
  expect(upload.calls).toHaveLength(countBefore);
  await failure.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/manager-upload-failed-${info.project.name}.png`,
    fullPage: true,
  });
});

test('the primary file can be replaced while backend validation is still running', async ({
  page,
}, info) => {
  await mockManager(page);
  const upload = await mockFileUpload(page, 'PROCESSING');
  await page.clock.install();
  await page.goto('/manager/materials');
  await page.getByRole('button', { name: 'Toàn bộ tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài liệu', exact: true }).click();
  await page.getByLabel('Khóa học', { exact: true }).selectOption(courseId);
  await page.getByLabel('Học phần', { exact: true }).selectOption(unitId);
  await page.getByRole('dialog').getByLabel('Loại tài liệu', { exact: true }).selectOption('FILE');
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Thay tệp trong khi chờ');
  const inputs = page.getByRole('dialog').locator('input[type="file"]');
  await inputs.first().setInputFiles({
    name: 'lesson.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%%EOF'),
  });
  await expect(page.getByText('lesson.pdf', { exact: true })).toBeVisible();
  await expect(inputs.first()).toBeEnabled();
  await expect(inputs.nth(1)).toBeEnabled();
  await expect(page.getByLabel('Tiêu đề', { exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Lưu bản nháp', exact: true })).toBeDisabled();
  await page.getByText('lesson.pdf', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/manager-upload-unlocked-${info.project.name}.png`,
    fullPage: true,
  });
  upload.ready();
  await inputs.first().setInputFiles({
    name: 'replacement.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%%EOF'),
  });
  await expect(page.getByText('Đã tải lên thành công', { exact: true })).toBeVisible();
  await expect(page.getByText('replacement.pdf', { exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Lưu bản nháp', exact: true })).toBeEnabled();
  const countBefore = upload.calls.length;
  await page.clock.runFor(90_000);
  expect(upload.calls).toHaveLength(countBefore);
  expect(upload.calls.filter((call) => call === 'storage:PUT')).toHaveLength(2);
});

test('attachments remain available while the primary file is being validated', async ({ page }) => {
  await mockManager(page);
  const upload = await mockFileUpload(page, 'PROCESSING');
  await page.clock.install();
  await page.goto('/manager/materials');
  await page.getByRole('button', { name: 'Toàn bộ tài liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài liệu', exact: true }).click();
  await page.getByLabel('Khóa học', { exact: true }).selectOption(courseId);
  await page.getByLabel('Học phần', { exact: true }).selectOption(unitId);
  await page.getByRole('dialog').getByLabel('Loại tài liệu', { exact: true }).selectOption('FILE');
  const inputs = page.getByRole('dialog').locator('input[type="file"]');
  await inputs.first().setInputFiles({
    name: 'lesson.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%%EOF'),
  });
  await expect(page.getByText('lesson.pdf', { exact: true })).toBeVisible();
  await inputs.nth(1).setInputFiles({
    name: 'attachment.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%%EOF'),
  });
  await expect(page.getByText('attachment.pdf', { exact: true })).toBeVisible();
  await expect(inputs.first()).toBeEnabled();
  await expect(inputs.nth(1)).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Lưu bản nháp', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const countBefore = upload.calls.length;
  await page.clock.runFor(90_000);
  expect(upload.calls).toHaveLength(countBefore);
});

test('manager course workspace matches student chapters and keeps pagination scoped', async ({
  page,
}, info) => {
  const { calls } = await mockManager(page, { unitPaging: true });
  await page.goto('/manager/materials');
  await page.getByLabel('Lọc theo khóa học', { exact: true }).selectOption(courseId);
  const rail = page.getByRole('complementary', { name: 'Nội dung khóa học' });
  await expect(rail.getByRole('button')).toHaveCount(2);
  await expect(rail.getByRole('button').first()).toHaveAttribute('aria-current', 'step');
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Đang chờ duyệt/ })).toHaveCount(0);
  const content = page.getByRole('region', { name: 'Nội dung chương', exact: true });
  await expect(
    content.getByRole('heading', { name: 'JavaScript căn bản', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Tài liệu trong chương' }).getByRole('button'),
  ).toHaveCount(20);
  await expect(
    page
      .getByRole('toolbar', { name: 'Thao tác tài liệu' })
      .getByRole('button', { name: 'Chỉnh sửa', exact: true }),
  ).toBeVisible();
  if (info.project.name === 'desktop') {
    const sidebar = await rail.boundingBox();
    const panel = await content.boundingBox();
    const create = await content
      .getByRole('button', { name: 'Tạo tài liệu', exact: true })
      .boundingBox();
    expect(
      sidebar && panel && create && sidebar.x + sidebar.width <= panel.x && create.x > panel.x,
    ).toBeTruthy();
  }
  await page.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(
    page
      .getByRole('navigation', { name: 'Tài liệu trong chương' })
      .getByRole('button', { name: /Học liệu trang 2/ }),
  ).toBeVisible();
  expect(
    calls.some(
      (call) =>
        call.path === `manager/course-units/${unitId}/materials` &&
        new URLSearchParams(call.search).get('page') === '2',
    ),
  ).toBe(true);
  await page.getByLabel('Loại tài liệu trong chương', { exact: true }).selectOption('VIDEO');
  await expect(
    page.getByText('Chưa có tài liệu phù hợp với bộ lọc trong chương này.'),
  ).toBeVisible();
  const videoCall = calls
    .filter(
      (call) =>
        call.path === `manager/course-units/${unitId}/materials` &&
        new URLSearchParams(call.search).get('contentType') === 'VIDEO',
    )
    .at(-1);
  expect(new URLSearchParams(videoCall?.search).get('page')).toBe('1');
  await rail.getByRole('button', { name: /Học phần chưa có tài liệu/ }).click();
  await expect(
    content.getByRole('heading', { name: 'Học phần chưa có tài liệu', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Chương này chưa có tài liệu.', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Loại tài liệu trong chương')).toHaveValue('');
  await expect(page.getByRole('toolbar')).toHaveCount(0);
  await page.setViewportSize(
    info.project.name === 'desktop' ? { width: 1440, height: 1000 } : { width: 393, height: 1100 },
  );
  await page.screenshot({
    path: `test-results/manager-student-workspace-${info.project.name}.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Lọc theo khóa học', { exact: true }).selectOption('');
  await expect(page.getByRole('complementary', { name: 'Danh sách khóa học' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('manager edits and creates directly inside the selected chapter', async ({ page }) => {
  const { calls } = await mockManager(page);
  await page.goto('/manager/materials');
  await page.getByLabel('Lọc theo khóa học', { exact: true }).selectOption(courseId);
  await page.getByRole('toolbar').getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Nội dung đã sửa trực tiếp');
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nội dung đã sửa trực tiếp' })).toBeVisible();
  expect(calls.find((call) => call.method === 'PATCH')?.body?.expectedRevision).toBe(3);
  await page.getByRole('button', { name: 'Tạo tài liệu', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Học phần', { exact: true })).toHaveCount(0);
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Bài viết trong chương đã chọn');
  await page.getByLabel('Nội dung bài viết', { exact: true }).fill('Dòng một\nDòng hai');
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bài viết trong chương đã chọn' })).toBeVisible();
  expect(
    calls.find((call) => call.method === 'POST' && call.path.endsWith('/materials'))?.body,
  ).toMatchObject({ contentText: 'Dòng một\nDòng hai', contentType: 'ARTICLE' });
});

test('material approval refetches the selected chapter inline', async ({ page }) => {
  await mockManager(page);
  await page.goto('/manager/materials');
  await page.getByLabel('Lọc theo khóa học', { exact: true }).selectOption(courseId);
  await page.getByRole('button', { name: 'Duyệt tài liệu', exact: true }).click();
  const refetch = page.waitForRequest(
    (request) =>
      request.method() === 'GET' &&
      request.url().includes(`/manager/course-units/${unitId}/materials?`) &&
      new URL(request.url()).searchParams.get('pageSize') === '20',
  );
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await refetch;
  await expect(page.getByText('Đã cập nhật tài liệu.', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ẩn tài liệu', exact: true })).toBeVisible();
  await page.getByLabel('Trạng thái duyệt trong chương', { exact: true }).selectOption('DRAFT');
  await expect(
    page.getByText('Chưa có tài liệu phù hợp với bộ lọc trong chương này.'),
  ).toBeVisible();
  await page.getByLabel('Trạng thái duyệt trong chương', { exact: true }).selectOption('APPROVED');
  await expect(
    page.getByRole('heading', { name: 'Hướng dẫn JavaScript cơ bản', exact: true }),
  ).toBeVisible();
});

test('manager uploads a file inline using the selected chapter context', async ({ page }) => {
  const { calls } = await mockManager(page);
  const upload = await mockFileUpload(page);
  await page.goto('/manager/materials');
  await page.getByLabel('Lọc theo khóa học', { exact: true }).selectOption(courseId);
  await page.getByRole('button', { name: 'Tạo tài liệu', exact: true }).click();
  await page.getByLabel('Loại tài liệu', { exact: true }).selectOption('FILE');
  await page.getByLabel('Tiêu đề', { exact: true }).fill('PDF của chương đang chọn');
  await expect(page.getByRole('button', { name: 'Lưu bản nháp', exact: true })).toBeDisabled();
  const choosing = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /^Chọn tệp để tải lên/ }).click();
  await (
    await choosing
  ).setFiles({
    name: 'lesson.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7\nlesson'),
  });
  await expect(page.getByText('Đã tải lên thành công', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'PDF của chương đang chọn', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(upload.declarations[0]).toMatchObject({ courseUnitId: unitId });
  expect(
    calls.find(
      (call) => call.method === 'POST' && call.path === `manager/course-units/${unitId}/materials`,
    )?.body,
  ).toMatchObject({ contentType: 'FILE', fileId: '88888888-8888-4888-8888-888888888888' });
});

test('manager keeps course headers still while scrolling each hidden-scrollbar panel', async ({
  page,
}, info) => {
  await page.setViewportSize(
    info.project.name === 'desktop' ? { width: 1440, height: 1000 } : { width: 393, height: 950 },
  );
  await mockManager(page, { fileMaterial: true, scrollContent: true });
  await page.goto('/manager/materials');
  await page.getByLabel('Lọc theo khóa học', { exact: true }).selectOption(courseId);
  await expect(
    page.getByRole('heading', { name: 'Yêu cầu bài thuyết trình', exact: true }),
  ).toBeVisible();
  const frame = page.locator('[data-slot="course-content-frame"]');
  const sidebar = page.getByRole('region', { name: 'Nội dung khóa học - vùng cuộn', exact: true });
  const content = page.getByRole('region', { name: 'Nội dung chương - vùng cuộn', exact: true });
  const chapterTitle = page.getByRole('heading', { name: 'JavaScript căn bản', exact: true });
  await frame.scrollIntoViewIfNeeded();
  const initialFrame = await frame.boundingBox();
  const initialTitle = await chapterTitle.boundingBox();
  const initialPageY = await page.evaluate(() => scrollY);
  for (const panel of [sidebar, content]) {
    const dimensions = await panel.evaluate((element) => ({
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollbar: getComputedStyle(element).scrollbarWidth,
      webkitScrollbar: getComputedStyle(element, '::-webkit-scrollbar').display,
    }));
    expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);
    expect(dimensions.scrollbar).toBe('none');
    expect(dimensions.webkitScrollbar).toBe('none');
  }
  await content.hover();
  await page.mouse.wheel(0, -500);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(await page.evaluate(() => scrollY)).toBe(initialPageY);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => content.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await sidebar.evaluate((element) => element.scrollTop)).toBe(0);
  expect(await frame.boundingBox()).toEqual(initialFrame);
  expect(await chapterTitle.boundingBox()).toEqual(initialTitle);
  expect(await page.evaluate(() => scrollY)).toBe(initialPageY);
  await content.focus();
  await page.keyboard.press('End');
  await expect
    .poll(() =>
      content.evaluate((element) =>
        Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop),
      ),
    )
    .toBeLessThanOrEqual(1);
  const contentY = await content.evaluate((element) => element.scrollTop);
  await sidebar.focus();
  await page.keyboard.press('End');
  const lastChapter = sidebar.getByRole('button', { name: /Chương thực hành 24/ });
  await expect(lastChapter).toBeInViewport();
  expect(await sidebar.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await content.evaluate((element) => element.scrollTop)).toBe(contentY);
  expect(await frame.boundingBox()).toEqual(initialFrame);
  expect(await page.evaluate(() => scrollY)).toBe(initialPageY);
  await page.screenshot({
    path: `test-results/manager-scroll-frame-${info.project.name}.png`,
    fullPage: true,
  });
  await lastChapter.click();
  await expect(
    page.getByRole('heading', { name: 'Chương thực hành 24', exact: true }),
  ).toBeVisible();
  expect(await content.evaluate((element) => element.scrollTop)).toBe(0);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('manager shows one clear file detail with grouped actions and readable dates', async ({
  page,
}, info) => {
  await mockManager(page, { fileMaterial: true });
  let accessCalls = 0;
  await page.route(`**/api/v1/manager/materials/${id}/files/*/access`, (route) => {
    accessCalls += 1;
    return route.fulfill({
      json: {
        materialId: id,
        fileId: '88888888-8888-4888-8888-888888888888',
        role: 'PRIMARY',
        revision: 3,
        url: 'https://storage.example.test/material.pdf',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    });
  });
  await page.route('https://storage.example.test/**', (route) =>
    route.fulfill({ contentType: 'application/pdf', body: '%PDF-1.7\n%%EOF' }),
  );
  await page.goto('/manager/materials');
  await page.getByLabel('Lọc theo khóa học', { exact: true }).selectOption(courseId);
  await expect(
    page.getByRole('heading', { name: 'Yêu cầu bài thuyết trình', exact: true }),
  ).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Tài liệu trong chương' })).toHaveCount(0);
  const toolbar = page.getByRole('toolbar', { name: 'Thao tác tài liệu' });
  await expect(toolbar.getByRole('button', { name: 'Chỉnh sửa', exact: true })).toBeVisible();
  await expect(toolbar.getByRole('button', { name: 'Ẩn tài liệu', exact: true })).toBeVisible();
  await expect(toolbar.getByRole('button', { name: 'Xóa tài liệu', exact: true })).toBeVisible();
  await expect(page.getByText('PDF · 133,1 KB', { exact: true })).toBeVisible();
  await expect(page.getByText('application/pdf', { exact: false })).toHaveCount(0);
  await expect(page.locator('time[datetime="2026-10-27T09:00:00Z"]')).toHaveText(
    '27/10/2026 · 16:00',
  );
  expect(accessCalls).toBe(0);
  await page.screenshot({
    path: `test-results/manager-file-detail-${info.project.name}.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 850 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Xem / tải tệp', exact: true }).click();
  await expect(page.getByRole('link', { name: /Mở tệp trong tab mới/ })).toBeVisible();
  expect(accessCalls).toBe(1);
});

test('manager keeps spacious filters on small screens without course search', async ({
  page,
}, info) => {
  await mockManager(page);
  await page.goto('/manager/materials');
  await expect(page.getByRole('searchbox', { name: 'Tìm khóa học', exact: true })).toHaveCount(0);
  const picker = page.getByLabel('Lọc theo khóa học', { exact: true });
  const rail = page.getByRole('complementary', { name: 'Danh sách khóa học' });
  const courseButton = rail.getByRole('button', { name: /Khóa học kiểm thử/ });
  await expect(courseButton).toBeVisible();
  await expect(picker.locator('option')).toHaveCount(2);
  await picker.selectOption(courseId);
  await expect(page.getByRole('toolbar', { name: 'Thao tác tài liệu' })).toBeVisible();
  await expect(picker).toHaveValue(courseId);
  await expect(page.getByRole('complementary', { name: 'Nội dung khóa học' })).toBeVisible();
  const filters = page.getByRole('group', { name: 'Bộ lọc tài liệu', exact: true });
  await expect(filters.getByLabel('Lọc theo khóa học', { exact: true })).toHaveValue(courseId);
  await expect(
    page
      .getByRole('region', { name: 'Nội dung chương - vùng cuộn', exact: true })
      .getByRole('combobox'),
  ).toHaveCount(0);
  if (info.project.name === 'desktop') {
    const coursePickerBox = await picker.boundingBox();
    const statusBox = await filters
      .getByLabel('Trạng thái duyệt trong chương', { exact: true })
      .boundingBox();
    const typeBox = await filters
      .getByLabel('Loại tài liệu trong chương', { exact: true })
      .boundingBox();
    expect(coursePickerBox && statusBox && typeBox).toBeTruthy();
    expect(coursePickerBox?.y).toBe(statusBox?.y);
    expect(coursePickerBox?.y).toBe(typeBox?.y);
    expect(
      coursePickerBox && statusBox && coursePickerBox.x + coursePickerBox.width < statusBox.x,
    ).toBeTruthy();
  }
  for (const control of [
    picker,
    page.getByLabel('Trạng thái duyệt trong chương', { exact: true }),
    page.getByLabel('Loại tài liệu trong chương', { exact: true }),
  ]) {
    await expect(control).toBeVisible();
    const dimensions = await control.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        height: element.getBoundingClientRect().height,
        contentHeight:
          element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
        lineHeight: parseFloat(style.lineHeight),
      };
    });
    expect(dimensions.height).toBeGreaterThanOrEqual(48);
    expect(dimensions.lineHeight).toBeGreaterThanOrEqual(24);
    expect(dimensions.contentHeight).toBeGreaterThanOrEqual(dimensions.lineHeight);
  }
  await page.screenshot({
    path: `test-results/manager-course-filters-${info.project.name}.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 850 });
  await expect(picker).toHaveValue(courseId);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('manager opens the course layout immediately and keeps it after reload', async ({
  page,
}, info) => {
  const { calls } = await mockManager(page);
  await page.goto('/manager/materials');
  const rail = page.getByRole('complementary', { name: 'Danh sách khóa học' });
  await expect(rail.getByRole('button', { name: /Khóa học kiểm thử/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Nội dung khóa học', exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Đang chờ duyệt|Đã được duyệt/ })).toHaveCount(0);
  expect(calls.some((call) => call.path === 'manager/materials')).toBe(false);
  if (info.project.name === 'desktop') {
    const left = await rail.boundingBox();
    const right = await page
      .getByRole('region', { name: 'Nội dung khóa học', exact: true })
      .boundingBox();
    expect(left && right && left.x + left.width <= right.x).toBeTruthy();
  }
  await page.setViewportSize(
    info.project.name === 'desktop' ? { width: 1440, height: 1000 } : { width: 393, height: 1100 },
  );
  await page.screenshot({
    path: `test-results/manager-default-course-${info.project.name}.png`,
    fullPage: true,
  });
  await rail.getByRole('button', { name: /Khóa học kiểm thử/ }).click();
  await expect(page.getByRole('complementary', { name: 'Nội dung khóa học' })).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'Thao tác tài liệu' })).toBeVisible();
  await page.reload();
  await expect(rail).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
