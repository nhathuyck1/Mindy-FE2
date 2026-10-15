import type { Page } from '@playwright/test';
import { mockHomepageApi } from './api-fixtures';

export const courseId = '33333333-3333-4333-8333-333333333333';
export const category = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Lập trình Web',
  slug: 'web',
};
export const course = {
  id: courseId,
  code: 'HTML-101',
  title: 'HTML, CSS và JavaScript từ cơ bản',
  description: 'Xây dựng nền tảng lập trình web và thực hành qua từng học phần.',
  imgUrl: null,
  priceAmount: 1500000,
  category,
};
export const openClass = {
  id: '44444444-4444-4444-8444-444444444444',
  courseId,
  code: 'WEB-ONLINE',
  name: 'Web — Online tối thứ 3',
  startDate: '2026-10-20',
  endDate: '2026-11-20',
  deliveryMode: 'ONLINE',
  maxStudents: 20,
  availableSeats: 4,
  mentor: { id: '55555555-5555-4555-8555-555555555555', displayName: 'Nguyễn Minh Anh' },
};
export const fullClass = {
  ...openClass,
  id: '66666666-6666-4666-8666-666666666666',
  code: 'WEB-OFFLINE',
  name: 'Web — Offline thứ 7',
  deliveryMode: 'OFFLINE',
  availableSeats: 0,
};
export const units = [
  {
    id: '77777777-7777-4777-8777-777777777777',
    unitNumber: 1,
    title: 'Làm quen với HTML',
    description: 'Cấu trúc một trang web và thẻ ngữ nghĩa.',
    requiredScorePercent: 80,
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    unitNumber: 2,
    title: 'CSS và bố cục responsive',
    description: null,
    requiredScorePercent: 75,
  },
];
export const detail = { ...course, units, openClasses: [openClass, fullClass] };
export const timetable = {
  ...openClass,
  units: [
    {
      id: units[0].id,
      position: 1,
      title: units[0].title,
      sessions: [
        {
          id: '99999999-9999-4999-8999-999999999999',
          sessionNumber: 2,
          title: 'Thực hành HTML',
          startsAt: '2026-10-27T12:00:00Z',
          endsAt: '2026-10-27T14:00:00Z',
          roomName: null,
          status: 'CANCELLED',
        },
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          sessionNumber: 1,
          title: 'Buổi đầu tiên',
          startsAt: '2026-10-20T12:00:00Z',
          endsAt: '2026-10-20T14:00:00Z',
          roomName: null,
          status: 'SCHEDULED',
        },
      ],
    },
  ],
};

export async function mockCoursesApi(page: Page) {
  await mockHomepageApi(page);
  await page.route('**/api/v1/courses?**', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const items = [
      course,
      {
        ...course,
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        code: 'PY-101',
        title: 'Python cho người mới',
        priceAmount: 2000,
      },
    ];
    return route.fulfill({
      json: { items, page: 1, pageSize: Number(params.get('pageSize')), total: items.length },
    });
  });
  await page.route(`**/api/v1/courses/${courseId}`, (route) => route.fulfill({ json: detail }));
  await page.route(`**/api/v1/courses/${courseId}/classes?**`, (route) => {
    const params = new URL(route.request().url()).searchParams;
    const items = [openClass, fullClass].filter(
      (item) => !params.get('deliveryMode') || item.deliveryMode === params.get('deliveryMode'),
    );
    return route.fulfill({
      json: { items, page: Number(params.get('page')), pageSize: 10, total: items.length },
    });
  });
  await page.route(`**/api/v1/classes/${openClass.id}`, (route) =>
    route.fulfill({ json: timetable }),
  );
  await page.route(`**/api/v1/classes/${fullClass.id}`, (route) =>
    route.fulfill({ json: { ...fullClass, units: [] } }),
  );
}
