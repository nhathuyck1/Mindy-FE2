import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://localhost:3001/api/v1/';
const login = await fetch(`${base}auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3001' },
  body: JSON.stringify({ email: process.env.MINDY_QA_EMAIL, password: process.env.MINDY_QA_PASSWORD }),
});
if (!login.ok) throw new Error(`Login failed: ${login.status}`);
const cookie = login.headers.getSetCookie().map((v) => v.split(';')[0]).join('; ');
const evidence = [];
async function read(path) {
  const response = await fetch(`${base}${path}`, { headers: { Cookie: cookie } });
  const body = await response.json().catch(() => null);
  evidence.push({ path, status: response.status, code: body?.code, total: body?.total,
    count: body?.items?.length, ...(response.ok ? {} : {message: body?.message}) });
  return response.ok ? body : null;
}
await read('auth/me');
const classes = await read('mentor/classes?page=1&pageSize=100&assignment=ANY');
await read('mentor/schedule?from=2026-11-01T17%3A00%3A00Z&to=2026-11-08T17%3A00%3A00Z&page=1&pageSize=100');
await read('mentor/leave-requests?page=1&pageSize=20');
for (const c of classes?.items ?? []) {
  const prefix = `mentor/classes/${c.id}`;
  await read(prefix);
  const units = await read(`${prefix}/units?page=1&pageSize=100`);
  const sessions = await read(`${prefix}/sessions?page=1&pageSize=100`);
  await read(`${prefix}/students?page=1&pageSize=20`);
  await read(`${prefix}/attendance-summary?page=1&pageSize=20`);
  await read(`${prefix}/progress?page=1&pageSize=20`);
  await read(`${prefix}/assignments?page=1&pageSize=20`);
  if (units?.items?.[0]) {
    const unit = units.items[0];
    await read(`${prefix}/units/${unit.id}/materials?page=1&pageSize=100`);
    await read(`${prefix}/units/${unit.id}/sessions?page=1&pageSize=100`);
  }
  const session = sessions?.items?.find(s => s.capabilities?.readSessionContext);
  if (session) {
    const sp = `class-sessions/${session.sessionId}`;
    await read(`${sp}/context`);
    await read(`${sp}/attendance?page=1&pageSize=20`);
    await read(`${sp}/teaching-notes`);
    if (session.status === 'SCHEDULED') await read(`${sp}/attendance-candidates?page=1&pageSize=20`);
  }
}
await mkdir('docs/qa/mentor-2026-11-04', {recursive:true});
await writeFile('docs/qa/mentor-2026-11-04/api-read-evidence.json', JSON.stringify({date:'2026-11-04', environment:'localhost:3001 -> configured deployed backend', evidence}, null, 2));
console.log(JSON.stringify(evidence, null, 2));
