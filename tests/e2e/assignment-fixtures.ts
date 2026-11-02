import type { Page } from '@playwright/test';
import * as dto from '../../src/features/assignments/schemas/assignment-contracts';
import * as f from '../fixtures/assignment-data';
import { mockMentor } from './mentor-fixtures';
import { mockHomepageApi, testUser } from './api-fixtures';

export async function mockAssignments(
  page: Page,
  options: {
    mentor?: boolean;
    zip?: boolean;
    flagOff?: boolean;
    draft?: boolean;
    timed?: boolean;
    expired?: boolean;
    conflict?: boolean;
    slowSave?: boolean;
    historical?: boolean;
    attachUnknown?: boolean;
  } = {},
) {
  if (options.mentor) await mockMentor(page);
  else await mockHomepageApi(page);
  const calls: {
    path: string;
    method: string;
    body: Record<string, unknown> | null;
    key: string | undefined;
  }[] = [];
  let assignment = dto.mentorAssignmentSchema.parse({
    ...f.assignment,
    status: options.draft && (!options.zip || options.mentor) ? 'DRAFT' : 'PUBLISHED',
    ...(options.zip
      ? {
          type: 'ZIP',
          title: 'Bài thực hành vòng lặp',
          description: f.zip.snapshot.description,
          maxAttempts: 3,
        }
      : {}),
    capabilities: {
      zipMutationsEnabled: !options.flagOff,
      instructionFilesEnabled: !options.flagOff,
    },
  });
  let attempt = dto.attemptSchema.parse({
    ...f.attempt,
    expiresAt: options.expired
      ? '2026-11-02T02:59:00.000Z'
      : options.timed
        ? '2026-11-02T03:15:00.000Z'
        : null,
  });
  let zip = dto.mentorZipSchema.parse({
    ...f.zip,
    ...(options.draft
      ? {
          status: 'DRAFT',
          version: 1,
          attemptNumber: null,
          submittedAt: null,
          snapshot: null,
          file: null,
        }
      : {}),
  });
  let file = dto.fileStatusSchema.parse({ ...f.fileStatus, status: 'PENDING_UPLOAD' });
  let attachCount = 0;
  const revisions: dto.MentorZipSubmission['grade'][] = [];
  const audits: {
    action: string;
    version: number;
    actorId: string;
    reason: string | null;
    createdAt: string;
  }[] = [];
  await page.route('https://storage.example.test/**', (route) =>
    route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, body: '' }),
  );
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1/', '');
    const method = request.method();
    if (path === 'auth/me')
      return route.fulfill({ json: { ...testUser, role: options.mentor ? 'MENTOR' : 'STUDENT' } });
    if (path === 'me/cart') return route.fulfill({ json: { items: [], totalAmount: 0 } });
    if (path === `me/classes/${f.ids.class}`)
      return route.fulfill({
        json: {
          id: f.ids.class,
          courseId: f.ids.assignment,
          code: 'WEB-A',
          name: 'Lập trình Web',
          startDate: '2026-10-01',
          endDate: '2027-01-01',
          deliveryMode: 'ONLINE',
          maxStudents: 20,
          availableSeats: 5,
          mentor: { id: f.ids.student, displayName: 'Mentor Minh' },
          classStatus: 'IN_PROGRESS',
          enrollmentId: f.ids.file,
          enrollmentStatus: 'ACTIVE',
          enrolledAt: f.now,
          accessMode: 'FULL',
          meetingUrl: null,
          units: [
            {
              id: f.ids.question,
              position: 1,
              title: 'Chương 1',
              sessions: [
                {
                  id: f.ids.session,
                  sessionNumber: 1,
                  title: 'Buổi 1',
                  startsAt: f.now,
                  endsAt: '2026-11-02T05:00:00.000Z',
                  roomName: null,
                  status: 'SCHEDULED',
                },
              ],
            },
          ],
        },
      });
    const body = request.postData() ? (request.postDataJSON() as Record<string, unknown>) : null;
    const isAssignment =
      /assignments|assignment-submissions|zip-submissions|assignment-files|assignment-metrics/.test(
        path,
      );
    if (!isAssignment) return route.fallback();
    calls.push({ path, method, body, key: request.headers()['idempotency-key'] });
    const json = (value: unknown, status = 200) => route.fulfill({ status, json: value });
    if (path.endsWith('/assignment-metrics')) return json(f.metrics);
    if (path.endsWith('/roster'))
      return json({
        ...f.pageOf([
          {
            studentId: f.ids.student,
            enrollmentId: f.ids.file,
            displayName: 'Nguyễn An',
            submissionId: f.ids.submission,
            submitted: true,
            graded: zip.gradeVersion > 0,
            released: zip.releasedVersion !== null,
            missing: false,
          },
        ]),
        denominator: 'CURRENT_ACTIVE_ENTITLEMENTS',
      });
    if (path.endsWith('/grade/history'))
      return json({
        ...f.pageOf(
          revisions
            .filter((v) => v !== null)
            .map((v) => ({ ...v, actorId: f.ids.student, reason: null, createdAt: f.now })),
        ),
        audits,
        totalAudits: audits.length,
      });
    if (path.endsWith('/submissions') && method === 'GET')
      return json(f.pageOf(options.zip && zip.status === 'SUBMITTED' ? [zip] : []));
    if (path.endsWith('/assignments')) {
      if (method === 'POST') {
        assignment = dto.mentorAssignmentSchema.parse({ ...assignment, ...body });
        return json(assignment, 201);
      }
      const matches =
        !url.searchParams.get('type') || url.searchParams.get('type') === assignment.type;
      return json(f.pageOf(matches ? [assignment] : []));
    }
    if (
      path === `mentor/assignments/${f.ids.assignment}` ||
      path === `me/assignments/${f.ids.assignment}`
    ) {
      if (options.historical && path.startsWith('me/'))
        return json({ code: 'ASSIGNMENT_NOT_FOUND', message: 'Không còn quyền lớp.' }, 404);
      if (method === 'DELETE') return route.fulfill({ status: 204 });
      if (method === 'PATCH')
        assignment = dto.mentorAssignmentSchema.parse({
          ...assignment,
          ...body,
          revision: assignment.revision + 1,
        });
      return json(assignment);
    }
    if (path.endsWith('/questions')) {
      if (options.conflict)
        return json({ code: 'ASSIGNMENT_VERSION_CONFLICT', message: 'Bản mới.' }, 409);
      const questions = dto.questionsInputSchema.parse(body).questions.map((q, i) => ({
        ...q,
        id: q.id ?? (i === 0 ? f.ids.question : crypto.randomUUID()),
        position: i,
      }));
      assignment = { ...assignment, questions, revision: assignment.revision + 1 };
      return json(assignment);
    }
    if (path.endsWith('/publish')) {
      assignment = { ...assignment, status: 'PUBLISHED', revision: assignment.revision + 1 };
      return json(assignment);
    }
    if (path.endsWith('/archive')) {
      assignment = { ...assignment, status: 'ARCHIVED', revision: assignment.revision + 1 };
      return json(assignment);
    }
    if (path.endsWith('/extend')) {
      assignment = {
        ...assignment,
        ...dto.extendInputSchema.parse(body),
        revision: assignment.revision + 1,
      };
      return json({
        revision: assignment.revision,
        dueAt: assignment.dueAt,
        maxAttempts: assignment.maxAttempts,
      });
    }
    if (path.endsWith('/instruction-files')) {
      const input = dto.instructionInputSchema.parse(body);
      assignment = {
        ...assignment,
        revision: assignment.revision + 1,
        instructionFiles: input.fileIds.map((id, i) => ({
          ...f.file,
          id,
          originalFilename: 'de-bai.pdf',
          position: i,
        })),
      };
      return json({ revision: assignment.revision, instructionFiles: assignment.instructionFiles });
    }
    if (path.endsWith('/upload-intents') || path.endsWith('/instruction-upload-intents')) {
      file = {
        ...file,
        status: 'PENDING_UPLOAD',
        version: 1,
        purpose: path.includes('instruction') ? 'INSTRUCTION' : 'SUBMISSION',
      };
      return json(
        {
          ...file,
          fileId: file.id,
          uploadUrl: 'https://storage.example.test/upload',
          requiredHeaders: { 'Content-Type': 'application/zip' },
          uploadUrlExpiresAt: assignment.dueAt,
          intentExpiresAt: assignment.dueAt,
        },
        201,
      );
    }
    if (path.endsWith('/complete')) {
      file = { ...file, status: 'READY', version: 2 };
      return json(file);
    }
    if (path === `assignment-files/${f.ids.file}`) return json(file);
    if (path.endsWith('/download'))
      return json({ url: 'https://storage.example.test/download', expiresAt: f.assignment.dueAt });
    if (path.endsWith('/start')) return json(attempt, 201);
    if (path.includes('/assignment-submissions/')) {
      if (method !== 'GET') {
        if (options.slowSave && path.endsWith('/answers'))
          await new Promise((resolve) => setTimeout(resolve, 1200));
        if (options.conflict) return json({ code: 'VERSION_CONFLICT', message: 'Bản mới.' }, 409);
        const input = dto.answersInputSchema.parse(body);
        attempt = {
          ...attempt,
          version: attempt.version + 1,
          answers: input.answers,
          answeredCount: input.answers.length,
        };
        if (path.endsWith('/submit'))
          attempt = { ...attempt, status: 'GRADED', submittedAt: f.now, result: f.result };
      }
      if (options.expired && path.endsWith('/result'))
        attempt = {
          ...attempt,
          status: 'GRADED',
          result: { ...f.result, score: '0.00', correctCount: 0 },
        };
      return json(attempt);
    }
    if (path.endsWith('/zip-submissions') && method === 'POST') return json(zip, 201);
    if (path.includes('/zip-submissions/')) {
      if (path.endsWith('/file')) {
        zip = { ...zip, file: f.file, version: zip.version + 1 };
        if (options.attachUnknown && ++attachCount === 1) return route.abort('failed');
        return json(zip);
      }
      if (path.endsWith('/submit')) {
        zip = {
          ...zip,
          status: 'SUBMITTED',
          attemptNumber: 1,
          submittedAt: f.now,
          snapshot: f.zip.snapshot,
          version: zip.version + 1,
        };
        return json(zip);
      }
      if (path.endsWith('/grade/release')) {
        zip = { ...zip, releasedVersion: zip.gradeVersion };
        audits.push({
          action: 'RELEASE',
          version: zip.gradeVersion,
          actorId: f.ids.student,
          reason: null,
          createdAt: f.now,
        });
        return json(zip);
      }
      if (path.endsWith('/grade')) {
        const input = dto.gradeInputSchema.parse(body);
        zip = {
          ...zip,
          grade: { version: zip.gradeVersion + 1, score: input.score, feedback: input.feedback },
          gradeVersion: zip.gradeVersion + 1,
        };
        revisions.push(zip.grade);
        audits.push({
          action: 'GRADE',
          version: zip.gradeVersion,
          actorId: f.ids.student,
          reason: input.reason ?? null,
          createdAt: f.now,
        });
        return json(zip);
      }
      return json(zip);
    }
    return json({ code: 'NOT_FOUND', message: 'Fixture chưa có endpoint.' }, 404);
  });
  return { calls };
}
