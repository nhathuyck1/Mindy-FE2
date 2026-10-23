import { expect, test } from '@playwright/test';
import { mockMentor, mentorIds } from './mentor-fixtures';
import { mockCommerce, classId } from './commerce-fixtures';
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const questionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const attemptId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const now = '2026-10-23T05:00:00Z';
const assignment = {
  id,
  sessionId: mentorIds.session,
  purpose: 'HOMEWORK',
  type: 'QUIZ',
  title: 'Ôn tập buổi 1',
  description: 'Chọn đáp án đúng.',
  maxScore: '100.00',
  dueAt: null,
  timeLimitMinutes: null,
  maxAttempts: 1,
  status: 'DRAFT',
  revision: 1,
  publishedAt: null,
};
const question = {
  id: questionId,
  position: 1,
  prompt: '1 + 1 bằng bao nhiêu?',
  options: [
    { label: 'A', text: '2' },
    { label: 'B', text: '3' },
    { label: 'C', text: '4' },
    { label: 'D', text: '5' },
  ],
};
test('Mentor creates a session homework draft, saves ABCD keys and publishes', async ({
  page,
}, info) => {
  await mockMentor(page);
  let saved = false;
  let published = false;
  await page.route('**/api/v1/mentor/**assignments**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (method === 'GET' && path.endsWith('/assignments'))
      return route.fulfill({
        json: {
          items: saved ? [{ ...assignment, status: published ? 'PUBLISHED' : 'DRAFT' }] : [],
          page: 1,
          pageSize: 100,
          total: saved ? 1 : 0,
        },
      });
    if (method === 'POST' && path.endsWith('/assignments')) {
      expect(route.request().postDataJSON().purpose).toBe('HOMEWORK');
      saved = true;
      return route.fulfill({ json: assignment });
    }
    if (path.endsWith('/questions')) {
      expect(route.request().postDataJSON().questions[0].correctOption).toBe('A');
      return route.fulfill({
        json: { ...assignment, revision: 2, questions: [{ ...question, correctOption: 'A' }] },
      });
    }
    if (path.endsWith('/publish')) {
      expect(route.request().postDataJSON().expectedRevision).toBe(2);
      published = true;
      return route.fulfill({
        json: {
          ...assignment,
          revision: 3,
          status: 'PUBLISHED',
          publishedAt: now,
          questions: [{ ...question, correctOption: 'A' }],
        },
      });
    }
    return route.fulfill({ json: assignment });
  });
  await page.goto(`/mentor/sessions/${mentorIds.session}`);
  await page.getByRole('button', { name: 'Giao bài mới' }).click();
  await page.getByLabel('Tiêu đề', { exact: true }).fill(assignment.title);
  await page.getByRole('button', { name: 'Tạo bản nháp', exact: true }).click();
  await page.getByLabel('Câu 1', { exact: true }).fill(question.prompt);
  for (const option of question.options)
    await page
      .getByRole('textbox', { name: `Câu 1 đáp án ${option.label}`, exact: true })
      .fill(option.text);
  await page.getByRole('button', { name: 'Lưu câu hỏi', exact: true }).click();
  await page.getByRole('button', { name: 'Phát hành cho học viên', exact: true }).click();
  await expect(
    page.getByText('Đã phát hành. Học viên thấy bài trong đúng buổi học này.'),
  ).toBeVisible();
  await page
    .getByText('Đã phát hành. Học viên thấy bài trong đúng buổi học này.')
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('mentor-homework.png'), fullPage: true });
  expect(published).toBe(true);
});
test('Student saves answers, submits once and sees the released result', async ({ page }, info) => {
  await mockCommerce(page);
  const mentor = { id: mentorIds.unit, displayName: 'Mentor Minh' };
  await page.route(`**/api/v1/me/classes/${classId}`, (route) =>
    route.fulfill({
      json: {
        id: classId,
        courseId: mentorIds.class,
        code: 'WEB-A',
        name: 'Lớp Web',
        startDate: '2026-10-01',
        endDate: '2026-12-01',
        deliveryMode: 'ONLINE',
        maxStudents: 20,
        availableSeats: 5,
        mentor,
        classStatus: 'IN_PROGRESS',
        enrollmentId: id,
        enrollmentStatus: 'ACTIVE',
        enrolledAt: now,
        accessMode: 'FULL',
        meetingUrl: null,
        units: [
          {
            id: mentorIds.unit,
            position: 1,
            title: 'Chương 1',
            sessions: [
              {
                id: mentorIds.session,
                sessionNumber: 1,
                title: 'Buổi 1',
                startsAt: now,
                endsAt: '2026-10-23T07:00:00Z',
                roomName: null,
                status: 'COMPLETED',
              },
            ],
          },
        ],
      },
    }),
  );
  await page.route('**/api/v1/me/classes/*/units/*/materials?**', (route) =>
    route.fulfill({ json: { items: [], page: 1, pageSize: 100, total: 0, asOf: now } }),
  );
  await page.route('**/api/v1/me/classes/*/assignments?**', (route) => {
    expect(new URL(route.request().url()).searchParams.get('sessionId')).toBe(mentorIds.session);
    return route.fulfill({
      json: {
        items: [{ ...assignment, status: 'PUBLISHED', publishedAt: now }],
        page: 1,
        pageSize: 100,
        total: 1,
      },
    });
  });
  let version = 1;
  const saveKeys: string[] = [];
  let answers: { questionId: string; selectedOption: string }[] = [];
  let graded = false;
  const response = () => ({
    attemptId,
    assignmentId: id,
    status: graded ? 'GRADED' : 'IN_PROGRESS',
    version,
    startedAt: now,
    expiresAt: null,
    submittedAt: graded ? now : null,
    submissionSource: null,
    serverNow: now,
    totalQuestions: 1,
    answeredCount: answers.length,
    questions: [question],
    answers,
    result: graded
      ? {
          totalQuestions: 1,
          answeredCount: 1,
          correctCount: 1,
          wrongCount: 0,
          score: '100.00',
          maxScore: '100.00',
          results: [{ questionId, selectedOption: 'A', correctOption: 'A', isCorrect: true }],
        }
      : null,
    retryAfterSeconds: null,
  });
  await page.route('**/api/v1/me/assignments/*/start', (route) => {
    expect(route.request().headers()['idempotency-key']).toBeTruthy();
    return route.fulfill({ json: response() });
  });
  await page.route('**/api/v1/me/assignment-submissions/**', (route) => {
    if (route.request().method() !== 'GET') {
      const body = route.request().postDataJSON();
      expect(body.expectedVersion).toBe(version);
      expect(route.request().headers()['idempotency-key']).toBeTruthy();
      if (route.request().url().endsWith('/answers')) {
        saveKeys.push(route.request().headers()['idempotency-key']);
        if (saveKeys.length === 1)
          return route.fulfill({
            status: 503,
            json: { code: 'API_UNAVAILABLE', message: 'Unavailable' },
          });
        expect(saveKeys[1]).toBe(saveKeys[0]);
      }
      answers = body.answers;
      version++;
      graded = route.request().url().endsWith('/submit');
    }
    return route.fulfill({ json: response() });
  });
  await page.goto(`/user/materials/${classId}`);
  await page.getByRole('button', { name: 'Xem yêu cầu / làm bài' }).click();
  await expect(page.getByText('1 + 1 bằng bao nhiêu?')).toHaveCount(0);
  await page.getByRole('button', { name: 'Bắt đầu / tiếp tục bài làm' }).click();
  await page.getByRole('radio', { name: 'A. 2', exact: true }).check();
  await page.getByRole('button', { name: 'Lưu đáp án', exact: true }).click();
  await expect(page.getByText(/Chưa hoàn tất yêu cầu/)).toBeVisible();
  await expect(page.getByRole('radio', { name: 'A. 2', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Lưu đáp án', exact: true }).click();
  await expect(page.getByText('Đã lưu đáp án. Bạn có thể tiếp tục làm bài.')).toBeVisible();
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kết quả: 100.00/100.00' })).toBeVisible();
  await page.getByRole('heading', { name: 'Kết quả: 100.00/100.00' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('student-homework.png'), fullPage: true });
});
