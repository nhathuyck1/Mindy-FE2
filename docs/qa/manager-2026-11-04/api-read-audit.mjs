import { mkdir, writeFile } from 'node:fs/promises';
const base = 'http://localhost:3001/api/v1/';
const login = await fetch(`${base}auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3001' },
  body: JSON.stringify({
    email: process.env.MINDY_QA_EMAIL,
    password: process.env.MINDY_QA_PASSWORD,
  }),
  signal: AbortSignal.timeout(20000),
});
if (!login.ok) throw new Error(`Login status ${login.status}`);
const auth = await login.json();
if (auth.user?.role !== 'MANAGER') throw new Error('Account is not MANAGER');
const cookie = login.headers
  .getSetCookie()
  .map((v) => v.split(';')[0])
  .join('; ');
const evidence = [];
async function read(path) {
  const r = await fetch(base + path, {
    headers: { Cookie: cookie },
    signal: AbortSignal.timeout(20000),
  });
  const b = await r.json().catch(() => null);
  const entry = {
    path,
    status: r.status,
    total: b?.total,
    count: b?.items?.length,
    ...(!r.ok ? { code: b?.code, message: b?.message } : {}),
  };
  evidence.push(entry);
  console.log(JSON.stringify(entry));
  return r.ok ? b : null;
}
await read('auth/me');
const classes = await read('manager/classes?page=1&pageSize=100');
await read('manager/mentors?page=1&pageSize=20');
const orders = await read('manager/orders?page=1&pageSize=20&paymentType=CASH');
await read('manager/orders?page=1&pageSize=20&paymentType=CASH&status=PENDING');
await read('manager/orders?page=1&pageSize=20&paymentType=CASH&status=PAID');
for (const o of orders?.items?.slice(0, 2) ?? []) await read(`manager/orders/${o.id}`);
for (const s of ['', 'PENDING_REVIEW', 'APPROVED', 'DRAFT', 'REJECTED']) {
  const list = await read(`manager/materials?page=1&pageSize=20${s ? `&reviewStatus=${s}` : ''}`);
  if (list?.items?.[0]) await read(`manager/materials/${list.items[0].id}`);
}
const leaves = await read('management/mentor-leave-requests?page=1&pageSize=20');
await read('management/mentor-leave-requests?page=1&pageSize=20&status=PENDING');
for (const l of leaves?.items?.slice(0, 2) ?? [])
  await read(`management/mentor-leave-requests/${l.id}?page=1&pageSize=20`);
for (const c of classes?.items?.slice(0, 2) ?? []) {
  await read(`manager/classes/${c.id}`);
  await read(`manager/classes/${c.id}/units?page=1&pageSize=100`);
}
await mkdir('docs/qa/manager-2026-11-04', { recursive: true });
await writeFile(
  'docs/qa/manager-2026-11-04/api-read-evidence.json',
  JSON.stringify({ date: '2026-11-04', role: 'MANAGER', evidence }, null, 2),
);
