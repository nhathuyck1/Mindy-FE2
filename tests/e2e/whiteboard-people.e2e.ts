import { expect, test } from '@playwright/test';
import * as Y from 'yjs';
import { mockAssignments } from './assignment-fixtures';
import { ids, now } from '../fixtures/assignment-data';
import { testUser } from './api-fixtures';

test('whiteboard shows connected people without cursor activity and scrolls a compact list', async ({
  page,
}) => {
  await mockAssignments(page);
  const self = { id: testUser.id, name: testUser.displayName };
  const people = [
    self,
    ...Array.from({ length: 14 }, (_, i) => ({
      id: `22222222-2222-4222-8222-${String(i).padStart(12, '0')}`,
      name: `Nguyễn Văn Học Viên ${i + 1}`,
    })),
  ];
  const board = {
    id: ids.assignment,
    sessionId: ids.session,
    title: 'Bảng buổi học',
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
    canEdit: false,
    canControl: false,
    canUpload: false,
    canSnapshot: false,
    canRestore: false,
    canExport: false,
  };
  const state = {
    board,
    capabilities,
    identity: self,
    binary: Buffer.from(Y.encodeStateAsUpdate(new Y.Doc())).toString('base64'),
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
          displayName: self.name,
          mentor: false,
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
  let updatePeople: (value: typeof people) => void = () => {};
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
    updatePeople = (value) => ws.send('42' + JSON.stringify(['board:presence', { people: value }]));
    ws.onMessage((message) => {
      const text = String(message);
      if (text.startsWith('40')) ws.send('40' + JSON.stringify({ sid: 'test' }));
      const packet = /^42(\d+)(\[[\s\S]*)$/.exec(text);
      if (packet && JSON.parse(packet[2])[0] === 'board:join') {
        ws.send('43' + packet[1] + JSON.stringify([{ ok: true, data: state }]));
        updatePeople([...people, people[1]]);
      }
    });
  });
  await page.goto(`/whiteboards/${ids.session}`);
  await expect(page.locator('.whiteboard-self-name')).toHaveText(self.name);
  const trigger = page.getByRole('button', { name: 'Người đang hoạt động: 15', exact: true });
  await trigger.click();
  const list = page.getByLabel('Danh sách người tham gia');
  await expect(list.getByRole('listitem')).toHaveCount(15);
  await expect(list.getByText(`${self.name} (Bạn)`, { exact: true })).toBeVisible();
  expect(
    await list.evaluate((el) => el.scrollHeight > el.clientHeight && el.clientHeight <= 240),
  ).toBe(true);
  await list.getByText(people[14].name, { exact: true }).scrollIntoViewIfNeeded();
  await expect(list.getByText(people[14].name, { exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/whiteboard-people-${test.info().project.name}.png` });
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.setViewportSize({ width: 320, height: 720 });
  expect(
    await page.locator('.whiteboard-people').evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  updatePeople([self]);
  await expect(
    page.getByRole('button', { name: 'Người đang hoạt động: 1', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
