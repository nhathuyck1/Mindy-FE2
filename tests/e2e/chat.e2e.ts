import { expect, test, type Page } from '@playwright/test';
import { PNG } from 'pngjs';
import { testUser } from './api-fixtures';
import type { ChatMessage } from '@/features/chat/schemas/chat-contracts';
const id = '22222222-2222-4222-8222-222222222222',
  peerId = '33333333-3333-4333-8333-333333333333';
const mentor = { id: peerId, displayName: 'Đặng Nhật Huy', avatarUrl: null };
function message(body = 'Chào cả lớp!', own = false): ChatMessage {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    conversationId: id,
    sender: own ? { id: testUser.id, displayName: testUser.displayName, avatarUrl: null } : mentor,
    clientMessageId: null,
    sequence: '1',
    lastChangedSequence: '1',
    type: 'TEXT',
    body,
    file: null,
    replyTo: null,
    version: 1,
    createdAt: new Date().toISOString(),
    editedAt: null,
    deletedAt: null,
  };
}
function conversation(readonly = false) {
  return {
    id,
    type: 'GROUP',
    classId: id,
    name: 'Lớp Web buổi tối',
    peer: null,
    capabilities: { canRead: true, canSend: !readonly, canAttach: false, canType: !readonly },
    accessMode: readonly ? 'HISTORY_READ_ONLY' : 'ACTIVE',
    lastReadSequence: '0',
    highWatermark: '1',
    unreadCount: 1,
    lastMessage: message(),
    activityAt: new Date().toISOString(),
  };
}
const pageOf = (data: unknown[]) => ({
  data,
  meta: { hasMore: false, nextCursor: null, highWatermark: '1' },
});
async function setup(
  page: Page,
  options: {
    readonly?: boolean;
    role?: 'MENTOR' | 'STUDENT';
    attachments?: boolean;
    image?: boolean;
  } = {},
) {
  const c = conversation(options.readonly);
  c.capabilities.canAttach = !!options.attachments;
  let messages = [message()];
  if (options.image)
    messages = [
      {
        ...message(),
        type: 'IMAGE',
        body: null,
        file: {
          id: peerId,
          originalFilename: 'anh.png',
          mimeType: 'image/png',
          sizeBytes: 68,
          kind: 'IMAGE',
        },
      },
    ];
  let denied = false,
    sendCount = 0;
  const clientIds: string[] = [];
  // This suite exercises HTTP fallback; live ticket/socket transport has a dedicated smoke test.
  await page.route('**/api/v1/auth/realtime-ticket', (route) =>
    route.fulfill({
      status: 503,
      json: { code: 'REALTIME_UNAVAILABLE', message: 'Transport fixture offline' },
    }),
  );
  await page.routeWebSocket('**/socket.io/**', (socket) => socket.close());
  await page.route('**/api/v1/auth/me', (r) =>
    r.fulfill({ json: { ...testUser, role: options.role ?? 'STUDENT' } }),
  );
  await page.route('**/api/v1/me/cart', (r) => r.fulfill({ json: { items: [], totalAmount: 0 } }));
  await page.route('**/api/v1/chat/**', async (r) => {
    const url = new URL(r.request().url()),
      path = url.pathname,
      method = r.request().method();
    if (path.endsWith('/direct'))
      return r.fulfill({
        json: { conversation: { ...c, id: peerId, type: 'DIRECT', peer: mentor }, created: false },
      });
    if (path.endsWith('/conversations')) return r.fulfill({ json: pageOf([c]) });
    if (denied)
      return r.fulfill({ status: 403, json: { code: 'CHAT_ACCESS_DENIED', message: 'Denied' } });
    if (path.endsWith('/members'))
      return r.fulfill({
        json: pageOf([
          {
            userId: peerId,
            displayName: mentor.displayName,
            avatarUrl: null,
            role: 'ADMIN',
            joinedAt: new Date().toISOString(),
            lastReadSequence: '0',
          },
        ]),
      });
    if (path.endsWith('/read')) {
      c.unreadCount = 0;
      return r.fulfill({
        json: {
          conversationId: id,
          lastReadSequence: '1',
          lastReadAt: new Date().toISOString(),
          unreadCount: 0,
        },
      });
    }
    if (path.endsWith('/messages')) {
      if (method === 'POST') {
        const input = r.request().postDataJSON();
        clientIds.push(input.clientMessageId);
        sendCount++;
        if (input.body === 'Thử lại' && sendCount === 1)
          return r.fulfill({
            status: 503,
            json: { code: 'CHAT_UNAVAILABLE', message: 'Unavailable' },
          });
        const sent: ChatMessage = {
          ...message(input.body, true),
          id: '55555555-5555-4555-8555-555555555555',
          sequence: '2',
          lastChangedSequence: '2',
          clientMessageId: input.clientMessageId,
          type: input.type,
          body: input.body ?? null,
          file: input.fileObjectId
            ? {
                id: input.fileObjectId,
                originalFilename: input.type === 'IMAGE' ? 'anh.png' : 'bai-hoc.pdf',
                mimeType: input.type === 'IMAGE' ? 'image/png' : 'application/pdf',
                sizeBytes: 20,
                kind: input.type === 'IMAGE' ? 'IMAGE' : 'PDF',
              }
            : null,
        };
        messages = [...messages, sent];
        return r.fulfill({ status: 201, json: { message: sent, replayed: false } });
      }
      return r.fulfill({ json: pageOf(messages) });
    }
    if (/\/messages\/[^/]+$/.test(path) && ['PATCH', 'DELETE'].includes(method)) {
      const target = messages.find((m) => path.endsWith(m.id));
      if (!target)
        return r.fulfill({ status: 404, json: { code: 'CHAT_NOT_FOUND', message: 'Not found' } });
      const updated: ChatMessage = {
        ...target,
        version: target.version + 1,
        body: method === 'DELETE' ? null : r.request().postDataJSON().body,
        deletedAt: method === 'DELETE' ? new Date().toISOString() : null,
        editedAt: method === 'PATCH' ? new Date().toISOString() : null,
      };
      messages = messages.map((m) => (m.id === updated.id ? updated : m));
      return r.fulfill({ json: { message: updated, replayed: false } });
    }
    return r.fulfill({ json: c });
  });
  return {
    clientIds,
    notify: () => {
      c.unreadCount++;
    },
    revoke: () => {
      denied = true;
    },
  };
}
test('opens class chat, renders circular name initials, sends and replies on desktop/mobile', async ({
  page,
}) => {
  if (test.info().project.name === 'mobile')
    await page.setViewportSize({ width: 320, height: 800 });
  await setup(page);
  await page.goto(`/user/messages?conversation=${id}`);
  await expect(page.getByText('Chào cả lớp!', { exact: true }).last()).toBeVisible();
  const avatar = page.locator('article span').filter({ hasText: 'ĐH' }).first();
  await expect(avatar).toBeVisible();
  expect(
    await avatar.evaluate(
      (el) => parseFloat(getComputedStyle(el).borderRadius) >= el.getBoundingClientRect().width / 2,
    ),
  ).toBeTruthy();
  await page.getByRole('button', { name: 'Trả lời', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Hủy trả lời' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Tin nhắn', exact: true }).fill('Em chào thầy!');
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await expect(page.getByText('Em chào thầy!', { exact: true }).last()).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Tin nhắn', exact: true })).toHaveValue('');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/chat-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test('Enter sends, Shift Enter inserts a newline and composition does not submit', async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto(`/user/messages?conversation=${id}`);
  const input = page.getByRole('textbox', { name: 'Tin nhắn', exact: true });
  await input.fill('Dòng một');
  await input.press('Shift+Enter');
  await input.pressSequentially('Dòng hai');
  await expect(input).toHaveValue('Dòng một\nDòng hai');
  await input.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true });
  expect(state.clientIds).toHaveLength(0);
  await input.press('Enter');
  await expect(page.locator('article').filter({ hasText: 'Dòng một\nDòng hai' })).toBeVisible();
  await expect(input).toHaveValue('');
  expect(state.clientIds).toHaveLength(1);
});
test('floating chat shows incoming unread count, opens at the right and sends without navigation', async ({
  page,
}) => {
  if (test.info().project.name === 'mobile')
    await page.setViewportSize({ width: 320, height: 800 });
  const state = await setup(page);
  await page.goto('/user/messages');
  const launcher = page.getByRole('button', { name: 'Mở chat', exact: true });
  await expect(launcher).toBeVisible();
  await expect(
    page.getByRole('status', { name: '1 tin nhắn chưa đọc', exact: true }),
  ).toBeVisible();
  state.notify();
  await expect(page.getByRole('status', { name: '2 tin nhắn chưa đọc', exact: true })).toBeVisible({
    timeout: 8000,
  });
  await launcher.click();
  const popup = page.getByRole('dialog', { name: 'Tin nhắn', exact: true });
  await popup.getByRole('button', { name: /Lớp Web buổi tối/ }).click();
  await expect(popup.locator('article').filter({ hasText: 'Chào cả lớp!' })).toBeVisible();
  await expect(page.getByRole('status', { name: '2 tin nhắn chưa đọc', exact: true })).toHaveCount(
    0,
  );
  await popup.getByRole('textbox', { name: 'Tin nhắn', exact: true }).fill('Gửi từ cửa sổ nổi');
  await popup.getByRole('textbox', { name: 'Tin nhắn', exact: true }).press('Enter');
  await expect(popup.locator('article').filter({ hasText: 'Gửi từ cửa sổ nổi' })).toBeVisible();
  await expect(page).toHaveURL(/\/user\/messages$/);
  const bounds = await popup.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  await page.screenshot({
    path: `test-results/floating-chat-${test.info().project.name}.png`,
    fullPage: true,
  });
  await popup.getByRole('button', { name: 'Thu gọn khung chat' }).click();
  await expect(popup).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mở chat', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Mở chat', exact: true }).click();
  await expect(popup.locator('article').filter({ hasText: 'Gửi từ cửa sổ nổi' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0);
});
test('floating unread count includes subsequent conversation pages', async ({ page }) => {
  await setup(page);
  await page.route('**/api/v1/chat/conversations?**', (route) => {
    const params = new URL(route.request().url()).searchParams;
    if (params.get('limit') !== '100') return route.fallback();
    const next = params.has('cursor');
    return route.fulfill({
      json: {
        data: [{ ...conversation(), id: next ? peerId : id, unreadCount: next ? 4 : 2 }],
        meta: { hasMore: !next, nextCursor: next ? null : 'next-page' },
      },
    });
  });
  await page.goto('/user/messages');
  await expect(
    page.getByRole('status', { name: '6 tin nhắn chưa đọc', exact: true }),
  ).toBeVisible();
});
test('keeps the same client message ID on uncertain send retry', async ({ page }) => {
  const state = await setup(page);
  await page.goto(`/user/messages?conversation=${id}`);
  await page.getByRole('textbox', { name: 'Tin nhắn', exact: true }).fill('Thử lại');
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Thử gửi lại', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Tin nhắn', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Thử gửi lại', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Tin nhắn', exact: true })).toHaveValue('');
  expect(state.clientIds).toHaveLength(2);
  expect(state.clientIds[0]).toBe(state.clientIds[1]);
});
test('honors read-only capability for Mentor', async ({ page }) => {
  await setup(page, { readonly: true, role: 'MENTOR' });
  await page.goto(`/mentor/messages?conversation=${id}`);
  await expect(page.getByText('Cuộc trò chuyện này chỉ cho phép đọc lịch sử.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Tin nhắn', exact: true })).toHaveCount(0);
});
test('starts direct chat from named members', async ({ page }) => {
  await setup(page);
  await page.goto(`/user/messages?conversation=${id}`);
  await page.getByRole('button', { name: 'Thành viên', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Đặng Nhật Huy');
  await page.getByRole('button', { name: 'Nhắn riêng', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('conversation=' + peerId));
});
test('hides cached history when access is revoked', async ({ page }) => {
  const state = await setup(page);
  await page.goto(`/user/messages?conversation=${id}`);
  await expect(page.getByText('Chào cả lớp!', { exact: true }).last()).toBeVisible();
  state.revoke();
  await expect(
    page.getByText('Bạn không còn quyền truy cập cuộc trò chuyện này.').first(),
  ).toBeVisible({ timeout: 12000 });
  await expect(page.locator('article')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Tin nhắn', exact: true })).toHaveCount(0);
});
test('edits and deletes an owned message with server versions', async ({ page }) => {
  await setup(page);
  await page.goto(`/user/messages?conversation=${id}`);
  await page.getByRole('textbox', { name: 'Tin nhắn', exact: true }).fill('Nội dung ban đầu');
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sửa', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tùy chọn tin nhắn', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Sửa', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nội dung chỉnh sửa' }).fill('Nội dung đã sửa');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.locator('article').filter({ hasText: 'Nội dung đã sửa' })).toBeVisible();
  await page.getByRole('button', { name: 'Tùy chọn tin nhắn', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Xóa', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xóa tin nhắn', exact: true }).click();
  await expect(page.locator('article').filter({ hasText: 'Tin nhắn đã xóa' })).toBeVisible();
  await expect(page.locator('article').filter({ hasText: 'Nội dung đã sửa' })).toHaveCount(0);
});
test('waits for attachment readiness before sending and omits cookies on storage PUT', async ({
  page,
}) => {
  await setup(page, { attachments: true });
  const fileId = '66666666-6666-4666-8666-666666666666';
  let ready = false,
    storageCookie: string | undefined;
  const summary = {
    id: fileId,
    originalFilename: 'bai-hoc.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 20,
    kind: 'PDF',
  };
  const status = () => ({
    id: fileId,
    status: ready ? 'READY' : 'PROCESSING',
    originalFilename: 'bai-hoc.pdf',
    errorCode: null,
    file: ready ? summary : null,
  });
  await page.route('https://storage.example.test/**', (r) => {
    storageCookie = r.request().headers()['cookie'];
    return r.fulfill({ status: 200, body: '' });
  });
  await page.route('**/attachments/**', (r) => {
    if (r.request().url().endsWith('/upload-intents'))
      return r.fulfill({
        json: {
          fileId,
          uploadUrl: 'https://storage.example.test/upload',
          requiredHeaders: { 'content-type': 'application/pdf' },
          uploadUrlExpiresAt: new Date(Date.now() + 60000).toISOString(),
          intentExpiresAt: new Date(Date.now() + 60000).toISOString(),
          replayed: false,
        },
      });
    return r.fulfill({ json: status() });
  });
  await page.goto(`/user/messages?conversation=${id}`);
  await page.getByLabel('Chọn ảnh hoặc PDF').setInputFiles({
    name: 'bai-hoc.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 test file'),
  });
  await expect(page.getByRole('button', { name: 'Kiểm tra tệp' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gửi', exact: true })).toBeDisabled();
  ready = true;
  await page.getByRole('button', { name: 'Kiểm tra tệp' }).click();
  await expect(page.getByRole('button', { name: 'Bỏ tệp đính kèm' })).toBeVisible();
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await expect(page.locator('article').filter({ hasText: 'bai-hoc.pdf' })).toBeVisible();
  expect(storageCookie).toBeUndefined();
});

test('inserts a composed emoji at the caret, preserves length limit, and sends/edits Unicode', async ({
  page,
}) => {
  await setup(page);
  await page.goto(`/user/messages?conversation=${id}`);
  const input = page.getByRole('textbox', { name: 'Tin nhắn', exact: true });
  await input.fill('Xin !');
  await input.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(4, 4));
  await page.getByLabel('Chọn emoji', { exact: true }).click();
  await page.getByRole('button', { name: 'Chèn 👨‍👩‍👧‍👦', exact: true }).click();
  await expect(input).toHaveValue('Xin 👨‍👩‍👧‍👦!');
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await expect(page.locator('article').filter({ hasText: 'Xin 👨‍👩‍👧‍👦!' })).toBeVisible();
  await page.getByRole('button', { name: 'Tùy chọn tin nhắn', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Sửa', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nội dung chỉnh sửa' }).fill('Cảm ơn 👩🏽‍💻');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.locator('article').filter({ hasText: 'Cảm ơn 👩🏽‍💻' })).toBeVisible();
  await input.fill('x'.repeat(3995));
  await page.getByRole('button', { name: 'Chèn 👨‍👩‍👧‍👦', exact: true }).click();
  await expect(input).toHaveValue('x'.repeat(3995));
});

const sampleImage = new PNG({ width: 128, height: 96 });
for (let p = 0; p < sampleImage.data.length; p += 4) {
  sampleImage.data.set([35, 160, 150, 255], p);
}
const png = PNG.sync.write(sampleImage);
test('shows an image in the timeline, renews an expired URL, and restores focus after enlarge', async ({
  page,
}, info) => {
  await setup(page, { image: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let calls = 0;
  await page.route('https://storage.example.test/**', (r) =>
    r.fulfill({ contentType: 'image/png', body: png }),
  );
  await page.route('**/file-access?disposition=inline', (r) => {
    calls++;
    return r.fulfill({
      json: {
        url: 'https://storage.example.test/image-' + calls,
        expiresAt: new Date(Date.now() + (calls === 1 ? -1000 : 60000)).toISOString(),
      },
    });
  });
  await page.goto(`/user/messages?conversation=${id}`);
  const button = page.getByRole('button', { name: 'Mở lớn ảnh anh.png', exact: true });
  await expect(button).toBeVisible();
  await expect(button.locator('img')).toHaveJSProperty('naturalWidth', 128);
  await expect(button.locator('..')).toHaveCSS('border-top-width', '0px');
  await expect(page.getByRole('button', { name: 'Xem ảnh · anh.png' })).toHaveCount(0);
  await button.press('Enter');
  await expect.poll(() => calls).toBe(2);
  const viewer = page.getByRole('dialog', { name: 'Xem ảnh', exact: true });
  await expect(viewer).toBeVisible();
  await expect(viewer.locator('img')).toHaveJSProperty('naturalWidth', 128);
  await expect(viewer.getByText('anh.png', { exact: true })).toHaveCount(0);
  await expect(viewer).toHaveCSS('border-top-width', '0px');
  expect(calls).toBe(2);
  await page.screenshot({ path: info.outputPath('chat-image.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(button).toBeFocused();
  await button.click();
  await viewer.click({ position: { x: 4, y: 4 } });
  await expect(viewer).toHaveCount(0);
});

test('keeps image loading silent, reports failure and lets the user retry in floating chat', async ({
  page,
}) => {
  await setup(page, { image: true });
  let allowResponse = () => {};
  const responseGate = new Promise<void>((resolve) => {
    allowResponse = resolve;
  });
  let requests = 0;
  let fail = true;
  await page.route('**/file-access?disposition=inline', async (route) => {
    requests++;
    if (fail) {
      await responseGate;
      return route.fulfill({ status: 503, json: { message: 'Unavailable' } });
    }
    return route.fulfill({
      json: {
        url: 'https://storage.example.test/image',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      },
    });
  });
  await page.route('https://storage.example.test/image', (route) =>
    route.fulfill({ contentType: 'image/png', body: png }),
  );
  await page.goto('/user/messages');
  await page.getByRole('button', { name: 'Mở chat', exact: true }).click();
  const popup = page.getByRole('dialog', { name: 'Tin nhắn', exact: true });
  await popup.getByRole('button', { name: /Lớp Web buổi tối/ }).click();
  try {
    await expect.poll(() => requests).toBeGreaterThan(0);
    await expect(page.getByText('Đang tải ảnh…', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Không tải được ảnh. Vui lòng thử lại.')).toHaveCount(0);
  } finally {
    allowResponse();
  }
  await expect(page.getByText('Không tải được ảnh. Vui lòng thử lại.')).toBeVisible();
  fail = false;
  await popup.getByRole('button', { name: 'Tải lại ảnh', exact: true }).click();
  const thumbnail = popup.getByRole('button', { name: 'Mở lớn ảnh anh.png', exact: true });
  await expect(thumbnail).toBeVisible();
  await thumbnail.click();
  const viewer = page.getByRole('dialog', { name: 'Xem ảnh', exact: true });
  await expect(viewer.getByAltText('anh.png')).toBeVisible();
  await viewer.getByRole('button', { name: 'Đóng ảnh', exact: true }).click();
  await expect(viewer).toHaveCount(0);
  await expect(thumbnail).toBeFocused();
});

test('previews a selected image and leaves send disabled after upload fails', async ({ page }) => {
  await setup(page, { attachments: true });
  await page.route('**/attachments/upload-intents', (r) =>
    r.fulfill({ status: 503, json: { message: 'Upload unavailable' } }),
  );
  await page.goto(`/user/messages?conversation=${id}`);
  await page
    .getByLabel('Chọn ảnh hoặc PDF')
    .setInputFiles({ name: 'anh.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByAltText('Ảnh đã chọn: anh.png')).toHaveJSProperty('naturalWidth', 128);
  await expect(page.getByRole('button', { name: 'Gửi', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Đính kèm ảnh hoặc PDF' })).toBeEnabled();
});

test('retries a failed image upload, previews and sends the image without text', async ({
  page,
}) => {
  await setup(page, { attachments: true });
  const fileId = '66666666-6666-4666-8666-666666666666';
  let uploads = 0;
  await page.route('https://storage.example.test/**', (route) => {
    if (route.request().method() === 'PUT') {
      uploads++;
      return uploads === 1 ? route.abort('failed') : route.fulfill({ status: 200 });
    }
    return route.fulfill({ contentType: 'image/png', body: png });
  });
  await page.route('**/attachments/**', (route) =>
    route.fulfill({
      json: route.request().url().endsWith('/upload-intents')
        ? {
            fileId,
            uploadUrl: 'https://storage.example.test/upload',
            requiredHeaders: { 'content-type': 'image/png' },
            uploadUrlExpiresAt: new Date(Date.now() + 60000).toISOString(),
            intentExpiresAt: new Date(Date.now() + 60000).toISOString(),
            replayed: false,
          }
        : {
            id: fileId,
            status: 'READY',
            originalFilename: 'anh.png',
            errorCode: null,
            file: {
              id: fileId,
              originalFilename: 'anh.png',
              mimeType: 'image/png',
              sizeBytes: png.length,
              kind: 'IMAGE',
            },
          },
    }),
  );
  await page.route('**/file-access?disposition=inline', (route) =>
    route.fulfill({
      json: {
        url: 'https://storage.example.test/image',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      },
    }),
  );
  await page.goto(`/user/messages?conversation=${id}`);
  const input = page.getByRole('textbox', { name: 'Tin nhắn', exact: true });
  const send = page.getByRole('button', { name: 'Gửi', exact: true });
  await page
    .getByLabel('Chọn ảnh hoặc PDF')
    .setInputFiles({ name: 'anh.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByAltText('Ảnh đã chọn: anh.png')).toHaveJSProperty('naturalWidth', 128);
  await expect(
    page.getByRole('status').filter({ hasText: 'Chưa tải được tệp lên kho lưu trữ' }),
  ).toBeVisible();
  await expect(send).toBeDisabled();
  await input.fill('Chú thích');
  await input.press('Enter');
  await expect(input).toHaveValue('Chú thích');
  await input.clear();
  await page.getByRole('button', { name: 'Thử tải lại tệp' }).click();
  await expect(send).toBeEnabled();
  await expect(input).toHaveValue('');
  const sent = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/messages'),
  );
  await input.press('Enter');
  expect((await sent).postDataJSON()).toEqual({
    clientMessageId: expect.any(String),
    type: 'IMAGE',
    fileObjectId: fileId,
  });
  await expect(page.getByAltText('Ảnh đã chọn: anh.png')).toHaveCount(0);
  const image = page.getByRole('button', { name: 'Mở lớn ảnh anh.png', exact: true });
  await expect(image.locator('img')).toHaveJSProperty('naturalWidth', 128);
  await image.click();
  await expect(page.getByRole('dialog').getByAltText('anh.png')).toHaveJSProperty(
    'naturalWidth',
    128,
  );
  expect(uploads).toBe(2);
});
