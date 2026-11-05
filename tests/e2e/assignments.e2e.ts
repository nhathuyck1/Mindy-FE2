import { expect, test } from '@playwright/test';
import { mockAssignments } from './assignment-fixtures';
import { ids } from '../fixtures/assignment-data';
import { quizBulkExample } from '../../src/features/assignments/lib/quiz-bulk-import';

test('Mentor creates a ZIP from the session using labelled fields', async ({ page }) => {
  const { calls } = await mockAssignments(page, { mentor: true });
  await page.goto(`/mentor/sessions/${ids.session}`);
  await page.getByRole('button', { name: 'Bài tập của buổi', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo bài tập', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Loại bài', { exact: true }).selectOption('ZIP');
  await dialog.getByLabel('Tên bài tập', { exact: true }).fill('Bài thực hành mảng');
  await dialog.getByLabel('Hạn nộp (giờ Việt Nam)', { exact: true }).fill('2027-01-01T20:00');
  await dialog.getByRole('button', { name: 'Tạo bản nháp' }).click();
  await expect(
    page.getByRole('heading', { name: 'Bài thực hành mảng', exact: true }),
  ).toBeVisible();
  const created = calls.find((c) => c.method === 'POST' && c.path.endsWith('/assignments'));
  expect(created?.body).toMatchObject({
    type: 'ZIP',
    maxAttempts: 1,
    timeLimitMinutes: null,
    dueAt: '2027-01-01T20:00:00+07:00',
  });
});

test('Mentor edits draft metadata then confirms deletion', async ({ page }) => {
  const { calls } = await mockAssignments(page, { mentor: true, draft: true });
  await page.goto(`/mentor/assignments/${ids.assignment}`);
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
  await page.getByLabel('Tên bài tập', { exact: true }).fill('Tên bài đã sửa');
  await page.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tên bài đã sửa', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa bản nháp', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page).toHaveURL('/mentor/classes');
  expect(calls.find((c) => c.method === 'DELETE')?.body).toEqual({ expectedRevision: 2 });
});

test('Mentor archives only after entering a reason', async ({ page }) => {
  const { calls } = await mockAssignments(page, { mentor: true });
  await page.goto(`/mentor/assignments/${ids.assignment}`);
  await page.getByRole('button', { name: 'Lưu trữ bài', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Xác nhận', exact: true })).toBeDisabled();
  await page.getByLabel('Lý do', { exact: true }).fill('Thay bộ đề mới');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByText('Đã lưu trữ', { exact: true })).toBeVisible();
  expect(calls.find((c) => c.path.endsWith('/archive'))?.body).toEqual({
    expectedRevision: 1,
    reason: 'Thay bộ đề mới',
  });
});

test('Mentor extends ZIP and Student sees feature OFF without losing history', async ({ page }) => {
  const { calls } = await mockAssignments(page, { mentor: true, zip: true });
  await page.goto(`/mentor/assignments/${ids.assignment}`);
  await page.getByRole('button', { name: 'Gia hạn / thêm lượt' }).click();
  await page.getByLabel('Số lượt tối đa', { exact: true }).fill('4');
  await page.getByLabel('Lý do', { exact: true }).fill('Thêm lượt sửa bài');
  await page.getByRole('button', { name: 'Lưu gia hạn' }).click();
  await expect(page.getByText('4 lượt', { exact: true })).toBeVisible();
  expect(calls.find((c) => c.path.endsWith('/extend'))?.body).toMatchObject({
    maxAttempts: 4,
    expectedRevision: 1,
  });
  await mockAssignments(page, { zip: true, flagOff: true });
  await page.goto(`/user/assignments/${ids.assignment}`);
  await expect(page.getByRole('button', { name: 'Tạo / tiếp tục bài nộp' })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Xem kết quả' })).toBeVisible();
});

test('Mentor binds instruction upload and can remove it with an empty list', async ({ page }) => {
  const { calls } = await mockAssignments(page, { mentor: true, draft: true });
  await page.goto(`/mentor/assignments/${ids.assignment}`);
  await page.getByRole('button', { name: 'Tệp đề bài', exact: true }).click();
  await page.getByLabel('Chọn tệp đề bài', { exact: true }).setInputFiles({
    name: 'de-bai.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('PDF mock bytes'),
  });
  await expect(page.getByText('Đã gắn tệp', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Gỡ tệp', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu thứ tự và tệp đề', exact: true }).click();
  await expect
    .poll(() => calls.filter((c) => c.path.endsWith('/instruction-files')).length)
    .toBe(2);
  const bindings = calls.filter((c) => c.path.endsWith('/instruction-files'));
  expect(bindings[0].body).toEqual({ expectedRevision: 1, fileIds: [ids.file] });
  expect(bindings[1].body).toEqual({ expectedRevision: 2, fileIds: [] });
});

test('Student starts, autosaves, reloads and submits a QUIZ', async ({ page }, info) => {
  const { calls } = await mockAssignments(page);
  await page.goto(`/user/assignments/${ids.assignment}`);
  await expect(page.getByRole('heading', { name: 'Ôn tập kiểu dữ liệu' })).toBeVisible();
  await expect(page.getByText('Giá trị nào là số nguyên?')).toHaveCount(0);
  await page.getByRole('button', { name: 'Bắt đầu / tiếp tục' }).click();
  await expect(page).toHaveURL(`/user/assignment-submissions/${ids.submission}`);
  await page.getByRole('radio').first().check();
  await expect.poll(() => calls.filter((c) => c.path.endsWith('/answers')).length).toBe(1);
  await expect(page.getByText('Đã lưu', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('radio').first()).toBeChecked();
  expect(calls.filter((c) => c.path.endsWith('/start'))).toHaveLength(1);
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận nộp bài' }).click();
  await expect(page.getByRole('heading', { name: 'Kết quả bài làm' })).toBeVisible();
  await expect(page.getByText('1/1 câu đúng')).toBeVisible();
  await page.screenshot({ path: info.outputPath('quiz-result.png'), fullPage: true });
  for (const call of calls.filter((c) => c.method !== 'GET'))
    expect(call.key).toMatch(/^[\da-f-]{36}$/);
});
test('QUIZ answers stay editable after opening and reloading the attempt', async ({ page }) => {
  const { calls } = await mockAssignments(page, { timed: true });
  await page.goto(`/user/assignment-submissions/${ids.submission}`);
  await expect(page.getByRole('heading', { name: 'Bài trắc nghiệm' })).toBeVisible({
    timeout: 30_000,
  });
  const answers = page.getByRole('radio');
  await expect(answers).toHaveCount(4);
  for (const answer of await answers.all()) await expect(answer).toBeEnabled();
  await page.getByText('B. 12.5', { exact: true }).click();
  await expect(answers.nth(1)).toBeChecked();
  await expect(page.getByText('1/1 câu đã chọn', { exact: true })).toBeVisible();
  await expect(page.getByText('Đã lưu', { exact: true })).toBeVisible();
  await page.reload();
  await expect(answers.nth(1)).toBeChecked();
  await expect(answers.nth(1)).toBeEnabled();
  await answers.nth(1).focus();
  await page.keyboard.press('ArrowRight');
  await expect(answers.nth(2)).toBeChecked();
  await expect(answers.nth(1)).not.toBeChecked();
  await expect(page.getByText('Đã lưu', { exact: true })).toBeVisible();
  const writes = calls.filter((c) => c.path.endsWith('/answers'));
  expect(writes).toHaveLength(2);
  expect(writes[1].body).toMatchObject({
    expectedVersion: 2,
    answers: [{ questionId: ids.question, selectedOption: 'C' }],
  });
});

test('QUIZ submit waits for slow autosave; no late answer overwrite', async ({ page }) => {
  const { calls } = await mockAssignments(page, { slowSave: true, timed: true });
  await page.goto(`/user/assignment-submissions/${ids.submission}`);
  await expect(page.getByText('15:00')).toBeVisible();
  await page.getByRole('radio').first().check();
  await expect(page.getByText('Đang lưu…', { exact: true })).toBeVisible();
  await page.getByRole('radio').nth(1).check();
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận nộp bài' }).click();
  await expect(page.getByRole('heading', { name: 'Kết quả bài làm' })).toBeVisible();
  const writes = calls.filter((c) => /\/(answers|submit)$/.test(c.path));
  expect(writes.at(-1)?.body).toMatchObject({ answers: [{ selectedOption: 'B' }] });
  expect(writes.at(-1)?.body?.expectedVersion).toBe(writes.length);
});
test('QUIZ conflict retains selected answers and asks before reloading', async ({ page }) => {
  await mockAssignments(page, { conflict: true });
  await page.goto(`/user/assignment-submissions/${ids.submission}`);
  await page.getByRole('radio').nth(1).check();
  await expect(page.getByRole('alert').filter({ hasText: 'Dữ liệu đã thay đổi' })).toBeVisible();
  await expect(page.getByRole('radio').nth(1)).toBeChecked();
  await page.getByRole('button', { name: 'Tải lại bài đã lưu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Tải lại bài đã lưu' })).toBeFocused();
});

test('QUIZ browser Back asks before discarding a pending save', async ({ page }) => {
  await mockAssignments(page, { slowSave: true });
  await page.goto(`/user/assignments/${ids.assignment}`);
  await page.getByRole('button', { name: 'Bắt đầu / tiếp tục' }).click();
  await page.getByRole('radio').first().check();
  await page.evaluate(() => history.back());
  await expect(page.getByRole('dialog', { name: 'Rời bài đang làm?' })).toBeVisible();
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(page.getByRole('radio').first()).toBeChecked();
  await expect(page).toHaveURL(`/user/assignment-submissions/${ids.submission}`);
});
test('expired QUIZ reads server result and sends no autosave', async ({ page }) => {
  const { calls } = await mockAssignments(page, { expired: true });
  await page.goto(`/user/assignment-submissions/${ids.submission}`);
  await expect(page.getByRole('heading', { name: 'Kết quả bài làm' })).toBeVisible();
  expect(calls.every((c) => c.method === 'GET')).toBe(true);
});
test('Mentor edits questions, previews and confirms publish', async ({ page }, info) => {
  const { calls } = await mockAssignments(page, { mentor: true, draft: true });
  await page.goto(`/mentor/assignments/${ids.assignment}`);
  await expect(page.getByRole('button', { name: 'Soạn câu hỏi' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('mentor-assignment-draft.png'), fullPage: true });
  await page.getByRole('button', { name: 'Soạn câu hỏi' }).click();
  await page.getByRole('textbox', { name: 'Nội dung câu 1' }).fill('Kết quả của 6 + 6 là gì?');
  await page.getByRole('button', { name: 'Lưu bộ câu hỏi' }).click();
  await expect.poll(() => calls.filter((c) => c.path.endsWith('/questions')).length).toBe(1);
  await page.getByRole('button', { name: 'Xem trước' }).click();
  await expect(page.getByRole('dialog')).toContainText('Kết quả của 6 + 6');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Đóng trình sửa' }).click();
  await page.getByRole('button', { name: 'Xuất bản', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Nội dung và tệp đề sẽ được khóa');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lưu trữ bài' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('mentor-assignment.png'), fullPage: true });
});
test('Mentor previews and appends bulk ABCD questions before saving the full set', async ({
  page,
}, info) => {
  const { calls } = await mockAssignments(page, { mentor: true, draft: true });
  await page.goto(`/mentor/assignments/${ids.assignment}`);
  await page.getByRole('checkbox', { name: 'Gồm lượt cũ' }).click();
  await expect(page).toHaveURL(/history-history=true/);
  await expect(page.getByRole('checkbox', { name: 'Gồm lượt cũ' })).toBeChecked();
  await page.getByRole('button', { name: 'Soạn câu hỏi' }).click();
  await page
    .getByRole('textbox', { name: 'Nội dung câu 1' })
    .fill('Câu đã chỉnh sửa trước khi nhập');
  await page.getByRole('button', { name: 'Nhập hàng loạt', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const source = dialog.getByRole('textbox', { name: 'Nội dung câu hỏi', exact: true });
  const check = dialog.getByRole('button', { name: 'Kiểm tra & xem trước' });
  await source.fill(quizBulkExample.replace('Đáp án: B', 'Đáp án: E'));
  await check.click();
  await expect(dialog.getByRole('alert')).toContainText('phải là A, B, C hoặc D');
  await expect(dialog.getByRole('button', { name: 'Thêm câu hỏi', exact: true })).toBeDisabled();
  expect(calls.filter((c) => c.path.endsWith('/questions'))).toHaveLength(0);
  await source.fill(Array(100).fill(quizBulkExample).join('\n\n'));
  await check.click();
  await expect(dialog.getByRole('alert')).toContainText('Tổng 201 câu vượt giới hạn 200');
  await expect(
    dialog.getByRole('button', { name: 'Thêm 200 câu hỏi', exact: true }),
  ).toBeDisabled();
  await source.fill(quizBulkExample);
  await check.click();
  await expect(dialog.getByRole('status')).toHaveText('2 câu hỏi hợp lệ');
  await dialog.getByText('Câu 1. Kết quả của 2 + 2 là gì?', { exact: true }).click();
  await expect(dialog.getByText('B. 4 · Đáp án đúng', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('mentor-bulk-import.png'), fullPage: true });
  await dialog.getByRole('button', { name: 'Thêm 2 câu hỏi', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Nội dung câu 1', exact: true })).toHaveValue(
    'Câu đã chỉnh sửa trước khi nhập',
  );
  await expect(page.getByRole('textbox', { name: 'Nội dung câu 3', exact: true })).toHaveValue(
    'Kiểu dữ liệu nào biểu diễn đúng/sai?',
  );
  expect(calls.filter((c) => c.path.endsWith('/questions'))).toHaveLength(0);
  await page.getByRole('button', { name: 'Lưu bộ câu hỏi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lưu bộ câu hỏi', exact: true })).toBeDisabled();
  const writes = calls.filter((c) => c.path.endsWith('/questions'));
  expect(writes).toHaveLength(1);
  expect(writes[0].body).toMatchObject({
    expectedRevision: 1,
    questions: [
      { id: ids.question, prompt: 'Câu đã chỉnh sửa trước khi nhập' },
      { correctOption: 'B' },
      { correctOption: 'C' },
    ],
  });
});

test('Mentor imports UTF-8 text and replaces questions only after applying the preview', async ({
  page,
}) => {
  const { calls } = await mockAssignments(page, { mentor: true, draft: true });
  await page.goto(`/mentor/assignments/${ids.assignment}`);
  await page.getByRole('button', { name: 'Soạn câu hỏi' }).click();
  const original = page.getByRole('textbox', { name: 'Nội dung câu 1', exact: true });
  await page.getByRole('button', { name: 'Nhập hàng loạt', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Chọn tệp câu hỏi .txt').setInputFiles({
    name: 'cau-hoi.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(quizBulkExample),
  });
  await expect(dialog.getByRole('textbox', { name: 'Nội dung câu hỏi', exact: true })).toHaveValue(
    quizBulkExample,
  );
  await dialog.getByRole('button', { name: 'Kiểm tra & xem trước' }).click();
  await dialog.getByRole('radio', { name: 'Thay toàn bộ 1 câu hiện có' }).check();
  await page.keyboard.press('Escape');
  await expect(original).toHaveValue('Giá trị nào là số nguyên?');
  await page.getByRole('button', { name: 'Nhập hàng loạt', exact: true }).click();
  await dialog.getByRole('button', { name: 'Thay bằng 2 câu hỏi', exact: true }).click();
  await expect(original).toHaveValue('Kết quả của 2 + 2 là gì?');
  await expect(page.getByRole('textbox', { name: 'Nội dung câu 3', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Lưu bộ câu hỏi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lưu bộ câu hỏi', exact: true })).toBeDisabled();
  expect(calls.find((c) => c.path.endsWith('/questions'))?.body?.questions).toHaveLength(2);
});

test('Student ZIP upload attaches before explicit submit; historical snapshot survives closed access', async ({
  page,
}, info) => {
  const { calls } = await mockAssignments(page, { zip: true, draft: true });
  await page.goto(`/user/zip-submissions/${ids.submission}`);
  await expect(page.getByRole('button', { name: 'Nộp bài ZIP', exact: true })).toBeDisabled();
  await page.getByLabel('Chọn tệp ZIP', { exact: true }).setInputFiles({
    name: 'bai-lam.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from('ZIP fixture bytes'),
  });
  await expect(page.getByText('Đã gắn tệp', { exact: true })).toBeVisible();
  expect(calls.some((c) => c.path.endsWith('/submit'))).toBe(false);
  await page.getByRole('button', { name: 'Nộp bài ZIP', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận nộp bài' }).click();
  await expect(page.getByText('Đã nộp', { exact: true })).toBeVisible();
  await expect(page.getByText('Chưa trả điểm.', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('zip-submitted.png'), fullPage: true });
  await mockAssignments(page, { zip: true, historical: true, flagOff: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bài thực hành vòng lặp' })).toBeVisible();
  await expect(page.locator('main [role="alert"]')).toHaveCount(0);
});

test('ZIP unknown attach is reconciled before replacing the file', async ({ page }) => {
  const { calls } = await mockAssignments(page, { zip: true, draft: true, attachUnknown: true });
  await page.goto(`/user/zip-submissions/${ids.submission}`);
  const file = {
    name: 'bai-lam.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from('ZIP mock bytes'),
  };
  await page.getByLabel('Chọn tệp ZIP', { exact: true }).setInputFiles(file);
  await expect(page.locator('main [role="alert"]').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chọn tệp ZIP', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Tải lại bài nộp', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Chọn tệp ZIP', exact: true })).toBeEnabled();
  await page.getByLabel('Chọn tệp ZIP', { exact: true }).setInputFiles(file);
  await expect(page.getByText('Đã gắn tệp', { exact: true })).toBeVisible();
  const bindings = calls.filter((c) => c.path.endsWith('/file'));
  expect(bindings).toHaveLength(2);
  expect(bindings[0].body?.expectedVersion).toBe(1);
  expect(bindings[1].body?.expectedVersion).toBe(2);
});
test('Mentor saves zero score, releases separately and reads grade audit', async ({
  page,
}, info) => {
  const { calls } = await mockAssignments(page, { mentor: true, zip: true });
  await page.goto(`/mentor/zip-submissions/${ids.submission}`);
  await page.getByRole('textbox', { name: 'Điểm /' }).fill('0');
  await page.getByRole('textbox', { name: 'Nhận xét' }).fill('Cần bổ sung điều kiện dừng.');
  await page.getByRole('button', { name: 'Lưu điểm', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Trả điểm', exact: true })).toBeEnabled();
  expect(calls.some((c) => c.path.endsWith('/grade/release'))).toBe(false);
  await page.getByRole('button', { name: 'Trả điểm', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('0 / 10.00');
  await page.getByRole('button', { name: 'Xác nhận trả điểm' }).click();
  await expect(page.getByText('Đã trả điểm hiện tại')).toBeVisible();
  await expect(page.getByText('1 bản điểm · 2 thao tác')).toBeVisible();
  const release = calls.find((c) => c.path.endsWith('/grade/release'));
  expect(release?.body).toEqual({ expectedVersion: 1, gradeVersion: 1 });
  await page.screenshot({ path: info.outputPath('mentor-grade.png'), fullPage: true });
});
test('assignment screens stay usable at 320px and filters follow browser history', async ({
  page,
}, info) => {
  await mockAssignments(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(`/user/classes/${ids.class}/assignments`);
  await expect(page.getByRole('heading', { name: 'Ôn tập kiểu dữ liệu' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Loại bài' }).selectOption('ZIP');
  await expect(page).toHaveURL(/type=ZIP/);
  await expect(page.getByText('Chưa có bài tập', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('combobox', { name: 'Loại bài' })).toHaveValue('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.goto(`/user/assignment-submissions/${ids.submission}`);
  await expect(page.getByRole('heading', { name: 'Bài trắc nghiệm' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await mockAssignments(page, { mentor: true, draft: true });
  await page.goto(`/mentor/assignments/${ids.assignment}`);
  await expect(page.getByRole('button', { name: 'Soạn câu hỏi' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: info.outputPath('mentor-assignment-320.png'), fullPage: true });
});
