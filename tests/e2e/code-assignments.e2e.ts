import { expect, test } from '@playwright/test';
import type {
  StudentCodeAssignment,
  Submission,
} from '@/features/code-assignments/schemas/code-contracts';
import { mockHomepageApi, testUser } from './api-fixtures';

const assignmentId = '77777777-7777-4777-8777-777777777777';
const submissionId = '88888888-8888-4888-8888-888888888888';
const solution = 'function sum(a, b) { return a + b; }';

test('student saves, runs custom input, submits and receives the grade without reloading', async ({
  page,
}, testInfo) => {
  await mockHomepageApi(page);
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: testUser }));
  const now = new Date().toISOString();
  const view: StudentCodeAssignment = {
    assignmentId,
    sessionId: '66666666-6666-4666-8666-666666666666',
    title: 'Cộng hai số',
    description: '',
    purpose: 'HOMEWORK',
    status: 'PUBLISHED',
    maxScore: '10.00',
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    serverNow: now,
    deadlinePassed: false,
    maxAttempts: 3,
    attemptsUsed: 0,
    attemptsRemaining: 3,
    bestScore: null,
    bestSubmissionId: null,
    inFlightSubmissionId: null,
    canSubmit: true,
    problem: {
      statementMd: 'Trả về tổng của a và b.',
      constraintsMd: '',
      difficulty: 'EASY',
      signature: {
        functionName: 'sum',
        params: [
          { name: 'a', type: 'int' },
          { name: 'b', type: 'int' },
        ],
        returnType: 'int',
      },
      compareMode: 'EXACT',
      scoringMode: 'PER_TEST',
      cpuTimeLimitMs: 1000,
      memoryLimitMb: 128,
    },
    languages: [
      {
        key: 'javascript',
        displayName: 'JavaScript',
        runtimeVersion: 'Node.js 22',
        editorMode: 'javascript',
        starterCode: 'function sum(a, b) {}',
      },
    ],
    samples: [
      { position: 1, inputArgs: [1, 2], expected: 3, display: 'a = 1, b = 2', explanationMd: null },
    ],
    hiddenTestCount: 1,
  };
  const submission: Submission = {
    id: submissionId,
    assignmentId,
    attemptNumber: 1,
    languageKey: 'javascript',
    runtimeVersion: null,
    status: 'QUEUED',
    verdict: null,
    countsAsAttempt: true,
    passedCount: null,
    totalCount: null,
    score: null,
    maxScore: '10.00',
    compileOutput: null,
    maxTimeMs: null,
    maxMemoryKb: null,
    submittedAt: now,
    judgedAt: null,
    voidedReason: null,
    retryAfterMs: 1500,
  };
  let draft = {
    languageKey: 'javascript',
    sourceCode: view.languages[0].starterCode,
    version: 0,
    updatedAt: null as string | null,
  };
  let submitted = false;
  let detailReads = 0;
  let idempotencyKey: string | undefined;
  await page.route('**/api/v1/me/assignments/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path === `/api/v1/me/assignments/${assignmentId}`)
      return route.fulfill({
        json: {
          id: assignmentId,
          sessionId: view.sessionId,
          type: 'CODE',
          purpose: view.purpose,
          title: view.title,
          description: view.description,
          maxScore: view.maxScore,
          dueAt: view.dueAt,
          timeLimitMinutes: null,
          maxAttempts: view.maxAttempts,
          status: view.status,
          revision: 1,
          publishedAt: now,
          instructionFiles: [],
          capabilities: { zipMutationsEnabled: false, instructionFilesEnabled: false },
        },
      });
    if (path.endsWith('/code')) return route.fulfill({ json: view });
    if (path.includes('/code-drafts/')) {
      if (req.method() === 'PUT') {
        expect(req.postDataJSON().expectedVersion).toBe(draft.version);
        draft = {
          ...draft,
          sourceCode: req.postDataJSON().sourceCode,
          version: draft.version + 1,
          updatedAt: now,
        };
      }
      return route.fulfill({ json: draft });
    }
    if (path.endsWith('/code-runs')) {
      expect(req.postDataJSON()).toMatchObject({ sourceCode: solution, customArgs: [4, 5] });
      return route.fulfill({
        json: {
          compileStatus: 'OK',
          compileOutput: '',
          runtimeVersion: 'Node.js 22',
          tests: [
            {
              kind: 'CUSTOM',
              position: null,
              display: 'a = 4, b = 5',
              actual: 9,
              status: 'COMPLETED',
              console: '',
              stderr: '',
              timeMs: 2,
              memoryKb: 1024,
            },
          ],
        },
      });
    }
    if (path.endsWith('/code-submissions')) {
      if (req.method() === 'POST') {
        expect(req.postDataJSON().sourceCode).toBe(solution);
        idempotencyKey = req.headers()['idempotency-key'];
        submitted = true;
        Object.assign(view, {
          inFlightSubmissionId: submissionId,
          canSubmit: false,
          attemptsUsed: 1,
          attemptsRemaining: 2,
        });
        return route.fulfill({ status: 202, json: submission });
      }
      return route.fulfill({ json: { items: submitted ? [submission] : [] } });
    }
    throw new Error(`Unexpected compiler request: ${req.method()} ${path}`);
  });
  await page.route(`**/api/v1/me/code-submissions/${submissionId}`, (route) => {
    if (++detailReads > 1) {
      Object.assign(submission, {
        status: 'GRADED',
        verdict: 'ACCEPTED',
        score: '10.00',
        passedCount: 2,
        totalCount: 2,
        judgedAt: now,
        retryAfterMs: null,
      });
      Object.assign(view, {
        inFlightSubmissionId: null,
        canSubmit: true,
        bestScore: '10.00',
        bestSubmissionId: submissionId,
      });
    }
    return route.fulfill({ json: submission });
  });
  await page.goto(`/user/assignments/${assignmentId}`);
  await expect(page.getByRole('heading', { name: 'Cộng hai số' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Code javascript' }).fill(solution);
  await expect(page.getByText('Đã lưu nháp', { exact: true })).toBeVisible();
  expect(draft.sourceCode).toBe(solution);
  await page.getByRole('checkbox', { name: 'Chạy với input tự nhập' }).check();
  await page.getByLabel('a: int', { exact: true }).fill('4');
  await page.getByLabel('b: int', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click();
  await expect(page.getByText('Kết quả: 9', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await expect(page.getByText('10.00/10.00 điểm', { exact: true })).toBeVisible();
  expect(idempotencyKey).toMatch(/^[\da-f-]{36}$/);
  await expect(page.getByRole('button', { name: 'Nộp bài', exact: true })).toBeEnabled();
  await expect(page.getByText('Đang chờ chấm', { exact: true })).toHaveCount(0);
  await expect(page.getByText('2/3', { exact: true })).toBeVisible();
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath('compiler.png'), fullPage: true });
});
