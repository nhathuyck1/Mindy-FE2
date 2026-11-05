import { expect, test } from '@playwright/test';
import { mockAssignments } from './assignment-fixtures';
import { assignment, ids, pageOf } from '../fixtures/assignment-data';
import { mockAdminApi, adminUsers } from './admin-fixtures';

test('student assignment hub reads all class pages, shows all types and keeps the selected class', async ({
  page,
}, info) => {
  await mockAssignments(page);
  const classRow = {
    enrollmentId: ids.student,
    enrollmentStatus: 'ACTIVE',
    enrolledAt: '2026-10-10T00:00:00Z',
    createdAt: '2026-10-10T00:00:00Z',
    isHoldExpired: false,
    courseId: ids.class,
    courseCode: 'WEB101',
    courseTitle: 'Lập trình Web',
    courseImageUrl: null,
    classId: ids.class,
    classCode: 'WEB-A',
    className: 'Web cơ bản',
    classStatus: 'IN_PROGRESS',
    deliveryMode: 'ONLINE',
    startDate: '2026-10-01',
    endDate: '2026-12-01',
    mentor: { id: ids.student, displayName: 'Mentor Mindy' },
    order: null,
    accessMode: 'FULL',
    accessReason: 'ACTIVE_ENROLLMENT',
    canViewClass: true,
    canViewSchedule: true,
  };
  const secondClass = { ...classRow, classId: ids.session, className: 'Web nâng cao' };
  await page.route(`**/api/v1/me/classes/${ids.session}`, (route) =>
    route.fulfill({
      json: {
        ...secondClass,
        id: ids.session,
        code: secondClass.classCode,
        name: secondClass.className,
        maxStudents: 20,
        availableSeats: 5,
        meetingUrl: null,
        units: [
          {
            id: ids.question,
            position: 1,
            title: 'Chương 1',
            status: 'OPEN',
            sessions: [
              {
                id: ids.session,
                sessionNumber: 1,
                title: 'Buổi 1',
                startsAt: '2026-11-06T03:00:00Z',
                endsAt: '2026-11-06T05:00:00Z',
                roomName: null,
                status: 'SCHEDULED',
              },
            ],
          },
        ],
      },
    }),
  );
  const reads: URL[] = [];
  await page.route('**/api/v1/me/classes?*', (route) => {
    const url = new URL(route.request().url());
    reads.push(url);
    return route.fulfill({
      json: {
        items: [url.searchParams.get('page') === '1' ? classRow : secondClass],
        page: Number(url.searchParams.get('page')),
        pageSize: 1,
        total: 2,
        asOf: '2026-11-06T00:00:00Z',
      },
    });
  });
  const assignmentReads: URL[] = [];
  await page.route('**/api/v1/me/classes/*/assignments?*', (route) => {
    const url = new URL(route.request().url());
    assignmentReads.push(url);
    const items = [
      { ...assignment, type: 'QUIZ', title: 'Ôn tập trắc nghiệm' },
      { ...assignment, id: ids.file, type: 'ZIP', title: 'Bài nộp dự án' },
      { ...assignment, id: ids.question, type: 'CODE', title: 'Luyện tập lập trình' },
    ];
    return route.fulfill({
      json: pageOf(
        items.filter(
          (item) => !url.searchParams.get('type') || item.type === url.searchParams.get('type'),
        ),
      ),
    });
  });
  await page.goto(`/user/assignments?classId=${ids.session}`);
  await expect(page.getByRole('combobox', { name: 'Lớp học', exact: true })).toHaveValue(
    ids.session,
  );
  await expect(page.getByRole('link', { name: /Ôn tập trắc nghiệm/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Bài nộp dự án/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Luyện tập lập trình/ })).toBeVisible();
  expect(reads.map((url) => url.searchParams.get('page'))).toEqual(['1', '2']);
  expect(assignmentReads.at(-1)?.searchParams.has('type')).toBe(false);
  await page.getByRole('combobox', { name: 'Loại bài', exact: true }).selectOption('ZIP');
  await expect(page.getByRole('link', { name: /Ôn tập trắc nghiệm/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Xóa lọc', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`classId=${ids.session}`));
  await expect(page.getByRole('link', { name: /Ôn tập trắc nghiệm/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Lớp học', exact: true })).toHaveValue(
    ids.session,
  );
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('assignment-hub.png'), fullPage: true });
});

test('admin filters survive reload and a shrinking result set returns to the last valid page', async ({
  page,
}) => {
  await mockAdminApi(page);
  await page.goto('/admin/users');
  const roles = page.getByRole('combobox', { name: 'Tất cả vai trò', exact: true });
  await roles.selectOption('MENTOR');
  await expect(page).toHaveURL(/role=MENTOR/);
  await page.reload();
  await expect(roles).toHaveValue('MENTOR');
  await page.route('**/api/v1/admin/users?*', (route) => {
    const url = new URL(route.request().url()),
      current = Number(url.searchParams.get('page') ?? 1);
    return route.fulfill({
      json: {
        items: current > 2 ? [] : adminUsers.slice(10, 20),
        total: 20,
        page: current,
        pageSize: 10,
      },
    });
  });
  await page.goto('/admin/users?page=3');
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(10);
});
