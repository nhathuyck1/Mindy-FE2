import type { Page } from '@playwright/test';
import { mockMentor, mentorIds } from './mentor-fixtures';
import { testUser } from './api-fixtures';

export const workspaceDate = '2026-10-22T03:00:00.000Z';
export const leaveId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const person = { id: testUser.id, displayName: 'Học viên An' };
export async function mockMentorWorkspace(
  page: Page,
  options: {
    substitute?: boolean;
    noteConflict?: boolean;
    noteTimeout?: boolean;
    leaveConflict?: boolean;
    classStatus?: 'COMPLETED' | 'CANCELLED';
  } = {},
) {
  await mockMentor(page);
  const calls: {
    path: string;
    method: string;
    query: string;
    body: Record<string, unknown> | null;
    key?: string;
  }[] = [];
  const prefix = `mentor/classes/${mentorIds.class}`;
  const session = {
    sessionId: mentorIds.session,
    classId: mentorIds.class,
    classUnitId: mentorIds.unit,
    title: 'Buổi vòng lặp',
    startsAt: '2026-10-26T03:00:00.000Z',
    endsAt: '2026-10-26T05:00:00.000Z',
    status: options.classStatus === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED',
    version: 1,
    primaryMentor: person,
    effectiveMentor: person,
    assignmentType: 'PRIMARY',
    actualStartedAt: null as string | null,
    actualEndedAt: null as string | null,
    editableUntil: '2026-11-30T16:59:59.999Z',
    makeupForSessionId: null,
    makeupRootSessionId: null,
    asOf: workspaceDate,
    timeZone: 'Asia/Ho_Chi_Minh',
  };
  const source = { ...session, sessionId: mentorIds.nextUnit, title: 'Buổi xin nghỉ', version: 4 };
  const snapshot = () => ({
    ...session,
    permissions: {
      canStart: session.status === 'SCHEDULED',
      canEditAttendance: session.status !== 'SCHEDULED',
      canFinalize: session.status === 'IN_PROGRESS',
      canSyncRoster: session.status === 'IN_PROGRESS',
      canRecover: false,
      canViewAttendanceAudits: false,
    },
  });
  const paged = (items: unknown[], url: URL, total = items.length) => ({
    items,
    total,
    page: Number(url.searchParams.get('page') ?? 1),
    pageSize: Number(url.searchParams.get('pageSize') ?? 20),
  });
  let regular = 'UNMARKED';
  let guest = 'UNMARKED';
  let noteVersion = 0;
  let noteContent = '';
  let noteNextSteps = '';
  let meetingUrl: string | null = 'https://meet.example.test/old';
  let conflict = options.noteConflict;
  let timeout = options.noteTimeout;
  let leaveStatus = 'PENDING';
  let leaveVersion = 1;
  let created = false;
  const totals = () => ({
    eligible: 41,
    present: [regular, guest].filter((v) => v === 'PRESENT').length,
    absent: [regular, guest].filter((v) => v === 'ABSENT').length,
    unmarked: [regular, guest].filter((v) => v === 'UNMARKED').length,
  });
  const write = () => ({
    session: snapshot(),
    totals: totals(),
    changedEnrollmentIds: [testUser.id],
    changedMakeupPlacementIds: [mentorIds.file],
  });
  const note = () => ({
    sessionId: session.sessionId,
    version: noteVersion,
    note:
      noteVersion === 0
        ? null
        : {
            content: noteContent,
            nextSteps: noteNextSteps,
            version: noteVersion,
            createdBy: testUser.id,
            updatedBy: testUser.id,
            createdAt: workspaceDate,
            updatedAt: workspaceDate,
          },
  });
  const leave = (url: URL) => ({
    id: leaveId,
    mentorId: testUser.id,
    fromDate: '2026-10-26',
    toDate: '2026-10-26',
    period: 'FULL_DAY',
    reason: 'Việc gia đình',
    status: leaveStatus,
    version: leaveVersion,
    submittedAt: workspaceDate,
    expiresAt: source.startsAt,
    itemCount: 1,
    page: Number(url.searchParams.get('page') ?? 1),
    pageSize: 20,
    items: [
      {
        sourceSessionId: source.sessionId,
        classId: mentorIds.class,
        sourceVersion: 4,
        sourceStartsAt: source.startsAt,
        sourceEndsAt: source.endsAt,
        startsAt: '2026-10-28T03:00:00.000Z',
        endsAt: '2026-10-28T05:00:00.000Z',
        replacementSessionId: null,
      },
    ],
    studentConflictCount: 0,
    classExtensions: [{ classId: mentorIds.class, endDate: '2026-12-16' }],
    review: null,
    asOf: workspaceDate,
    timeZone: session.timeZone,
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1/', '');
    const method = request.method();
    const body = request.postData() ? (request.postDataJSON() as Record<string, unknown>) : null;
    calls.push({
      path,
      method,
      query: url.search,
      body,
      key: request.headers()['idempotency-key'],
    });
    const ok = (json: unknown, status = 200) => route.fulfill({ status, json });
    if (path === prefix)
      return ok({
        id: mentorIds.class,
        classId: mentorIds.class,
        code: 'JS101-A',
        name: 'Lớp JavaScript tháng 10',
        course: { id: mentorIds.material, title: 'JavaScript' },
        status: options.classStatus ?? 'IN_PROGRESS',
        accessScope: options.substitute ? 'SESSION' : 'CLASS',
        assignmentType: options.substitute ? 'SUBSTITUTE' : 'PRIMARY',
        readonly: Boolean(options.classStatus),
        capabilities: {
          readClass: true,
          readClassRoster: !options.substitute,
          readClassReports: !options.substitute,
          authorMaterials: !options.substitute,
        },
        visibleUnitCount: 1,
        visibleSessionCount: 1,
        asOf: workspaceDate,
        timeZone: session.timeZone,
      });
    if (path === `${prefix}/sessions`)
      return ok(
        paged(
          [
            {
              ...session,
              capabilities: {
                readSessionContext: true,
                writeTeachingNotes: session.status !== 'SCHEDULED',
              },
            },
          ],
          url,
        ),
      );
    const counts = {
      present: 0,
      absent: 0,
      unmarked: 1,
      excluded: 1,
      makeupPending: 1,
      finalizedEligibleCount: 0,
      rate: null,
    };
    const metadata = {
      classId: mentorIds.class,
      asOf: workspaceDate,
      timeZone: session.timeZone,
      readonly: false,
    };
    if (path === `${prefix}/attendance-summary`)
      return ok({
        ...metadata,
        ...paged([{ ...counts, enrollmentId: testUser.id, student: person }], url),
      });
    if (path.endsWith(`/students/${testUser.id}/attendance-summary`))
      return ok({
        ...metadata,
        ...counts,
        present: 1,
        finalizedEligibleCount: 1,
        rate: 100,
        aggregationScope: 'STUDENT_CLASS_HISTORY',
      });
    if (path.endsWith(`/students/${testUser.id}/attendance`))
      return ok({
        ...metadata,
        ...paged(
          [
            {
              sessionId: session.sessionId,
              enrollmentId: testUser.id,
              rootSessionId: session.sessionId,
              title: 'Buổi có học bù',
              startsAt: session.startsAt,
              endsAt: session.endsAt,
              sessionStatus: 'COMPLETED',
              attendanceStatus: 'ABSENT',
              attendanceApplicability: 'MAKEUP_CREDITED',
              excluded: false,
              effectiveMentor: person,
              assignmentType: 'PRIMARY',
              makeupForSessionId: null,
              makeupRootSessionId: null,
              makeupPlacementId: mentorIds.file,
              creditSessionId: mentorIds.nextUnit,
              creditedAttendanceStatus: 'PRESENT',
            },
          ],
          url,
        ),
      });
    const progressMetadata = {
      completionPolicy: 'UNDEFINED',
      policyVersion: null,
      assignmentSummary: { availability: 'NOT_IMPLEMENTED', counts: null },
      readonly: true,
      asOf: workspaceDate,
      timeZone: session.timeZone,
    };
    if (path === `${prefix}/progress`)
      return ok({
        ...progressMetadata,
        ...paged(
          [
            {
              enrollmentId: testUser.id,
              studentId: testUser.id,
              displayName: person.displayName,
              storedUnitCount: 1,
              untrackedUnitCount: 1,
              invalidStoredUnitCount: 1,
            },
          ],
          url,
        ),
      });
    if (path.endsWith(`/students/${testUser.id}/progress`))
      return ok({
        ...progressMetadata,
        ...paged(
          [
            {
              enrollmentId: testUser.id,
              classUnitId: mentorIds.unit,
              trackingStatus: 'STORED',
              status: 'NOT_STARTED',
              progressPercent: '0.00',
              completedAt: null,
              dataQuality: 'VALID',
            },
            {
              enrollmentId: testUser.id,
              classUnitId: mentorIds.nextUnit,
              trackingStatus: 'UNTRACKED',
              status: null,
              progressPercent: null,
              completedAt: null,
              dataQuality: 'UNTRACKED',
            },
            {
              enrollmentId: mentorIds.material,
              classUnitId: mentorIds.unit,
              trackingStatus: 'STORED',
              status: 'NOT_STARTED',
              progressPercent: null,
              completedAt: null,
              dataQuality: 'INVALID_PERCENT',
            },
          ],
          url,
        ),
      });
    if (path === `class-sessions/${session.sessionId}/context`)
      return ok({ session, roomName: 'Phòng 101', meetingUrl, accessScope: 'SESSION' });
    if (path === `class-sessions/${session.sessionId}/attendance-candidates`)
      return ok({
        ...paged(
          [
            {
              enrollmentId: testUser.id,
              student: person,
              entryType: 'REGULAR',
              makeupPlacementId: null,
            },
            {
              enrollmentId: mentorIds.material,
              student: { id: mentorIds.material, displayName: 'Học viên học bù' },
              entryType: 'MAKEUP',
              makeupPlacementId: mentorIds.file,
            },
          ],
          url,
          41,
        ),
        provisional: true,
        asOf: workspaceDate,
      });
    if (path === `class-sessions/${session.sessionId}/teaching-notes`) {
      if (method === 'GET') return ok(note());
      if (conflict) {
        conflict = false;
        noteVersion = 1;
        noteContent = 'Nội dung trên máy chủ';
        return ok({ code: 'TEACHING_VERSION_CONFLICT', message: 'Version changed' }, 409);
      }
      if (timeout) {
        timeout = false;
        return ok({ code: 'API_UNAVAILABLE', message: 'Mất kết nối' }, 503);
      }
      noteVersion++;
      noteContent = String(body?.content);
      noteNextSteps = String(body?.nextSteps);
      return ok(note());
    }
    if (path === `mentor/class-sessions/${session.sessionId}/meeting-url`) {
      meetingUrl = body?.meetingUrl === null ? null : String(body?.meetingUrl);
      session.version++;
      return ok({
        sessionId: session.sessionId,
        classId: session.classId,
        meetingUrl,
        effectiveMeetingUrl: meetingUrl ?? 'https://meet.example.test/class',
        version: session.version,
      });
    }
    if (path.startsWith(`class-sessions/${session.sessionId}/`)) {
      if (method === 'GET')
        return ok({
          ...paged(
            session.status === 'SCHEDULED'
              ? []
              : [
                  {
                    attendanceId: mentorIds.material,
                    enrollmentId: testUser.id,
                    entryType: 'REGULAR',
                    makeupPlacementId: null,
                    student: person,
                    status: regular,
                    checkedInAt: null,
                    admittedAt: workspaceDate,
                  },
                  {
                    attendanceId: mentorIds.file,
                    enrollmentId: mentorIds.material,
                    entryType: 'MAKEUP',
                    makeupPlacementId: mentorIds.file,
                    student: { id: mentorIds.material, displayName: 'Học viên học bù' },
                    status: guest,
                    checkedInAt: null,
                    admittedAt: workspaceDate,
                  },
                ],
            url,
            session.status === 'SCHEDULED' ? 0 : 41,
          ),
          session: snapshot(),
          totals: totals(),
          pendingPaymentCount: 1,
        });
      session.version++;
      if (path.endsWith('/start')) {
        session.status = 'IN_PROGRESS';
        session.actualStartedAt = workspaceDate;
      }
      if (path.endsWith('/attendance/bulk')) {
        regular = guest = body?.checked ? 'PRESENT' : 'ABSENT';
      }
      if (path.endsWith('/attendance')) {
        const records = body?.records as { status: string }[];
        const guests = body?.guestRecords as { status: string }[] | undefined;
        if (records.length) regular = records[0].status;
        if (guests?.length) guest = guests[0].status;
      }
      if (path.endsWith('/finalize')) {
        session.status = 'COMPLETED';
        session.actualEndedAt = workspaceDate;
      }
      return ok(write());
    }
    if (path === 'mentor/leave-requests/preview')
      return ok({
        affectedSessions: [source],
        sourceVersions: [{ sessionId: source.sessionId, version: source.version }],
        noticeEligible: true,
        noticeDeadline: '2026-10-24T17:00:00.000Z',
        asOf: workspaceDate,
        timeZone: session.timeZone,
      });
    if (path === 'mentor/leave-requests/makeup-slots')
      return ok({
        slots: [{ startsAt: '2026-10-28T03:00:00.000Z', endsAt: '2026-10-28T05:00:00.000Z' }],
        sessionVersion: source.version,
        asOf: workspaceDate,
        timeZone: session.timeZone,
      });
    if (path === 'mentor/leave-requests') {
      if (method === 'GET')
        return ok({
          ...paged(created ? [{ ...leave(url), items: [] }] : [], url),
          asOf: workspaceDate,
        });
      if (options.leaveConflict)
        return ok({ code: 'LEAVE_REQUEST_STALE', message: 'Stale source' }, 409);
      created = true;
      return ok(leave(url), 201);
    }
    if (path === `mentor/leave-requests/${leaveId}`) return ok(leave(url));
    if (path === `mentor/leave-requests/${leaveId}/withdraw`) {
      leaveStatus = 'WITHDRAWN';
      leaveVersion++;
      return ok(leave(url));
    }
    return route.fallback();
  });
  return { calls, session };
}
