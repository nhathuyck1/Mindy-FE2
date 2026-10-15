import type { Page } from '@playwright/test';

export const testUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'student@example.test',
  displayName: 'Học viên kiểm thử',
  phone: null,
  role: 'STUDENT',
  status: 'ACTIVE',
  lastLoginAt: null,
  createdAt: '2026-10-15T00:00:00Z',
};
const category = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Lập trình Web',
  slug: 'web',
  description: null,
  isActive: true,
};

export async function mockHomepageApi(page: Page) {
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 401,
      json: { code: 'AUTHENTICATION_REQUIRED', message: 'Bạn chưa đăng nhập.' },
    }),
  );
  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({
      status: 401,
      json: { code: 'AUTHENTICATION_REQUIRED', message: 'Phiên đã hết hạn.' },
    }),
  );
  await page.route('**/api/v1/course-categories?**', (route) =>
    route.fulfill({ json: { items: [category], page: 1, pageSize: 100, total: 1 } }),
  );
  await page.route('**/api/v1/courses?**', (route) =>
    route.fulfill({
      json: {
        items: [
          {
            id: '33333333-3333-4333-8333-333333333333',
            code: 'TEST-101',
            title: 'Khóa học kiểm thử',
            description: 'Dữ liệu chỉ sử dụng trong test.',
            imgUrl: null,
            priceAmount: 100000,
            category,
          },
        ],
        page: 1,
        pageSize: 4,
        total: 1,
      },
    }),
  );
}
