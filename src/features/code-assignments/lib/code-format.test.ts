import { describe, expect, it } from 'vitest';
import {
  codeErrorMessage,
  example,
  formatValue,
  isPending,
  parseCustomArgs,
  parseJsonField,
  signatureText,
  timeLeft,
} from './code-format';

const signature = {
  functionName: 'twoSum',
  params: [
    { name: 'nums', type: 'int[]' as const },
    { name: 'target', type: 'int' as const },
  ],
  returnType: 'int[]' as const,
};

describe('code assignment helpers', () => {
  it('parses one JSON value per parameter for custom runs', () => {
    expect(parseCustomArgs(signature, ['[2,7]', ' 9 '])).toEqual({ args: [[2, 7], 9] });
    expect(parseCustomArgs(signature, ['[2,7]', ''])).toEqual({
      error: 'Nhập giá trị cho target.',
    });
    expect(parseCustomArgs(signature, ['[2,', '9'])).toEqual({
      error: 'nums phải là JSON hợp lệ (ví dụ [5]).',
    });
  });

  it('formats signatures, examples and values', () => {
    expect(signatureText(signature)).toBe('twoSum(nums: int[], target: int) → int[]');
    expect(example('string[][]')).toBe('[["abc"]]');
    expect(formatValue([0, 1])).toBe('[0,1]');
    expect(formatValue(undefined)).toBe('');
  });

  it('shows the remaining time from the server clock', () => {
    const now = new Date('2026-11-02T10:00:00+07:00');
    expect(timeLeft('2026-11-04T13:30:00+07:00', now)).toBe('Còn 2 ngày 3 giờ');
    expect(timeLeft('2026-11-02T11:15:00+07:00', now)).toBe('Còn 1 giờ 15 phút');
    expect(timeLeft('2026-11-02T10:00:20+07:00', now)).toBe('Còn 1 phút');
    expect(timeLeft('2026-11-02T09:59:00+07:00', now)).toBe('Đã quá hạn');
  });

  it('maps backend codes to Vietnamese messages', () => {
    expect(codeErrorMessage('CODE_ATTEMPTS_EXHAUSTED', 'x')).toBe('Bạn đã dùng hết số lần nộp.');
    expect(codeErrorMessage('UNKNOWN', 'Lỗi chung')).toBe('Lỗi chung');
    expect(codeErrorMessage(undefined, 'Lỗi chung')).toBe('Lỗi chung');
    expect(isPending('RUNNING')).toBe(true);
    expect(isPending('GRADED')).toBe(false);
    expect(parseJsonField('[1')).toEqual({ error: 'JSON không hợp lệ.' });
  });
});
