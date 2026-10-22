import type { Page } from '@playwright/test';
import { testUser } from './api-fixtures';
export const mentorIds = {
  class: '44444444-4444-4444-8444-444444444444',
  unit: '55555555-5555-4555-8555-555555555555',
  session: '66666666-6666-4666-8666-666666666666',
  material: '77777777-7777-4777-8777-777777777777',
  nextUnit: '99999999-9999-4999-8999-999999999999',
  file: '88888888-8888-4888-8888-888888888888',
};
const date = '2026-10-16T03:00:00Z';
const mentor = { ...testUser, role: 'MENTOR', displayName: 'Mentor Minh' };
export async function mockMentor(
  page: Page,
  options: {
    role?: string;
    expired?: boolean;
    conflict?: boolean;
    fileFailure?: boolean;
    filePending?: boolean;
    timetable?: boolean;
    rosterTable?: boolean;
    extraUnits?: boolean;
    materialState?: 'APPROVED' | 'PENDING_REVIEW';
    materialConflict?: boolean;
    savedAttachment?: boolean;
    sessionMaterials?: boolean;
  } = {},
) {
  const calls: {
    path: string;
    method: string;
    body: Record<string, unknown> | null;
    key?: string;
  }[] = [];
  const session = {
    sessionId: mentorIds.session,
    classId: mentorIds.class,
    classUnitId: mentorIds.unit,
    title: 'Buổi 1: Làm quen JavaScript',
    startsAt: date,
    endsAt: '2026-10-16T05:00:00Z',
    status: 'SCHEDULED',
    primaryMentor: { id: mentorIds.unit, displayName: 'Mentor chính' },
    effectiveMentor: { id: testUser.id, displayName: mentor.displayName },
    assignmentType: 'SUBSTITUTE',
    version: 1,
    actualStartedAt: null as string | null,
    actualEndedAt: null as string | null,
    editableUntil: '2026-10-17T16:59:59.999Z',
    asOf: date,
    timeZone: 'Asia/Ho_Chi_Minh',
  };
  const unit = {
    id: mentorIds.unit,
    classId: mentorIds.class,
    courseUnitId: mentorIds.material,
    title: 'JavaScript căn bản',
    position: 1,
    status: 'LOCKED',
    unlockAt: null as string | null,
  };
  const material = {
    id: mentorIds.material,
    courseUnitId: unit.courseUnitId,
    title: 'Bài viết đầu tiên',
    contentType: 'ARTICLE',
    description: null,
    sortOrder: 0,
    availableAt: null,
    sessionId: null,
    createdBy: testUser.id,
    createdInClassId: mentorIds.class,
    revision: 1,
    reviewStatus: options.materialState ?? 'DRAFT',
    approvedRevision: null,
    reviewedBy: null,
    reviewedAt: null,
    firstApprovedAt: options.materialState === 'APPROVED' ? date : null,
    rejectionReason: null,
    publishedAt: null,
    createdAt: date,
    updatedAt: date,
    canEdit: !options.materialState,
    file: null,
    contentHtml: '<h2>Nội dung bài viết</h2>',
    contentSchemaVersion: 1,
    inlineImages: [],
    attachments: options.savedAttachment
      ? [
          {
            id: mentorIds.file,
            originalFilename: 'Invoice-FCPCKEXP-0002.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 41943,
            kind: 'PDF',
          },
        ]
      : [],
  };
  let materials: Record<string, unknown>[] = [material];
  if (options.sessionMaterials)
    materials = [
      { ...material, sessionId: mentorIds.session },
      {
        ...material,
        id: mentorIds.file,
        title: 'Tài liệu thực hành HTML',
        contentType: 'FILE',
        sessionId: mentorIds.session,
        reviewStatus: 'APPROVED',
        canEdit: false,
        firstApprovedAt: date,
        contentHtml: null,
        file: {
          id: mentorIds.file,
          originalFilename: 'thuc-hanh.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 40960,
          kind: 'PDF',
        },
      },
      {
        ...material,
        id: mentorIds.nextUnit,
        title: 'Video làm quen biểu mẫu',
        contentType: 'VIDEO',
        sessionId: mentorIds.nextUnit,
        contentHtml: null,
        file: {
          id: mentorIds.file,
          originalFilename: 'bieu-mau.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 1048576,
          kind: 'VIDEO',
        },
      },
      { ...material, id: mentorIds.unit, title: 'Tài liệu dùng chung' },
      {
        ...material,
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        title: 'Nội dung cần kiểm tra buổi',
        sessionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      },
    ];
  let marks: string[] = [];
  const totals = () => ({
    eligible: marks.length,
    present: marks.filter((s) => s === 'PRESENT').length,
    absent: marks.filter((s) => s === 'ABSENT').length,
    unmarked: marks.filter((s) => s === 'UNMARKED').length,
  });
  const snapshot = () => ({
    ...session,
    permissions: {
      canStart: !options.expired && session.status === 'SCHEDULED',
      canEditAttendance: !options.expired && session.status !== 'SCHEDULED',
      canFinalize: !options.expired && session.status === 'IN_PROGRESS',
      canSyncRoster: !options.expired && session.status === 'IN_PROGRESS',
      canRecover: false,
      canViewAttendanceAudits: false,
    },
  });
  const paged = (items: unknown[], pageNumber = 1, total = items.length) => ({
    items,
    page: pageNumber,
    pageSize: 20,
    total,
  });
  await page.route('https://storage.example.test/**', (route) =>
    route.fulfill({ status: 200, body: '', headers: { 'Access-Control-Allow-Origin': '*' } }),
  );
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1/', '');
    const method = request.method();
    const body = request.postData() ? (request.postDataJSON() as Record<string, unknown>) : null;
    calls.push({ path, method, body, key: request.headers()['idempotency-key'] });
    const ok = (json: unknown) => route.fulfill({ json });
    if (path === 'auth/me') return ok({ ...mentor, role: options.role ?? mentor.role });
    if (path === 'mentor/schedule' && options.timetable) {
      const items = [
        {
          ...session,
          sessionId: mentorIds.session,
          title: 'JavaScript – Buổi sáng',
          startsAt: '2026-10-13T09:30:00+07:00',
          endsAt: '2026-10-13T11:45:00+07:00',
        },
        {
          ...session,
          sessionId: mentorIds.unit,
          title: 'Thực hành JavaScript',
          startsAt: '2026-10-16T09:30:00+07:00',
          endsAt: '2026-10-16T11:45:00+07:00',
        },
        {
          ...session,
          sessionId: mentorIds.class,
          title: 'Lập trình Web',
          startsAt: '2026-10-18T09:30:00+07:00',
          endsAt: '2026-10-18T11:45:00+07:00',
          assignmentType: 'PRIMARY',
        },
        {
          ...session,
          sessionId: mentorIds.file,
          title: 'Ôn tập cuối tuần',
          startsAt: '2026-10-18T09:30:00+07:00',
          endsAt: '2026-10-18T11:45:00+07:00',
          status: 'CANCELLED',
        },
        {
          ...session,
          sessionId: mentorIds.material,
          title: 'Workshop buổi chiều',
          startsAt: '2026-10-13T12:30:00+07:00',
          endsAt: '2026-10-13T14:45:00+07:00',
        },
      ].filter(
        (item) =>
          Date.parse(item.startsAt) >= Date.parse(url.searchParams.get('from') ?? '') &&
          Date.parse(item.startsAt) < Date.parse(url.searchParams.get('to') ?? ''),
      );
      return ok({
        ...paged(items),
        from: url.searchParams.get('from'),
        to: url.searchParams.get('to'),
        asOf: date,
        timeZone: 'Asia/Ho_Chi_Minh',
      });
    }
    if (path === 'mentor/schedule')
      return ok({
        ...paged([session]),
        from: date,
        to: '2026-10-24T03:00:00Z',
        asOf: date,
        timeZone: 'Asia/Ho_Chi_Minh',
      });
    if (path === 'mentor/classes')
      return ok(
        paged([
          {
            id: mentorIds.class,
            courseId: mentorIds.material,
            code: 'JS101-A',
            name: 'Lớp JavaScript tháng 10',
            startDate: '2026-10-16',
            endDate: '2026-12-16',
            deliveryMode: 'ONLINE',
            maxStudents: 20,
            availableSeats: 15,
            mentor: { id: testUser.id, displayName: mentor.displayName },
            status: 'IN_PROGRESS',
            assignmentType: 'PRIMARY',
            accessScope: 'CLASS',
          },
        ]),
      );
    if (path === `mentor/classes/${mentorIds.class}`)
      return ok({
        id: mentorIds.class,
        classId: mentorIds.class,
        code: 'JS101-A',
        name: 'Lớp JavaScript tháng 10',
        course: { id: mentorIds.material, title: 'JavaScript' },
        status: 'IN_PROGRESS',
        accessScope: 'CLASS',
        assignmentType: 'PRIMARY',
        readonly: false,
        capabilities: {
          readClass: true,
          readClassRoster: true,
          readClassReports: true,
          authorMaterials: true,
        },
        visibleUnitCount: 1,
        visibleSessionCount: 1,
        asOf: date,
        timeZone: 'Asia/Ho_Chi_Minh',
      });
    if (path.endsWith('/attendance-candidates'))
      return ok({
        ...paged([
          {
            enrollmentId: testUser.id,
            student: { id: testUser.id, displayName: 'Học viên An' },
            entryType: 'REGULAR',
            makeupPlacementId: null,
          },
        ]),
        provisional: true,
        asOf: date,
      });
    if (path.endsWith('/students') && options.rosterTable) {
      const students = Array.from({ length: 23 }, (_, index) => {
        const id = `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
        const status = ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED'][index % 4];
        return {
          enrollmentId: id,
          studentId: id,
          studentName: ['Nguyễn An', 'Trần Bình', 'Lê Châu'][index] ?? `Học viên ${index + 1}`,
          enrollmentStatus:
            status === 'PAID' ? 'ACTIVE' : status === 'CANCELLED' ? 'CANCELLED' : 'PENDING_PAYMENT',
          orderId: id,
          orderCode: String(index + 1000),
          orderStatus: status,
          paymentType: index % 2 ? 'PAYOS' : 'CASH',
          classAmount: 1000000,
          orderTotalAmount: 1000000,
          orderClassCount: 1,
          expiresAt: date,
          paidAt: status === 'PAID' ? date : null,
          canConfirmCash: false,
        };
      }).filter(
        (student) =>
          (!url.searchParams.get('orderStatus') ||
            student.orderStatus === url.searchParams.get('orderStatus')) &&
          (!url.searchParams.get('paymentType') ||
            student.paymentType === url.searchParams.get('paymentType')),
      );
      const currentPage = Number(url.searchParams.get('page') ?? 1);
      const size = Number(url.searchParams.get('pageSize') ?? 20);
      return ok({
        items: students.slice((currentPage - 1) * size, currentPage * size),
        page: currentPage,
        pageSize: size,
        total: students.length,
      });
    }
    if (path.endsWith('/students'))
      return ok(
        paged([
          {
            enrollmentId: testUser.id,
            enrollmentStatus: 'PENDING_PAYMENT',
            studentId: testUser.id,
            studentName: 'Học viên chờ kích hoạt',
            orderId: mentorIds.unit,
            orderCode: '12345',
            orderStatus: 'PENDING',
            paymentType: 'CASH',
            classAmount: 1000000,
            orderTotalAmount: 1000000,
            orderClassCount: 1,
            expiresAt: date,
            paidAt: null,
            canConfirmCash: true,
          },
        ]),
      );
    if (path.endsWith('/context'))
      return ok({
        session,
        roomName: 'Phòng 101',
        meetingUrl: 'https://meet.example.test/mindy',
        accessScope: 'SESSION',
      });
    if (path.startsWith('class-sessions/')) {
      if (method === 'GET')
        return ok({
          ...paged(
            marks.map((status, i) => ({
              attendanceId: i ? mentorIds.unit : mentorIds.material,
              enrollmentId: i ? mentorIds.file : testUser.id,
              entryType: 'REGULAR',
              makeupPlacementId: null,
              student: {
                id: i ? mentorIds.file : testUser.id,
                displayName: i ? 'Học viên mới' : 'Học viên An',
              },
              status,
              checkedInAt: status === 'PRESENT' ? date : null,
              admittedAt: date,
            })),
          ),
          session: snapshot(),
          totals: totals(),
          pendingPaymentCount: 1,
        });
      if (options.conflict) {
        session.version++;
        return route.fulfill({
          status: 409,
          json: { code: 'VERSION_CONFLICT', message: 'Changed' },
        });
      }
      session.version++;
      if (path.endsWith('/start')) {
        session.status = 'IN_PROGRESS';
        session.actualStartedAt = date;
        marks = ['UNMARKED'];
      }
      if (path.endsWith('/sync-roster')) marks.push('UNMARKED');
      if (method === 'PUT') {
        const records = body?.records as {
          enrollmentId: string;
          status: string;
        }[];
        for (const record of records) {
          const index = record.enrollmentId === testUser.id ? 0 : 1;
          marks[index] = record.status;
        }
      }
      if (path.endsWith('/finalize')) {
        session.status = 'COMPLETED';
        session.actualEndedAt = date;
        marks = marks.map((status) => (status === 'UNMARKED' ? 'ABSENT' : status));
      }
      return ok({
        session: snapshot(),
        totals: totals(),
        changedEnrollmentIds: [],
        changedMakeupPlacementIds: [],
      });
    }
    if (path === `mentor/classes/${mentorIds.class}/sessions`)
      return ok(
        paged(
          url.searchParams.get('unitId') === mentorIds.nextUnit
            ? []
            : [
                {
                  ...session,
                  capabilities: { readSessionContext: true, writeTeachingNotes: false },
                },
                ...(options.sessionMaterials
                  ? [
                      {
                        ...session,
                        sessionId: mentorIds.nextUnit,
                        title: 'Thực hành biểu mẫu',
                        startsAt: '2026-10-18T03:00:00Z',
                        endsAt: '2026-10-18T05:00:00Z',
                        status: 'SCHEDULED',
                        capabilities: { readSessionContext: true, writeTeachingNotes: false },
                      },
                    ]
                  : []),
              ],
        ),
      );
    if (path.endsWith('/units'))
      return ok(
        paged(
          options.extraUnits
            ? [
                unit,
                {
                  ...unit,
                  id: mentorIds.nextUnit,
                  position: 2,
                  title: 'State, sự kiện và render danh sách',
                },
              ]
            : [unit],
        ),
      );
    if (path === `mentor/classes/${mentorIds.class}/units/${mentorIds.nextUnit}`)
      return ok({
        ...unit,
        id: mentorIds.nextUnit,
        position: 2,
        title: 'State, sự kiện và render danh sách',
        sessions: [],
      });
    if (path.includes(`/units/${mentorIds.nextUnit}/materials`)) return ok(paged([]));
    if (path === `mentor/classes/${mentorIds.class}/units/${mentorIds.unit}`)
      return ok({
        ...unit,
        sessions: [],
      });
    if (path.endsWith('/release')) {
      unit.status = String(body?.status);
      unit.unlockAt = body?.unlockAt as string | null;
      return ok(unit);
    }
    if (path.endsWith('/sessions'))
      return ok(
        paged(
          path.includes(`/units/${mentorIds.nextUnit}/`)
            ? []
            : [
                {
                  id: mentorIds.session,
                  classUnitId: unit.id,
                  title: session.title,
                  sessionNumber: 1,
                  status: session.status,
                },
                ...(options.sessionMaterials
                  ? [
                      {
                        id: mentorIds.nextUnit,
                        classUnitId: unit.id,
                        title: 'Thực hành biểu mẫu',
                        sessionNumber: 2,
                        status: 'SCHEDULED',
                      },
                    ]
                  : []),
              ],
        ),
      );
    if (path.includes('/materials')) {
      if (path.endsWith('/access') || path.endsWith('/preview'))
        return ok({
          materialId: mentorIds.material,
          fileId: mentorIds.file,
          role: 'PRIMARY',
          revision: Number(url.searchParams.get('expectedRevision') ?? 1),
          url: 'https://storage.example.test/lesson.pdf',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        });
      const requestedId = path.split('/materials/')[1]?.split('/')[0];
      const currentIndex = materials.findIndex((item) => item.id === requestedId);
      if (method === 'DELETE') {
        materials = materials.filter((item) => item.id !== requestedId);
        return route.fulfill({ status: 204 });
      }
      if (path.endsWith('/submit')) {
        materials[currentIndex] = {
          ...materials[currentIndex],
          reviewStatus: 'PENDING_REVIEW',
          canEdit: false,
        };
        return ok(materials[currentIndex]);
      }
      if (method === 'PATCH' && options.materialConflict)
        return route.fulfill({
          status: 409,
          json: { code: 'MATERIAL_REVIEW_CONFLICT', message: 'Changed' },
        });
      if (method === 'POST' || method === 'PATCH') {
        const index =
          method === 'PATCH' ? currentIndex : options.sessionMaterials ? materials.length : 0;
        materials[index] = {
          ...(method === 'PATCH'
            ? materials[index]
            : {
                ...material,
                id: options.sessionMaterials ? 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' : material.id,
              }),
          ...body,
          revision: method === 'PATCH' ? 2 : 1,
        };
        if (typeof body?.contentText === 'string')
          materials[index].contentHtml =
            '<p>' +
            body.contentText
              .replaceAll('&', '&amp;')
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;')
              .replaceAll('\n', '<br>') +
            '</p>';
        if (materials[index].contentType !== 'ARTICLE')
          materials[index] = {
            ...materials[index],
            contentHtml: null,
            contentSchemaVersion: null,
            file: {
              id: mentorIds.file,
              originalFilename: 'lesson.pdf',
              mimeType: 'application/pdf',
              sizeBytes: 10,
              kind: 'PDF',
            },
          };
        return ok(materials[index]);
      }
      if (path.endsWith('/materials'))
        return ok(
          paged(
            materials.filter(
              (item) =>
                !url.searchParams.get('reviewStatus') ||
                item.reviewStatus === url.searchParams.get('reviewStatus'),
            ),
          ),
        );
      return ok(materials[currentIndex]);
    }
    const fileStatus = {
      id: mentorIds.file,
      status: options.fileFailure
        ? 'FAILED'
        : path.endsWith('/complete') || options.filePending
          ? 'PROCESSING'
          : 'READY',
      originalFilename: 'lesson.pdf',
      courseUnitId: unit.courseUnitId,
      declaredSizeBytes: 10,
      sizeBytes: 10,
      mimeType: 'application/pdf',
      kind: 'PDF',
      intentExpiresAt: '2026-12-01T00:00:00Z',
      readyAt: date,
      metadataStatus: 'READY',
      errorCode: null,
    };
    if (path === 'files/upload-intents')
      return ok({
        fileId: mentorIds.file,
        uploadUrl: 'https://storage.example.test/upload',
        requiredHeaders: { 'Content-Type': 'application/pdf' },
        uploadUrlExpiresAt: '2026-12-01T00:00:00Z',
        intentExpiresAt: '2026-12-01T00:00:00Z',
      });
    if (path.startsWith('files/')) return ok(fileStatus);
    return route.fulfill({ status: 404, json: { code: 'NOT_FOUND', message: path } });
  });
  return { calls };
}
