import { expect, test, type Page } from '@playwright/test';
import { mockHomepageApi, testUser } from './api-fixtures';
import { adminClasses, adminCourses, adminUsers, mockAdminApi } from './admin-fixtures';
import { userSchema } from '../../src/lib/api/contracts';
import {
  adminClassDetailSchema,
  adminCourseDetailSchema,
  createAdminClassSchema,
  createAdminCourseSchema,
  createAdminUserSchema,
  updateAdminClassSchema,
  updateAdminCourseSchema,
  updateAdminUserStatusSchema,
  addAdminCourseUnitSchema,
  scheduleAdminSessionSchema,
  updateAdminSessionTimeSchema,
  reorderAdminCourseUnitsSchema,
} from '../../src/features/admin/schemas/admin-write-contracts';

const newId = '99999999-9999-4999-8999-999999999999';
const unitId = '88888888-8888-4888-8888-888888888888';
const sessionId = '77777777-7777-4777-8777-777777777777';

test('Table icon actions open centered blurred modals without duplicate action buttons', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const api = await mockCrud(page);
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  await page.route('**/api/v1/admin/classes/*/students?**', (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 1, pageSize: 20 } }),
  );
  await page.goto('/admin/classes');
  const actions = page.getByRole('group', {
    name: `Thao tác ${adminClasses[1].name}`,
    exact: true,
  });
  const view = actions.getByRole('button', { name: /^Xem thông tin:/ });
  await view.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveCount(1);
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toContainText(adminClasses[1].name);
  await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCSS('backdrop-filter', /blur/);
  const box = await dialog.boundingBox();
  const viewport = page.viewportSize()!;
  expect(Math.abs(box!.x + box!.width / 2 - viewport.width / 2)).toBeLessThan(2);
  expect(Math.abs(box!.y + box!.height / 2 - viewport.height / 2)).toBeLessThan(2);
  await expect(dialog.getByRole('group', { name: 'Chuyển mục' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await actions.getByRole('button', { name: /^Chỉnh sửa lớp học:/ }).click();
  await expect(dialog.getByLabel(/^Tên lớp/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(actions.getByRole('link', { name: /^Danh sách học viên:/ })).toHaveAttribute(
    'href',
    `/admin/classes/${adminClasses[1].id}/students`,
  );
  await view.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toContainText('Thông tin lớp học');
  await expect(dialog).toHaveCount(1);
  await page.screenshot({
    path: testInfo.outputPath('row-action-modal.png'),
    animations: 'disabled',
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(api.writes).toHaveLength(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(view).toBeFocused();
});
async function mockCrud(page: Page) {
  await mockHomepageApi(page);
  await mockAdminApi(page);
  let user = userSchema.parse(adminUsers[0]);
  let course = adminCourseDetailSchema.parse({ ...adminCourses[1], units: [] });
  let classroom = adminClassDetailSchema.parse({ ...adminClasses[1], meetingUrl: null, units: [] });
  const writes: { method: string; path: string; body: unknown }[] = [];
  let rejectSave = false;
  await page.route('**/api/v1/admin/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/v1/admin/', '');
    const method = request.method();
    const parts = path.split('/');
    if (method === 'GET') {
      if (parts.length === 2) {
        return route.fulfill({
          json: parts[0] === 'users' ? user : parts[0] === 'courses' ? course : classroom,
        });
      }
      if (parts.length === 1) return route.fallback();
      return route.fulfill({ status: 404, json: { message: 'Not mocked' } });
    }
    const body: unknown = request.postDataJSON();
    writes.push({ method, path, body });
    if (rejectSave)
      return route.fulfill({ status: 409, json: { code: 'CONFLICT', message: 'Mã đã tồn tại.' } });
    if (path === 'users') {
      const data = createAdminUserSchema.parse(body);
      user = userSchema.parse({ ...testUser, ...data, id: newId });
      return route.fulfill({ json: user });
    }
    if (parts[0] === 'users') {
      user = { ...user, ...updateAdminUserStatusSchema.parse(body) };
      return route.fulfill({ json: user });
    }
    if (path === 'courses') {
      const data = createAdminCourseSchema.parse(body);
      course = adminCourseDetailSchema.parse({ ...adminCourses[1], ...data, id: newId, units: [] });
    } else if (parts[0] === 'courses') {
      if (method === 'PATCH') course = { ...course, ...updateAdminCourseSchema.parse(body) };
      else if (parts[2] === 'activate') course.isActive = true;
      else if (method === 'PUT') {
        const data = reorderAdminCourseUnitsSchema.parse(body);
        course.units = data.unitIds.map((id, index) => ({
          ...course.units.find((unit) => unit.id === id)!,
          unitNumber: index + 1,
        }));
      } else {
        const data = addAdminCourseUnitSchema.parse(body);
        const unit = {
          id: course.units.length ? sessionId : unitId,
          unitNumber: course.units.length + 1,
          description: null,
          requiredScorePercent: 80,
          ...data,
        };
        course.units.push(unit);
        return route.fulfill({ json: unit });
      }
    } else if (path === 'classes') {
      const data = createAdminClassSchema.parse(body);
      classroom = adminClassDetailSchema.parse({
        ...adminClasses[1],
        ...data,
        id: newId,
        meetingUrl: data.meetingUrl ?? null,
        units: [
          {
            id: unitId,
            courseUnitId: sessionId,
            title: 'Nền tảng',
            position: 1,
            status: 'LOCKED',
            unlockAt: null,
            sessions: [],
          },
        ],
      });
    } else if (parts[0] === 'classes') {
      if (parts.length === 2) classroom = { ...classroom, ...updateAdminClassSchema.parse(body) };
      else if (parts[2] === 'sessions') {
        if (method === 'POST') {
          const data = scheduleAdminSessionSchema.parse(body);
          classroom.units[0].sessions.push({
            id: sessionId,
            sessionNumber: 1,
            status: 'SCHEDULED',
            roomName: null,
            meetingUrl: null,
            ...data,
          });
        } else {
          const data = updateAdminSessionTimeSchema.parse(body);
          const session = classroom.units[0].sessions[0];
          session.startsAt = `${session.startsAt.slice(0, 10)}T${data.startTime}:00+07:00`;
          session.endsAt = `${session.endsAt.slice(0, 10)}T${data.endTime}:00+07:00`;
        }
      } else if (parts[2] === 'open') classroom.status = 'OPEN';
      else if (parts[2] === 'cancel') classroom.status = 'CANCELLED';
    }
    return route.fulfill({ json: parts[0] === 'courses' ? course : classroom });
  });
  return {
    writes,
    reject: (value: boolean) => {
      rejectSave = value;
    },
  };
}

test('Creates a user, validates password, confirms status changes and restores menu focus', async ({
  page,
  isMobile,
}) => {
  const api = await mockCrud(page);
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/admin/users');
  await page.getByRole('button', { name: 'Tạo người dùng', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Họ tên').fill('Thành viên mới');
  await dialog.getByLabel(/^Email(?: \*)?$/).fill('new@example.test');
  await dialog.getByLabel('Mật khẩu ban đầu').fill('12345');
  await dialog.getByRole('button', { name: 'Tạo người dùng', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('kiểm tra thông tin');
  expect(api.writes).toHaveLength(0);
  await dialog.getByLabel('Mật khẩu ban đầu').fill('123456');
  await dialog.getByRole('button', { name: 'Tạo người dùng', exact: true }).click();
  await expect(dialog).toContainText('Thành viên mới');
  await expect(dialog.getByLabel('Mật khẩu ban đầu')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
  const trigger = page.getByRole('button', {
    name: 'Khóa tài khoản: Nguyễn An',
    exact: true,
  });
  await trigger.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('alertdialog')).toContainText('Khóa tài khoản');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Quay lại' }).click();
  expect(api.writes).toHaveLength(1);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  expect(api.writes.at(-1)).toMatchObject({ method: 'PATCH', body: { status: 'SUSPENDED' } });
  await expect(trigger).toBeFocused();
  const unlock = page.getByRole('button', { name: 'Mở tài khoản: Phạm Thảo Nguyên', exact: true });
  await unlock.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('alertdialog')).toContainText('Mở tài khoản');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  expect(api.writes.at(-1)).toMatchObject({ method: 'PATCH', body: { status: 'ACTIVE' } });
  await expect(page.getByText('Không gian làm việc', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Creates a course, adds and reorders units, activates and handles rejected edits', async ({
  page,
}, testInfo) => {
  const api = await mockCrud(page);
  await page.goto('/admin/courses');
  await page.getByRole('button', { name: 'Tạo khóa học', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Mã khóa học').fill('REACT101');
  await dialog.getByLabel('Tên khóa học').fill('React thực hành');
  const categoryBox = await dialog.getByLabel(/^Danh mục(?: \*)?$/).boundingBox();
  const categoryButton = await dialog
    .getByRole('button', { name: 'Tạo danh mục mới' })
    .boundingBox();
  expect(categoryBox).not.toBeNull();
  expect(categoryButton).not.toBeNull();
  expect(Math.abs(categoryBox!.y - categoryButton!.y)).toBeLessThan(2);
  expect(categoryButton!.x).toBeGreaterThan(categoryBox!.x + categoryBox!.width);
  await dialog.getByLabel(/^Danh mục(?: \*)?$/).selectOption(adminCourses[0].category.id);
  await dialog.getByLabel('Học phí (VND)').fill('1500000');
  await dialog.getByRole('button', { name: 'Tạo khóa học', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Kích hoạt khóa học' })).toBeDisabled();
  await dialog.getByLabel('Tên học phần').fill('Cơ bản');
  await dialog.getByRole('button', { name: 'Thêm học phần', exact: true }).click();
  await expect(dialog).toContainText('1. Cơ bản');
  await dialog.getByLabel('Tên học phần').fill('Nâng cao');
  await dialog.getByRole('button', { name: 'Thêm học phần', exact: true }).click();
  await expect(dialog).toContainText('2. Nâng cao');
  await dialog.getByRole('button', { name: 'Đưa Nâng cao lên' }).click();
  await expect(dialog).toContainText('1. Nâng cao');
  expect(api.writes.at(-1)).toMatchObject({
    method: 'PUT',
    body: { unitIds: [sessionId, unitId] },
  });
  await dialog.getByRole('button', { name: 'Kích hoạt khóa học' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận' }).click();
  await expect(dialog).toContainText('Đã kích hoạt');
  api.reject(true);
  await dialog.getByLabel('Tên khóa học').fill('React cập nhật');
  await dialog.getByRole('button', { name: 'Lưu khóa học' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Mã đã tồn tại');
  const count = api.writes.length;
  await expect(dialog.getByLabel('Tên khóa học')).toHaveValue('React cập nhật');
  api.reject(false);
  await dialog.getByRole('button', { name: 'Lưu khóa học' }).click();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  expect(api.writes).toHaveLength(count + 1);
  expect(api.writes.at(-1)).toMatchObject({
    method: 'PATCH',
    body: { title: 'React cập nhật', imgUrl: null },
  });
  await page.screenshot({ path: testInfo.outputPath('course-editor.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  const row = page.getByRole('table').locator('tbody tr').first();
  await row.getByRole('button', { name: /^Chỉnh sửa khóa học:/ }).click();
  await expect(dialog.getByLabel('Tên khóa học')).toHaveValue('React cập nhật');
});

test('Creates and edits a class, schedules in Vietnam time and confirms lifecycle actions', async ({
  page,
  isMobile,
}, testInfo) => {
  const api = await mockCrud(page);
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/admin/classes');
  await page.getByRole('button', { name: 'Tạo lớp học', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/^Khóa học(?: \*)?$/).selectOption(adminCourses[0].id);
  await dialog.getByLabel(/^Giảng viên(?: \*)?$/).selectOption(adminUsers[1].id);
  await dialog.getByLabel('Mã lớp').fill('REACT-OCT');
  await dialog.getByLabel(/^Tên lớp(?: \*)?$/).fill('React tháng 10');
  await dialog.getByLabel('Ngày khai giảng').fill('2026-10-20');
  await dialog.getByLabel('Ngày kết thúc').fill('2026-12-20');
  await expect(dialog.getByLabel(/^Tên lớp(?: \*)?$/)).toHaveCSS('height', '48px');
  await dialog.getByRole('button', { name: 'Tạo lớp học', exact: true }).click();
  await expect(dialog).toContainText('Bản nháp');
  await dialog.getByLabel(/^Tên lớp(?: \*)?$/).fill('React tháng 10 cập nhật');
  await dialog.getByRole('button', { name: 'Lưu lớp học' }).click();
  await expect(dialog.getByRole('button', { name: 'Lưu lớp học' })).toBeEnabled();
  expect(api.writes.at(-1)).toMatchObject({
    method: 'PATCH',
    body: { name: 'React tháng 10 cập nhật' },
  });
  await dialog.getByLabel('Học phần của lớp').selectOption(unitId);
  await dialog.getByLabel('Tên buổi học').fill('Mở đầu React');
  await dialog.getByLabel(/^Ngày học(?: \*)?$/).fill('2026-10-21');
  await dialog.getByLabel(/^Giờ bắt đầu(?: \*)?$/).fill('19:00');
  await dialog.getByLabel(/^Giờ kết thúc(?: \*)?$/).fill('21:00');
  await dialog.getByRole('button', { name: 'Thêm buổi học', exact: true }).click();
  await expect(dialog).toContainText('Mở đầu React');
  expect(api.writes.at(-1)).toMatchObject({ body: { startsAt: '2026-10-21T19:00:00+07:00' } });
  await dialog.getByRole('button', { name: 'Đổi giờ buổi 1' }).click();
  await dialog.getByLabel('Giờ bắt đầu mới').fill('18:30');
  await dialog.getByLabel('Giờ kết thúc mới').fill('20:30');
  await dialog.getByRole('button', { name: 'Lưu giờ buổi học' }).click();
  await expect(dialog.getByLabel('Giờ bắt đầu mới')).toHaveCount(0);
  expect(api.writes.at(-1)).toMatchObject({
    method: 'PATCH',
    body: { startTime: '18:30', endTime: '20:30' },
  });
  await dialog.getByRole('button', { name: 'Mở tuyển sinh', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận' }).click();
  await expect(dialog).toContainText('Đang tuyển sinh');
  await expect(dialog.getByLabel('Ngày khai giảng')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Hủy lớp', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận' }).click();
  await expect(dialog).toContainText('Đã hủy');
  await expect(dialog.getByLabel(/^Tên lớp(?: \*)?$/)).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('class-editor.png'), animations: 'disabled' });
});
