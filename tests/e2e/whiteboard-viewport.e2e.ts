import { expect, test, type Page } from '@playwright/test';
import {
  presenterViewportSchema,
  type PresenterViewport,
  type BoardShape,
} from '../../src/features/whiteboard/schemas/whiteboard-contracts';
import { readShapes } from '../../src/features/whiteboard/lib/board-shapes';
import * as Y from 'yjs';
import { mockAssignments } from './assignment-fixtures';
import { ids, now } from '../fixtures/assignment-data';
import { testUser } from './api-fixtures';

async function fixture(
  page: Page,
  mentor = false,
  options: { earlyViewport?: boolean; collaborative?: boolean } = {},
) {
  await mockAssignments(page, { mentor });
  const board = {
    id: ids.assignment,
    sessionId: ids.session,
    title: 'Bảng buổi học',
    mode: options.collaborative ? 'COLLABORATIVE' : 'PRESENTATION',
    epoch: ids.question,
    controlVersion: '1',
    sequence: '0',
    schemaVersion: 2,
    lastPersistedAt: now,
  };
  const capabilities = {
    canView: true,
    canCreate: mentor,
    canEdit: mentor || !!options.collaborative,
    canControl: mentor,
    canUpload: false,
    canSnapshot: false,
    canRestore: false,
    canExport: false,
  };
  const doc = new Y.Doc();
  const sticky = new Y.Map<unknown>();
  for (const [key, value] of Object.entries({
    id: ids.file,
    type: 'sticky',
    x: 600,
    y: 0,
    width: 220,
    height: 150,
    color: '#f9d85f',
  }))
    sticky.set(key, value);
  sticky.set('text', new Y.Text('Nội dung giảng viên'));
  doc.getMap('shapes').set(ids.file, sticky);
  const state = {
    board,
    capabilities,
    identity: { id: testUser.id, name: testUser.displayName },
    binary: Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64'),
  };
  await page.route('**/api/v1/class-sessions/*/whiteboard', (route) =>
    route.fulfill({
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
          mentor,
        },
      },
    }),
  );
  await page.route('**/api/v1/auth/realtime-ticket', (route) =>
    route.fulfill({
      json: {
        url: 'http://realtime.test',
        ticket: 'test-ticket',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      },
    }),
  );
  const viewport = {
    connectionId: 'mentor',
    identity: { id: ids.student, name: 'Giảng viên' },
    epoch: board.epoch,
    x: 400,
    y: -200,
    width: 1440,
    height: 900,
    scale: 1.5,
  };
  let present: ((value: typeof viewport) => void) | undefined;
  let disconnect = () => {};
  const outgoing: PresenterViewport[] = [];
  const writtenShapes: BoardShape[] = [];
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
    present = (value) => {
      ws.send('42' + JSON.stringify(['board:viewport', value]));
      ws.send(
        '42' +
          JSON.stringify([
            'board:awareness',
            {
              connectionId: value.connectionId,
              identity: value.identity,
              x: value.x + 300,
              y: value.y + 200,
            },
          ]),
      );
    };
    disconnect = () => ws.close();
    ws.onMessage((message) => {
      const text = String(message);
      if (text.startsWith('40')) ws.send('40' + JSON.stringify({ sid: 'test' }));
      const packet = /^42(\d+)(\[[\s\S]*)$/.exec(text);
      if (packet && JSON.parse(packet[2])[0] === 'board:join') {
        if (options.earlyViewport) present?.(viewport);
        ws.send('43' + packet[1] + JSON.stringify([{ ok: true, data: state }]));
      } else if (packet && JSON.parse(packet[2])[0] === 'board:viewport') {
        outgoing.push(presenterViewportSchema.parse(JSON.parse(packet[2])[1]));
        ws.send('43' + packet[1] + JSON.stringify([{ ok: true, data: { accepted: true } }]));
      } else if (packet && JSON.parse(packet[2])[0] === 'board:update') {
        const update = JSON.parse(packet[2])[1];
        Y.applyUpdate(doc, Buffer.from(update.binary, 'base64'));
        writtenShapes.splice(0, writtenShapes.length, ...readShapes(doc));
        board.sequence = String(Number(board.sequence) + 1);
        ws.send(
          '43' +
            packet[1] +
            JSON.stringify([
              {
                ok: true,
                data: { epoch: board.epoch, sequence: board.sequence, updateId: update.updateId },
              },
            ]),
        );
      }
    });
  });
  await page.goto(`/whiteboards/${ids.session}`);
  return {
    present: (value: typeof viewport) => present?.(value),
    disconnect: () => disconnect(),
    viewport,
    outgoing,
    writtenShapes,
  };
}

test('student follows instructor FOV, navigates independently and resumes after zoom', async ({
  page,
}) => {
  const { present, disconnect, viewport } = await fixture(page);
  const follow = page.getByRole('button', { name: 'Theo giảng viên', exact: true });
  await expect(follow).toHaveText('Chờ giảng viên');
  await expect(page.getByText('Đã lưu', { exact: true })).toBeVisible();
  present(viewport);
  await expect(follow).toHaveText('Đang theo');
  await expect(follow).toHaveAttribute('aria-pressed', 'true');
  const canvas = await page.locator('.whiteboard-canvas').boundingBox();
  if (!canvas) throw new Error('Missing canvas');
  const expectedScale = Math.round(150 * Math.min(canvas.width / 1440, canvas.height / 900));
  const zoom = page.getByRole('button', { name: 'Đặt lại mức phóng', exact: true });
  await expect(zoom).toHaveText(`${expectedScale}%`);
  await page.getByRole('button', { name: 'Phóng to', exact: true }).click();
  await expect(follow).toHaveAttribute('aria-pressed', 'false');
  const independentZoom = await zoom.textContent();
  present({ ...viewport, scale: 2 });
  await expect(zoom).toHaveText(independentZoom ?? '');
  await follow.click();
  await expect(zoom).toHaveText(
    `${Math.round(200 * Math.min(canvas.width / 1440, canvas.height / 900))}%`,
    { timeout: 2000 },
  );
  present({ ...viewport, epoch: ids.assignment, scale: 4 });
  await expect(follow).toHaveText('Đang theo');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: test.info().outputPath('student-follow-viewport.png') });
  disconnect();
  await expect(follow).toHaveText('Chờ giảng viên');
});

test('student immediately applies a viewport received before the board join acknowledgement', async ({
  page,
}) => {
  const { viewport } = await fixture(page, false, { earlyViewport: true });
  await expect(page.getByRole('button', { name: 'Theo giảng viên', exact: true })).toHaveText(
    'Đang theo',
  );
  const canvas = await page.locator('.whiteboard-canvas').boundingBox();
  if (!canvas) throw new Error('Missing canvas');
  await expect(page.getByRole('button', { name: 'Đặt lại mức phóng', exact: true })).toHaveText(
    `${Math.round(100 * viewport.scale * Math.min(canvas.width / viewport.width, canvas.height / viewport.height))}%`,
  );
});

test('student automatically follows instructor pan and resize and retains the camera on signal loss', async ({
  page,
}) => {
  const { viewport, present, disconnect } = await fixture(page);
  const follow = page.getByRole('button', { name: 'Theo giảng viên', exact: true });
  await expect(page.getByText('Đã lưu', { exact: true })).toBeVisible();
  const canvas = page.locator('.whiteboard-canvas');
  const position = () => canvas.evaluate((element) => element.style.backgroundPosition);
  present(viewport);
  await expect(follow).toHaveText('Đang theo');
  const original = await position();
  present({ ...viewport, x: 5000, y: 4000 });
  await expect.poll(position).not.toBe(original);
  await expect(follow).toHaveAttribute('aria-pressed', 'true');
  const panned = await position();
  await page.setViewportSize({ width: 360, height: 640 });
  await expect.poll(position).not.toBe(panned);
  const lastPosition = await position();
  const lastZoom = await page
    .getByRole('button', { name: 'Đặt lại mức phóng', exact: true })
    .textContent();
  await page.screenshot({ path: test.info().outputPath('student-follow-pan.png') });
  disconnect();
  await expect(follow).toHaveText('Chờ giảng viên');
  expect(await position()).toBe(lastPosition);
  await expect(page.getByRole('button', { name: 'Đặt lại mức phóng', exact: true })).toHaveText(
    lastZoom ?? '',
  );
});

test('student adds content inside the instructor FOV while following in collaborative mode', async ({
  page,
}) => {
  const { present, viewport, writtenShapes } = await fixture(page, false, { collaborative: true });
  await expect(page.getByText('Đã lưu', { exact: true })).toBeVisible();
  const target = { ...viewport, x: 5000, y: 4000, scale: 2 };
  present(target);
  await expect(page.getByRole('button', { name: 'Theo giảng viên', exact: true })).toHaveText(
    'Đang theo',
  );
  await page.getByRole('button', { name: 'Thêm ghi chú', exact: true }).click();
  await expect
    .poll(() => writtenShapes.find((shape) => shape.id !== ids.file)?.x)
    .toBeCloseTo(target.x + target.width / target.scale / 2 - 110);
  expect(writtenShapes.find((shape) => shape.id !== ids.file)?.y).toBeCloseTo(
    target.y + target.height / target.scale / 2 - 75,
  );
});

test('instructor publishes initial viewport, zoom changes and stationary refreshes for late joiners', async ({
  page,
}) => {
  const { outgoing } = await fixture(page, true);
  await expect.poll(() => outgoing.length).toBeGreaterThan(0);
  const initial = outgoing[0];
  const box = await page.locator('.whiteboard-canvas').boundingBox();
  if (!box) throw new Error('Missing canvas');
  expect(initial).toMatchObject({
    epoch: ids.question,
    scale: 1,
    width: Math.floor(box.width),
    height: Math.floor(box.height),
  });
  expect(await page.getByRole('button', { name: 'Theo giảng viên', exact: true }).count()).toBe(0);
  await page.getByRole('button', { name: 'Phóng to', exact: true }).click();
  await expect.poll(() => outgoing.at(-1)?.scale).toBeCloseTo(1.2);
  const count = outgoing.length;
  await expect.poll(() => outgoing.length, { timeout: 4000 }).toBeGreaterThan(count);
  expect(outgoing.at(-1)?.scale).toBeCloseTo(1.2);
});
