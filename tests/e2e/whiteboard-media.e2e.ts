import { expect, test, type Page } from '@playwright/test';
import { PNG } from 'pngjs';
import * as Y from 'yjs';
import { mockAssignments } from './assignment-fixtures';
import { ids, now } from '../fixtures/assignment-data';
import { testUser } from './api-fixtures';
import { readShapes } from '../../src/features/whiteboard/lib/board-shapes';
import type { BoardShape } from '../../src/features/whiteboard/schemas/whiteboard-contracts';
import { boardAssetInput } from '../../src/features/whiteboard/schemas/whiteboard-contracts';

const png = new PNG({ width: 320, height: 160 });
for (let i = 0; i < png.data.length; i += 4) {
  png.data[i] = 51;
  png.data[i + 1] = 138;
  png.data[i + 2] = 133;
  png.data[i + 3] = 255;
}
const image = PNG.sync.write(png);

async function pasteImage(page: Page) {
  await page.evaluate((base64) => {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const clipboardData = new DataTransfer();
    clipboardData.items.add(new File([bytes], 'clipboard.png', { type: 'image/png' }));
    document
      .querySelector('.whiteboard-canvas')
      ?.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
  }, image.toString('base64'));
}

async function fixture(
  page: Page,
  options: { readonly?: boolean; retry?: boolean; hold?: boolean } = {},
) {
  await mockAssignments(page, { mentor: !options.readonly });
  const board = {
    id: ids.assignment,
    sessionId: ids.session,
    title: 'Bảng ảnh buổi học',
    mode: 'PRESENTATION',
    epoch: ids.question,
    controlVersion: '1',
    sequence: '0',
    schemaVersion: 2,
    lastPersistedAt: now,
  };
  const capabilities = {
    canView: true,
    canCreate: false,
    canEdit: !options.readonly,
    canControl: !options.readonly,
    canUpload: !options.readonly,
    canSnapshot: false,
    canRestore: false,
    canExport: false,
    canImportPdf: true,
  };
  const doc = new Y.Doc();
  const sync = () => ({
    board,
    capabilities,
    identity: { id: testUser.id, name: testUser.displayName },
    binary: Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64'),
  });
  const writtenShapes: BoardShape[] = [];
  const calls: string[] = [];
  let failComplete = options.retry;
  let pdfUpload = false;
  let completeRequested = false;
  let release = () => {};
  const gate = options.hold
    ? new Promise<void>((resolve) => {
        release = resolve;
      })
    : Promise.resolve();
  const asset = {
    id: ids.file,
    status: 'READY',
    width: 320,
    height: 160,
    error: null,
    assets: null,
  };
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1/', '');
    if (path === `class-sessions/${ids.session}/whiteboard`)
      return route.fulfill({
        json: {
          sessionId: ids.session,
          board,
          capabilities,
          context: {
            sessionId: ids.session,
            sessionTitle: board.title,
            classId: ids.class,
            className: 'Lập trình Web',
            sessionStatus: 'IN_PROGRESS',
            displayName: testUser.displayName,
            mentor: !options.readonly,
          },
        },
      });
    if (path === 'auth/realtime-ticket')
      return route.fulfill({
        json: {
          url: 'http://realtime.test',
          ticket: 'test-ticket',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      });
    if (path.startsWith(`whiteboards/${ids.assignment}/assets`)) {
      calls.push(path);
      if (path.endsWith('/access'))
        return route.fulfill({
          json: {
            url: 'https://storage.example.test/image.png',
            expiresAt: '2027-01-01T00:00:00Z',
          },
        });
      if (path.endsWith('/assets')) {
        pdfUpload =
          boardAssetInput.parse(route.request().postDataJSON()).mimeType === 'application/pdf';
        return route.fulfill({
          json: {
            id: ids.file,
            status: 'PENDING_UPLOAD',
            putUrl: 'https://storage.example.test/upload',
            expiresAt: '2027-01-01T00:00:00Z',
          },
        });
      }
      if (path.endsWith('/complete')) {
        completeRequested = true;
        await gate;
        if (failComplete) {
          failComplete = false;
          return route.fulfill({ status: 503, json: { code: 'UNAVAILABLE' } });
        }
      }
      return route.fulfill({
        json: pdfUpload
          ? {
              ...asset,
              status: 'IMPORTED',
              width: null,
              height: null,
              assets: [{ id: asset.id, width: 320, height: 160 }],
            }
          : asset,
      });
    }
    return route.fallback();
  });
  await page.route('https://storage.example.test/**', (route) => {
    calls.push(route.request().method() + ' storage');
    return route.fulfill(
      route.request().method() === 'PUT'
        ? { status: 200, headers: { 'access-control-allow-origin': '*' } }
        : {
            contentType: 'image/png',
            body: image,
            headers: { 'access-control-allow-origin': '*' },
          },
    );
  });
  let resetBoard = () => {};
  await page.routeWebSocket('**/ws/whiteboards*', (ws) => {
    ws.send(
      '0' +
        JSON.stringify({
          sid: 'test',
          upgrades: [],
          pingInterval: 25000,
          pingTimeout: 20000,
          maxPayload: 1000000,
        }),
    );
    resetBoard = () => {
      board.epoch = ids.student;
      ws.send('42' + JSON.stringify(['board:state', sync()]));
    };
    ws.onMessage((message) => {
      const text = String(message);
      if (text.startsWith('40')) ws.send('40' + JSON.stringify({ sid: 'test' }));
      const packet = /^42(\d+)(\[[\s\S]*)$/.exec(text);
      if (!packet) return;
      const [event, body] = JSON.parse(packet[2]);
      if (event === 'board:join')
        ws.send('43' + packet[1] + JSON.stringify([{ ok: true, data: sync() }]));
      if (event === 'board:viewport')
        ws.send('43' + packet[1] + JSON.stringify([{ ok: true, data: { accepted: true } }]));
      if (event === 'board:update') {
        Y.applyUpdate(doc, Buffer.from(body.binary, 'base64'));
        writtenShapes.splice(0, writtenShapes.length, ...readShapes(doc));
        board.sequence = String(Number(board.sequence) + 1);
        ws.send(
          '43' +
            packet[1] +
            JSON.stringify([
              {
                ok: true,
                data: {
                  epoch: board.epoch,
                  sequence: board.sequence,
                  updateId: body.updateId,
                },
              },
            ]),
        );
      }
    });
  });
  await page.goto(`/whiteboards/${ids.session}`);
  await expect(page.getByText('Đã lưu', { exact: true })).toBeVisible();
  return {
    calls,
    writtenShapes,
    resetBoard: () => resetBoard(),
    release: () => release(),
    completeRequested: () => completeRequested,
  };
}

test('upload button and clipboard insert images immediately, once, with undo and redo', async ({
  page,
}, info) => {
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 780 });
  const { writtenShapes } = await fixture(page);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Tải ảnh lên bảng', exact: true }).click();
  await (await chooser).setFiles({ name: 'anh.png', mimeType: 'image/png', buffer: image });
  await expect.poll(() => writtenShapes.length).toBe(1);
  expect(writtenShapes[0]).toMatchObject({
    type: 'image',
    assetId: ids.file,
    width: 320,
    height: 160,
  });
  await expect(page.getByRole('button', { name: 'Thêm ảnh vào bảng' })).toHaveCount(0);
  await pasteImage(page);
  await expect.poll(() => writtenShapes.length).toBe(2);
  await page.getByRole('button', { name: 'Hoàn tác', exact: true }).click();
  await expect.poll(() => writtenShapes.length).toBe(1);
  await page.getByRole('button', { name: 'Làm lại', exact: true }).click();
  await expect.poll(() => writtenShapes.length).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('whiteboard-images.png') });
});

test('retry checks the same uploaded image and inserts it without another confirmation', async ({
  page,
}) => {
  const { calls, writtenShapes } = await fixture(page, { retry: true });
  await pasteImage(page);
  await page.getByRole('button', { name: 'Kiểm tra tệp', exact: true }).click();
  await expect.poll(() => writtenShapes.length).toBe(1);
  expect(calls.filter((path) => path.endsWith('/assets'))).toHaveLength(1);
  expect(calls.filter((path) => path === 'PUT storage')).toHaveLength(1);
});

test('read-only viewers cannot upload or paste images', async ({ page }) => {
  const { calls, writtenShapes } = await fixture(page, { readonly: true });
  await expect(page.getByRole('button', { name: 'Tải ảnh lên bảng' })).toHaveCount(0);
  await pasteImage(page);
  await page.getByRole('button', { name: 'Thêm thao tác' }).click();
  await expect(page.getByRole('region', { name: 'Thao tác bảng' })).toBeVisible();
  expect(calls).toHaveLength(0);
  expect(writtenShapes).toHaveLength(0);
});

test('PDF import remains available from the menu and places processed pages automatically', async ({
  page,
}) => {
  const { writtenShapes } = await fixture(page);
  await page.getByRole('button', { name: 'Thêm thao tác' }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Nhập PDF', exact: true }).click();
  await (
    await chooser
  ).setFiles({
    name: 'bai-hoc.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 fixture'),
  });
  await expect(page.getByRole('dialog', { name: 'Chọn trang PDF' })).toBeVisible();
  await page.getByRole('button', { name: 'Tải và xử lý trang', exact: true }).click();
  await expect.poll(() => writtenShapes.length).toBe(1);
  expect(writtenShapes[0].type).toBe('image');
  await expect(page.getByRole('button', { name: 'Thêm ảnh vào bảng' })).toHaveCount(0);
});

test('an image finishing after a board reset is not inserted into the new board', async ({
  page,
}) => {
  const state = await fixture(page, { hold: true });
  await pasteImage(page);
  await expect.poll(state.completeRequested).toBe(true);
  state.resetBoard();
  await expect(page.getByText('Đã lưu', { exact: true })).toBeVisible();
  state.release();
  await expect(
    page.getByText('Bảng đã thay đổi. Hãy tải ảnh lại vào bảng hiện tại.'),
  ).toBeVisible();
  expect(state.writtenShapes).toHaveLength(0);
});
