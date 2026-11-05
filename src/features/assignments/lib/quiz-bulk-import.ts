import {
  labels,
  optionLabel,
  questionInputSchema,
  type QuestionInput,
} from '../schemas/assignment-contracts';

export const quizBulkExample = `Câu 1: Kết quả của 2 + 2 là gì?
A. 3
B. 4
C. 5
D. 6
Đáp án: B

Câu 2: Kiểu dữ liệu nào biểu diễn đúng/sai?
A. string
B. number
C. boolean
D. object
Đáp án: C`;

export const maxQuizBulkBytes = 8_388_608;
export type QuizBulkIssue = { line: number; message: string };
export type QuizBulkResult = { questions: QuestionInput[]; errors: QuizBulkIssue[] };
type Draft = {
  line: number;
  prompt: string[];
  options: Map<QuestionInput['correctOption'], string[]>;
  activeOption: QuestionInput['correctOption'] | null;
  correctOption?: QuestionInput['correctOption'];
  answered: boolean;
};

/** Parse numbered, plain-text ABCD blocks without importing a partially valid batch. */
export function parseQuizBulk(source: string): QuizBulkResult {
  const errors: QuizBulkIssue[] = [];
  const questions: QuestionInput[] = [];
  if (new TextEncoder().encode(source).byteLength > maxQuizBulkBytes)
    return { questions: [], errors: [{ line: 1, message: 'Nội dung vượt quá 8 MiB.' }] };
  let draft: Draft | null = null;
  let count = 0;
  function finish(question: Draft) {
    const options = labels.map((label) => ({
      label,
      text: question.options.get(label)?.join('\n').trim() ?? '',
    }));
    const parsed = questionInputSchema.safeParse({
      prompt: question.prompt.join('\n').trim(),
      options,
      correctOption: question.correctOption,
    });
    if (parsed.success) questions.push(parsed.data);
    else {
      for (const issue of parsed.error.issues) {
        const message =
          issue.path[0] === 'prompt'
            ? 'Nội dung câu hỏi phải có từ 1 đến 5.000 ký tự.'
            : issue.path[0] === 'options'
              ? `Đáp án ${options[Number(issue.path[1])]?.label ?? 'ABCD'} phải có từ 1 đến 2.000 ký tự.`
              : 'Cần một dòng Đáp án: A, B, C hoặc D.';
        errors.push({ line: question.line, message });
      }
    }
  }
  for (const [index, raw] of source
    .replace(/^\uFEFF/, '')
    .split(/\r\n?|\n/)
    .entries()) {
    const text = raw.trim();
    const line = index + 1;
    if (!text) continue;
    const heading = /^(?:Câu\s+)?\d+\s*[:.)]\s*(.*)$/iu.exec(text);
    if (heading) {
      if (draft) finish(draft);
      if (++count > 200)
        return { questions: [], errors: [{ line, message: 'Mỗi bộ đề có tối đa 200 câu hỏi.' }] };
      draft = {
        line,
        prompt: [heading[1]],
        options: new Map(),
        activeOption: null,
        answered: false,
      };
      continue;
    }
    if (!draft) {
      if (!errors.length)
        errors.push({ line, message: 'Bắt đầu mỗi câu bằng “Câu 1:” hoặc “1.”.' });
      continue;
    }
    const answer = /^(?:đáp\s*án(?:\s*đúng)?|dap\s*an(?:\s*dung)?|answer)\s*:\s*(.*)$/iu.exec(text);
    if (answer) {
      if (draft.answered) errors.push({ line, message: 'Mỗi câu chỉ có một dòng đáp án đúng.' });
      const label = optionLabel.safeParse(answer[1].toUpperCase());
      if (label.success) draft.correctOption = label.data;
      else errors.push({ line, message: 'Đáp án đúng phải là A, B, C hoặc D.' });
      draft.answered = true;
      continue;
    }
    if (draft.answered) {
      errors.push({ line, message: 'Sau đáp án đúng, hãy bắt đầu câu tiếp theo bằng “Câu 2:”.' });
      continue;
    }
    const option = /^([A-Z])[.)]\s*(.*)$/iu.exec(text);
    if (option) {
      const parsedLabel = optionLabel.safeParse(option[1].toUpperCase());
      if (!parsedLabel.success) {
        errors.push({ line, message: 'Chỉ dùng bốn đáp án A, B, C, D.' });
        continue;
      }
      const label = parsedLabel.data;
      if (draft.options.has(label)) errors.push({ line, message: `Đáp án ${label} bị lặp.` });
      else draft.options.set(label, [option[2]]);
      draft.activeOption = label;
    } else if (draft.activeOption) draft.options.get(draft.activeOption)?.push(text);
    else draft.prompt.push(text);
  }
  if (draft) finish(draft);
  if (!count && !errors.length) errors.push({ line: 1, message: 'Dán ít nhất một câu hỏi ABCD.' });
  return { questions: errors.length ? [] : questions, errors };
}
