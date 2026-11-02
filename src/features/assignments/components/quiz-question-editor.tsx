'use client';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { Plus, ArrowUp, ArrowDown, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Modal } from '@/components/ui/modal';
import { ApiError } from '@/lib/api/client';
import { useAssignmentCommand } from '../api/assignment-queries';
import * as dto from '../schemas/assignment-contracts';
import { ErrorNotice, panelClass, fieldClass } from './assignment-ui';

function blankQuestion(): dto.QuestionInput {
  return {
    prompt: '',
    options: dto.labels.map((label) => ({ label, text: '' })),
    correctOption: 'A',
  };
}
export function QuizQuestionEditor(props: {
  item: dto.Assignment;
  onSaved: (item: dto.Assignment) => void;
  readonly?: boolean;
}) {
  const [questions, setQuestions] = useState<dto.QuestionInput[]>(
    () =>
      props.item.questions?.map(({ id, prompt, options, correctOption }) => ({
        id,
        prompt,
        options,
        correctOption,
      })) ?? [],
  );
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [blocked, setBlocked] = useState(false);
  const [dirty, setDirty] = useState(false);
  const revision = useRef(props.item.revision);
  const command = useAssignmentCommand(dto.mentorAssignmentSchema);
  const disabled = props.readonly || command.isPending || blocked;
  function update(index: number, value: dto.QuestionInput) {
    setDirty(true);
    setQuestions((previous) => previous.map((q, i) => (i === index ? value : q)));
  }
  function move(index: number, delta: number) {
    setDirty(true);
    setQuestions((previous) => {
      const next = [...previous];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }
  if (props.readonly)
    return (
      <section className={`${panelClass} space-y-4`}>
        <h2 className="text-xl font-extrabold">
          Bộ câu hỏi <span className="text-base text-muted">({questions.length})</span>
        </h2>
        {questions.map((question, index) => (
          <details key={question.id ?? index} className="rounded-xl border border-line p-4">
            <summary className="cursor-pointer font-bold whitespace-pre-wrap break-words">
              Câu {index + 1}. {question.prompt}
            </summary>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {question.options.map((option) => (
                <li
                  key={option.label}
                  className={`rounded-lg p-3 whitespace-pre-wrap break-words ${option.label === question.correctOption ? 'bg-mint/10 font-bold text-forest' : 'bg-soft/40'}`}
                >
                  {option.label}. {option.text}
                  {option.label === question.correctOption ? ' ✓' : ''}
                </li>
              ))}
            </ul>
          </details>
        ))}
        {questions.length === 0 && <p className="text-muted">Chưa có câu hỏi.</p>}
      </section>
    );
  return (
    <section className={`${panelClass} space-y-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">
          Câu hỏi <span className="text-base text-muted">({questions.length}/200)</span>
        </h2>
        <Button variant="outline" onClick={() => setPreview(true)}>
          <Eye size={18} />
          Xem trước
        </Button>
      </div>
      <fieldset disabled={disabled} className="min-w-0 space-y-5">
        {questions.map((question, index) => (
          <div
            key={question.id ?? `new-${index}`}
            className="min-w-0 rounded-xl border border-line bg-soft/30 p-4"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-extrabold">Câu {index + 1}</h3>
              {!props.readonly && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    aria-label={`Đưa câu ${index + 1} lên`}
                    disabled={disabled || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`Đưa câu ${index + 1} xuống`}
                    disabled={disabled || index === questions.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`Xóa câu ${index + 1}`}
                    onClick={() => {
                      setQuestions(questions.filter((_, i) => i !== index));
                      setDirty(true);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </div>
            <label className={fieldClass}>
              Nội dung câu {index + 1}
              <Textarea
                rows={3}
                maxLength={5000}
                value={question.prompt}
                onChange={(e) => update(index, { ...question, prompt: e.target.value })}
              />
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {question.options.map((option, oi) => (
                <label key={option.label} className={fieldClass}>
                  Đáp án {option.label}
                  <Input
                    maxLength={2000}
                    value={option.text}
                    onChange={(e) =>
                      update(index, {
                        ...question,
                        options: question.options.map((o, j) =>
                          j === oi ? { ...o, text: e.target.value } : o,
                        ),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <label className={`${fieldClass} mt-4`}>
              Đáp án đúng
              <NativeSelect
                value={question.correctOption}
                onChange={(e) =>
                  update(index, {
                    ...question,
                    correctOption: dto.optionLabel.parse(e.target.value),
                  })
                }
              >
                {dto.labels.map((label) => (
                  <option key={label}>{label}</option>
                ))}
              </NativeSelect>
            </label>
          </div>
        ))}
      </fieldset>
      {!props.readonly && (
        <>
          <ErrorNotice error={error} />
          {blocked && (
            <p className="text-sm text-muted">
              Câu hỏi đang soạn vẫn được giữ. Kiểm tra bản mới trước khi mở lại trình sửa.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={disabled || questions.length >= 200}
              onClick={() => {
                setQuestions([...questions, blankQuestion()]);
                setDirty(true);
              }}
            >
              <Plus size={18} />
              Thêm câu hỏi
            </Button>
            <Button
              disabled={disabled || !dirty}
              onClick={async () => {
                try {
                  const body = dto.questionsInputSchema.parse({
                    expectedRevision: revision.current,
                    questions,
                  });
                  const result = await command.mutateAsync({
                    path: `mentor/assignments/${props.item.id}/questions`,
                    method: 'PUT',
                    body,
                  });
                  setQuestions(result.questions ?? []);
                  revision.current = result.revision;
                  setDirty(false);
                  setError(null);
                  props.onSaved(result);
                } catch (e) {
                  setError(e);
                  if (
                    !(e instanceof z.ZodError) &&
                    (!(e instanceof ApiError) || e.status === 409 || e.status >= 500)
                  )
                    setBlocked(true);
                }
              }}
            >
              {command.isPending ? 'Đang lưu câu hỏi…' : 'Lưu bộ câu hỏi'}
            </Button>
          </div>
        </>
      )}
      {preview && (
        <Modal
          title="Xem trước bài trắc nghiệm"
          onClose={() => setPreview(false)}
          contentClassName="assignment-workspace"
        >
          <div className="space-y-6 p-5">
            {questions.length ? (
              questions.map((q, i) => (
                <fieldset key={i} className="space-y-3">
                  <legend className="mb-3 font-bold whitespace-pre-wrap break-words">
                    {i + 1}. {q.prompt || '(Chưa có câu hỏi)'}
                  </legend>
                  {q.options.map((o) => (
                    <label
                      key={o.label}
                      className="flex min-h-11 items-start gap-3 rounded-lg border border-line p-3"
                    >
                      <input className="mt-1" type="radio" name={`preview-${i}`} />
                      <span className="min-w-0 whitespace-pre-wrap break-words">
                        {o.label}. {o.text}
                      </span>
                    </label>
                  ))}
                </fieldset>
              ))
            ) : (
              <p>Chưa có câu hỏi.</p>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}
