import { expect, test } from '@playwright/test';
import { mockMentor, mentorIds } from './mentor-fixtures';

for (const first of ['context', 'attendance'] as const) {
  test(`mentor session shows one loading when ${first} resolves first`, async ({
    page,
  }, testInfo) => {
    const { calls } = await mockMentor(page);
    const gates = {
      context: Promise.withResolvers<void>(),
      attendance: Promise.withResolvers<void>(),
    };
    for (const endpoint of ['context', 'attendance'] as const) {
      await page.route(
        `**/api/v1/class-sessions/${mentorIds.session}/${endpoint}${endpoint === 'attendance' ? '?*' : ''}`,
        async (route) => {
          await gates[endpoint].promise;
          await route.fallback();
        },
      );
    }
    try {
      await page.goto(`/mentor/sessions/${mentorIds.session}`);
      const loading = page.getByRole('status', { name: 'Đang tải dữ liệu…', exact: true });
      await expect(loading).toHaveCount(1);
      await page.screenshot({
        path: `test-results/mentor-single-loading-${first}-${testInfo.project.name}.png`,
        fullPage: true,
      });
      gates[first].resolve();
      await expect.poll(() => calls.some((call) => call.path.endsWith(`/${first}`))).toBe(true);
      await expect(loading).toHaveCount(1);
      await expect(page.getByRole('heading', { name: 'Bảng điểm danh', exact: true })).toHaveCount(
        0,
      );
      gates[first === 'context' ? 'attendance' : 'context'].resolve();
      await expect(
        page.getByRole('heading', { name: 'Bảng điểm danh', exact: true }),
      ).toBeVisible();
      await expect(page.getByText('Phòng: Phòng 101', { exact: false })).toBeVisible();
      await expect(loading).toHaveCount(0);
    } finally {
      gates.context.resolve();
      gates.attendance.resolve();
    }
  });
}

test('mentor session retries both reads after a single loading error', async ({ page }) => {
  const { calls } = await mockMentor(page);
  let attempts = 0;
  await page.route(`**/api/v1/class-sessions/${mentorIds.session}/context`, async (route) => {
    attempts++;
    if (attempts === 1)
      return route.fulfill({
        status: 503,
        json: { code: 'UNAVAILABLE', message: 'Không tải được thông tin buổi học.' },
      });
    await route.fallback();
  });
  await page.goto(`/mentor/sessions/${mentorIds.session}`);
  await expect(
    page.getByRole('alert').filter({ hasText: 'Không tải được thông tin buổi học.' }),
  ).toBeVisible();
  await expect(page.getByRole('status', { name: 'Đang tải dữ liệu…', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bảng điểm danh', exact: true })).toBeVisible();
  expect(attempts).toBe(2);
  expect(calls.filter((call) => call.path.endsWith('/attendance'))).toHaveLength(2);
});

test('mentor chapter keeps one loading across content, editor and session reads', async ({
  page,
}) => {
  await mockMentor(page);
  const prefix = `mentor/classes/${mentorIds.class}`;
  const gates = {
    list: {
      path: `${prefix}/units/${mentorIds.unit}/materials?*`,
      ...Promise.withResolvers<void>(),
    },
    detail: { path: `${prefix}/materials/${mentorIds.material}`, ...Promise.withResolvers<void>() },
    context: { path: `${prefix}/units/${mentorIds.unit}`, ...Promise.withResolvers<void>() },
    sessions: {
      path: `${prefix}/units/${mentorIds.unit}/sessions?*`,
      ...Promise.withResolvers<void>(),
    },
  };
  for (const gate of Object.values(gates)) {
    await page.route(`**/api/v1/${gate.path}`, async (route) => {
      await gate.promise;
      await route.fallback();
    });
  }
  try {
    await page.goto(`/mentor/classes/${mentorIds.class}`);
    const loading = page.getByRole('status', { name: 'Đang tải dữ liệu…', exact: true });
    await expect(loading).toHaveCount(1);
    await page.getByRole('button', { name: 'Thêm nội dung', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Thêm nội dung mới', exact: true }),
    ).toBeVisible();
    await expect(loading).toHaveCount(1);
    gates.sessions.resolve();
    await expect(loading).toHaveCount(0);
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(loading).toHaveCount(1);
    gates.list.resolve();
    await expect(loading).toHaveCount(1);
    gates.context.resolve();
    await expect(page.getByRole('button', { name: /Bài viết đầu tiên/ })).toBeVisible();
    await expect(loading).toHaveCount(0);
    await page.getByRole('button', { name: /Bài viết đầu tiên/ }).click();
    await expect(loading).toHaveCount(1);
    gates.detail.resolve();
    await expect(
      page.getByRole('toolbar', { name: 'Thao tác nội dung', exact: true }),
    ).toBeVisible();
    await expect(loading).toHaveCount(0);
    await expect(loading).toHaveCount(0);
  } finally {
    for (const gate of Object.values(gates)) gate.resolve();
  }
});
