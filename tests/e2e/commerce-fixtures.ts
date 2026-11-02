import type { Page } from '@playwright/test';
import type { z } from 'zod';
import type { cartSchema } from '@/features/cart/schemas/cart-contracts';
import type { OrderPayment } from '@/features/orders/schemas/order-contracts';
import { checkoutInputSchema } from '@/features/orders/schemas/order-contracts';
import type { Payment } from '@/features/payments/schemas/payment-contracts';
import { mockHomepageApi, testUser } from './api-fixtures';

export const orderId = '55555555-5555-4555-8555-555555555555';
export const classId = '44444444-4444-4444-8444-444444444444';
export const qrPayload =
  '00020101021238570010A000000727012700069704220113MINDYTEST0000152040000530370454061000005802VN6304ABCD';

export async function mockCommerce(page: Page) {
  await mockHomepageApi(page);
  const order: OrderPayment = {
    id: orderId,
    orderCode: 'MDTESTCHECKOUT',
    paymentType: 'PAYOS',
    status: 'PENDING',
    totalAmount: 100000,
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    paidAt: null,
    mentorId: null,
    createdAt: new Date().toISOString(),
    details: [
      {
        id: '66666666-6666-4666-8666-666666666666',
        classId,
        courseTitle: 'Lập trình Web',
        className: 'Web buổi tối',
        priceAmount: 100000,
        quantity: 1,
        totalAmount: 100000,
      },
    ],
    payment: null,
  };
  const payment: Payment = {
    paymentId: '77777777-7777-4777-8777-777777777777',
    orderId,
    providerOrderCode: 1000000000,
    status: 'PENDING',
    checkoutUrl: 'https://pay.payos.vn/web/test-checkout',
    qrCode: qrPayload,
    expiresAt: order.expiresAt,
    amount: 100000,
  };
  const cart: z.infer<typeof cartSchema> = {
    items: [
      {
        classId,
        classCode: 'WEB-EVENING',
        className: 'Web buổi tối',
        courseId: '33333333-3333-4333-8333-333333333333',
        courseTitle: 'Lập trình Web',
        deliveryMode: 'ONLINE',
        startDate: '2026-11-01',
        endDate: '2026-12-01',
        priceSnapshot: 90000,
        currentPriceAmount: 100000,
        isPurchasable: true,
        addedAt: new Date().toISOString(),
      },
    ],
    totalAmount: 100000,
  };
  const state = {
    order,
    payment,
    cart,
    hasOrder: false,
    loggedIn: true,
    checkouts: 0,
    checkoutTypes: [] as string[],
    extraCashOrders: [] as OrderPayment[],
    cancellations: 0,
    cancelFails: false,
    creates: 0,
    reads: 0,
    paymentFailures: 0,
    creatingResponses: 0,
    loseCheckoutResponse: false,
    orderReadStatus: 200,
    mappings: [] as string[],
  };
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1/', '');
    const method = request.method();
    if (path === 'auth/me')
      return route.fulfill({
        status: state.loggedIn ? 200 : 401,
        json: state.loggedIn
          ? testUser
          : { code: 'AUTHENTICATION_REQUIRED', message: 'Đăng nhập lại' },
      });
    if (path === 'auth/login') {
      state.loggedIn = true;
      return route.fulfill({
        json: { user: testUser, accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString() },
      });
    }
    if (path === 'auth/logout') {
      state.loggedIn = false;
      return route.fulfill({ status: 204 });
    }
    if (path === 'auth/refresh')
      return route.fulfill({
        status: 401,
        json: { code: 'AUTHENTICATION_REQUIRED', message: 'Đăng nhập lại' },
      });
    if (path === 'me/cart' && method === 'GET') return route.fulfill({ json: state.cart });
    if (path === `me/cart/items/${classId}` && method === 'DELETE') {
      state.cart = { items: [], totalAmount: 0 };
      return route.fulfill({ status: 204 });
    }
    if (path === 'me/cart/checkout') {
      state.checkouts++;
      const input = checkoutInputSchema.parse(request.postDataJSON());
      state.checkoutTypes.push(input.paymentType);
      state.order.paymentType = input.paymentType;
      state.hasOrder = true;
      state.cart = { items: [], totalAmount: 0 };
      if (state.loseCheckoutResponse) return route.abort('failed');
      return route.fulfill({
        status: 201,
        json: {
          orders: [state.order, ...(input.paymentType === 'CASH' ? state.extraCashOrders : [])],
        },
      });
    }
    if (path === 'me/orders')
      return route.fulfill({
        json: {
          items:
            state.hasOrder &&
            (!url.searchParams.get('status') ||
              state.order.status === url.searchParams.get('status'))
              ? [state.order, ...state.extraCashOrders]
              : [],
          page: Number(url.searchParams.get('page') ?? 1),
          pageSize: 10,
          total:
            state.hasOrder &&
            (!url.searchParams.get('status') ||
              state.order.status === url.searchParams.get('status'))
              ? 1 + state.extraCashOrders.length
              : 0,
        },
      });
    if (path === 'me/orders/payment-result') {
      state.mappings.push(url.search);
      return route.fulfill({ json: state.order });
    }
    if (path === `me/orders/${orderId}/cancel` && method === 'POST') {
      state.cancellations++;
      if (state.cancelFails)
        return route.fulfill({ status: 503, json: { code: 'UNAVAILABLE', message: 'Try again' } });
      if (state.order.status !== 'PENDING')
        return route.fulfill({
          status: 409,
          json: { code: 'ORDER_NOT_CANCELLABLE', message: 'Order closed' },
        });
      state.order.status = 'CANCELLED';
      return route.fulfill({ json: state.order });
    }
    if (path === `me/orders/${orderId}`) {
      state.reads++;
      return route.fulfill({
        status: state.orderReadStatus,
        json:
          state.orderReadStatus === 200
            ? state.order
            : { code: 'ORDER_ACCESS_DENIED', message: 'No access' },
      });
    }
    if (path === `me/orders/${orderId}/payments/payos`) {
      state.creates++;
      if (JSON.stringify(request.postDataJSON()) !== '{}')
        throw new Error('Unexpected payment input');
      if (state.paymentFailures > 0) {
        state.paymentFailures--;
        return route.fulfill({
          status: 503,
          json: { code: 'PAYMENT_UNAVAILABLE', message: 'Unavailable' },
        });
      }
      if (state.creatingResponses > 0) {
        state.creatingResponses--;
        state.order.payment = {
          ...state.payment,
          status: 'CREATING',
          qrCode: null,
          checkoutUrl: null,
        };
      } else state.order.payment = state.payment;
      return route.fulfill({ status: 201, json: state.order.payment });
    }
    return route.fallback();
  });
  return state;
}
