import { describe, expect, it } from 'vitest';
import { parseQuizBulk, quizBulkExample } from './quiz-bulk-import';

const question = 'Câu 1: Chọn số nguyên\nA. 12\nB. 12.5\nC. null\nD. false\nĐáp án: A';

describe('bulk ABCD import', () => {
  it('reads UTF-8 BOM, CRLF and the downloadable example', () => {
    const result = parseQuizBulk('\uFEFF' + quizBulkExample.replaceAll('\n', '\r\n'));
    expect(result.errors).toEqual([]);
    expect(result.questions.map((q) => q.correctOption)).toEqual(['B', 'C']);
    expect(result.questions[0].options.map((o) => o.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(result.questions[0].id).toBeUndefined();
  });
  it('preserves multiline prompts, options and literal markup', () => {
    const result = parseQuizBulk(
      question
        .replace('Chọn số nguyên', 'Chọn số nguyên\ntrong các giá trị sau:')
        .replace('A. 12', 'A. <script>12</script>\nDòng tiếp theo'),
    );
    expect(result.questions[0].prompt).toBe('Chọn số nguyên\ntrong các giá trị sau:');
    expect(result.questions[0].options[0].text).toBe('<script>12</script>\nDòng tiếp theo');
  });
  it('supports numbered questions, parentheses, lowercase options and unaccented answer keys', () => {
    const result = parseQuizBulk(
      question.replace('Câu 1:', '1.').replace('A.', 'a)').replace('Đáp án: A', 'Dap an dung: a'),
    );
    expect(result.errors).toEqual([]);
    expect(result.questions[0].correctOption).toBe('A');
  });
  it.each([
    [question.replace('\nĐáp án: A', ''), 'Cần một dòng'],
    [question.replace('Đáp án: A', 'Đáp án: E'), 'phải là A'],
    [question.replace('B. 12.5', 'A. 12.5'), 'bị lặp'],
    [question.replace('\nD. false', ''), 'Đáp án D'],
    [question.replace('B. 12.5', 'B. '), 'Đáp án B'],
    [question.replace('Chọn số nguyên', 'x'.repeat(5001)), '5.000'],
    [question.replace('A. 12', 'A. ' + 'x'.repeat(2001)), '2.000'],
    [question.replace('\nĐáp án:', '\nE. 5\nĐáp án:'), 'Chỉ dùng bốn'],
    [question + '\nĐáp án: B', 'chỉ có một'],
    [question + '\nNội dung thừa', 'Sau đáp án đúng'],
    ['Chữ không có số câu\n' + question, 'Bắt đầu mỗi câu'],
  ])('rejects invalid batches without importing their valid questions', (source, message) => {
    const result = parseQuizBulk(source + '\n\n' + question);
    expect(result.questions).toEqual([]);
    expect(result.errors.some((e) => e.message.includes(message))).toBe(true);
    expect(result.errors.every((e) => e.line >= 1)).toBe(true);
  });
  it('rejects an empty source', () => {
    expect(parseQuizBulk(' ').questions).toEqual([]);
    expect(parseQuizBulk(' ').errors).toHaveLength(1);
  });
  it('allows 200 questions and rejects 201', () => {
    expect(parseQuizBulk(Array(200).fill(question).join('\n\n')).questions).toHaveLength(200);
    const tooMany = parseQuizBulk(Array(201).fill(question).join('\n\n'));
    expect(tooMany.questions).toEqual([]);
    expect(tooMany.errors[0].message).toContain('200');
  });
});
