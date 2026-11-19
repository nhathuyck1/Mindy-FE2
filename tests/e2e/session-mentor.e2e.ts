import { expect, test, type Page } from '@playwright/test';
import { adminClasses, mockAdminApi } from './admin-fixtures';
import { mockHomepageApi, testUser } from './api-fixtures';

const classroom = adminClasses[0];
const ids = {
  session: '55555555-5555-4555-8555-555555555555',
  unit: '66666666-6666-4666-8666-666666666666',
  mentor: '77777777-7777-4777-8777-777777777777',
  next: '88888888-8888-4888-8888-888888888888',
};
const primary = classroom.mentor;
const substitute = { id: ids.mentor, displayName: 'Nguyễn Hà Linh' };
const initialSession = {
  sessionId: ids.session,
  classId: classroom.id,
  classUnitId: ids.unit,
  title: 'Thực hành HTML và CSS',
  startsAt: '2026-11-25T02:30:00Z',
  endsAt: '2026-11-25T04:00:00Z',
  status: 'SCHEDULED',
  primaryMentor: primary,
  effectiveMentor: primary,
  assignmentType: 'PRIMARY',
  version: 1,
  actualStartedAt: null,
  actualEndedAt: null,
  editableUntil: null,
  asOf: '2026-11-19T03:00:00Z',
  timeZone: 'Asia/Ho_Chi_Minh',
};
async function setup(
  page: Page,
  options: {
    failure?: 409 | 503;
    assigned?: boolean;
    admin?: boolean;
    empty?: boolean;
    candidateFailure?: boolean;
    paginated?: boolean;
    inProgress?: boolean;
  } = {},
) {
  await mockHomepageApi(page);
  await mockAdminApi(page);
  let current = {
    ...initialSession,
    ...(options.assigned ? { effectiveMentor: substitute, assignmentType: 'SUBSTITUTE' } : {}),
    ...(options.inProgress
      ? { status: 'IN_PROGRESS', actualStartedAt: '2026-11-25T02:31:00Z' }
      : {}),
  };
  const writes: { body: unknown; key: string | undefined }[] = [];
  let failCandidates = options.candidateFailure ?? false;
  let classReadFailure = false;
  const reads: string[] = [];
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ json: { ...testUser, role: options.admin ? 'ADMIN' : 'MANAGER' } }),
  );
  await page.route('**/api/v1/teaching-slots', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/v1/management/**', (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    reads.push(url.pathname + url.search);
    if (path.endsWith('/available-mentors')) {
      if (failCandidates) {
        failCandidates = false;
        return route.fulfill({ status: 503, json: { message: 'Unavailable' } });
      }
      const search = url.searchParams.get('search')?.toLocaleLowerCase('vi') ?? '';
      const items = options.empty
        ? []
        : [
            { ...current.effectiveMentor, isCurrent: true },
            ...(current.effectiveMentor.id === ids.mentor
              ? []
              : [{ ...substitute, isCurrent: false }]),
          ].filter((item) => item.displayName.toLocaleLowerCase('vi').includes(search));
      return route.fulfill({
        json: {
          sessionId: ids.session,
          sessionVersion: current.version,
          checkedFrom: current.startsAt,
          checkedTo: current.endsAt,
          items,
          page: 1,
          pageSize: 10,
          total: items.length,
          asOf: current.asOf,
          timeZone: current.timeZone,
          availabilityBasis: 'TEACHING_SCHEDULE_AND_APPROVED_LEAVE',
        },
      });
    }
    if (path.endsWith('/mentor')) {
      writes.push({
        body: route.request().postDataJSON(),
        key: route.request().headers()['idempotency-key'],
      });
      if (writes.length === 1 && options.failure) {
        if (options.failure === 409) current = { ...current, version: 2 };
        return route.fulfill({
          status: options.failure,
          json: {
            code: options.failure === 409 ? 'SESSION_VERSION_CONFLICT' : 'UNKNOWN',
            message: 'Changed',
          },
        });
      }
      const input = route.request().postDataJSON();
      current = {
        ...current,
        version: current.version + 1,
        effectiveMentor: input.mentorId === null ? primary : substitute,
        assignmentType: input.mentorId === null ? 'PRIMARY' : 'SUBSTITUTE',
      };
      return route.fulfill({ json: current });
    }
    if (path.endsWith('/weekly-schedule'))
      return route.fulfill({
        json: {
          class: { ...classroom, status: 'IN_PROGRESS', meetingUrl: null, units: [] },
          weeklySlots: [],
        },
      });
    if (path.endsWith('/classes'))
      return route.fulfill({
        json: { items: [{ ...classroom, status: 'IN_PROGRESS' }], page: 1, pageSize: 20, total: 1 },
      });
    if (path.endsWith(`/classes/${classroom.id}`)) {
      if (classReadFailure)
        return route.fulfill({ status: 503, json: { message: 'Read unavailable' } });
      const secondPage = url.searchParams.get('page') === '2';
      return route.fulfill({
        json: {
          class: { ...classroom, status: 'IN_PROGRESS', primaryMentor: primary },
          sessions: {
            items: secondPage
              ? [{ ...current, sessionId: ids.next, title: 'Buổi trang sau' }]
              : [
                  current,
                  { ...current, sessionId: ids.next, title: 'Buổi đã học', status: 'COMPLETED' },
                ],
            page: secondPage ? 2 : 1,
            pageSize: 20,
            total: options.paginated ? 21 : 2,
          },
        },
      });
    }
    return route.fulfill({ status: 404, json: { message: 'Not found' } });
  });
  if (options.admin) {
    await page.goto('/admin/classes');
    await page.getByRole('button', { name: `Xếp lịch: ${classroom.name}`, exact: true }).click();
    await page.getByText('Gán / đổi mentor dạy thay theo buổi', { exact: true }).click();
  } else await page.goto(`/manager/schedule?classId=${classroom.id}`);
  const panel = page.getByRole('region', { name: 'Phân công dạy thay', exact: true });
  await expect(panel.getByLabel('Buổi cần dạy thay')).toBeVisible();
  return {
    writes,
    reads,
    panel,
    setClassReadFailure: (value: boolean) => {
      classReadFailure = value;
    },
  };
}
async function choose(page: Page) {
  await page.getByLabel('Buổi cần dạy thay').selectOption(ids.session);
  await page.getByRole('combobox', { name: 'Mentor dạy thay' }).click();
  await page.getByRole('option', { name: substitute.displayName, exact: true }).click();
  await page.getByLabel('Lý do phân công').fill('Mentor chính bận đột xuất');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
}
test('manager selects session then mentor and confirms only that session', async ({
  page,
  isMobile,
}, info) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 850 });
  const api = await setup(page);
  await expect(page.getByRole('option', { name: /Buổi đã học/ })).toHaveAttribute('disabled', '');
  await page.getByLabel('Buổi cần dạy thay').selectOption(ids.session);
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeDisabled();
  await expect(page.getByRole('combobox', { name: 'Lớp học', exact: true })).toBeDisabled();
  const picker = page.getByRole('combobox', { name: 'Mentor dạy thay' });
  await picker.fill('không có');
  await expect(page.getByText('Không tìm thấy giảng viên phù hợp.')).toBeVisible();
  await picker.fill('Hà');
  await expect(page.getByRole('option', { name: substitute.displayName })).toBeVisible();
  await picker.press('ArrowDown');
  await picker.press('Enter');
  await page.getByLabel('Lý do phân công').fill('Mentor chính bận đột xuất');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).scrollIntoViewIfNeeded();
  await api.panel.screenshot({
    path: info.outputPath('session-mentor-form.png'),
    animations: 'disabled',
    scale: 'css',
  });
  await page.screenshot({
    path: info.outputPath('session-mentor-page.png'),
    fullPage: true,
    animations: 'disabled',
    scale: 'css',
  });
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  expect(api.writes).toHaveLength(0);
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText('Thực hành HTML và CSS');
  await expect(confirm).toContainText('25/11/26');
  await page.screenshot({
    path: info.outputPath('session-mentor-confirmation.png'),
    animations: 'disabled',
    scale: 'css',
  });
  await confirm.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận phân công' }).click();
  await expect(api.panel.getByRole('status')).toContainText(
    `Đã phân công ${substitute.displayName}`,
  );
  expect(api.writes).toHaveLength(1);
  expect(api.writes[0].body).toEqual({
    mentorId: ids.mentor,
    expectedVersion: 1,
    reason: 'Mentor chính bận đột xuất',
  });
  expect(api.writes[0].key).toMatch(/^[0-9a-f-]{36}$/);
  await expect(page.getByLabel('Buổi cần dạy thay')).toBeFocused();
  await page.getByLabel('Buổi cần dạy thay').selectOption(ids.session);
  await expect(api.panel).toContainText(`Đang dạy thay: ${substitute.displayName}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('admin can assign from the existing class schedule', async ({ page }) => {
  const api = await setup(page, { admin: true });
  await choose(page);
  await page.getByRole('button', { name: 'Xác nhận phân công' }).click();
  await expect(api.panel.getByRole('status')).toContainText('Đã phân công');
  expect(api.writes).toHaveLength(1);
});
test('removal restores primary mentor with a required reason', async ({ page }) => {
  const api = await setup(page, { assigned: true });
  await page.getByLabel('Buổi cần dạy thay').selectOption(ids.session);
  await page.getByRole('checkbox', { name: /Gỡ dạy thay/ }).check();
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeDisabled();
  await page.getByLabel('Lý do phân công').fill('Mentor chính đã trở lại');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Gỡ phân công dạy thay?');
  await page.getByRole('button', { name: 'Xác nhận phân công' }).click();
  await expect(api.panel.getByRole('status')).toContainText('Đã gỡ dạy thay');
  expect(api.writes[0].body).toMatchObject({ mentorId: null, expectedVersion: 1 });
});
test('uncertain save retains the original request and locks editing until retry', async ({
  page,
}) => {
  const api = await setup(page, { failure: 503 });
  await choose(page);
  await page.getByRole('button', { name: 'Xác nhận phân công' }).click();
  await expect(page.getByRole('alert')).toContainText('Chưa xác định kết quả');
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(page.getByLabel('Lý do phân công')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Hủy', exact: true })).toBeDisabled();
  await expect(page.getByRole('combobox', { name: 'Lớp học', exact: true })).toBeDisabled();
  api.setClassReadFailure(true);
  await page.clock.install();
  await page.clock.fastForward(61_000);
  await page.evaluate(() => {
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
  });
  await expect(api.panel.getByRole('alert')).toContainText('Chưa tải lại được lịch buổi học');
  await expect(page.getByLabel('Lý do phân công')).toBeDisabled();
  api.setClassReadFailure(false);
  await page.getByRole('button', { name: 'Kiểm tra lại yêu cầu' }).click();
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(api.panel.getByRole('status')).toContainText('Đã phân công');
  expect(api.writes).toHaveLength(2);
  expect(api.writes[1]).toEqual(api.writes[0]);
});
test('conflict reloads the session and requires a new selection and receipt', async ({ page }) => {
  const api = await setup(page, { failure: 409 });
  await choose(page);
  await page.getByRole('button', { name: 'Xác nhận phân công' }).click();
  await expect(page.getByRole('alert')).toContainText('Tải lại danh sách');
  await page.getByRole('button', { name: 'Tải lại danh sách', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Mentor dạy thay' }).click();
  await page.getByRole('option', { name: substitute.displayName, exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận phân công' }).click();
  await expect(api.panel.getByRole('status')).toContainText('Đã phân công');
  expect(api.writes[1].body).toMatchObject({ expectedVersion: 2 });
  expect(api.writes[1].key).not.toBe(api.writes[0].key);
});
test('candidate errors recover and empty candidates never enable assignment', async ({ page }) => {
  const api = await setup(page, { candidateFailure: true, empty: true });
  await page.getByLabel('Buổi cần dạy thay').selectOption(ids.session);
  await page.getByRole('combobox', { name: 'Mentor dạy thay' }).click();
  await expect(page.getByText('Không tải được giảng viên.')).toBeVisible();
  await page.getByRole('button', { name: 'Tải lại', exact: true }).click();
  await expect(page.getByText('Không tìm thấy giảng viên phù hợp.')).toBeVisible();
  await page.getByLabel('Lý do phân công').fill('Cần người thay');
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeDisabled();
  expect(api.writes).toHaveLength(0);
});
test('session picker supports later pages and ongoing sessions show transfer notice', async ({
  page,
}) => {
  const api = await setup(page, { paginated: true, inProgress: true });
  await api.panel.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(page.getByRole('option', { name: /Buổi trang sau/ })).toHaveCount(1);
  await api.panel.getByRole('button', { name: 'Trước', exact: true }).click();
  await choose(page);
  await expect(page.getByRole('alertdialog')).toContainText('Buổi đang học');
  expect(api.reads.some((path) => path.includes('page=2'))).toBe(true);
});
