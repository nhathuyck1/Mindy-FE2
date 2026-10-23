'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api/client';
import { useAssignmentCommand } from './api';
import {
  authorAssignmentSchema,
  createSchema,
  type Assignment,
  type AuthorAssignment,
} from './contracts';
const labels = ['A', 'B', 'C', 'D'] as const;
const field = 'min-h-11 w-full rounded-lg border border-line bg-canvas p-3 text-sm';
export function AssignmentEditor(props: {
  sessionId: string;
  assignment: Assignment | null;
  readonly?: boolean;
  onClose: () => void;
}) {
  const actor = useSession();
  const detail = useQuery({
    queryKey: ['assignments', actor.data?.id, 'author-detail', props.assignment?.id],
    enabled: !!props.assignment,
    retry: false,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `mentor/assignments/${props.assignment?.id}`,
        schema: authorAssignmentSchema,
        signal,
      }),
  });
  if (props.assignment && detail.isPending) return <p>Đang tải đề bài…</p>;
  if (detail.isError)
    return (
      <div role="alert">
        Không tải được đề bài. <Button onClick={() => void detail.refetch()}>Thử lại</Button>
      </div>
    );
  if (detail.data?.type === 'ZIP')
    return (
      <div className="rounded-xl bg-soft p-4 text-sm">
        <p>
          Bài nộp tệp ZIP hiện chưa được hệ thống hỗ trợ phát hành. Bạn có thể tạo bài trắc nghiệm
          cho buổi học này.
        </p>
        <Button variant="ghost" onClick={props.onClose}>
          Đóng
        </Button>
      </div>
    );
  return <EditorForm key={detail.data?.id ?? 'new'} initial={detail.data ?? null} {...props} />;
}
function EditorForm(props: {
  initial: AuthorAssignment | null;
  sessionId: string;
  readonly?: boolean;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState(props.initial);
  const [metadataDirty, setMetadataDirty] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState(
    props.initial?.questions?.map((q) => ({
      prompt: q.prompt,
      options: q.options.map((o) => o.text),
      correctOption: q.correctOption,
    })) ?? [
      { prompt: '', options: ['', '', '', ''], correctOption: 'A' as (typeof labels)[number] },
    ],
  );
  const command = useAssignmentCommand(authorAssignmentSchema);
  const locked = props.readonly || (saved?.status !== 'DRAFT' && !!saved);
  async function saveQuestions() {
    if (!saved) return;
    try {
      const value = await command.mutateAsync({
        path: `mentor/assignments/${saved.id}/questions`,
        method: 'PUT',
        body: {
          expectedRevision: saved.revision,
          questions: questions.map((q) => ({
            ...q,
            options: q.options.map((text, index) => ({ label: labels[index], text })),
          })),
        },
      });
      setSaved(value);
      setError('');
    } catch {
      setError(
        'Chưa lưu được câu hỏi. Kiểm tra đủ câu hỏi và 4 đáp án; nếu bài đã thay đổi, hãy đóng rồi mở lại.',
      );
    }
  }
  return (
    <div className="space-y-5 border-t border-line pt-5">
      <div className="flex justify-between gap-3">
        <h4 className="font-bold">
          {saved ? `Soạn bài: ${saved.title}` : '1. Tạo bản nháp cho buổi học này'}
        </h4>
        <Button variant="ghost" disabled={command.isPending} onClick={props.onClose}>
          Đóng
        </Button>
      </div>
      {!locked && (
        <form
          onChange={() => setMetadataDirty(true)}
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            try {
              const body = createSchema.parse({
                purpose: saved?.purpose ?? data.get('purpose'),
                type: 'QUIZ',
                title: data.get('title'),
                description: data.get('description'),
                maxScore: saved?.maxScore ?? data.get('maxScore'),
                dueAt: data.get('dueAt')
                  ? new Date(`${data.get('dueAt')}:00+07:00`).toISOString()
                  : null,
                timeLimitMinutes: data.get('minutes') ? Number(data.get('minutes')) : null,
                maxAttempts: 1,
              });
              const value = await command.mutateAsync(
                saved
                  ? {
                      path: `mentor/assignments/${saved.id}`,
                      method: 'PATCH',
                      body: {
                        expectedRevision: saved.revision,
                        title: body.title,
                        description: body.description,
                        dueAt: body.dueAt,
                        timeLimitMinutes: body.timeLimitMinutes,
                      },
                    }
                  : {
                      path: `mentor/class-sessions/${props.sessionId}/assignments`,
                      method: 'POST',
                      body,
                    },
              );
              setSaved({ ...value, questions: value.questions ?? saved?.questions });
              setMetadataDirty(false);
              setError('');
            } catch {
              setError(
                'Chưa tạo được bản nháp. Kiểm tra dữ liệu; nếu mất kết nối, tải lại danh sách trước khi tạo lại để tránh trùng bài.',
              );
            }
          }}
        >
          <label>
            Loại bài
            <select
              name="purpose"
              defaultValue={saved?.purpose ?? 'HOMEWORK'}
              disabled={!!saved}
              className={field}
            >
              <option value="HOMEWORK">Bài tập về nhà</option>
              <option value="TEST">Bài kiểm tra</option>
            </select>
          </label>
          <label>
            Tiêu đề
            <input
              required
              maxLength={250}
              defaultValue={saved?.title}
              name="title"
              className={field}
            />
          </label>
          <label className="sm:col-span-2">
            Hướng dẫn cho học viên
            <textarea
              name="description"
              defaultValue={saved?.description}
              maxLength={20000}
              className={field}
            />
          </label>
          <label>
            Điểm tối đa
            <input
              name="maxScore"
              defaultValue={saved?.maxScore ?? '100'}
              disabled={!!saved}
              type="number"
              min="0.01"
              step="0.01"
              required
              className={field}
            />
          </label>
          <label>
            Hạn nộp (giờ Việt Nam)
            <input
              name="dueAt"
              defaultValue={
                saved?.dueAt
                  ? new Date(Date.parse(saved.dueAt) + 7 * 3600000).toISOString().slice(0, 16)
                  : ''
              }
              type="datetime-local"
              className={field}
            />
          </label>
          <label>
            Thời gian làm bài (phút, để trống nếu không giới hạn)
            <input
              name="minutes"
              defaultValue={saved?.timeLimitMinutes ?? ''}
              type="number"
              min="1"
              max="240"
              className={field}
            />
          </label>
          <p className="text-sm text-muted">
            Trắc nghiệm A–D · 1 lượt làm bài. Học viên chỉ thấy sau khi phát hành.
          </p>
          <Button disabled={command.isPending}>
            {saved ? 'Lưu thông tin bài' : 'Tạo bản nháp'}
          </Button>
        </form>
      )}
      {saved && (
        <>
          <p className="whitespace-pre-wrap text-sm">{saved.description}</p>
          <p className="text-sm text-muted">
            2. Soạn và lưu câu hỏi · 3. Phát hành khi đề đã hoàn chỉnh. Sau phát hành, đề được khóa.
          </p>
          <fieldset disabled={locked || command.isPending} className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-line p-4">
                <label>
                  Câu {i + 1}
                  <textarea
                    className={field}
                    required
                    value={q.prompt}
                    onChange={(e) =>
                      setQuestions(
                        questions.map((v, n) => (n === i ? { ...v, prompt: e.target.value } : v)),
                      )
                    }
                  />
                </label>
                {q.options.map((text, j) => (
                  <label key={j} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`correct-${i}`}
                      aria-label={`Đáp án đúng câu ${i + 1}: ${labels[j]}`}
                      checked={q.correctOption === labels[j]}
                      onChange={() =>
                        setQuestions(
                          questions.map((v, n) =>
                            n === i ? { ...v, correctOption: labels[j] } : v,
                          ),
                        )
                      }
                    />
                    <span>{labels[j]}</span>
                    <input
                      aria-label={`Câu ${i + 1} đáp án ${labels[j]}`}
                      className={field}
                      value={text}
                      onChange={(e) =>
                        setQuestions(
                          questions.map((v, n) =>
                            n === i
                              ? {
                                  ...v,
                                  options: v.options.map((o, k) => (k === j ? e.target.value : o)),
                                }
                              : v,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
                <p className="text-xs text-muted">
                  Chọn chấm tròn để đặt đáp án đúng (chỉ mentor thấy).
                </p>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => setQuestions(questions.filter((_, n) => n !== i))}
                  >
                    Xóa câu
                  </Button>
                )}
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                disabled={questions.length >= 200}
                onClick={() =>
                  setQuestions([
                    ...questions,
                    { prompt: '', options: ['', '', '', ''], correctOption: 'A' },
                  ])
                }
              >
                Thêm câu hỏi
              </Button>
              <Button onClick={() => void saveQuestions()}>Lưu câu hỏi</Button>
            </div>
          </fieldset>
          {!locked && (
            <Button
              disabled={
                command.isPending ||
                metadataDirty ||
                !saved.questions?.length ||
                JSON.stringify(
                  saved.questions.map((q) => ({
                    prompt: q.prompt,
                    options: q.options.map((o) => o.text),
                    correctOption: q.correctOption,
                  })),
                ) !== JSON.stringify(questions)
              }
              onClick={async () => {
                try {
                  setSaved(
                    await command.mutateAsync({
                      path: `mentor/assignments/${saved.id}/publish`,
                      method: 'POST',
                      body: { expectedRevision: saved.revision },
                    }),
                  );
                  setError('');
                } catch {
                  setError('Chưa phát hành được. Hãy lưu đầy đủ câu hỏi và kiểm tra hạn nộp.');
                }
              }}
            >
              Phát hành cho học viên
            </Button>
          )}
          {saved.status === 'PUBLISHED' && (
            <p role="status">Đã phát hành. Học viên thấy bài trong đúng buổi học này.</p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
