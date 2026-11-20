import { expect, test, type Page } from '@playwright/test';
import { mockCommerce, orderId } from './commerce-fixtures';

async function freeCart(page: Page) {
  const state = await mockCommerce(page);
  state.cart.totalAmount = 0;
  state.cart.items[0].currentPriceAmount = 0;
  state.cart.items[0].priceSnapshot = 0;
  state.order.totalAmount = 0;
  state.order.details[0].priceAmount = 0;
  state.order.details[0].totalAmount = 0;
  await page.route('**/api/v1/me/classes?**', (route) =>
    route.fulfill({
      json: {
        items:
          state.order.status === 'PAID'
            ? [
                {
                  enrollmentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                  enrollmentStatus: 'ACTIVE',
                  enrolledAt: state.order.paidAt,
                  createdAt: state.order.createdAt,
                  isHoldExpired: false,
                  courseId: state.cart.items[0]?.courseId ?? '33333333-3333-4333-8333-333333333333',
                  courseCode: 'WEB-TRIAL',
                  courseTitle: 'Lập trình Web',
                  courseImageUrl: null,
                  classId: state.order.details[0].classId,
                  classCode: 'WEB-EVENING',
                  className: 'Web buổi tối',
                  classStatus: 'OPEN',
                  deliveryMode: 'ONLINE',
                  startDate: '2026-11-21',
                  endDate: '2026-12-21',
                  mentor: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', displayName: 'Mentor' },
                  order: {
                    orderId,
                    orderCode: state.order.orderCode,
                    orderStatus: 'PAID',
                    paymentType: state.order.paymentType,
                    expiresAt: state.order.expiresAt,
                    paidAt: state.order.paidAt,
                    requiresReview: false,
                  },
                  accessMode: 'FULL',
                  accessReason: 'ACTIVE_ENROLLMENT',
                  canViewClass: true,
                  canViewSchedule: true,
                },
              ]
            : [],
        page: 1,
        pageSize: 10,
        total: state.order.status === 'PAID' ? 1 : 0,
        asOf: new Date().toISOString(),
      },
    }),
  );
  return state;
}

test('Free checkout confirms once and opens the server-confirmed class without PayOS', async ({
  page,
  isMobile,
}, testInfo) => {
  const state = await freeCart(page);
  state.order.status = 'PAID';
  state.order.paidAt = new Date().toISOString();
  await page.setViewportSize({ width: isMobile ? 320 : 1440, height: 900 });
  await page.goto('/cart');
  await expect(page.getByRole('radio')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Xác nhận đăng ký', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('free-cart.png'), fullPage: true });
  await page.getByRole('button', { name: 'Xác nhận đăng ký', exact: true }).dblclick();
  await expect(page).toHaveURL('/user/courses');
  await expect(page.getByRole('heading', { name: 'Khóa học của tôi', exact: true })).toBeVisible();
  await expect(page.locator('article').filter({ hasText: 'Web buổi tối' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vào học', exact: true })).toBeVisible();
  expect(state.checkouts).toBe(1);
  expect(state.creates).toBe(0);
  expect(state.checkoutTypes).toEqual(['PAYOS']);
  await page.goto(`/checkout/${orderId}`);
  await expect(page.getByText('Đăng ký miễn phí thành công', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Khóa học của tôi', exact: true }).last(),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('free-confirmed.png'), fullPage: true });
  expect(state.creates).toBe(0);
});

test('An unconfirmed free checkout never creates QR or claims enrollment and recovers on read', async ({
  page,
}) => {
  const state = await freeCart(page);
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Xác nhận đăng ký', exact: true }).click();
  await expect(page).toHaveURL(`/checkout/${orderId}`);
  await expect(page.getByText('Chưa hoàn tất đăng ký miễn phí', { exact: true })).toBeVisible();
  await expect(page.getByText('Đăng ký miễn phí thành công', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toHaveCount(0);
  expect(state.creates).toBe(0);
  state.order.status = 'PAID';
  state.order.paidAt = new Date().toISOString();
  await page.getByRole('button', { name: 'Kiểm tra đăng ký', exact: true }).click();
  await expect(page.getByText('Đăng ký miễn phí thành công', { exact: true })).toBeVisible();
  expect(state.checkouts).toBe(1);
  expect(state.creates).toBe(0);
});

test('A free price changed by the server to a positive amount follows paid checkout', async ({
  page,
}) => {
  const state = await freeCart(page);
  state.order.totalAmount = 100000;
  state.order.details[0].priceAmount = 100000;
  state.order.details[0].totalAmount = 100000;
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Xác nhận đăng ký', exact: true }).click();
  await expect(page).toHaveURL(`/checkout/${orderId}`);
  await expect(page.getByRole('link', { name: 'Mở trang thanh toán payOS' })).toBeVisible();
  await expect(page.getByText('Đăng ký miễn phí thành công', { exact: true })).toHaveCount(0);
  expect(state.checkouts).toBe(1);
  expect(state.creates).toBe(1);
});

test('A positive cart repriced to zero by the server completes registration without PayOS', async ({
  page,
}) => {
  const state = await freeCart(page);
  state.cart.totalAmount = 100000;
  state.cart.items[0].currentPriceAmount = 100000;
  state.order.status = 'PAID';
  state.order.paidAt = new Date().toISOString();
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Thanh toán', exact: true }).click();
  await expect(page).toHaveURL('/user/courses');
  expect(state.checkouts).toBe(1);
  expect(state.creates).toBe(0);
});

test('An unavailable free class still blocks registration', async ({ page }) => {
  const state = await freeCart(page);
  state.cart.items[0].isPurchasable = false;
  await page.goto('/cart');
  await expect(page.getByRole('button', { name: 'Xác nhận đăng ký', exact: true })).toBeDisabled();
  expect(state.checkouts).toBe(0);
  expect(state.creates).toBe(0);
});

test('Mixed CASH checkout counts only positive pending orders and labels free orders honestly', async ({
  page,
}) => {
  const state = await mockCommerce(page);
  state.extraCashOrders.push({
    ...state.order,
    id: '88888888-8888-4888-8888-888888888888',
    orderCode: 'MDFREE',
    totalAmount: 0,
    paymentType: 'CASH',
    status: 'PAID',
    paidAt: new Date().toISOString(),
    details: [{ ...state.order.details[0], priceAmount: 0, totalAmount: 0 }],
  });
  await page.goto('/cart');
  await page.getByRole('radio', { name: 'Tiền mặt', exact: true }).check();
  await page.getByRole('button', { name: 'Thanh toán', exact: true }).click();
  await expect(page).toHaveURL('/user/orders');
  await expect(
    page.getByText('Còn 1 đơn tiền mặt cần thanh toán tại trung tâm trước hạn ghi trên đơn.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Miễn phí', exact: true })).toHaveCount(1);
  expect(state.checkouts).toBe(1);
  expect(state.creates).toBe(0);
});
