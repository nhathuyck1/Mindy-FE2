import { expect, test } from '@playwright/test';
import { mentorIds } from './mentor-fixtures';
import { mockMentorWorkspace, workspaceDate } from './mentor-workspace-fixtures';
import { testUser } from './api-fixtures';

test('mentor progress bars distinguish zero, partial, full and unknown data', async ({
  page,
}, info) => {
  const { calls } = await mockMentorWorkspace(page);
  const units = Array.from({ length: 5 }, (_, index) => ({
    id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    classId: mentorIds.class,
    courseUnitId: mentorIds.material,
    position: index + 1,
    title: [
      'Làm quen lập trình',
      'Biến và kiểu dữ liệu',
      'Câu lệnh điều kiện',
      'Vòng lặp',
      'Bài thực hành',
    ][index],
    status: 'OPEN',
    unlockAt: null,
  }));
  const paged = (items: unknown[]) => ({ items, page: 1, pageSize: 20, total: items.length });
  const metadata = {
    completionPolicy: 'UNDEFINED',
    policyVersion: null,
    assignmentSummary: { availability: 'NOT_IMPLEMENTED', counts: null },
    readonly: true,
    asOf: workspaceDate,
    timeZone: 'Asia/Ho_Chi_Minh',
  };
  await page.route(`**/api/v1/mentor/classes/${mentorIds.class}/units?*`, (route) =>
    route.fulfill({ json: paged(units) }),
  );
  await page.route(`**/api/v1/mentor/classes/${mentorIds.class}/progress?*`, (route) =>
    route.fulfill({
      json: {
        ...metadata,
        ...paged([
          {
            enrollmentId: testUser.id,
            studentId: testUser.id,
            displayName: 'Nguyễn Minh Anh',
            storedUnitCount: 4,
            untrackedUnitCount: 1,
            invalidStoredUnitCount: 1,
          },
        ]),
      },
    }),
  );
  await page.route(
    `**/api/v1/mentor/classes/${mentorIds.class}/students/${testUser.id}/progress?*`,
    (route) =>
      route.fulfill({
        json: {
          ...metadata,
          ...paged(
            units.map((unit, index) => ({
              enrollmentId: testUser.id,
              classUnitId: unit.id,
              trackingStatus: index === 3 ? 'UNTRACKED' : 'STORED',
              status: index === 2 ? 'COMPLETED' : 'IN_PROGRESS',
              progressPercent: ['0.00', '60.00', '100.00', null, null][index],
              completedAt: index === 2 ? workspaceDate : null,
              dataQuality: index === 3 ? 'UNTRACKED' : index === 4 ? 'INVALID_PERCENT' : 'VALID',
            })),
          ),
        },
      }),
  );
  await page.goto(`/mentor/classes/${mentorIds.class}`);
  await page.getByRole('button', { name: 'Tiến độ', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: 'Chương đã có dữ liệu' })).toHaveAttribute(
    'aria-valuenow',
    '80',
  );
  await expect(page.getByText('4/5 chương', { exact: true })).toBeVisible();
  await expect(page.getByText('1 cần kiểm tra', { exact: true })).toBeVisible();
  await page.screenshot({
    path: `test-results/mentor-progress-list-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Xem tiến độ học viên' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('progressbar')).toHaveCount(3);
  await expect(
    dialog.getByRole('progressbar', { name: 'Tiến độ chương 1', exact: true }),
  ).toHaveAttribute('aria-valuenow', '0');
  await expect(
    dialog.getByRole('progressbar', { name: 'Tiến độ chương 2', exact: true }),
  ).toHaveAttribute('aria-valuenow', '60');
  await expect(
    dialog.getByRole('progressbar', { name: 'Tiến độ chương 3', exact: true }),
  ).toHaveAttribute('aria-valuenow', '100');
  await expect(dialog.getByText('Chưa có dữ liệu', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Cần kiểm tra dữ liệu', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1440, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: `test-results/mentor-progress-detail-${info.project.name}.png`,
    fullPage: true,
  });
  await dialog.getByText('Cách đọc tiến độ', { exact: true }).click();
  await expect(dialog).toContainText('Chưa có dữ liệu khác với 0%');
  expect(calls.some((call) => call.method !== 'GET')).toBe(false);
});

test('leave creation focuses on three steps and keeps the list separate', async ({
  page,
}, info) => {
  await mockMentorWorkspace(page);
  await page.clock.setFixedTime(new Date('2026-10-22T03:00:00Z'));
  await page.goto('/mentor/leave-requests');
  await expect(page.getByRole('heading', { name: 'Bạn chưa có đơn xin nghỉ' })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo đơn xin nghỉ', exact: true }).click();
  const steps = page.getByRole('list', { name: 'Các bước tạo đơn' });
  await expect(steps.locator('[aria-current="step"]')).toContainText('Khoảng nghỉ');
  await expect(page.getByRole('heading', { name: 'Bạn chưa có đơn xin nghỉ' })).toHaveCount(0);
  await page.getByLabel('Nghỉ từ ngày').fill('2026-10-26');
  await page.getByLabel('Nghỉ đến ngày').fill('2026-10-26');
  await page.getByRole('button', { name: 'Xem buổi bị ảnh hưởng' }).click();
  await expect(steps.locator('[aria-current="step"]')).toContainText('Lịch dạy bù');
  await page.getByLabel('Dạy bù cho ngày 2026-10-26').fill('2026-10-28');
  await expect(steps.locator('[aria-current="step"]')).toContainText('Gửi đơn');
  await page.getByLabel('Lý do xin nghỉ').fill('Xin nghỉ để giải quyết việc gia đình.');
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1440, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: `test-results/mentor-leave-steps-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Gửi đơn xin nghỉ', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Chi tiết đơn xin nghỉ' })).toBeVisible();
  await page.screenshot({
    path: `test-results/mentor-leave-detail-${info.project.name}.png`,
    fullPage: true,
  });
});
