import { expect, test, type Page } from '@playwright/test';
import { mockHomepageApi } from './api-fixtures';
import { adminClasses, mockAdminApi } from './admin-fixtures';

const classroom = adminClasses[1];
const mentorId = '22222222-2222-4222-8222-222222222222';
async function setup(page: Page, failure?: 409 | 503) {
  await mockHomepageApi(page);
  await mockAdminApi(page);
  const writes: { body: unknown; key: string | undefined }[] = [];
  let version = 1;
  let reads = 0;
  await page.route(`**/api/v1/management/classes/${classroom.id}/available-mentors?**`, (route) => {
    reads++;
    const search =
      new URL(route.request().url()).searchParams.get('search')?.toLocaleLowerCase('vi') ?? '';
    const items = [
      { ...classroom.mentor, isCurrent: true },
      { id: mentorId, displayName: 'Trần Mai Anh', isCurrent: false },
    ].filter((item) => item.displayName.toLocaleLowerCase('vi').includes(search));
    return route.fulfill({
      json: {
        classId: classroom.id,
        assignmentVersion: version,
        affectedSessionCount: 4,
        items,
        page: 1,
        pageSize: 10,
        total: items.length,
        asOf: '2026-11-06T03:00:00Z',
        timeZone: 'Asia/Ho_Chi_Minh',
        availabilityBasis: 'TEACHING_SCHEDULE_AND_APPROVED_LEAVE',
      },
    });
  });
  await page.route(`**/api/v1/management/classes/${classroom.id}/mentor`, (route) => {
    writes.push({
      body: route.request().postDataJSON(),
      key: route.request().headers()['idempotency-key'],
    });
    if (writes.length === 1 && failure) {
      version = 2;
      return route.fulfill({ status: failure, json: { code: 'CONFLICT', message: 'Changed' } });
    }
    return route.fulfill({
      json: {
        classId: classroom.id,
        primaryMentor: { id: mentorId, displayName: 'Trần Mai Anh' },
        assignmentVersion: 3,
        affectedSessionCount: 4,
        asOf: '2026-11-06T03:00:00Z',
      },
    });
  });
  await page.goto('/admin/classes');
  await page
    .getByRole('button', { name: `Chỉnh sửa lớp học: ${classroom.name}`, exact: true })
    .click();
  await page.getByRole('button', { name: 'Đổi giảng viên', exact: true }).click();
  await expect(page.getByLabel('Giảng viên mới')).toBeVisible();
  return { writes, reads: () => reads };
}
async function choose(page: Page) {
  await page.getByRole('combobox', { name: 'Giảng viên mới' }).click();
  await page.getByRole('option', { name: 'Trần Mai Anh', exact: true }).click();
  await page.getByLabel('Lý do thay đổi').fill('Điều chỉnh phân công học kỳ');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
}

test('Change primary mentor requires selection, reason and confirmation', async ({
  page,
  isMobile,
}, testInfo) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  const api = await setup(page);
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Giảng viên mới' }).click();
  await expect(page.getByRole('option', { name: /Đang phụ trách/ })).toHaveAttribute(
    'disabled',
    '',
  );
  await choose(page);
  expect(api.writes).toHaveLength(0);
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText('Trần Mai Anh sẽ phụ trách 4 buổi');
  await page.screenshot({ path: testInfo.outputPath('change-mentor.png'), animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await confirm.getByRole('button', { name: 'Quay lại' }).click();
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận đổi' }).click();
  await expect(page.getByText('Đã cập nhật giảng viên phụ trách.')).toBeVisible();
  expect(api.writes).toHaveLength(1);
  expect(api.writes[0].body).toEqual({
    mentorId,
    reason: 'Điều chỉnh phân công học kỳ',
    expectedVersion: 1,
  });
  expect(api.writes[0].key).toMatch(/^[0-9a-f-]{36}$/);
});

test('Mentor search and selection share one field with keyboard and empty results', async ({
  page,
  isMobile,
}, testInfo) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 800 });
  const api = await setup(page);
  const picker = page.getByRole('combobox', { name: 'Giảng viên mới' });
  await expect(page.getByRole('button', { name: 'Tìm', exact: true })).toHaveCount(0);
  await picker.fill('không có tên này');
  await expect(page.getByText('Không tìm thấy giảng viên phù hợp.')).toBeVisible();
  await picker.fill('Mai');
  await expect(page.getByRole('option', { name: 'Trần Mai Anh', exact: true })).toBeVisible();
  await expect(
    page.getByRole('listbox', { name: 'Giảng viên phù hợp' }).getByRole('option'),
  ).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('mentor-picker.png'), animations: 'disabled' });
  await picker.press('ArrowDown');
  await picker.press('Enter');
  await expect(picker).toHaveValue('Trần Mai Anh');
  await expect(picker).toHaveAttribute('aria-expanded', 'false');
  await picker.click();
  await expect(page.getByRole('option', { name: 'Trần Mai Anh' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await picker.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await picker.fill('Lê');
  await expect(page.getByRole('option', { name: /Đang phụ trách/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeDisabled();
  expect(api.writes).toHaveLength(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Unknown save outcome retries the same immutable assignment request', async ({ page }) => {
  const api = await setup(page, 503);
  await choose(page);
  await page.getByRole('button', { name: 'Xác nhận đổi' }).click();
  await expect(page.getByRole('alert')).toContainText('Chưa xác định kết quả');
  await page.getByRole('button', { name: 'Quay lại' }).click();
  await expect(page.getByLabel('Giảng viên mới')).toBeDisabled();
  await expect(page.getByLabel('Lý do thay đổi')).toBeDisabled();
  await page.getByRole('button', { name: 'Kiểm tra lại yêu cầu' }).click();
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByText('Đã cập nhật giảng viên phụ trách.')).toBeVisible();
  expect(api.writes).toHaveLength(2);
  expect(api.writes[1]).toEqual(api.writes[0]);
});

test('Assignment conflict requires refreshed candidates and a new confirmation', async ({
  page,
}) => {
  const api = await setup(page, 409);
  await choose(page);
  await page.getByRole('button', { name: 'Xác nhận đổi' }).click();
  await expect(page.getByRole('alert')).toContainText('Tải lại danh sách');
  await page.getByRole('button', { name: 'Tải lại danh sách' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  expect(api.reads()).toBeGreaterThan(1);
  await choose(page);
  expect(api.writes).toHaveLength(1);
  await page.getByRole('button', { name: 'Xác nhận đổi' }).click();
  await expect(page.getByText('Đã cập nhật giảng viên phụ trách.')).toBeVisible();
  expect(api.writes[1].body).toMatchObject({ expectedVersion: 2 });
  expect(api.writes[1].key).not.toBe(api.writes[0].key);
});
