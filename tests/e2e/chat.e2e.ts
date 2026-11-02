import { expect, test, type Page } from '@playwright/test';
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
  options: { readonly?: boolean; role?: 'MENTOR' | 'STUDENT'; attachments?: boolean } = {},
) {
  const c = conversation(options.readonly);
  c.capabilities.canAttach = !!options.attachments;
  let messages = [message()];
  let denied = false,
    sendCount = 0;
  const clientIds: string[] = [];
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
                originalFilename: 'bai-hoc.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 20,
                kind: 'PDF',
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
