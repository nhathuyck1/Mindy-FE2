import { expect, test, type Page } from '@playwright/test';
import * as Y from 'yjs';
import { mockAssignments } from './assignment-fixtures';
import { assignment, ids, now } from '../fixtures/assignment-data';
import { scheduleEventSchema } from '../../src/features/user/schemas/user-contracts';

async function fixture(
  page: Page,
  options: {
    mode?: 'FULL' | 'CASH_PREVIEW' | 'SESSION_MAKEUP';
    status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    meeting?: string | null;
  } = {},
) {
  await mockAssignments(page);
  await page.clock.setFixedTime(new Date(now));
  const event = scheduleEventSchema.parse({
    sessionId: ids.session,
    sessionNumber: 1,
    sessionTitle: 'React Router và gọi API',
    sessionStatus: options.status ?? 'SCHEDULED',
    startsAt: now,
    endsAt: '2026-11-02T05:00:00.000Z',
    dayOfWeek: 'Monday',
    startTime: '10:00',
    endTime: '12:00',
    roomName: null,
    classId: ids.class,
    classCode: 'REACT-201-ON1',
    className: 'ReactJS thực chiến',
    classStatus: 'IN_PROGRESS',
    courseId: ids.assignment,
    courseTitle: 'ReactJS',
    classUnitId: ids.question,
    unitTitle: 'Gọi API',
    deliveryMode: 'ONLINE',
    mentor: { id: ids.student, displayName: 'Mentor Minh' },
    assignmentType: 'PRIMARY',
    enrollmentId: ids.file,
    attendanceStatus: null,
    attendanceApplicability: 'NOT_STARTED',
    attendanceExcluded: false,
    creditedAttendanceStatus: null,
    makeupForSessionId: null,
    makeupRootSessionId: null,
    sourceClassId: null,
    sourceSessionId: null,
    makeupPlacementId: null,
    accessMode: options.mode ?? 'FULL',
  });
  const context = {
    id: ids.class,
    courseId: ids.assignment,
    code: event.classCode,
    name: event.className,
    startDate: '2026-10-01',
    endDate: '2027-01-01',
    deliveryMode: 'ONLINE',
    maxStudents: 20,
    availableSeats: 5,
    mentor: event.mentor,
    classStatus: 'IN_PROGRESS',
    enrollmentId: ids.file,
    enrollmentStatus: 'ACTIVE',
    enrolledAt: now,
    accessMode: 'FULL',
    meetingUrl: 'https://meet.example.test/class',
    units: [
      {
        id: ids.question,
        position: 1,
        title: 'Gọi API',
        sessions: [
          {
            id: event.sessionId,
            sessionNumber: 1,
            title: event.sessionTitle,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            roomName: null,
            status: event.sessionStatus,
            meetingUrl:
              options.meeting === undefined ? 'https://meet.example.test/session' : options.meeting,
          },
        ],
      },
    ],
  };
  const state = {
    denied: false,
    assignmentError: false,
    empty: false,
    boardCreated: false,
    classMeeting: true,
  };
  const calls: string[] = [];
  const board = {
    id: ids.assignment,
    sessionId: ids.session,
    title: 'Bảng React',
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
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/api/v1/', '');
    calls.push(path);
    if (path === 'me/schedule')
      return route.fulfill({
        json: {
          items: [event],
          total: 1,
          page: 1,
          pageSize: 100,
          asOf: now,
          timeZone: 'Asia/Ho_Chi_Minh',
          from: url.searchParams.get('from'),
          to: url.searchParams.get('to'),
        },
      });
    if (path === `me/classes/${ids.class}`)
      return route.fulfill(
        state.denied
          ? { status: 403, json: { code: 'CLASS_ACCESS_DENIED', message: 'Denied' } }
          : { json: { ...context, meetingUrl: state.classMeeting ? context.meetingUrl : null } },
      );
    if (path === `class-sessions/${ids.session}/context`)
      return route.fulfill({
        json: {
          session: {
            sessionId: ids.session,
            classId: ids.class,
            classUnitId: ids.question,
            title: event.sessionTitle,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            status: event.sessionStatus,
            primaryMentor: event.mentor,
            effectiveMentor: event.mentor,
            assignmentType: 'PRIMARY',
            version: 1,
            actualStartedAt: null,
            actualEndedAt: null,
            editableUntil: null,
            asOf: now,
            timeZone: 'Asia/Ho_Chi_Minh',
          },
          meetingUrl: 'https://meet.example.test/makeup',
          roomName: null,
          accessScope: 'SESSION',
        },
      });
    if (path === `me/classes/${ids.class}/assignments`) {
      expect(url.searchParams.get('sessionId')).toBe(ids.session);
      if (state.assignmentError)
        return route.fulfill({ status: 503, json: { code: 'UNAVAILABLE' } });
      const pageNumber = Number(url.searchParams.get('page') ?? 1);
      return route.fulfill({
        json: {
          items: state.empty
            ? []
            : pageNumber === 1
              ? ['QUIZ', 'ZIP', 'CODE'].map((type, i) => ({
                  ...assignment,
                  id: i === 0 ? ids.assignment : `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa${i}`,
                  type,
                  status: 'PUBLISHED',
                  title: `Bài ${type}`,
                  publishedAt: now,
                }))
              : [{ ...assignment, status: 'PUBLISHED', title: 'Bài trang sau', publishedAt: now }],
          total: state.empty ? 0 : 21,
          page: pageNumber,
          pageSize: 20,
        },
      });
    }
    if (path === `class-sessions/${ids.session}/whiteboard`)
      return route.fulfill({
        json: {
          sessionId: ids.session,
          board: state.boardCreated ? board : null,
          context: {
            sessionId: ids.session,
            sessionTitle: event.sessionTitle,
            classId: ids.class,
            className: event.className,
            sessionStatus: 'SCHEDULED',
            displayName: 'Học viên',
            mentor: false,
          },
          capabilities,
        },
      });
    if (path === `whiteboards/${ids.assignment}/sync`)
      return route.fulfill({
        json: {
          board,
          capabilities,
          binary: Buffer.from(Y.encodeStateAsUpdate(new Y.Doc())).toString('base64'),
          identity: { id: ids.student, name: 'Học viên' },
        },
      });
    return route.fallback();
  });
  await page.goto('/user/schedule');
  await page.getByRole('button', { name: `Xem chi tiết ${event.sessionTitle}` }).click();
  return { state, calls };
}

test('student schedule opens meeting, whiteboard and all three assignment types with pagination', async ({
  page,
}, info) => {
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 780 });
  const { calls } = await fixture(page);
  const dialog = page.getByRole('dialog', { name: 'Chi tiết lớp học' });
  await expect(dialog.getByRole('link', { name: 'Vào phòng học' })).toHaveAttribute(
    'href',
    'https://meet.example.test/session',
  );
  await expect(dialog.getByRole('link', { name: 'Vào phòng học' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
  await expect(dialog.getByRole('link', { name: 'Mở bảng vẽ' })).toHaveAttribute(
    'href',
    `/whiteboards/${ids.session}`,
  );
  for (const type of ['QUIZ', 'ZIP', 'CODE'])
    await expect(dialog.getByRole('link').filter({ hasText: `Bài ${type}` })).toBeVisible();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('student-session.png'), fullPage: true });
  await dialog.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(dialog.getByText('Bài trang sau', { exact: true })).toBeVisible();
  expect(calls.some((path) => path.startsWith('mentor/'))).toBe(false);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Xem chi tiết React Router và gọi API' }),
  ).toBeFocused();
});

test('student follows a session assignment into its existing quiz page', async ({ page }) => {
  await fixture(page);
  await page.getByRole('link').filter({ hasText: 'Bài QUIZ' }).click();
  await expect(page).toHaveURL(new RegExp(`/user/assignments/${ids.assignment}`));
  await expect(page.getByRole('heading', { name: assignment.title, exact: true })).toBeVisible();
});

test('student uses the class meeting fallback and handles an absent link', async ({ page }) => {
  const { state } = await fixture(page, { meeting: null });
  await expect(page.getByRole('link', { name: 'Vào phòng học' })).toHaveAttribute(
    'href',
    'https://meet.example.test/class',
  );
  state.classMeeting = false;
  await page.reload();
  await page.getByRole('button', { name: 'Xem chi tiết React Router và gọi API' }).click();
  await expect(page.getByText('Mentor chưa cập nhật link phòng học.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vào phòng học' })).toHaveCount(0);
});

for (const status of ['COMPLETED', 'CANCELLED'] as const)
  test(`student handles ${status} sessions without a meeting action`, async ({ page }) => {
    const { calls } = await fixture(page, { status });
    await expect(
      page.getByText(status === 'COMPLETED' ? 'Buổi học đã kết thúc.' : 'Buổi học đã hủy.', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Vào phòng học' })).toHaveCount(0);
    if (status === 'CANCELLED') {
      await expect(page.getByRole('link', { name: 'Mở bảng vẽ' })).toHaveCount(0);
      expect(
        calls.some((path) => path === `me/classes/${ids.class}` || path.endsWith('/assignments')),
      ).toBe(false);
    } else await expect(page.getByRole('link').filter({ hasText: 'Bài QUIZ' })).toBeVisible();
  });

test('cash preview never loads private class, board or assignment data', async ({ page }) => {
  const { calls } = await fixture(page, { mode: 'CASH_PREVIEW' });
  await expect(page.getByText(/Chờ xác nhận thanh toán tiền mặt để mở/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mở bảng vẽ' })).toHaveCount(0);
  expect(
    calls.some(
      (path) =>
        path === `me/classes/${ids.class}` ||
        path.endsWith('/assignments') ||
        path.endsWith('/context'),
    ),
  ).toBe(false);
});

test('makeup student uses session scope for board and meeting without loading the target class assignments', async ({
  page,
}) => {
  const { calls } = await fixture(page, { mode: 'SESSION_MAKEUP' });
  await expect(page.getByRole('link', { name: 'Vào phòng học' })).toHaveAttribute(
    'href',
    'https://meet.example.test/makeup',
  );
  await expect(page.getByRole('link', { name: 'Mở bảng vẽ' })).toBeVisible();
  await expect(
    page.getByText(/Bài tập của lớp dành cho học viên đăng ký chính thức/),
  ).toBeVisible();
  expect(calls).toContain(`class-sessions/${ids.session}/context`);
  expect(calls.some((path) => path.startsWith('me/classes/'))).toBe(false);
});

test('assignment errors recover and empty results remain distinct from failures', async ({
  page,
}) => {
  const { state } = await fixture(page);
  state.assignmentError = true;
  await page.reload();
  await page.getByRole('button', { name: 'Xem chi tiết React Router và gọi API' }).click();
  await expect(page.getByText('Chưa tải được bài tập của buổi học.')).toBeVisible();
  state.assignmentError = false;
  state.empty = true;
  await page.getByRole('button', { name: 'Thử lại bài tập' }).click();
  await expect(page.getByText('Chưa có bài tập được giao cho buổi học này.')).toBeVisible();
});

test('student reaches an uncreated board without mentor controls and can view a created board', async ({
  page,
}) => {
  const { state } = await fixture(page);
  await page.getByRole('link', { name: 'Mở bảng vẽ' }).click();
  await expect(page.getByText('Mentor chưa tạo bảng cho buổi học này.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tạo bảng vẽ', exact: true })).toHaveCount(0);
  state.boardCreated = true;
  await page.reload();
  await expect(page.getByText('Chỉ xem', { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Chế độ bảng' })).toHaveCount(0);
});
test('revoked class access hides private actions and can recover', async ({ page }) => {
  const { state } = await fixture(page);
  state.denied = true;
  await page.reload();
  await page.getByRole('button', { name: 'Xem chi tiết React Router và gọi API' }).click();
  await expect(
    page.getByText('Bạn chưa có quyền truy cập nội dung của buổi học này.'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mở bảng vẽ' })).toHaveCount(0);
  state.denied = false;
  await page.getByRole('button', { name: 'Thử lại buổi học' }).click();
  await expect(page.getByRole('link', { name: 'Mở bảng vẽ' })).toBeVisible();
});

test('unsafe meeting URLs are rejected before displaying any room action', async ({ page }) => {
  await fixture(page, { meeting: 'javascript:alert(1)' });
  await expect(
    page.getByText('Chưa tải được không gian buổi học. Vui lòng thử lại.'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vào phòng học' })).toHaveCount(0);
});
