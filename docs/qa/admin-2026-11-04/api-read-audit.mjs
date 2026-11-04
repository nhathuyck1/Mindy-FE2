import { writeFile } from 'node:fs/promises';
const base = 'http://localhost:3001/api/v1/';
const login = await fetch(base + 'auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3001' },
  body: JSON.stringify({
    email: process.env.MINDY_QA_EMAIL,
    password: process.env.MINDY_QA_PASSWORD,
  }),
  signal: AbortSignal.timeout(20000),
});
const auth = await login.json();
if (!login.ok || auth.user?.role !== 'ADMIN') throw new Error(`Admin login failed ${login.status}`);
const cookie = login.headers
    .getSetCookie()
    .map((v) => v.split(';')[0])
    .join('; '),
  evidence = [];
async function read(path) {
  const r = await fetch(base + path, {
    headers: { Cookie: cookie },
    signal: AbortSignal.timeout(20000),
  });
  const b = await r.json().catch(() => null);
  const e = {
    path,
    status: r.status,
    total: b?.total,
    count: b?.items?.length,
    ...(!r.ok ? { code: b?.code, message: b?.message } : {}),
  };
  evidence.push(e);
  console.log(JSON.stringify(e));
  return r.ok ? b : null;
}
await read('auth/me');
const users = await read('admin/users?page=1&pageSize=100');
for (const status of ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'])
  await read(`admin/users?page=1&pageSize=10&status=${status}`);
await read('admin/users?page=1&pageSize=10&role=MENTOR');
if (users?.items?.[0]) await read(`admin/users/${users.items[0].id}`);
const courses = await read('admin/courses?page=1&pageSize=100');
await read('admin/courses?page=1&pageSize=10&isActive=true');
await read('admin/courses?page=1&pageSize=10&isActive=false');
for (const c of courses?.items?.slice(0, 2) ?? []) await read(`admin/courses/${c.id}`);
const classes = await read('admin/classes?page=1&pageSize=100');
for (const status of ['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  await read(`admin/classes?page=1&pageSize=10&status=${status}`);
for (const c of classes?.items?.slice(0, 2) ?? []) {
  await read(`admin/classes/${c.id}`);
  const students = await read(`admin/classes/${c.id}/students?page=1&pageSize=20`);
  if (students?.items?.[0])
    await read(`admin/classes/${c.id}/students/${students.items[0].studentId}`);
}
const tracking = await read('admin/tracking/events?page=1&pageSize=20');
if (tracking?.items?.[0])
  await read(`admin/tracking/events/${tracking.items[0].source}/${tracking.items[0].id}`);
await read('admin/payments/reconciliation?page=1&pageSize=20');
await writeFile(
  'docs/qa/admin-2026-11-04/api-read-evidence.json',
  JSON.stringify({ date: '2026-11-04', role: 'ADMIN', evidence }, null, 2),
);
