import { expect, test } from '@playwright/test';
import { mentorIds } from './mentor-fixtures';
import { mockMentorWorkspace } from './mentor-workspace-fixtures';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-22T03:00:00Z'));
});
test('mentor assignment filters, class shell and timetable use the new contracts', async ({
  page,
}, info) => {
  const { calls } = await mockMentorWorkspace(page);
  await page.goto('/mentor/classes');
  await expect(page.getByRole('heading', { name: 'Lớp JavaScript tháng 10' })).toBeVisible();
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1440, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('mentor-classes.png'), fullPage: true });
  await page.getByLabel('Phân công', { exact: true }).selectOption('SUBSTITUTE');
  await expect
    .poll(() =>
      calls.some((c) => c.path === 'mentor/classes' && c.query.includes('assignment=SUBSTITUTE')),
    )
    .toBe(true);
  await page.getByRole('link', { name: /Lớp JavaScript tháng 10/ }).click();
  await expect(page.getByRole('button', { name: 'Buổi học', exact: true })).toHaveCount(0);
  await page.goto(`/mentor/classes/${mentorIds.class}?tab=sessions`);
  await expect(page.getByRole('heading', { name: 'Buổi vòng lặp' })).toBeVisible();
  await page.getByLabel('Từ ngày', { exact: true }).fill('2026-10-26');
  await page.getByLabel('Đến ngày', { exact: true }).fill('2026-10-26');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect
    .poll(() =>
      calls.some(
        (c) =>
          c.path.endsWith('/sessions') &&
          new URLSearchParams(c.query).get('from') === '2026-10-26T00:00:00+07:00' &&
          new URLSearchParams(c.query).get('to') === '2026-10-26T17:00:00.000Z',
      ),
    )
    .toBe(true);
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1440, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: `test-results/mentor-api-workspace-${info.project.name}.png`,
    fullPage: true,
  });
});
test('substitute sees assigned teaching content without class roster, reports or authoring', async ({
  page,
}) => {
  const { calls } = await mockMentorWorkspace(page, { substitute: true });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await expect(page.getByText('Dạy thay · Chỉ xem chương', { exact: false })).toBeVisible();
  for (const name of ['Học viên', 'Chuyên cần', 'Tiến độ', 'Thêm nội dung', 'Quyền truy cập'])
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tài liệu chung', exact: true }).click();
  await page.getByRole('button', { name: /Bài viết đầu tiên/ }).click();
  await expect(page.getByRole('button', { name: 'Chỉnh sửa', exact: true })).toHaveCount(0);
  expect(
    calls.some(
      (c) =>
        c.path.endsWith('/students') ||
        c.path.endsWith('/attendance-summary') ||
        c.path.endsWith('/progress'),
    ),
  ).toBe(false);
});
test('attendance reports distinguish no data, physical status and makeup credit', async ({
  page,
}) => {
  await mockMentorWorkspace(page);
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Chuyên cần', exact: true }).click();
  await expect(page.getByText('Chưa có dữ liệu chuyên cần')).toBeVisible();
  await page.getByRole('button', { name: 'Xem lịch sử chuyên cần' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('100%', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Điểm danh thực tế: Vắng mặt')).toBeVisible();
  await expect(dialog.getByText('Kết quả được tính: Có mặt')).toBeVisible();
  await expect(dialog.getByText('Đã tính từ buổi học bù', { exact: false })).toBeVisible();
});
test('cancelled class opens history and prevents teaching mutations', async ({ page }) => {
  const { calls } = await mockMentorWorkspace(page, { classStatus: 'CANCELLED' });
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await expect(page.getByRole('button', { name: 'Chương', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Buổi vòng lặp' })).toBeVisible();
  await page.getByRole('button', { name: 'Chuyên cần', exact: true }).click();
  await expect(page.getByText('Chưa có dữ liệu chuyên cần')).toBeVisible();
  await page.goto(`/mentor/sessions/${mentorIds.session}`);
  await expect(page.getByRole('heading', { name: 'Bảng điểm danh' })).toBeVisible();
  for (const name of ['Bắt đầu buổi', 'Tất cả có mặt', 'Sửa link buổi học'])
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  expect(calls.some((c) => c.path.endsWith('/attendance-candidates'))).toBe(false);
  expect(calls.some((c) => c.method !== 'GET')).toBe(false);
});
test('completed class allows internal notes within the editing window', async ({ page }) => {
  await mockMentorWorkspace(page, { classStatus: 'COMPLETED' });
  await page.goto(`/mentor/sessions/${mentorIds.session}`);
  await page.getByRole('button', { name: 'Ghi chú giảng dạy', exact: true }).click();
  await page.getByLabel('Nội dung đã dạy', { exact: true }).fill('Bổ sung ghi chú sau buổi học');
  await page.getByRole('button', { name: 'Lưu ghi chú giảng dạy' }).click();
  await expect(page.getByText('Đã lưu ghi chú giảng dạy.')).toBeVisible();
});
test('stored progress preserves zero, missing data and invalid values without writes', async ({
  page,
}) => {
  const { calls } = await mockMentorWorkspace(page);
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Tiến độ', exact: true }).click();
  await page.getByLabel('Lọc chương').selectOption(mentorIds.unit);
  await expect
    .poll(() =>
      calls.some(
        (c) => c.path.endsWith('/progress') && c.query.includes(`unitId=${mentorIds.unit}`),
      ),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Xem tiến độ học viên' }).click();
  await expect(page.getByRole('dialog').getByRole('progressbar').first()).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await expect(
    page.getByRole('dialog').getByText('Chưa có dữ liệu', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('dialog').getByText('Cần kiểm tra dữ liệu', { exact: true }),
  ).toBeVisible();
  expect(calls.some((c) => c.method !== 'GET')).toBe(false);
});
test('preview is read only and bulk attendance includes guests across all pages', async ({
  page,
}) => {
  const { calls } = await mockMentorWorkspace(page);
  await page.goto(`/mentor/sessions/${mentorIds.session}`);
  await expect(page.getByRole('region', { name: 'Danh sách học viên dự kiến' })).toContainText(
    'Học viên học bù',
  );
  expect(calls.some((c) => c.method !== 'GET')).toBe(false);
  await page.getByRole('button', { name: 'Bắt đầu buổi' }).click();
  await page.getByRole('button', { name: 'Tất cả có mặt', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('toàn bộ 41 học viên');
  await page.getByRole('button', { name: 'Xác nhận toàn bộ' }).click();
  await expect(page.getByRole('button', { name: 'Có mặt: Học viên học bù' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const bulk = calls.find((c) => c.path.endsWith('/attendance/bulk'));
  expect(bulk?.body).toEqual({ expectedVersion: 2, checked: true });
  expect(bulk?.key).toMatch(/^[0-9a-f-]{36}$/);
  await page.getByRole('button', { name: 'Vắng: Học viên học bù' }).click();
  await expect
    .poll(() => calls.filter((c) => c.path.endsWith('/attendance') && c.method === 'PUT').length)
    .toBe(1);
  expect(calls.find((c) => c.path.endsWith('/attendance') && c.method === 'PUT')?.body).toEqual({
    expectedVersion: 3,
    records: [],
    guestRecords: [{ makeupPlacementId: mentorIds.file, status: 'ABSENT' }],
  });
  await page.getByRole('button', { name: 'Tất cả vắng', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận toàn bộ' }).click();
  await expect(page.getByRole('button', { name: 'Vắng: Học viên An' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(calls.filter((c) => c.path.endsWith('/finalize'))).toHaveLength(0);
});
test('teaching note conflicts preserve drafts and require an explicit merge decision', async ({
  page,
}) => {
  const { calls } = await mockMentorWorkspace(page, { noteConflict: true });
  await page.goto(`/mentor/sessions/${mentorIds.session}`);
  await page.getByRole('button', { name: 'Bắt đầu buổi' }).click();
  await page.getByRole('button', { name: 'Ghi chú giảng dạy', exact: true }).click();
  await page.getByLabel('Nội dung đã dạy', { exact: true }).fill('Bản nháp về vòng lặp');
  await page.getByLabel('Việc cần làm tiếp', { exact: true }).fill('Ôn tập');
  await page.getByRole('button', { name: 'Lưu ghi chú giảng dạy' }).click();
  await expect(page.getByText('Nội dung trên máy chủ', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Nội dung đã dạy', { exact: true })).toHaveValue(
    'Bản nháp về vòng lặp',
  );
  await expect(page.getByRole('button', { name: 'Lưu ghi chú giảng dạy' })).toBeDisabled();
  await page.getByRole('button', { name: 'Giữ bản nháp để lưu tiếp' }).click();
  await page.getByRole('button', { name: 'Lưu ghi chú giảng dạy' }).click();
  await expect(page.getByText('Đã lưu ghi chú giảng dạy.')).toBeVisible();
  const writes = calls.filter((c) => c.path.endsWith('/teaching-notes') && c.method === 'PUT');
  expect(writes.map((c) => c.body?.expectedVersion)).toEqual([0, 1]);
  expect(writes[0].key).not.toBe(writes[1].key);
});
test('network retry keeps note idempotency key and meeting edits can clear the override', async ({
  page,
}) => {
  const { calls } = await mockMentorWorkspace(page, { noteTimeout: true });
  await page.goto(`/mentor/sessions/${mentorIds.session}`);
  await page.getByRole('button', { name: 'Sửa link buổi học' }).click();
  await page.getByLabel('Link học trực tuyến').fill('');
  await page.getByRole('button', { name: 'Lưu link buổi học' }).click();
  await expect
    .poll(() => calls.find((c) => c.path.endsWith('/meeting-url'))?.body?.meetingUrl)
    .toBe(null);
  await page.getByRole('button', { name: 'Bắt đầu buổi' }).click();
  await page.getByRole('button', { name: 'Ghi chú giảng dạy', exact: true }).click();
  await page.getByLabel('Nội dung đã dạy', { exact: true }).fill('Nội dung cần lưu');
  await page.getByRole('button', { name: 'Lưu ghi chú giảng dạy' }).click();
  await expect(page.getByText('Mất kết nối', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu ghi chú giảng dạy' }).click();
  await expect(page.getByText('Đã lưu ghi chú giảng dạy.')).toBeVisible();
  const writes = calls.filter((c) => c.path.endsWith('/teaching-notes') && c.method === 'PUT');
  expect(writes).toHaveLength(2);
  expect(writes[0].key).toBe(writes[1].key);
  expect(writes[0].body).toEqual(writes[1].body);
});
test('note drafts survive a failed conflict refresh and the edit window is checked on submit', async ({
  page,
}) => {
  const { calls } = await mockMentorWorkspace(page, { noteConflict: true });
  let failNextRead = false;
  await page.route(
    `**/api/v1/class-sessions/${mentorIds.session}/teaching-notes`,
    async (route) => {
      if (route.request().method() === 'PUT') failNextRead = true;
      else if (failNextRead) {
        failNextRead = false;
        return route.fulfill({
          status: 503,
          json: { code: 'API_UNAVAILABLE', message: 'Chưa tải lại được ghi chú' },
        });
      }
      return route.fallback();
    },
  );
  await page.goto(`/mentor/sessions/${mentorIds.session}`);
  await page.getByRole('button', { name: 'Bắt đầu buổi' }).click();
  await page.getByRole('button', { name: 'Ghi chú giảng dạy', exact: true }).click();
  await page.getByLabel('Nội dung đã dạy', { exact: true }).fill('Giữ nguyên bản nháp này');
  await page.getByRole('button', { name: 'Lưu ghi chú giảng dạy' }).click();
  await expect(
    page.getByText('Chưa tải lại được ghi chú. Bản nháp được giữ nguyên.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel('Nội dung đã dạy', { exact: true })).toHaveValue(
    'Giữ nguyên bản nháp này',
  );
  await page.getByRole('button', { name: 'Thử tải lại', exact: true }).click();
  await page.getByRole('button', { name: 'Giữ bản nháp để lưu tiếp' }).click();
  await page.clock.setFixedTime(new Date('2026-12-01T00:00:00Z'));
  await page.getByRole('button', { name: 'Lưu ghi chú giảng dạy' }).click();
  await expect(
    page.getByText('Đã hết thời hạn sửa ghi chú. Bản nháp vẫn được giữ tại đây.'),
  ).toBeVisible();
  expect(
    calls.filter((c) => c.path.endsWith('/teaching-notes') && c.method === 'PUT'),
  ).toHaveLength(1);
});
test('full-day leave separates same-day sessions, blocks past dates and preserves independent makeup choices', async ({
  page,
}, info) => {
  const { calls } = await mockMentorWorkspace(page, { multipleLeaveSessions: true });
  await page.clock.setFixedTime(new Date('2026-10-22T03:00:00Z'));
  await page.goto('/mentor/leave-requests');
  await page.getByRole('button', { name: 'Tạo đơn xin nghỉ', exact: true }).click();
  await page.getByLabel('Nghỉ từ ngày').fill('2026-10-26');
  await page.getByLabel('Nghỉ đến ngày').fill('2026-10-26');
  await page.getByRole('button', { name: 'Kiểm tra lịch dạy' }).click();
  const first = page.getByRole('region', { name: 'Lịch bù: Buổi xin nghỉ', exact: true });
  const second = page.getByRole('region', { name: 'Lịch bù: Buổi chiều cùng ngày', exact: true });
  await expect(first).toContainText('10:00 – 12:00');
  await expect(second).toContainText('15:00 – 17:00');
  const date = first.getByLabel('Ngày dạy bù', { exact: true });
  await expect(date).toHaveAttribute('min', '2026-10-27');
  // These are future dates relative to today, but still before/on the leave day.
  for (const invalidDate of ['2026-10-21', '2026-10-25', '2026-10-26']) {
    await date.fill(invalidDate);
    expect(
      await date.evaluate((element: HTMLInputElement) => element.validity.rangeUnderflow),
    ).toBe(true);
    await expect(first.getByRole('button', { name: 'Tìm giờ phù hợp' })).toBeDisabled();
    await expect(first).toContainText('Ngày dạy bù phải từ 27/10/2026 trở đi.');
  }
  expect(calls.filter((call) => call.path.endsWith('/makeup-slots'))).toHaveLength(0);
  await date.fill('2026-10-28');
  await first.getByRole('button', { name: 'Tìm giờ phù hợp' }).click();
  await first.getByRole('radio').check();
  await second.getByLabel('Ngày dạy bù', { exact: true }).fill('2026-10-29');
  await second.getByLabel('Buổi dạy bù', { exact: true }).selectOption('AFTERNOON');
  await second.getByRole('button', { name: 'Tìm giờ phù hợp' }).click();
  await second.getByRole('radio').check();
  await expect(first.getByRole('status')).toContainText('28/10/2026 · 10:00 – 12:00');
  await expect(second.getByRole('status')).toContainText('29/10/2026 · 14:00 – 16:00');
  await page.getByLabel('Lý do xin nghỉ').fill('Hai buổi bù riêng');
  await second.getByLabel('Ngày dạy bù', { exact: true }).fill('2026-10-30');
  await expect(first.getByRole('radio')).toBeChecked();
  await expect(page.getByRole('button', { name: 'Gửi đơn xin nghỉ', exact: true })).toBeDisabled();
  await second.getByLabel('Ngày dạy bù', { exact: true }).fill('2026-10-29');
  await second.getByRole('button', { name: 'Tìm giờ phù hợp' }).click();
  await second.getByRole('radio').check();
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1440, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .getByRole('region', { name: 'Tạo đơn xin nghỉ' })
    .screenshot({ path: info.outputPath('independent-makeup-sessions.png') });
  await page.getByRole('button', { name: 'Gửi đơn xin nghỉ', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Chi tiết đơn xin nghỉ' })).toBeVisible();
  const create = calls.find(
    (call) => call.path === 'mentor/leave-requests' && call.method === 'POST',
  );
  expect(create?.body?.sessionMappings).toEqual([
    {
      sourceSessionId: mentorIds.nextUnit,
      targetDate: '2026-10-28',
      targetPeriod: 'FULL_DAY',
      startsAt: '2026-10-28T03:00:00.000Z',
      endsAt: '2026-10-28T05:00:00.000Z',
    },
    {
      sourceSessionId: mentorIds.file,
      targetDate: '2026-10-29',
      targetPeriod: 'AFTERNOON',
      startsAt: '2026-10-29T07:00:00.000Z',
      endsAt: '2026-10-29T09:00:00.000Z',
    },
  ]);
  expect(create?.body).not.toHaveProperty('dayMappings');
});

test('makeup slots block identical and overlapping proposals, allow adjacency and release cleared choices', async ({
  page,
}, info) => {
  const { calls } = await mockMentorWorkspace(page, { multipleLeaveSessions: true });
  await page.route('**/api/v1/mentor/leave-requests/makeup-slots', (route) => {
    const body: Record<string, unknown> = route.request().postDataJSON();
    return route.fulfill({
      json: {
        slots: [
          { startsAt: '2026-10-28T03:00:00.000Z', endsAt: '2026-10-28T05:00:00.000Z' },
          { startsAt: '2026-10-28T04:00:00.000Z', endsAt: '2026-10-28T06:00:00.000Z' },
          { startsAt: '2026-10-28T05:00:00.000Z', endsAt: '2026-10-28T07:00:00.000Z' },
        ],
        sessionVersion: body.sourceSessionId === mentorIds.nextUnit ? 4 : 2,
        asOf: '2026-10-22T03:00:00.000Z',
        timeZone: 'Asia/Ho_Chi_Minh',
      },
    });
  });
  await page.goto('/mentor/leave-requests');
  await page.getByRole('button', { name: 'Tạo đơn xin nghỉ', exact: true }).click();
  await page.getByLabel('Nghỉ từ ngày').fill('2026-10-26');
  await page.getByLabel('Nghỉ đến ngày').fill('2026-10-26');
  await page.getByRole('button', { name: 'Kiểm tra lịch dạy' }).click();
  const first = page.getByRole('region', { name: 'Lịch bù: Buổi xin nghỉ', exact: true });
  const second = page.getByRole('region', { name: 'Lịch bù: Buổi chiều cùng ngày', exact: true });
  for (const section of [first, second]) {
    await section.getByLabel('Ngày dạy bù', { exact: true }).fill('2026-10-28');
    await section.getByRole('button', { name: 'Tìm giờ phù hợp' }).click();
  }
  await first.getByRole('radio', { name: /^10:00 – 12:00/ }).check();
  await expect(second.getByRole('radio', { name: /^10:00 – 12:00/ })).toBeDisabled();
  await expect(second.getByRole('radio', { name: /^11:00 – 13:00/ })).toBeDisabled();
  await expect(second).toContainText('Trùng lịch bù buổi khác');
  await second.getByRole('radio', { name: /^12:00 – 14:00/ }).check();
  await expect(first.getByRole('radio', { name: /^11:00 – 13:00/ })).toBeDisabled();
  await page.getByLabel('Lý do xin nghỉ').fill('Lịch bù không trùng nhau');
  await expect(page.getByRole('button', { name: 'Gửi đơn xin nghỉ', exact: true })).toBeEnabled();
  await first.getByLabel('Ngày dạy bù', { exact: true }).fill('2026-10-29');
  await expect(second.getByRole('radio', { name: /^10:00 – 12:00/ })).toBeEnabled();
  await expect(second.getByRole('radio', { name: /^12:00 – 14:00/ })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Gửi đơn xin nghỉ', exact: true })).toBeDisabled();
  await first.getByLabel('Ngày dạy bù', { exact: true }).fill('2026-10-28');
  await first.getByRole('button', { name: 'Tìm giờ phù hợp' }).click();
  await first.getByRole('radio', { name: /^10:00 – 12:00/ }).check();
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1440, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await second.screenshot({ path: info.outputPath('blocked-overlapping-makeup.png') });
  await page.getByRole('button', { name: 'Gửi đơn xin nghỉ', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Chi tiết đơn xin nghỉ' })).toBeVisible();
  const create = calls.find(
    (call) => call.path === 'mentor/leave-requests' && call.method === 'POST',
  );
  expect(create?.body?.sessionMappings).toMatchObject([
    {
      sourceSessionId: mentorIds.nextUnit,
      startsAt: '2026-10-28T03:00:00.000Z',
      endsAt: '2026-10-28T05:00:00.000Z',
    },
    {
      sourceSessionId: mentorIds.file,
      startsAt: '2026-10-28T05:00:00.000Z',
      endsAt: '2026-10-28T07:00:00.000Z',
    },
  ]);
});

test('makeup calendar blocks future dates inside the whole full-day leave range', async ({
  page,
}) => {
  const { calls } = await mockMentorWorkspace(page);
  await page.goto('/mentor/leave-requests');
  await page.getByRole('button', { name: 'Tạo đơn xin nghỉ', exact: true }).click();
  await page.getByLabel('Nghỉ từ ngày').fill('2026-10-26');
  await page.getByLabel('Nghỉ đến ngày').fill('2026-10-29');
  await page.getByRole('button', { name: 'Kiểm tra lịch dạy' }).click();
  const date = page.getByLabel('Ngày dạy bù', { exact: true });
  await expect(date).toHaveAttribute('min', '2026-10-30');
  for (const invalid of ['2026-10-25', '2026-10-26', '2026-10-28', '2026-10-29']) {
    await date.fill(invalid);
    expect(
      await date.evaluate((element: HTMLInputElement) => element.validity.rangeUnderflow),
    ).toBe(true);
    await expect(page.getByRole('button', { name: 'Tìm giờ phù hợp' })).toBeDisabled();
  }
  expect(calls.filter((call) => call.path.endsWith('/makeup-slots'))).toHaveLength(0);
  await date.fill('2026-10-30');
  await expect(page.getByRole('button', { name: 'Tìm giờ phù hợp' })).toBeEnabled();
});

test('stale leave creation keeps the proposed dates and reason without retrying automatically', async ({
  page,
}) => {
  const { calls } = await mockMentorWorkspace(page, { leaveConflict: true });
  await page.clock.setFixedTime(new Date('2026-10-22T03:00:00Z'));
  await page.goto('/mentor/leave-requests');
  await page.getByRole('button', { name: 'Tạo đơn xin nghỉ', exact: true }).click();
  await page.getByLabel('Nghỉ từ ngày').fill('2026-10-26');
  await page.getByLabel('Nghỉ đến ngày').fill('2026-10-26');
  await page.getByRole('button', { name: 'Kiểm tra lịch dạy' }).click();
  await page.getByLabel('Ngày dạy bù', { exact: true }).fill('2026-10-28');
  await page.getByRole('button', { name: 'Tìm giờ phù hợp' }).click();
  await page.getByRole('radio').check();
  await page.getByLabel('Lý do xin nghỉ').fill('Lý do cần giữ');
  await page.getByRole('button', { name: 'Gửi đơn xin nghỉ', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Lịch nguồn đã thay đổi.' }),
  ).toBeVisible();
  await expect(page.getByLabel('Ngày dạy bù', { exact: true })).toHaveValue('2026-10-28');
  await expect(page.getByRole('textbox', { name: 'Lý do xin nghỉ' })).toHaveValue('Lý do cần giữ');
  expect(
    calls.filter((c) => c.path === 'mentor/leave-requests' && c.method === 'POST'),
  ).toHaveLength(1);
});
for (const period of ['FULL_DAY', 'MORNING'])
  test(`leave ${period} preview, mapping, create, detail and withdrawal use current versions`, async ({
    page,
  }, info) => {
    const { calls } = await mockMentorWorkspace(page);
    await page.clock.setFixedTime(new Date('2026-10-22T03:00:00Z'));
    await page.goto('/mentor/leave-requests');
    await page.getByRole('button', { name: 'Tạo đơn xin nghỉ', exact: true }).click();
    await page.getByLabel('Nghỉ từ ngày').fill('2026-10-26');
    await page.getByLabel('Nghỉ đến ngày').fill('2026-10-26');
    await page.getByLabel('Khoảng nghỉ').selectOption(period);
    await page.getByRole('button', { name: 'Kiểm tra lịch dạy' }).click();
    await expect(page.getByText('Có 1 buổi bị ảnh hưởng.', { exact: false })).toBeVisible();
    await page.getByLabel('Ngày dạy bù', { exact: true }).fill('2026-10-28');
    await page.getByLabel('Buổi dạy bù', { exact: true }).selectOption(period);
    await page.getByRole('button', { name: 'Tìm giờ phù hợp' }).click();
    await page.getByRole('radio').check();
    await page.getByLabel('Lý do xin nghỉ').fill('Việc gia đình');
    await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1440, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (info.project.name === 'mobile') {
      for (const control of await page
        .getByRole('region', { name: 'Tạo đơn xin nghỉ' })
        .locator('input, select, textarea')
        .all()) {
        if ((await control.getAttribute('type')) === 'radio') continue;
        expect((await control.boundingBox())?.width).toBeGreaterThan(150);
      }
    }
    await page.screenshot({
      path: `test-results/mentor-leave-${period}-${info.project.name}.png`,
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Gửi đơn xin nghỉ', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Chi tiết đơn xin nghỉ' })).toBeVisible();
    const create = calls.find((c) => c.path === 'mentor/leave-requests' && c.method === 'POST');
    expect(create?.body?.sourceVersions).toEqual([{ sessionId: mentorIds.nextUnit, version: 4 }]);
    expect(create?.key).toBeTruthy();
    expect(create?.body?.sessionMappings).toEqual([
      {
        sourceSessionId: mentorIds.nextUnit,
        targetDate: '2026-10-28',
        targetPeriod: period,
        startsAt: '2026-10-28T03:00:00.000Z',
        endsAt: '2026-10-28T05:00:00.000Z',
      },
    ]);
    expect(create?.body).not.toHaveProperty('dayMappings');
    await page.getByRole('button', { name: 'Rút đơn', exact: true }).click();
    await page.getByLabel('Lý do rút đơn').fill('Đã sắp xếp được');
    await page.getByRole('button', { name: 'Xác nhận rút đơn' }).click();
    await expect(page.getByRole('dialog')).toContainText('Đã rút');
    expect(calls.find((c) => c.path.endsWith('/withdraw'))?.body).toEqual({
      expectedVersion: 1,
      reason: 'Đã sắp xếp được',
    });
  });
