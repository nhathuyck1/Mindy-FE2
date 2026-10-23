import { expect, test } from '@playwright/test';
import { mockMentor, mentorIds } from './mentor-fixtures';
import { testUser } from './api-fixtures';

test('mentor saved attachments show readable metadata and request access on demand', async ({
  page,
}, testInfo) => {
  const { calls } = await mockMentor(page, { savedAttachment: true });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: /Bài viết đầu tiên/ }).click();
  const card = page.getByRole('region', { name: 'Invoice-FCPCKEXP-0002.pdf', exact: true });
  await expect(card).toBeVisible();
  await expect(card).toContainText('41 KB');
  await expect(card).not.toContainText('application/pdf');
  expect(calls.some((call) => call.path.endsWith('/access'))).toBe(false);
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/mentor-attachment-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await card.getByRole('button', { name: 'Xem / tải tệp' }).click();
  await expect(card.getByRole('link', { name: 'Mở tệp trong tab mới' })).toHaveAttribute(
    'href',
    'https://storage.example.test/lesson.pdf',
  );
  expect(calls.some((call) => call.path.includes(`/assets/${mentorIds.file}/access`))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('weekly timetable groups slots, stacks sessions and navigates whole weeks', async ({
  page,
}, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-10-16T03:00:00Z'));
  const { calls } = await mockMentor(page, { timetable: true });
  await page.goto('/mentor');
  await expect(page.getByRole('columnheader')).toHaveCount(8);
  if (testInfo.project.name === 'desktop')
    await expect(page.getByRole('columnheader', { name: /Chủ nhật/ })).toBeInViewport();
  await expect(page.getByRole('columnheader', { name: /Thứ Sáu/ })).toHaveAttribute(
    'aria-current',
    'date',
  );
  await expect(page.getByRole('rowheader')).toHaveCount(6);
  await expect(page.getByRole('rowheader')).toHaveText([
    /^1\s*07:30\s*\|\s*09:00$/,
    /^2\s*09:30\s*\|\s*11:00$/,
    /^3\s*13:00\s*\|\s*15:30$/,
    /^4\s*16:00\s*\|\s*17:30$/,
    /^5\s*18:00\s*\|\s*19:30$/,
    /^6\s*20:00\s*\|\s*21:30$/,
  ]);
  await expect(
    page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: /^2\s*09:30/ }) }),
  ).toContainText('JS101-A');
  await expect(
    page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: /^3\s*13:00/ }) }),
  ).toContainText('JS101-A');
  if (testInfo.project.name === 'desktop') {
    const emptyDay = await page.getByRole('columnheader', { name: /Thứ Hai/ }).boundingBox();
    const teachingDay = await page.getByRole('columnheader', { name: /Thứ Ba/ }).boundingBox();
    expect(emptyDay && teachingDay && emptyDay.width < teachingDay.width).toBeTruthy();
    const previous = await page
      .getByRole('button', { name: 'Tuần trước', exact: true })
      .boundingBox();
    const date = await page.getByLabel('Chọn ngày (dd/mm/yyyy)', { exact: true }).boundingBox();
    expect(previous && date && date.x < previous.x).toBeTruthy();
  }
  const sundayCell = page.getByRole('row').filter({ hasText: '09:30' }).getByRole('cell').last();
  await expect(sundayCell.getByRole('link')).toHaveCount(2);
  await expect(sundayCell).toContainText('Đã hủy');
  await expect(page.getByText('5 buổi dạy trong tuần', { exact: false })).toBeVisible();
  await page.screenshot({
    path: `test-results/mentor-weekly-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Tuần sau', exact: true }).click();
  await expect(page.getByText('Không có buổi dạy trong tuần này.')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /Thứ Hai/ })).toContainText('(19/10)');
  await page.getByRole('button', { name: 'Tuần trước', exact: true }).click();
  await expect(page.locator(`a[href="/mentor/sessions/${mentorIds.material}"]`)).toHaveCount(1);
  await expect(page.getByLabel('Chọn ngày (dd/mm/yyyy)', { exact: true })).toHaveValue(
    '12/10/2026',
  );
  await page.getByLabel('Chọn ngày (dd/mm/yyyy)', { exact: true }).fill('28/10/2026');
  await page.getByLabel('Chọn ngày (dd/mm/yyyy)', { exact: true }).press('Enter');
  await expect(page.getByRole('columnheader', { name: /Thứ Hai/ })).toContainText('(26/10)');
  await page.getByLabel('Chọn ngày (dd/mm/yyyy)', { exact: true }).fill('31/02/2026');
  await page.getByLabel('Chọn ngày (dd/mm/yyyy)', { exact: true }).press('Enter');
  await expect(page.getByText('Nhập ngày hợp lệ theo dd/mm/yyyy.')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /Thứ Hai/ })).toContainText('(26/10)');
  await page.getByRole('button', { name: 'Mở lịch chọn ngày' }).click();
  await page.getByLabel('Ngày trong lịch', { exact: true }).fill('2026-10-12');
  await expect(page.getByLabel('Chọn ngày (dd/mm/yyyy)', { exact: true })).toHaveValue(
    '12/10/2026',
  );
  await page.getByRole('button', { name: 'Tuần hiện tại', exact: true }).click();
  await expect(page.getByRole('columnheader', { name: /Thứ Hai/ })).toContainText('(12/10)');
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const calendar = page.getByRole('region', { name: 'Bảng lịch dạy theo tuần' });
  expect(await calendar.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  await calendar.focus();
  await page.keyboard.press('End');
  await calendar.evaluate((node) => {
    node.scrollLeft = node.scrollWidth;
  });
  await expect(page.locator(`a[href="/mentor/sessions/${mentorIds.file}"]`)).toBeInViewport();
  expect(
    calls.filter((call) => call.path === 'mentor/schedule').every((call) => call.method === 'GET'),
  ).toBe(true);
});

test('mentor attendance keeps student names readable and preserves the attendance lifecycle', async ({
  page,
}, testInfo) => {
  const { calls } = await mockMentor(page);
  await page.goto(`/mentor/sessions/${mentorIds.session}`);
  await expect(page.getByText('Phòng: Phòng 101', { exact: false })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Danh sách học viên dự kiến' })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu buổi' }).click();
  const absentStat = page.getByText('Vắng mặt', { exact: true }).first().locator('..');
  await expect(absentStat).not.toHaveClass(/border-status-red/);
  await page.getByRole('button', { name: 'Có mặt: Học viên An' }).click();
  await expect(page.getByRole('button', { name: 'Có mặt: Học viên An' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Đồng bộ học viên' }).click();
  await expect(
    page.getByRole('button', { name: 'Có mặt: Học viên mới', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Chốt buổi', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận chốt buổi' }).click();
  await expect(page.getByText('Hoàn thành', { exact: true })).toBeVisible();
  const roster = page.getByRole('region', { name: 'Danh sách điểm danh', exact: true });
  const studentRow = (name: string) =>
    roster
      .locator('tr:visible, li:visible')
      .filter({ has: page.getByRole('button', { name: `Có mặt: ${name}`, exact: true }) });
  await expect(studentRow('Học viên mới')).toContainText('Vắng mặt');
  await expect(absentStat).toHaveClass(/border-status-red/);
  const studentName = studentRow('Học viên An').getByText('Học viên An', { exact: true });
  expect(
    await studentName.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
  ).toBeGreaterThanOrEqual(20);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `test-results/mentor-attendance-${testInfo.project.name}.png`,
    fullPage: true,
  });
  const present = page.getByRole('button', { name: 'Có mặt: Học viên An', exact: true });
  const absent = page.getByRole('button', { name: 'Vắng: Học viên An', exact: true });
  await absent.focus();
  await page.keyboard.press('Space');
  await expect(studentRow('Học viên An')).toContainText('Vắng mặt');
  await expect(absent).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 1600, height: 1000 });
  await expect(roster.getByRole('table')).toBeVisible();
  await expect(roster.getByRole('columnheader')).toHaveCount(3);
  await page.locator('section[aria-labelledby="attendance-heading"]').screenshot({
    path: `test-results/mentor-attendance-controls-${testInfo.project.name}.png`,
  });
  await present.click();
  await expect(present).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Có mặt: Học viên mới', exact: true }).click();
  await expect(absentStat).not.toHaveClass(/border-status-red/);
  await expect(absentStat).toContainText('0');
  await page.locator('section[aria-labelledby="attendance-heading"]').screenshot({
    path: `test-results/mentor-attendance-present-${testInfo.project.name}.png`,
  });
  await absent.click();
  await expect(absent).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  await expect(absent).toHaveAttribute('aria-pressed', 'true');
  expect(calls.filter((call) => call.method === 'PUT').at(-1)?.body?.records).toEqual([
    { enrollmentId: testUser.id, status: 'ABSENT' },
  ]);
  await expect(absentStat).toHaveClass(/border-status-red/);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(roster.getByRole('listitem')).toHaveCount(2);
  await expect(present).toHaveAttribute('aria-pressed', 'false');
  await page.screenshot({
    path: `test-results/mentor-attendance-320-${testInfo.project.name}.png`,
    fullPage: true,
  });
  const writes = calls.filter((c) => c.path.startsWith('class-sessions/') && c.method !== 'GET');
  expect(writes).toHaveLength(8);
  expect(
    writes.every(
      (c) => typeof c.body?.expectedVersion === 'number' && /^[\da-f-]{36}$/.test(c.key ?? ''),
    ),
  ).toBe(true);
  expect(calls.some((c) => c.path.includes('cash-orders'))).toBe(false);
});

test('class roster is read only and removed unit release is absent', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-22T03:00:30Z'));
  const { calls } = await mockMentor(page);
  await page.goto('/mentor/classes');
  await page.getByRole('link', { name: /Lớp JavaScript tháng 10/ }).click();
  await page.getByRole('button', { name: 'Học viên', exact: true }).click();
  await expect(page.getByText('Học viên chờ kích hoạt')).toBeVisible();
  await expect(page.getByRole('button', { name: /thu tiền|xác nhận tiền/i })).toHaveCount(0);
  await page.getByRole('button', { name: 'Chương', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Quyền truy cập', exact: true })).toHaveCount(0);
  expect(calls.some((call) => call.path.endsWith('/release'))).toBe(false);
  expect(calls.some((c) => c.path.includes('cash-orders'))).toBe(false);
});

test('mentor student table matches admin layout and supports scoped search, filters and pagination', async ({
  page,
}, testInfo) => {
  const { calls } = await mockMentor(page, { rosterTable: true });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Học viên', exact: true }).click();
  await expect(page.getByRole('table')).toHaveClass(/admin-data-table/);
  await expect(page.getByRole('columnheader')).toHaveCount(4);
  await expect(page.getByRole('rowheader')).toHaveCount(20);
  const firstRow = await page.getByRole('rowheader').first().locator('..').boundingBox();
  expect(firstRow?.height).toBe(64);
  await page.getByRole('button', { name: 'Trang học viên sau' }).click();
  await expect(page.getByRole('rowheader')).toHaveCount(3);
  await expect(page.getByRole('navigation', { name: 'Phân trang học viên' })).toContainText(
    '2 / 2',
  );
  await page.getByRole('button', { name: 'Trang học viên trước' }).click();
  await page.getByLabel('Số dòng mỗi trang').selectOption('10');
  await expect(page.getByRole('rowheader')).toHaveCount(10);
  await page.screenshot({
    path: `test-results/mentor-students-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Sắp xếp tên học viên trong trang' }).click();
  await expect(page.getByRole('columnheader').first()).toHaveAttribute('aria-sort', 'ascending');
  await page.getByLabel('Tìm học viên trong trang').fill('nguyen an');
  await expect(page.getByRole('rowheader')).toHaveCount(1);
  await expect(page.getByRole('rowheader')).toContainText('Nguyễn An');
  await page.getByLabel('Tìm học viên trong trang').fill('không tìm thấy');
  await expect(page.getByText('Không có kết quả phù hợp', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa tìm kiếm' }).click();
  await page
    .getByRole('group', { name: 'Lọc trạng thái thanh toán' })
    .getByRole('button', { name: 'Đã thanh toán', exact: true })
    .click();
  await expect(page.getByRole('rowheader')).toHaveCount(6);
  await expect(page.getByText('6 học viên theo bộ lọc', { exact: true })).toBeVisible();
  await page.getByLabel('Hình thức thanh toán', { exact: true }).selectOption('CASH');
  await expect(page.getByText('Chưa có học viên theo bộ lọc', { exact: true })).toBeVisible();
  await page.getByLabel('Hình thức thanh toán', { exact: true }).selectOption('PAYOS');
  await expect(page.getByRole('rowheader')).toHaveCount(6);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: /thu tiền|xác nhận tiền/i })).toHaveCount(0);
  expect(
    calls.filter((call) => call.path.endsWith('/students')).every((call) => call.method === 'GET'),
  ).toBe(true);
  expect(
    calls.some((call) => call.path.startsWith('admin/') || call.path.includes('cash-orders')),
  ).toBe(false);
});

test('mentor creates article, edits own draft and submits for manager review', async ({
  page,
}, testInfo) => {
  const { calls } = await mockMentor(page);
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Chương', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Nội dung buổi 1' }).getByText('Buổi 1: Làm quen JavaScript'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Thêm nội dung', exact: true }).click();
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Bài viết đã tạo');
  await page
    .getByLabel('Nội dung bài viết', { exact: true })
    .fill('Học JavaScript\nNội dung thử nghiệm');
  await page.screenshot({
    path: `test-results/mentor-editor-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByRole('heading', { name: 'Bài viết đã tạo' })).toBeVisible();
  expect(
    calls.find((c) => c.method === 'POST' && c.path.endsWith('/materials'))?.body?.contentText,
  ).toBe('Học JavaScript\nNội dung thử nghiệm');
  await expect(
    page
      .frameLocator('iframe[title="Nội dung bài viết"]')
      .getByText('Học JavaScript', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('toolbar', { name: 'Thao tác nội dung' })
    .getByRole('button', { name: 'Chỉnh sửa', exact: true })
    .click();
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Bản nháp đã sửa');
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByRole('heading', { name: 'Bản nháp đã sửa' })).toBeVisible();
  await page.getByRole('button', { name: 'Gửi duyệt', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(
    page.locator('[data-slot="badge"]').getByText('Chờ duyệt', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xóa nháp' })).toHaveCount(0);
  expect(
    calls.find((c) => c.method === 'PATCH' && c.path.includes('/materials/'))?.body
      ?.expectedRevision,
  ).toBe(1);
  expect(calls.find((c) => c.path.endsWith('/submit'))?.body?.expectedRevision).toBe(2);
});

test('mentor workspace keeps chapters beside content, edit toolbar and creation at the right', async ({
  page,
}, testInfo) => {
  const { calls } = await mockMentor(page, { extraUnits: true });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  const rail = page.getByRole('complementary', { name: 'Nội dung khóa học' });
  const chapterSelect = page.getByLabel('Chương đang xem');
  if (testInfo.project.name === 'desktop') await expect(rail.getByRole('button')).toHaveCount(2);
  else await expect(chapterSelect).toBeVisible();
  const toolbar = page.getByRole('toolbar', { name: 'Thao tác nội dung' });
  await page.getByRole('button', { name: /Bài viết đầu tiên/ }).click();
  await expect(toolbar.getByRole('button', { name: 'Chỉnh sửa', exact: true })).toBeVisible();
  await expect(
    page
      .frameLocator('iframe[title="Nội dung bài viết"]')
      .getByRole('heading', { name: 'Nội dung bài viết' }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  if (testInfo.project.name === 'desktop') {
    const sidebar = await rail.boundingBox();
    const content = await toolbar.boundingBox();
    const create = await page
      .getByRole('button', { name: 'Thêm nội dung', exact: true })
      .boundingBox();
    expect(
      sidebar &&
        content &&
        create &&
        sidebar.x + sidebar.width <= content.x &&
        create.x > content.x,
    ).toBeTruthy();
  }
  await page.locator('iframe[title="Nội dung bài viết"]').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/mentor-workspace-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await toolbar.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  await expect(page.getByLabel('Nội dung bài viết (HTML)')).toHaveValue(
    '<h2>Nội dung bài viết</h2>',
  );
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Văn bản', exact: true }).click();
  await expect(page.getByLabel('Nội dung bài viết', { exact: true })).toHaveValue(
    'Nội dung bài viết',
  );
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  if (await chapterSelect.isVisible()) await chapterSelect.selectOption(mentorIds.nextUnit);
  else await rail.getByRole('button', { name: /State, sự kiện/ }).click();
  await expect(
    page.getByRole('heading', { name: 'State, sự kiện và render danh sách', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'Thao tác nội dung' })).toHaveCount(0);
  await expect(page.getByText('Chương này chưa có buổi học.', { exact: false })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Thêm nội dung', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thêm nội dung mới' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(calls.some((c) => c.path.endsWith(`/units/${mentorIds.nextUnit}/sessions`))).toBe(true);
});

test('mentor material shows its linked lesson and lets the author attach one', async ({
  page,
}, testInfo) => {
  const { calls } = await mockMentor(page);
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  const lesson = page.getByRole('region', { name: 'Buổi học của tài liệu', exact: true });
  await page.getByRole('button', { name: /Bài viết đầu tiên/ }).click();
  await expect(lesson).toContainText('Nội dung chung của chương');
  await expect(lesson.getByRole('link')).toHaveCount(0);
  await lesson.getByRole('button', { name: 'Gắn buổi học', exact: true }).click();
  const select = page.getByRole('combobox', { name: 'Gắn với buổi học (tùy chọn)', exact: true });
  await select.selectOption(mentorIds.session);
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
  await expect(lesson).toContainText('Buổi 1: Làm quen JavaScript');
  expect(
    calls.find(
      (call) => call.method === 'PATCH' && call.path.endsWith(`/materials/${mentorIds.material}`),
    )?.body?.sessionId,
  ).toBe(mentorIds.session);
  await page.reload();
  await page.getByRole('button', { name: /Bài viết đầu tiên/ }).click();
  await expect(lesson).toContainText('Buổi 1: Làm quen JavaScript');
  await page.setViewportSize({ width: 1600, height: 1000 });
  await lesson.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/mentor-material-lesson-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(lesson).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('mentor cannot edit reviewed materials and preserves unsaved text on conflict', async ({
  page,
}) => {
  await mockMentor(page, { materialState: 'APPROVED' });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: /Bài viết đầu tiên/ }).click();
  await expect(
    page.locator('[data-slot="badge"]').getByText('Đã duyệt', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('toolbar').getByRole('button')).toHaveCount(0);
  await page.unrouteAll({ behavior: 'wait' });
  const { calls } = await mockMentor(page, { materialConflict: true });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: /Bài viết đầu tiên/ }).click();
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Giữ thay đổi của tôi');
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Dữ liệu đã thay đổi' })).toBeVisible();
  await expect(page.getByLabel('Tiêu đề', { exact: true })).toHaveValue('Giữ thay đổi của tôi');
  expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(1);
});

test('mentor waits for validated upload before saving FILE', async ({ page }, testInfo) => {
  const options = { fileFailure: false };
  const { calls } = await mockMentor(page, options);
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Chương', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm nội dung', exact: true }).click();
  await page.getByLabel('Loại nội dung').selectOption('FILE');
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Tài liệu mới');
  const uploader = page.getByRole('region', { name: 'Tài liệu chính - tải lên', exact: true });
  await page.getByLabel('Tài liệu chính', { exact: true }).setInputFiles({
    name: 'lesson.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-test'),
  });
  await expect(page.getByText('Đang kiểm tra tệp…', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lưu bản nháp' })).toBeDisabled();
  await expect(uploader.getByText('Tải lên thành công', { exact: true })).toBeVisible();
  await expect(uploader.getByText('lesson.pdf', { exact: true })).toHaveCount(1);
  await uploader.screenshot({
    path: `test-results/mentor-upload-success-${testInfo.project.name}.png`,
  });
  options.fileFailure = true;
  await page.getByLabel('Tài liệu chính', { exact: true }).setInputFiles({
    name: 'broken.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('invalid'),
  });
  await expect(uploader.getByRole('alert')).toContainText('Tải lên thất bại');
  await expect(uploader.getByText('Tải lên thành công', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  expect(calls.some((call) => call.method === 'POST' && call.path.endsWith('/materials'))).toBe(
    false,
  );
  options.fileFailure = false;
  await uploader.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(uploader.getByText('Tải lên thành công', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByRole('heading', { name: 'Tài liệu mới' })).toBeVisible();
  const intent = calls.find((c) => c.path === 'files/upload-intents');
  expect(intent?.body?.classId).toBe(mentorIds.class);
  expect(calls.some((c) => c.path.endsWith('/complete'))).toBe(true);
  expect(
    calls.find((c) => c.method === 'POST' && c.path.endsWith('/materials'))?.body?.fileId,
  ).toBe(mentorIds.file);
  await page.getByRole('button', { name: 'Xem / tải tệp' }).click();
  await expect(page.getByRole('link', { name: 'Mở tệp trong tab mới' })).toHaveAttribute(
    'href',
    'https://storage.example.test/lesson.pdf',
  );
});

test('failed upload cannot be attached to a draft', async ({ page }, testInfo) => {
  const { calls } = await mockMentor(page, { fileFailure: true });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Chương', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm nội dung', exact: true }).click();
  await page.getByLabel('Loại nội dung').selectOption('FILE');
  await page.getByLabel('Tiêu đề', { exact: true }).fill('File không hợp lệ');
  await page.getByLabel('Tài liệu chính', { exact: true }).setInputFiles({
    name: 'lesson.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('invalid'),
  });
  await expect(page.getByRole('alert').filter({ hasText: 'File không thể sử dụng' })).toBeVisible();
  const uploader = page.getByRole('region', { name: 'Tài liệu chính - tải lên', exact: true });
  await expect(uploader.getByRole('alert')).toContainText('Tải lên thất bại');
  await uploader.screenshot({
    path: `test-results/mentor-upload-failed-${testInfo.project.name}.png`,
  });
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByRole('heading', { name: 'Thêm nội dung mới' })).toBeVisible();
  expect(calls.some((c) => c.method === 'POST' && c.path.endsWith('/materials'))).toBe(false);
});

test('mentor can drop, cancel and retry a pending document upload', async ({ page }) => {
  const options = { filePending: true };
  const { calls } = await mockMentor(page, options);
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Thêm nội dung', exact: true }).click();
  await page.getByLabel('Loại nội dung').selectOption('FILE');
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Tài liệu kéo thả');
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(['%PDF-test'], 'tai-lieu.pdf', { type: 'application/pdf' }));
    return data;
  });
  const uploader = page.getByRole('region', { name: 'Tài liệu chính - tải lên', exact: true });
  await uploader
    .getByRole('button', { name: 'Chọn tệp: Tài liệu chính', exact: true })
    .dispatchEvent('drop', { dataTransfer: transfer });
  await expect(uploader.getByText('Đang kiểm tra tệp…', { exact: true })).toBeVisible();
  await uploader.getByRole('button', { name: 'Hủy tải lên', exact: true }).click();
  await expect(uploader.getByText('Đã hủy tải lên', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  expect(calls.some((call) => call.method === 'POST' && call.path.endsWith('/materials'))).toBe(
    false,
  );
  options.filePending = false;
  await uploader.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(uploader.getByText('Tải lên thành công', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('mentor shows validated attachments as removable green file cards', async ({ page }) => {
  const { calls } = await mockMentor(page);
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Thêm nội dung', exact: true }).click();
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Bài đọc có tài liệu');
  await page.getByLabel('Nội dung bài viết', { exact: true }).fill('Nội dung bài đọc');
  await page.getByLabel('Thêm tệp đính kèm', { exact: true }).setInputFiles({
    name: 'lesson.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-test'),
  });
  const ready = page.getByRole('status').filter({ hasText: 'Tải lên thành công' });
  await expect(ready).toContainText('lesson.pdf');
  await ready.getByRole('button', { name: 'Bỏ', exact: true }).click();
  await expect(ready).toHaveCount(0);
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  expect(
    calls.find((call) => call.method === 'POST' && call.path.endsWith('/materials'))?.body
      ?.attachmentFileIds,
  ).toEqual([]);
});

test('mentor guard, expired attendance, conflict and narrow viewport', async ({ page }) => {
  await mockMentor(page, { role: 'STUDENT' });
  await page.goto('/mentor');
  await expect(page.getByRole('heading', { name: 'Tài khoản chưa có quyền Mentor' })).toBeVisible();
  await page.unrouteAll({ behavior: 'wait' });
  await mockMentor(page, { expired: true });
  await page.goto(`/mentor/sessions/${mentorIds.session}`);
  await expect(page.getByText('Hiện không thể sửa điểm danh.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bắt đầu buổi' })).toHaveCount(0);
  await page.unrouteAll({ behavior: 'wait' });
  await mockMentor(page, { conflict: true });
  await page.goto(`/mentor/sessions/${mentorIds.session}`);
  await page.getByRole('button', { name: 'Bắt đầu buổi' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Dữ liệu đã thay đổi' })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Mở menu Mentor' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
