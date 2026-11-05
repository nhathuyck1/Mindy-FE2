import { expect, test } from '@playwright/test';
import { testUser } from './api-fixtures';
import { adminClasses } from './admin-fixtures';
import { mockMentorWorkspace } from './mentor-workspace-fixtures';
import { mentorIds } from './mentor-fixtures';

const classId = adminClasses[0].id,
  unitId = '55555555-5555-4555-8555-555555555555',
  sessionId = '66666666-6666-4666-8666-666666666666';

test('mentor swaps two assigned future sessions and retries the same uncertain request', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-22T03:00:00Z'));
  await mockMentorWorkspace(page);
  const calls: { body: unknown; key?: string }[] = [];
  const person = { id: testUser.id, displayName: 'Mentor' };
  const sessions = [0, 1].map((i) => ({
    sessionId: i ? mentorIds.nextUnit : mentorIds.session,
    classId: mentorIds.class,
    classUnitId: mentorIds.unit,
    title: `Buổi ${i + 7}`,
    startsAt: `2026-10-${26 + i}T03:00:00Z`,
    endsAt: `2026-10-${26 + i}T05:00:00Z`,
    status: 'SCHEDULED',
    version: 1,
    primaryMentor: person,
    effectiveMentor: person,
    assignmentType: 'PRIMARY',
    actualStartedAt: null,
    actualEndedAt: null,
    editableUntil: null,
    asOf: '2026-10-22T03:00:00Z',
    timeZone: 'Asia/Ho_Chi_Minh',
    capabilities: { readSessionContext: true, writeTeachingNotes: false },
  }));
  await page.route(`**/api/v1/mentor/classes/${mentorIds.class}/sessions?**`, (r) =>
    r.fulfill({ json: { items: sessions, page: 1, pageSize: 20, total: 2 } }),
  );
  await page.route(`**/api/v1/mentor/classes/${mentorIds.class}/sessions/swap`, (r) => {
    calls.push({ body: r.request().postDataJSON(), key: r.request().headers()['idempotency-key'] });
    return calls.length === 1
      ? r.fulfill({ status: 503, json: { message: 'Response lost' } })
      : r.fulfill({
          json: { timeZone: 'Asia/Ho_Chi_Minh', expectedVersion: 2, sessions: [], conflicts: [] },
        });
  });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Buổi học', exact: true }).click();
  await page.getByText('Hoán đổi hai buổi trong trang lịch này', { exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Buổi thứ nhất', exact: true })
    .selectOption(mentorIds.session);
  await page
    .getByRole('combobox', { name: 'Buổi thứ hai', exact: true })
    .selectOption(mentorIds.nextUnit);
  await page.getByLabel('Lý do', { exact: true }).fill('Đổi ngày buổi 7 và 8');
  await page.getByRole('button', { name: 'Xác nhận hoán đổi', exact: true }).click();
  await page.getByRole('button', { name: 'Thử lại cùng yêu cầu', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Đã hoán đổi thời gian hai buổi.' }),
  ).toBeVisible();
  expect(calls).toHaveLength(2);
  expect(calls[0]).toEqual(calls[1]);
});
test('manager previews a weekly timetable and retries an uncertain save with the same receipt', async ({
  page,
}, info) => {
  const calls: { body: unknown; key: string | undefined }[] = [];
  let saved = false;
  const detail = {
    ...adminClasses[0],
    startDate: '2030-01-07',
    endDate: '2030-01-07',
    meetingUrl: null,
    units: [
      {
        id: unitId,
        courseUnitId: unitId,
        position: 1,
        title: 'Chương 1',
        status: 'LOCKED',
        unlockAt: null,
        sessions: [
          {
            id: sessionId,
            classUnitId: unitId,
            sessionNumber: 1,
            title: 'Nội dung giữ nguyên',
            startsAt: '2030-01-07T00:30:00Z',
            endsAt: '2030-01-07T02:00:00Z',
            roomName: null,
            meetingUrl: null,
            status: 'SCHEDULED',
          },
        ],
      },
    ],
  };
  const result = {
    timeZone: 'Asia/Ho_Chi_Minh',
    expectedVersion: 2,
    sessions: [
      {
        sessionId,
        classUnitId: unitId,
        title: 'Nội dung giữ nguyên',
        startsAt: '2030-01-07T00:30:00Z',
        endsAt: '2030-01-07T02:00:00Z',
      },
    ],
    conflicts: [],
  };
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/me')) return route.fulfill({ json: { ...testUser, role: 'MANAGER' } });
    if (path.endsWith('/dashboard'))
      return route.fulfill({
        json: {
          scope: 'MANAGER',
          timeZone: 'Asia/Ho_Chi_Minh',
          generatedAt: '2026-11-06T00:00:00Z',
          from: '2026-08-01T00:00:00Z',
          to: '2026-11-06T00:00:00Z',
          summary: { collectedAmount: '0', paidOrders: 0, pendingAmount: '0', pendingOrders: 0 },
          paymentMethods: [],
          courses: [],
          classes: [],
          trend: [],
          reconciliation: [],
          openingAlerts: [],
        },
      });
    if (path.endsWith('/teaching-slots'))
      return route.fulfill({ json: [{ id: 1, startsAt: '07:30', endsAt: '09:00' }] });
    if (path.endsWith('/management/classes'))
      return route.fulfill({ json: { items: [detail], page: 1, pageSize: 20, total: 1 } });
    if (path.endsWith('/weekly-schedule/preview')) return route.fulfill({ json: result });
    if (path.endsWith('/weekly-schedule')) {
      if (route.request().method() === 'GET')
        return route.fulfill({
          json: {
            class: { ...detail, assignmentVersion: saved ? 2 : 1 },
            weeklySlots: [{ weekday: 1, slotId: 1 }],
          },
        });
      calls.push({
        body: route.request().postDataJSON(),
        key: route.request().headers()['idempotency-key'],
      });
      if (calls.length === 1)
        return route.fulfill({ status: 503, json: { message: 'Response lost' } });
      saved = true;
      return route.fulfill({ json: result });
    }
    return route.fulfill({
      json: { items: [], page: 1, pageSize: 20, total: 0, asOf: '2026-11-06T00:00:00Z' },
    });
  });
  await page.goto('/manager');
  await page.getByText('Lịch tuần và dời khai giảng', { exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Lớp đang mở đăng ký', exact: true })
    .selectOption(classId);
  await expect(page.getByLabel('Tên buổi 1')).toBeDisabled();
  await page.getByLabel('Lý do', { exact: true }).fill('Dời khai giảng');
  await page.getByRole('button', { name: 'Xem trước lịch', exact: true }).click();
  await expect(page.getByText('Lịch dự kiến', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu toàn bộ lịch', exact: true }).click();
  await page.getByRole('button', { name: 'Thử lưu lại cùng yêu cầu', exact: true }).click();
  await expect.poll(() => calls.length).toBe(2);
  expect(calls[0]).toEqual(calls[1]);
  expect(calls[0].key).toMatch(/^[a-f0-9-]{36}$/);
  await expect(page.getByLabel('Lý do', { exact: true })).toBeEnabled();
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const reasonBounds = await page.getByLabel('Lý do', { exact: true }).boundingBox();
  expect(reasonBounds!.x + reasonBounds!.width).toBeLessThanOrEqual(
    await page.evaluate(() => innerWidth),
  );
  await page.screenshot({ path: info.outputPath('weekly-schedule.png'), fullPage: true });
});

test('manager confirms a retention snapshot and sees stale items without claiming reclaimed storage', async ({
  page,
}) => {
  let body: unknown;
  const material = {
    id: sessionId,
    title: 'Tài liệu cũ',
    revision: 3,
    lastSeenAt: null,
    trackingStartedAt: '2026-10-01T00:00:00.000Z',
    isUnseen: true,
    relatedSizeBytes: '1048576',
  };
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/me')) return route.fulfill({ json: { ...testUser, role: 'MANAGER' } });
    if (path.endsWith('/storage-cleanup'))
      return route.fulfill({
        json: { reclaimableBytes: '1048576', reclaimedBytes: '0', pendingFiles: 1, failedFiles: 0 },
      });
    if (path.endsWith('/bulk-delete')) {
      body = route.request().postDataJSON();
      return route.fulfill({ json: { items: [{ materialId: material.id, status: 'STALE' }] } });
    }
    return route.fulfill({
      json: {
        items: path.endsWith('/materials') ? [material] : [],
        page: 1,
        pageSize: 20,
        total: path.endsWith('/materials') ? 1 : 0,
      },
    });
  });
  await page.goto('/manager/materials?view=inventory');
  await page.getByLabel('Chọn Tài liệu cũ', { exact: true }).check();
  await page.getByRole('button', { name: 'Xóa 1 tài liệu đã chọn', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Tài liệu cũ · v3');
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận xóa', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '0 tài liệu đã xóa' })).toContainText(
    '1 tài liệu vừa thay đổi',
  );
  expect(body).toEqual({
    items: [
      {
        materialId: material.id,
        expectedRevision: 3,
        lastSeenAt: null,
        trackingStartedAt: material.trackingStartedAt,
      },
    ],
  });
  await expect(page.getByText(/Đã thu hồi: 0 MiB/)).toBeVisible();
});
