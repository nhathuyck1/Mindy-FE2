// Real FE -> compiled local BE -> isolated PostgreSQL + MinIO. No production data.
import assert from 'node:assert/strict';
import { fork, spawn } from 'node:child_process';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const beRoot = resolve('../Mindy-BE');
const beRequire = createRequire(resolve(beRoot, 'package.json'));
const { Client } = beRequire('pg');
const { S3Client, CreateBucketCommand, PutBucketVersioningCommand } =
  beRequire('@aws-sdk/client-s3');
const { ZipFile } = beRequire('yazl');
const { PDFDocument } = beRequire('pdf-lib');
const stamp = `${Date.now()}_${randomUUID().slice(0, 8)}`;
const dbName = `mindy_fe_${stamp}_http_test`;
const adminUrl = new URL(
  process.env.MINDY_SMOKE_DATABASE_URL ?? 'postgresql://mindy:mindy@127.0.0.1:5433/mindy_center',
);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(adminUrl.hostname))
  throw new Error('Smoke database must be local.');
const databaseUrl = new URL(adminUrl);
databaseUrl.pathname = `/${dbName}`;
const bucket = `mindy-fe-${stamp.replaceAll('_', '-')}-test`;
const output = resolve(process.env.MINDY_SMOKE_OUTPUT ?? '../output/assignment-smoke-2026-11-02');
const origin = 'http://localhost:3001';
const storagePort = '19000';
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const steps = [];
let be, fe, browser, db;
let appLogs = '';
const browserErrors = [];
const storage = new S3Client({
  endpoint: `http://127.0.0.1:${storagePort}`,
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: 'mindy-files-test',
    secretAccessKey: 'mindy-files-test-only-password',
  },
  maxAttempts: 1,
});
function step(name) {
  steps.push(name);
  console.log(`PASS ${name}`);
}
async function assertVisible(locator, name) {
  await locator.waitFor({ state: 'visible', timeout: 30000 });
  if (name) step(name);
}
async function ipc(command, property) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('BE IPC timeout')), 10000);
    const handler = (message) => {
      if (message && Object.hasOwn(message, property)) {
        clearTimeout(timeout);
        be.off('message', handler);
        resolve(message);
      }
    };
    be.on('message', handler);
    be.send(command);
  });
}
async function json(context, path, method = 'GET', body) {
  const response = await context.request.fetch(`${origin}/api/v1/${path}`, {
    method,
    data: body,
    headers: { Origin: origin },
  });
  if (!response.ok())
    throw new Error(
      `${method} ${path.split('/')[0]} failed ${response.status()}: ${await response.text()}`,
    );
  return response.status() === 204 ? null : response.json();
}
async function createAssignment(page, sessionId, type, title) {
  await page.goto(`${origin}/mentor/sessions/${sessionId}`);
  await page.getByRole('button', { name: 'Bài tập của buổi', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo bài tập', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Loại bài', { exact: true }).selectOption(type);
  await dialog.getByLabel('Tên bài tập', { exact: true }).fill(title);
  await dialog.getByLabel('Hướng dẫn', { exact: true }).fill('Hoàn thành bài và nộp trước hạn.');
  const deadline = new Date(Date.now() + 86400000 + 7 * 3600000).toISOString().slice(0, 16);
  await dialog.getByLabel('Hạn nộp (giờ Việt Nam)', { exact: true }).fill(deadline);
  if (type === 'ZIP') await dialog.getByLabel('Số lượt tối đa', { exact: true }).fill('2');
  await dialog.getByRole('button', { name: 'Tạo bản nháp' }).click();
  await page.waitForURL(/\/mentor\/assignments\/[a-f0-9-]+$/, { timeout: 30000 });
  await assertVisible(page.getByRole('heading', { name: title, exact: true }));
  return page.url().split('/').at(-1);
}
async function publish(page) {
  await page.getByRole('button', { name: 'Xuất bản', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await assertVisible(page.getByRole('button', { name: 'Lưu trữ bài' }));
}
try {
  await mkdir(output, { recursive: true });
  const occupied = await fetch(origin, { signal: AbortSignal.timeout(1500) }).then(
    () => true,
    () => false,
  );
  if (occupied)
    throw new Error(
      'Port 3001 is in use. Stop the existing FE before running this isolated smoke.',
    );
  console.log(
    `Isolated smoke target: ${adminUrl.hostname}:${adminUrl.port}/${dbName}; bucket ${bucket}`,
  );
  const admin = new Client({ connectionString: adminUrl.href });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [dbName]);
  assert.equal(exists.rowCount, 0, 'Fresh database name is required.');
  await admin.end();
  for (let n = 0; n < 40; n++) {
    try {
      if ((await fetch(`http://127.0.0.1:${storagePort}/minio/health/ready`)).ok) break;
    } catch {
      /* Wait for the existing local test storage. */
    }
    await delay(500);
  }
  await storage.send(new CreateBucketCommand({ Bucket: bucket }));
  await storage.send(
    new PutBucketVersioningCommand({
      Bucket: bucket,
      VersioningConfiguration: { Status: 'Enabled' },
    }),
  );
  be = fork(resolve(beRoot, 'test/http/payment-server.mjs'), [], {
    cwd: beRoot,
    silent: true,
    execArgv: [],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: databaseUrl.href,
      TEST_DATABASE_URL: adminUrl.href,
      DATABASE_LOGGING: 'false',
      COOKIE_SECURE: 'false',
      CORS_ORIGINS: origin,
      SWAGGER_ENABLED: 'true',
      GOOGLE_AUTH_ENABLED: 'false',
      MAIL_ENABLED: 'false',
      ORDER_EXPIRY_JOB_ENABLED: 'false',
      PAYMENT_MAIL_JOB_ENABLED: 'false',
      FILE_JOB_ENABLED: 'false',
      CHAT_JOB_ENABLED: 'false',
      ASSIGNMENT_TIMEOUT_JOB_ENABLED: 'true',
      ASSIGNMENT_ZIP_ENABLED: 'true',
      ASSIGNMENT_FILE_JOB_ENABLED: 'true',
      MINIO_ENABLED: 'true',
      MINIO_ENDPOINT: '127.0.0.1',
      MINIO_PORT: storagePort,
      MINIO_USE_SSL: 'false',
      MINIO_PUBLIC_URL: `http://127.0.0.1:${storagePort}`,
      MINIO_ACCESS_KEY: 'mindy-files-test',
      MINIO_SECRET_KEY: 'mindy-files-test-only-password',
      MINIO_BUCKET: bucket,
      PAYOS_ENABLED: 'true',
      PAYOS_CREATE_LINK_ENABLED: 'true',
      PAYOS_CLIENT_ID: 'http-client',
      PAYOS_API_KEY: 'http-key',
      PAYOS_CHECKSUM_KEY: 'http-checksum',
      PAYOS_RETURN_URL: 'https://example.test/paid',
      PAYOS_CANCEL_URL: 'https://example.test/cancel',
      PAYOS_WEBHOOK_URL: 'https://example.test/webhook',
      JWT_PRIVATE_KEY_BASE64: Buffer.from(
        keys.privateKey.export({ type: 'pkcs8', format: 'pem' }),
      ).toString('base64'),
      JWT_PUBLIC_KEY_BASE64: Buffer.from(
        keys.publicKey.export({ type: 'spki', format: 'pem' }),
      ).toString('base64'),
    },
  });
  be.stdout.on('data', (chunk) => {
    appLogs += String(chunk);
  });
  be.stderr.on('data', (chunk) => {
    appLogs += String(chunk);
  });
  const ready = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`BE startup timeout: ${appLogs.slice(-2000)}`)),
      60000,
    );
    be.once('message', (message) => {
      clearTimeout(timeout);
      resolve(message);
    });
    be.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`BE exited ${code}: ${appLogs.slice(-3000)}`));
    });
  });
  db = new Client({ connectionString: databaseUrl.href });
  await db.connect();
  const sessions = await db.query('SELECT id FROM class_sessions WHERE class_id=$1', [
    ready.classId,
  ]);
  const sessionId = sessions.rows[0].id;
  fe = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', '3001'], {
    cwd: process.cwd(),
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      MINDY_DIST_DIR: '.next-assignments-review',
      API_BASE_URL: `${ready.url}/api/v1`,
      APP_ORIGIN: origin,
    },
  });
  fe.stdout.on('data', () => {});
  fe.stderr.on('data', (chunk) => {
    appLogs += String(chunk);
  });
  for (let n = 0; n < 60; n++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    await delay(500);
  }
  browser = await chromium.launch();
  const mentor = await browser.newContext({ baseURL: origin });
  const student = await browser.newContext({ baseURL: origin });
  for (const [context, email] of [
    [mentor, 'mentor@http.test'],
    [student, 'student@http.test'],
  ])
    await json(context, 'auth/login', 'POST', { email, password: 'Http-test-password1!' });
  await json(student, 'me/cart/items', 'POST', { classId: ready.classId });
  await json(student, 'me/cart/checkout', 'POST', { paymentType: 'PAYOS' });
  await db.query(
    "UPDATE enrollments SET status='ACTIVE',enrolled_at=clock_timestamp() WHERE class_id=$1",
    [ready.classId],
  );
  const mp = await mentor.newPage(),
    sp = await student.newPage();
  for (const page of [mp, sp]) page.on('pageerror', (error) => browserErrors.push(error.message));
  const quizId = await createAssignment(mp, sessionId, 'QUIZ', 'Smoke: kiểu dữ liệu');
  step('Mentor creates QUIZ through FE');
  await mp.getByRole('button', { name: 'Tệp đề bài', exact: true }).click();
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const pdfBytes = Buffer.from(await pdf.save());
  await mp
    .getByLabel('Chọn tệp đề bài', { exact: true })
    .setInputFiles({ name: 'de-bai.pdf', mimeType: 'application/pdf', buffer: pdfBytes });
  await mp.getByText('Đã gắn tệp', { exact: true }).waitFor({ timeout: 90000 });
  step('Real instruction presigned PUT + worker READY + binding');
  await mp.getByRole('button', { name: 'Đóng trình sửa' }).click();
  await mp.getByRole('button', { name: 'Soạn câu hỏi' }).click();
  await mp.getByRole('button', { name: 'Thêm câu hỏi' }).click();
  await mp.getByLabel('Nội dung câu 1', { exact: true }).fill('Kết quả của 6 + 6 là gì?');
  for (const [label, text] of [
    ['A', '12'],
    ['B', '6'],
    ['C', '0'],
    ['D', '36'],
  ])
    await mp.getByRole('textbox', { name: `Đáp án ${label}`, exact: true }).fill(text);
  await mp.getByRole('button', { name: 'Lưu bộ câu hỏi' }).click();
  await mp.getByRole('button', { name: 'Lưu bộ câu hỏi' }).waitFor({ state: 'visible' });
  await mp.waitForFunction(() =>
    [...document.querySelectorAll('button')].some(
      (button) => button.textContent === 'Lưu bộ câu hỏi' && button.disabled,
    ),
  );
  await mp.getByRole('button', { name: 'Đóng trình sửa' }).click();
  await publish(mp);
  step('QUIZ questions and publish');
  await sp.goto(`${origin}/user/assignments/${quizId}`);
  await sp.getByRole('button', { name: 'Bắt đầu / tiếp tục' }).click();
  await sp.getByRole('radio').first().check();
  await assertVisible(sp.getByText('Đã lưu', { exact: true }));
  await sp.reload();
  await sp.getByRole('radio').first().waitFor();
  assert(await sp.getByRole('radio').first().isChecked());
  await sp.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await sp.getByRole('button', { name: 'Xác nhận nộp bài' }).click();
  await assertVisible(
    sp.getByRole('heading', { name: 'Kết quả bài làm' }),
    'Student start/save/reload/submit and real QUIZ grade',
  );
  await sp.screenshot({ path: resolve(output, 'quiz-result.png'), fullPage: true });
  const quizRow = await db.query(
    'SELECT status,result FROM assignment_submissions WHERE assignment_id=$1',
    [quizId],
  );
  assert.equal(quizRow.rows[0].status, 'GRADED');
  assert.equal(quizRow.rows[0].result.correctCount, 1);
  const zipId = await createAssignment(mp, sessionId, 'ZIP', 'Smoke: bài thực hành');
  await publish(mp);
  step('Mentor creates/publishes ZIP');
  await sp.goto(`${origin}/user/assignments/${zipId}`);
  await sp.getByRole('button', { name: 'Tạo / tiếp tục bài nộp' }).click();
  await sp.waitForURL(/\/user\/zip-submissions\//);
  const submissionId = sp.url().split('/').at(-1);
  const archive = new ZipFile();
  archive.addBuffer(Buffer.from('console.log(12);\n'), 'main.js');
  const chunks = [];
  archive.outputStream.on('data', (chunk) => chunks.push(chunk));
  const archiveDone = new Promise((resolve, reject) => {
    archive.outputStream.on('end', resolve);
    archive.outputStream.on('error', reject);
  });
  archive.end();
  await archiveDone;
  await sp.getByLabel('Chọn tệp ZIP', { exact: true }).setInputFiles({
    name: 'bai-lam.zip',
    mimeType: 'application/zip',
    buffer: Buffer.concat(chunks),
  });
  await sp.getByText('Đã gắn tệp', { exact: true }).waitFor({ timeout: 90000 });
  const beforeSubmit = await db.query(
    'SELECT status,attempt_number FROM assignment_zip_submissions WHERE id=$1',
    [submissionId],
  );
  assert.equal(beforeSubmit.rows[0].status, 'DRAFT');
  assert.equal(beforeSubmit.rows[0].attempt_number, null);
  step('Real ZIP storage CORS + worker READY + attach remains DRAFT');
  await sp.getByRole('button', { name: 'Nộp bài ZIP', exact: true }).click();
  await sp.getByRole('button', { name: 'Xác nhận nộp bài' }).click();
  await assertVisible(sp.getByText('Đã nộp', { exact: true }));
  await mp.goto(`${origin}/mentor/zip-submissions/${submissionId}`);
  await mp.getByRole('textbox', { name: 'Điểm /' }).fill('9.50');
  await mp.getByRole('textbox', { name: 'Nhận xét', exact: true }).fill('Đã xử lý đúng.');
  await mp.getByRole('button', { name: 'Lưu điểm', exact: true }).click();
  await mp.getByRole('button', { name: 'Trả điểm', exact: true }).waitFor();
  const hiddenGrade = await json(student, `me/zip-submissions/${submissionId}`);
  assert.equal(hiddenGrade.grade, null);
  assert(!Object.hasOwn(hiddenGrade, 'gradeVersion'));
  step('Draft grade hidden from Student');
  await mp.getByRole('button', { name: 'Trả điểm', exact: true }).click();
  await mp.getByRole('button', { name: 'Xác nhận trả điểm' }).click();
  await assertVisible(mp.getByText('Đã trả điểm hiện tại'));
  await sp.reload();
  await assertVisible(sp.getByText('Đã xử lý đúng.', { exact: true }));
  await sp.screenshot({ path: resolve(output, 'zip-result.png'), fullPage: true });
  step('Mentor grade/release and Student released result');
  await ipc({ type: 'assignment-feature', enabled: false }, 'assignmentFeature');
  await sp.goto(`${origin}/user/assignments/${zipId}`);
  assert(await sp.getByRole('button', { name: 'Tạo / tiếp tục bài nộp' }).isDisabled());
  await sp.goto(`${origin}/user/zip-submissions/${submissionId}`);
  await assertVisible(sp.getByText('Đã xử lý đúng.', { exact: true }));
  step('Feature OFF blocks new work and keeps history');
  await db.query("UPDATE classes SET status='COMPLETED' WHERE id=$1", [ready.classId]);
  await db.query("UPDATE enrollments SET status='COMPLETED' WHERE class_id=$1", [ready.classId]);
  await sp.reload();
  await assertVisible(sp.getByText('Đã xử lý đúng.', { exact: true }));
  const download = await json(student, `assignment-files/${hiddenGrade.file.id}/download`);
  const downloaded = await student.request.get(download.url);
  assert.equal(downloaded.status(), 200);
  const finalRow = await db.query(
    'SELECT status,attempt_number,assignment_snapshot FROM assignment_zip_submissions WHERE id=$1',
    [submissionId],
  );
  assert.equal(finalRow.rows[0].status, 'SUBMITTED');
  assert.equal(finalRow.rows[0].attempt_number, 1);
  step('Closed class retains immutable snapshot, released grade and authorized download');
  assert.deepEqual(browserErrors, []);
  step('No browser JavaScript errors');
  await writeFile(
    resolve(output, 'result.json'),
    JSON.stringify(
      { passed: true, steps, database: dbName, bucket, quizId, zipId, submissionId },
      null,
      2,
    ),
  );
} catch (error) {
  if (browser)
    for (const [ci, context] of browser.contexts().entries())
      for (const [pi, page] of context.pages().entries()) {
        await page
          .screenshot({ path: resolve(output, `failure-${ci}-${pi}.png`), fullPage: true })
          .catch(() => {});
        await writeFile(
          resolve(output, `failure-${ci}-${pi}.txt`),
          await page
            .locator('body')
            .innerText()
            .catch(() => ''),
        ).catch(() => {});
      }
  await writeFile(
    resolve(output, 'failure.txt'),
    String(error) + '\n' + appLogs.slice(-3000),
  ).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await db?.end();
  if (be?.connected) be.send('close');
  else be?.kill();
  fe?.kill();
  storage.destroy();
}
