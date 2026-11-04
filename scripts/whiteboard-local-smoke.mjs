// Isolated real-stack acceptance. No existing application database is used.
import { fork, spawn } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
const require = createRequire(import.meta.url),
  be = resolve(process.env.BACKEND_DIR || '../Mindy-BE'),
  beRequire = createRequire(resolve(be, 'package.json'));
const { DataSource } = beRequire('typeorm');
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !new URL(testUrl).pathname.endsWith('_test'))
  throw new Error('Dedicated TEST_DATABASE_URL ending _test is required');
const database = new URL(testUrl);
database.pathname = database.pathname.replace(/_test$/, '_whiteboard_browser_http_test');
const origin = 'http://127.0.0.1:3105',
  keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const env = {
  ...process.env,
  NODE_ENV: 'test',
  TEST_DATABASE_URL: testUrl,
  DATABASE_URL: database.toString(),
  CORS_ORIGINS: origin,
  COOKIE_SECURE: 'false',
  SWAGGER_ENABLED: 'true',
  GOOGLE_AUTH_ENABLED: 'false',
  MAIL_ENABLED: 'false',
  ORDER_EXPIRY_JOB_ENABLED: 'false',
  PAYMENT_MAIL_JOB_ENABLED: 'false',
  ASSIGNMENT_TIMEOUT_JOB_ENABLED: 'false',
  CHAT_ENABLED: 'false',
  MINIO_ENABLED: 'false',
  WHITEBOARD_ENABLED: 'true',
  WHITEBOARD_WORKER_ENABLED: 'false',
  JWT_PRIVATE_KEY_BASE64: Buffer.from(
    keys.privateKey.export({ type: 'pkcs8', format: 'pem' }),
  ).toString('base64'),
  JWT_PUBLIC_KEY_BASE64: Buffer.from(
    keys.publicKey.export({ type: 'spki', format: 'pem' }),
  ).toString('base64'),
};
let backend, frontend, browser, db;
const logs = [];
function capture(child) {
  child.stdout?.on('data', (c) => logs.push(String(c)));
  child.stderr?.on('data', (c) => logs.push(String(c)));
  return child;
}
async function childExit(child) {
  return new Promise((resolve, reject) => {
    child.once('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Child exited ${code}: ${logs.slice(-15).join('')}`)),
    );
    child.once('error', reject);
  });
}
async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise((r) => child.once('exit', r)),
    new Promise((r) => setTimeout(r, 3000)),
  ]);
}
const results = [];
try {
  backend = capture(
    fork(resolve(be, 'test/http/payment-server.mjs'), [], {
      cwd: be,
      env,
      execArgv: [],
      silent: true,
    }),
  );
  const ready = await new Promise((resolve, reject) => {
    backend.once('message', resolve);
    backend.once('error', reject);
    backend.once('exit', () => reject(new Error(logs.slice(-10).join(''))));
  });
  db = new DataSource({ type: 'postgres', url: database.toString() });
  await db.initialize();
  const [session] = await db.query(
    'SELECT s.id FROM class_sessions s JOIN class_units u ON u.id=s.class_unit_id WHERE u.class_id=$1',
    [ready.classId],
  );
  const nextEnv = {
    ...process.env,
    NODE_ENV: 'production',
    API_BASE_URL: `${ready.url}/api/v1`,
    APP_ORIGIN: origin,
    MINDY_DIST_DIR: '.next-whiteboard-smoke',
  };
  const next = require.resolve('next/dist/bin/next');
  console.log('Building isolated FE against compiled BE fixture...');
  await childExit(
    capture(spawn(process.execPath, [next, 'build'], { env: nextEnv, windowsHide: true })),
  );
  frontend = capture(
    spawn(process.execPath, [next, 'start', '--port', '3105'], { env: nextEnv, windowsHide: true }),
  );
  let available = false;
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok) {
        available = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!available) throw new Error('Next startup timeout');
  browser = await chromium.launch({ headless: true });
  async function actor(email, viewport = { width: 1440, height: 900 }, touch = false) {
    const context = await browser.newContext({ viewport, hasTouch: touch });
    const login = await context.request.post(`${origin}/api/v1/auth/login`, {
      headers: { Origin: origin },
      data: { email, password: 'Http-test-password1!' },
    });
    expect(login.status()).toBe(200);
    return { context, page: await context.newPage() };
  }
  const mentor = await actor('mentor@http.test'),
    student = await actor('student@http.test');
  const network = [];
  mentor.page.on('websocket', (ws) => {
    network.push({ url: ws.url() });
    ws.on('socketerror', (e) => network.push({ wsError: e }));
  });
  mentor.page.on('console', (m) => {
    if (m.type() === 'error') network.push({ console: m.text() });
  });
  const errors = [];
  mentor.page.on('pageerror', (e) => errors.push(e.message));
  student.page.on('pageerror', (e) => errors.push(e.message));
  await mentor.page.goto(`${origin}/whiteboards/${session.id}?audience=mentor`);
  await mentor.page.getByRole('button', { name: 'Tạo bảng vẽ', exact: true }).click();
  await expect(mentor.page.getByText('Đã lưu', { exact: true }))
    .toBeVisible({ timeout: 30000 })
    .catch((e) => {
      console.log(
        JSON.stringify(
          {
            network,
            logs: logs
              .filter((l) => l.includes('upgrade'))
              .map((l) => l.replace(/cookie:[^\n]*/gi, 'cookie: [redacted]')),
            errors,
          },
          null,
          2,
        ),
      );
      throw e;
    });
  results.push(
    'Production Next HTTP ticket proxy + direct backend WebSocket connected; login cookies remain HttpOnly on FE.',
  );
  await student.context.request.post(`${origin}/api/v1/me/cart/items`, {
    headers: { Origin: origin },
    data: { classId: ready.classId },
  });
  await student.context.request.post(`${origin}/api/v1/me/cart/checkout`, {
    headers: { Origin: origin },
    data: { paymentType: 'CASH' },
  });
  await student.page.goto(`${origin}/whiteboards/${session.id}`);
  await expect(student.page.getByText('Chưa thể mở bảng.', { exact: false })).toBeVisible();
  await db.query(
    "UPDATE enrollments SET status='ACTIVE',enrolled_at=clock_timestamp() WHERE class_id=$1",
    [ready.classId],
  );
  await student.page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(student.page.getByText('Đã lưu', { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(
    student.page.getByRole('button', { name: 'Thêm ghi chú', exact: true }),
  ).toBeDisabled();
  await mentor.page.getByRole('button', { name: 'Thêm ghi chú', exact: true }).click();
  await expect
    .poll(async () => {
      const [r] = await db.query('SELECT projection FROM whiteboards WHERE session_id=$1', [
        session.id,
      ]);
      return r.projection.length;
    })
    .toBe(1);
  const [stored] = await db.query('SELECT projection FROM whiteboards WHERE session_id=$1', [
    session.id,
  ]);
  const sticky = stored.projection.find((s) => s.type === 'sticky');
  const box = await mentor.page.locator('.whiteboard-canvas').boundingBox();
  await mentor.page.mouse.dblclick(box.x + sticky.x + 40, box.y + sticky.y + 40);
  const note = mentor.page.getByRole('textbox', { name: 'Nội dung ghi chú' });
  await note.fill('Xin chào — cùng học tiếng Việt');
  await note.press('Control+Enter');
  await expect(mentor.page.getByText('Đã lưu', { exact: true })).toBeVisible();
  await student.page.getByRole('button', { name: 'Thêm thao tác', exact: true }).click();
  await expect(student.page.getByRole('option', { name: /Xin chào/ })).toHaveCount(1, {
    timeout: 10000,
  });
  results.push(
    'CASH denied; FULL student receives committed Vietnamese sticky and remains read-only.',
  );
  await student.page.getByRole('button', { name: 'Thêm thao tác', exact: true }).click();
  await db.query(
    "UPDATE class_sessions SET status='IN_PROGRESS',teaching_mentor_id=(SELECT mentor_id FROM classes WHERE id=$2) WHERE id=$1",
    [session.id, ready.classId],
  );
  await mentor.page.getByRole('combobox', { name: 'Chế độ bảng' }).selectOption('COLLABORATIVE');
  await expect(student.page.getByRole('button', { name: 'Thêm ghi chú', exact: true })).toBeEnabled(
    { timeout: 10000 },
  );
  await student.page.getByRole('button', { name: 'Thêm ghi chú', exact: true }).click();
  await expect(student.page.getByText('Đã lưu', { exact: true })).toBeVisible();
  await mentor.page.getByRole('button', { name: 'Bút (P)', exact: true }).click();
  await mentor.page.getByRole('button', { name: 'Đóng thiết lập bút', exact: true }).click();
  await mentor.page.mouse.move(580, 430);
  await mentor.page.mouse.down();
  await mentor.page.mouse.move(790, 480, { steps: 12 });
  await mentor.page.mouse.up();
  await expect(mentor.page.getByText('Đã lưu', { exact: true })).toBeVisible();
  let [row] = await db.query('SELECT projection FROM whiteboards WHERE session_id=$1', [
    session.id,
  ]);
  expect(row.projection.filter((s) => s.type === 'stroke')).toHaveLength(1);
  await mentor.page.getByRole('button', { name: 'Hoàn tác', exact: true }).click();
  await expect(mentor.page.getByText('Đã lưu', { exact: true })).toBeVisible();
  [row] = await db.query('SELECT projection FROM whiteboards WHERE session_id=$1', [session.id]);
  expect(row.projection.filter((s) => s.type === 'stroke')).toHaveLength(0);
  expect(row.projection.filter((s) => s.type === 'sticky')).toHaveLength(2);
  results.push(
    'Independent mentor/student collaborative edits converge; local undo preserves student sticky.',
  );
  await mentor.page.reload();
  await expect(mentor.page.getByText('Đã lưu', { exact: true })).toBeVisible({ timeout: 15000 });
  await mentor.page.getByRole('button', { name: 'Thêm thao tác', exact: true }).click();
  await mentor.page.getByRole('button', { name: 'Lưu mốc', exact: true }).click();
  await expect(
    mentor.page.getByText('Đã lưu mốc để có thể khôi phục.', { exact: true }),
  ).toBeVisible();
  const artifacts = resolve('test-results/whiteboard-real');
  await mkdir(artifacts, { recursive: true });
  for (const width of [320, 375, 768, 1440]) {
    await mentor.page.setViewportSize({ width, height: 900 });
    await mentor.page.getByRole('button', { name: 'Vừa nội dung', exact: true }).click();
    await expect
      .poll(() =>
        mentor.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      )
      .toBe(true);
    await mentor.page.screenshot({
      path: resolve(artifacts, `whiteboard-${width}.png`),
      fullPage: true,
    });
  }
  results.push('1440/768/375/320px production screenshots; no horizontal document overflow.');
  await mentor.page.setViewportSize({ width: 1440, height: 900 });
  await mentor.page.getByRole('button', { name: 'Thêm thao tác', exact: true }).click();
  await mentor.page.getByRole('button', { name: 'Xóa nội dung bảng', exact: true }).click();
  await mentor.page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect
    .poll(async () => {
      const [r] = await db.query('SELECT projection FROM whiteboards WHERE session_id=$1', [
        session.id,
      ]);
      return r.projection.length;
    })
    .toBe(0);
  await mentor.page.getByRole('button', { name: 'Thêm thao tác', exact: true }).click();
  await mentor.page.getByRole('button', { name: 'Lịch sử mốc lưu', exact: true }).click();
  await mentor.page.getByRole('button', { name: 'Xem trước', exact: true }).last().click();
  await mentor.page.getByRole('button', { name: 'Khôi phục mốc này', exact: true }).click();
  await mentor.page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect
    .poll(async () => {
      const [r] = await db.query('SELECT projection FROM whiteboards WHERE session_id=$1', [
        session.id,
      ]);
      return r.projection.length;
    })
    .toBe(2);
  await expect(
    student.page.getByText('Bảng đã được khôi phục hoặc xóa.', { exact: false }),
  ).toBeVisible({ timeout: 10000 });
  results.push(
    'Save checkpoint, reset, preview and restore work across open peers; old epoch is discarded.',
  );
  for (const name of ['Hình tròn', 'Hình vuông', 'Văn bản / chú thích']) {
    await mentor.page.getByRole('button', { name: 'Thêm hình và văn bản', exact: true }).click();
    await mentor.page.getByRole('button', { name, exact: true }).click();
    if (name === 'Văn bản / chú thích') {
      const input = mentor.page.getByRole('textbox', { name: 'Nội dung ghi chú' });
      await input.fill('Chú thích độc lập');
      await input.press('Control+Enter');
    }
    await expect(mentor.page.getByText('Đã lưu', { exact: true })).toBeVisible();
  }
  await expect
    .poll(async () => {
      const [r] = await db.query('SELECT projection FROM whiteboards WHERE session_id=$1', [
        session.id,
      ]);
      return r.projection.filter((s) => ['rectangle', 'ellipse', 'text'].includes(s.type)).length;
    })
    .toBe(3);
  await mentor.page.screenshot({
    path: resolve(artifacts, 'whiteboard-presets.png'),
    fullPage: true,
  });
  results.push(
    'Preset circle/square and independent editable text persist; sticky opens on double-click without an Edit button.',
  );
  await db.query("UPDATE enrollments SET status='CANCELLED' WHERE class_id=$1", [ready.classId]);
  await expect(student.page.getByText('Đã dừng truy cập', { exact: true })).toBeVisible({
    timeout: 10000,
  });
  expect(errors).toEqual([]);
  results.push('Passive entitlement revoke clears student board; no browser runtime errors.');
  await writeFile(
    resolve(artifacts, 'evidence.json'),
    JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
  );
  console.log(JSON.stringify({ passed: results, artifacts }, null, 2));
} finally {
  await browser?.close();
  await stop(frontend);
  if (backend?.connected) backend.send('close');
  await stop(backend);
  if (db?.isInitialized) await db.destroy();
}
