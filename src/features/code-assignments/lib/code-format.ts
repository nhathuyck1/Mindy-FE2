import type { CodeSignature } from '../schemas/code-contracts';

/** Vietnamese labels and small pure helpers for CODE assignments (Phase 7). */

export const verdictLabels: Record<string, string> = {
  ACCEPTED: 'Đúng hết',
  PARTIAL: 'Đúng một phần',
  PASSED: 'Đạt',
  COMPLETED: 'Đã chạy',
  WRONG_ANSWER: 'Sai kết quả',
  TIME_LIMIT: 'Quá thời gian',
  MEMORY_LIMIT: 'Quá bộ nhớ',
  RUNTIME_ERROR: 'Lỗi khi chạy',
  OUTPUT_LIMIT: 'In quá nhiều',
  COMPILE_ERROR: 'Lỗi biên dịch',
};
export const submissionStatusLabels: Record<string, string> = {
  QUEUED: 'Đang chờ chấm',
  RUNNING: 'Đang chấm',
  GRADED: 'Đã chấm',
  FAILED: 'Lỗi hệ thống',
  VOIDED: 'Đã huỷ',
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã giao',
  ARCHIVED: 'Đã đóng',
};
export const blockerLabels: Record<string, string> = {
  CODE_PROBLEM_REQUIRED: 'Chưa có đề bài và chữ ký hàm',
  CODE_STATEMENT_REQUIRED: 'Chưa có mô tả đề',
  CODE_LANGUAGES_REQUIRED: 'Chưa chọn ngôn ngữ',
  CODE_SAMPLE_TEST_REQUIRED: 'Cần ít nhất 1 test ví dụ',
  CODE_HIDDEN_TEST_REQUIRED: 'Cần ít nhất 1 test ẩn',
  CODE_REFERENCE_REQUIRED: 'Chưa có lời giải mẫu',
  CODE_REFERENCE_NOT_VALIDATED: 'Lời giải mẫu chưa được kiểm tra ở phiên bản hiện tại',
};
const errorMessages: Record<string, string> = {
  CODE_RUNNER_BUSY: 'Hệ thống chấm đang bận, vui lòng thử lại sau vài giây.',
  CODE_RUNNER_UNAVAILABLE: 'Hệ thống chấm tạm thời không hoạt động.',
  CODE_RUN_RATE_LIMITED: 'Bạn chạy thử quá nhanh, vui lòng đợi một chút.',
  CODE_ATTEMPTS_EXHAUSTED: 'Bạn đã dùng hết số lần nộp.',
  CODE_SUBMISSION_IN_FLIGHT: 'Bài nộp trước đang được chấm.',
  ASSIGNMENT_DEADLINE_PASSED: 'Đã quá hạn nộp.',
  ASSIGNMENT_CLOSED: 'Bài tập đã đóng.',
  CODE_DRAFT_VERSION_CONFLICT: 'Bản nháp đã thay đổi ở nơi khác, vui lòng tải lại.',
  ASSIGNMENT_VERSION_CONFLICT: 'Đề đã được sửa ở nơi khác, vui lòng tải lại.',
  ASSIGNMENT_CONTENT_FROZEN: 'Đề đã giao nên không sửa được nữa.',
  CODE_TEST_TYPE_MISMATCH: 'Dữ liệu test không khớp kiểu tham số / kiểu trả về.',
  CODE_SIGNATURE_INVALID: 'Chữ ký hàm không hợp lệ (tên hoặc kiểu).',
  CODE_CUSTOM_INPUT_INVALID: 'Input tự nhập không khớp kiểu tham số.',
  CODE_LANGUAGE_NOT_ALLOWED: 'Ngôn ngữ không được phép cho đề này.',
  CODE_SOURCE_TOO_LARGE: 'Code quá dài (tối đa 64 KB).',
  CODE_REJUDGE_NOT_ALLOWED: 'Chỉ chấm lại được bài lỗi hệ thống.',
  CODE_SUBMISSION_ALREADY_VOIDED: 'Bài nộp đã bị huỷ trước đó.',
  INVALID_ASSIGNMENT_DEADLINE: 'Hạn nộp không hợp lệ.',
  CODE_ATTEMPTS_DECREASE_FORBIDDEN: 'Không được giảm số lần nộp.',
  CODE_FLOAT_EPSILON_INVALID: 'So sánh số thực cần sai số (epsilon), các kiểu khác không dùng.',
  ...Object.fromEntries(Object.entries(blockerLabels).map(([k, v]) => [k, v])),
};
export function codeErrorMessage(code: string | undefined, fallback: string): string {
  return (code && errorMessages[code]) ?? fallback;
}

export function formatValue(value: unknown): string {
  if (value === undefined) return '';
  return JSON.stringify(value);
}

/** Parses one JSON value per parameter for "custom input"; returns an error message instead of throwing. */
export function parseCustomArgs(
  signature: CodeSignature,
  texts: readonly string[],
): { args: unknown[] } | { error: string } {
  const args: unknown[] = [];
  for (const [index, param] of signature.params.entries()) {
    const raw = texts[index]?.trim() ?? '';
    if (!raw) return { error: `Nhập giá trị cho ${param.name}.` };
    try {
      args.push(JSON.parse(raw));
    } catch {
      return { error: `${param.name} phải là JSON hợp lệ (ví dụ ${example(param.type)}).` };
    }
  }
  return { args };
}

export function example(type: string): string {
  const base: Record<string, string> = {
    int: '5',
    long: '10000000000',
    double: '1.5',
    boolean: 'true',
    string: '"abc"',
  };
  if (type.endsWith('[][]')) return `[[${base[type.slice(0, -4)] ?? '0'}]]`;
  if (type.endsWith('[]')) return `[${base[type.slice(0, -2)] ?? '0'}]`;
  return base[type] ?? '0';
}

export function signatureText(signature: CodeSignature): string {
  return `${signature.functionName}(${signature.params.map((p) => `${p.name}: ${p.type}`).join(', ')}) → ${signature.returnType}`;
}

/** "còn 2 ngày 3 giờ" / "còn 15 phút" / "đã quá hạn", computed from the server clock offset. */
export function timeLeft(dueAt: string, now: Date): string {
  const ms = new Date(dueAt).getTime() - now.getTime();
  if (ms <= 0) return 'Đã quá hạn';
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  if (hours > 0) return `Còn ${hours} giờ ${minutes % 60} phút`;
  return `Còn ${Math.max(1, minutes)} phút`;
}

export function isPending(status: string): boolean {
  return status === 'QUEUED' || status === 'RUNNING';
}

/** Parses a JSON array typed by the mentor in the test editor (one value per parameter). */
export function parseJsonField(text: string): { value: unknown } | { error: string } {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return { error: 'JSON không hợp lệ.' };
  }
}
