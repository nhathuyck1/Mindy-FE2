// Uses real compiled auth/gateways and Next production servers; domain data is an in-memory fixture.
// Run after building both repos. No production API/database or browser profile is used.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
const backendRoot = resolve(process.env.BACKEND_DIR || '../Mindy-BE');
const { startRealtimeTestServer } = await import(
  pathToFileURL(resolve(backendRoot, 'tools/realtime-test-server.mjs'))
);
const origins = ['http://127.0.0.1:3181', 'http://localhost:3182'];
const backend = await startRealtimeTestServer(origins);
const children = [];
let browser;
const logs = [];
async function ready(origin) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(origin + '/login')).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Next did not start: ' + logs.slice(-10).join(''));
}
try {
  for (const origin of origins) {
    const child = spawn(
      process.execPath,
      ['node_modules/next/dist/bin/next', 'start', '--port', new URL(origin).port],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          API_BASE_URL: backend.url + '/api/v1',
          APP_ORIGIN: origin,
          REALTIME_ORIGIN: backend.url,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      },
    );
    children.push(child);
    child.stdout.on('data', (text) => logs.push(String(text)));
    child.stderr.on('data', (text) => logs.push(String(text)));
    await ready(origin);
  }
  browser = await chromium.launch({ headless: true });
  await mkdir('test-results/realtime-portability', { recursive: true });
  for (const [index, origin] of origins.entries()) {
    const context = await browser.newContext({
      viewport: index ? { width: 320, height: 780 } : { width: 1440, height: 900 },
    });
    const access = backend.tokens.signAccessToken(backend.actor);
    await context.addCookies([
      { name: 'access_token', value: access.token, url: origin, httpOnly: true, sameSite: 'Lax' },
    ]);
    const page = await context.newPage();
    const conversation = {
      id: backend.board.id,
      type: 'GROUP',
      classId: backend.context.classId,
      name: 'Portable chat',
      peer: null,
      capabilities: { canRead: true, canSend: true, canAttach: false, canType: true },
      accessMode: 'ACTIVE',
      lastReadSequence: '0',
      highWatermark: '0',
      unreadCount: 0,
      lastMessage: null,
      activityAt: new Date().toISOString(),
    };
    const socketUrls = [];
    let ticketRequests = 0;
    page.on('websocket', (socket) => socketUrls.push(socket.url()));
    page.on('request', (request) => {
      if (request.url().includes('/auth/realtime-ticket')) ticketRequests++;
    });
    await page.route('**/api/v1/**', (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/v1/auth/realtime-ticket') return route.continue();
      if (path === '/api/v1/auth/me')
        return route.fulfill({
          json: {
            id: backend.actor.userId,
            email: 'transport@example.test',
            displayName: 'Mentor test',
            phone: null,
            role: 'MENTOR',
            status: 'ACTIVE',
            lastLoginAt: null,
            createdAt: new Date().toISOString(),
          },
        });
      if (path.endsWith('/whiteboard'))
        return route.fulfill({
          json: {
            sessionId: backend.board.sessionId,
            board: backend.board,
            context: backend.context,
            capabilities: backend.capabilities,
          },
        });
      if (path === '/api/v1/whiteboards/' + backend.board.id)
        return route.fulfill({
          json: {
            board: backend.board,
            context: backend.context,
            capabilities: backend.capabilities,
          },
        });
      if (path === '/api/v1/chat/conversations')
        return route.fulfill({
          json: { data: [conversation], meta: { hasMore: false, nextCursor: null } },
        });
      if (path === '/api/v1/chat/conversations/' + conversation.id)
        return route.fulfill({ json: conversation });
      if (path.endsWith('/messages'))
        return route.fulfill({
          json: { data: [], meta: { hasMore: false, nextCursor: null, highWatermark: '0' } },
        });
      if (path.endsWith('/read'))
        return route.fulfill({
          json: {
            conversationId: conversation.id,
            lastReadSequence: '0',
            lastReadAt: null,
            unreadCount: 0,
          },
        });
      return route.fulfill({
        status: 404,
        json: { code: 'FIXTURE_NOT_FOUND', message: 'Fixture endpoint unavailable' },
      });
    });
    await page.goto(origin + '/whiteboards/' + backend.board.sessionId + '?audience=mentor');
    await expect(page.getByText('Đã lưu', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Thêm ghi chú', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Thêm ghi chú', exact: true }).click();
    await expect(page.getByText('Đã lưu', { exact: true })).toBeVisible();
    assert.ok(BigInt(backend.board.sequence) > 0n);
    const before = ticketRequests;
    backend.disconnectBoards();
    await expect.poll(() => ticketRequests).toBeGreaterThan(before);
    await expect(page.getByText('Đã lưu', { exact: true })).toBeVisible({ timeout: 15000 });
    assert.ok(socketUrls.length >= 2);
    assert.ok(
      socketUrls.every(
        (value) =>
          new URL(value).host === new URL(backend.url).host &&
          new URL(value).pathname === '/ws/whiteboards' &&
          !value.includes('ticket='),
      ),
    );
    assert.equal(
      await page.evaluate(
        () => Object.keys(localStorage).length + Object.keys(sessionStorage).length,
      ),
      0,
    );
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({
      path: 'test-results/realtime-portability/host-' + index + '.png',
      fullPage: true,
    });
    await page.goto(origin + '/mentor/messages?conversation=' + conversation.id);
    await expect(page.getByPlaceholder('Nhập tin nhắn…')).toBeEnabled();
    await expect.poll(() => backend.chatConnections()).toBe(1);
    const beforeChatReconnect = ticketRequests;
    backend.disconnectChats();
    await expect.poll(() => ticketRequests).toBeGreaterThan(beforeChatReconnect);
    await expect.poll(() => backend.chatConnections()).toBe(1);
    assert.ok(socketUrls.some((value) => new URL(value).pathname === '/socket.io'));
    assert.ok(
      socketUrls.every(
        (value) => new URL(value).host === new URL(backend.url).host && !value.includes('ticket='),
      ),
    );
    console.log(
      'PASS: ' +
        origin +
        ' → direct backend, online board + chat, acknowledged board update, fresh-ticket reconnect for both channels, no Web Storage credentials.',
    );
    await context.close();
  }
} finally {
  await browser?.close();
  for (const child of children) child.kill();
  await backend.close();
}
