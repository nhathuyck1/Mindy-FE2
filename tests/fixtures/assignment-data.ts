export const ids = {
  assignment: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  session: '66666666-6666-4666-8666-666666666666',
  class: '44444444-4444-4444-8444-444444444444',
  student: '11111111-1111-4111-8111-111111111111',
  question: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  submission: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  file: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
};
export const now = '2026-11-02T03:00:00.000Z';
export const question = {
  id: ids.question,
  position: 0,
  prompt: 'Giá trị nào là số nguyên?',
  options: [
    { label: 'A', text: '12' },
    { label: 'B', text: '12.5' },
    { label: 'C', text: '"mười hai"' },
    { label: 'D', text: 'null' },
  ],
  correctOption: 'A' as const,
};
export const assignment = {
  id: ids.assignment,
  sessionId: ids.session,
  type: 'QUIZ' as const,
  purpose: 'HOMEWORK' as const,
  title: 'Ôn tập kiểu dữ liệu',
  description: 'Chọn một đáp án cho mỗi câu.',
  maxScore: '10.00',
  dueAt: '2027-01-01T16:59:00.000Z',
  timeLimitMinutes: null,
  maxAttempts: 1,
  status: 'DRAFT' as const,
  revision: 1,
  publishedAt: null,
  instructionFiles: [],
  capabilities: { zipMutationsEnabled: true, instructionFilesEnabled: true },
  questions: [question],
};
export const result = {
  totalQuestions: 1,
  answeredCount: 1,
  correctCount: 1,
  wrongCount: 0,
  score: '10.00',
  maxScore: '10.00',
  results: [
    {
      questionId: ids.question,
      selectedOption: 'A' as const,
      correctOption: 'A' as const,
      isCorrect: true,
    },
  ],
};
export const attempt = {
  attemptId: ids.submission,
  assignmentId: ids.assignment,
  status: 'IN_PROGRESS' as const,
  version: 1,
  startedAt: now,
  expiresAt: null,
  submittedAt: null,
  submissionSource: null,
  serverNow: now,
  totalQuestions: 1,
  answeredCount: 0,
  questions: [question],
  answers: [],
  result: null,
  retryAfterSeconds: null,
};
export const file = {
  id: ids.file,
  originalFilename: 'bai-lam.zip',
  mimeType: 'application/zip',
  sizeBytes: 1024,
};
export const fileStatus = {
  ...file,
  version: 1,
  status: 'READY' as const,
  purpose: 'SUBMISSION' as const,
  errorCode: null,
};
export const zip = {
  type: 'ZIP' as const,
  id: ids.submission,
  assignmentId: ids.assignment,
  studentId: ids.student,
  status: 'SUBMITTED' as const,
  version: 3,
  attemptNumber: 1,
  submittedAt: now,
  snapshot: {
    title: 'Bài thực hành vòng lặp',
    description: 'Nộp mã nguồn trong một tệp ZIP.',
    maxScore: '10.00',
    dueAt: assignment.dueAt,
    instructionFiles: [],
  },
  file,
  grade: null,
  gradeVersion: 0,
  releasedVersion: null,
};
export const counts = {
  assignments: 2,
  eligible: 3,
  submitted: 4,
  missing: 1,
  ungraded: 1,
  unreleased: 2,
  released: 3,
};
export const metrics = {
  ...counts,
  denominator: 'CURRENT_ACTIVE_ASSIGNMENT_STUDENT_PAIRS',
  historyIncludesTerminalEnrollments: true,
  missingIsHistorical: false,
};
export function pageOf<T>(items: T[]) {
  return { items, total: items.length, page: 1, pageSize: 20 };
}
