'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAssignmentCommand } from './api';
import { attemptSchema, type Assignment, type Attempt } from './contracts';
export function QuizPlayer(props: { assignment: Assignment; onClose: () => void }) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Attempt['answers']>([]);
  const [message, setMessage] = useState('');
  const [clock, setClock] = useState(() => ({ offset: 0, now: Date.now() }));
  const command = useAssignmentCommand(attemptSchema);
  const { mutateAsync } = command;
  const deadline = attempt?.expiresAt ? Date.parse(attempt.expiresAt) : null;
  const expired = deadline !== null && clock.now + clock.offset >= deadline;
  const accept = useCallback((value: Attempt) => {
    setAttempt(value);
    setAnswers(value.answers);
    setClock({ offset: Date.parse(value.serverNow) - Date.now(), now: Date.now() });
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setClock((v) => ({ ...v, now: Date.now() })), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (
      !attempt ||
      !(attempt.status === 'FINALIZING' || (attempt.status === 'IN_PROGRESS' && expired))
    )
      return;
    const timer = setTimeout(
      () => {
        void mutateAsync({
          path: `me/assignment-submissions/${attempt.attemptId}/result`,
          method: 'GET',
        })
          .then(accept)
          .catch(() => setMessage('Chưa tải được kết quả. Bấm tải lại để kiểm tra.'));
      },
      (attempt.retryAfterSeconds ?? 2) * 1000,
    );
    return () => clearTimeout(timer);
  }, [attempt, expired, mutateAsync, accept]);
  async function act(action: 'start' | 'answers' | 'submit' | 'reload') {
    setMessage('');
    try {
      if (action === 'start') {
        const value = await command.mutateAsync({
          path: `me/assignments/${props.assignment.id}/start`,
          method: 'POST',
          body: { expectedAssignmentRevision: props.assignment.revision },
        });
        accept(value);
        if (value.status === 'GRADED' && !value.result)
          accept(
            await command.mutateAsync({
              path: `me/assignment-submissions/${value.attemptId}/result`,
              method: 'GET',
            }),
          );
      } else if (attempt) {
        const value = await command.mutateAsync({
          path: `me/assignment-submissions/${attempt.attemptId}${action === 'reload' ? '/result' : `/${action}`}`,
          method: action === 'reload' ? 'GET' : action === 'answers' ? 'PUT' : 'POST',
          body: action === 'reload' ? undefined : { expectedVersion: attempt.version, answers },
        });
        accept(value);
        if (value.status === 'GRADED' && !value.result)
          accept(
            await command.mutateAsync({
              path: `me/assignment-submissions/${value.attemptId}/result`,
              method: 'GET',
            }),
          );
        if (action === 'answers') setMessage('Đã lưu đáp án. Bạn có thể tiếp tục làm bài.');
      }
    } catch {
      setMessage(
        'Chưa hoàn tất yêu cầu. Đáp án bạn chọn vẫn còn trên màn hình. Thử lại; nếu phiên đã thay đổi, tải lại bài trước khi tiếp tục.',
      );
    }
  }
  const a = props.assignment;
  const busy = command.isPending;
  const editable = attempt?.status === 'IN_PROGRESS' && !expired && !busy;
  return (
    <div className="space-y-5 border-t border-line pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-bold">{a.title}</h4>
        <Button variant="ghost" disabled={busy} onClick={props.onClose}>
          Đóng
        </Button>
      </div>
      <p className="whitespace-pre-wrap text-sm">
        {a.description || 'Chọn một đáp án cho mỗi câu hỏi.'}
      </p>
      {!attempt ? (
        <>
          <p className="text-sm text-muted">
            Bạn có 1 lượt làm bài.{' '}
            {a.timeLimitMinutes
              ? `Thời gian ${a.timeLimitMinutes} phút tính từ lúc bắt đầu, vẫn tiếp tục khi đóng trang.`
              : 'Có thể lưu đáp án và quay lại tiếp tục trước hạn nộp.'}{' '}
            Bấm nộp bài để chốt đáp án và nhận kết quả.
          </p>
          <Button disabled={busy || a.type !== 'QUIZ'} onClick={() => void act('start')}>
            Bắt đầu / tiếp tục bài làm
          </Button>
        </>
      ) : (
        <>
          <p role="status" className="rounded-lg bg-soft p-3 text-sm font-bold">
            {attempt.status === 'GRADED'
              ? 'Đã nộp · Đã chấm điểm'
              : attempt.status === 'VOIDED'
                ? 'Bài làm không còn hiệu lực'
                : expired || attempt.status === 'FINALIZING'
                  ? 'Đang chốt bài và chấm điểm…'
                  : `Đang làm · Đã chọn ${answers.length}/${attempt.totalQuestions} câu`}
            {deadline && attempt.status === 'IN_PROGRESS' && !expired
              ? ` · Còn ${Math.ceil((deadline - clock.now - clock.offset) / 60000)} phút`
              : ''}
          </p>
          {attempt.questions.map((q, i) => (
            <fieldset
              key={q.id}
              disabled={!editable}
              className="space-y-2 rounded-xl border border-line p-4"
            >
              <legend className="px-1 font-bold">
                Câu {i + 1}. {q.prompt}
              </legend>
              {q.options.map((o) => (
                <label
                  key={o.label}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-soft/50 p-3 text-sm"
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers.some(
                      (v) => v.questionId === q.id && v.selectedOption === o.label,
                    )}
                    onChange={() =>
                      setAnswers([
                        ...answers.filter((v) => v.questionId !== q.id),
                        { questionId: q.id, selectedOption: o.label },
                      ])
                    }
                  />
                  <span>
                    {o.label}. {o.text}
                  </span>
                </label>
              ))}
              {attempt.result && (
                <p className="text-sm font-bold text-forest">
                  Đáp án đúng:{' '}
                  {attempt.result.results.find((r) => r.questionId === q.id)?.correctOption}
                </p>
              )}
            </fieldset>
          ))}
          {editable && (
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => void act('answers')}>
                Lưu đáp án
              </Button>
              <Button
                onClick={() => {
                  if (
                    window.confirm(
                      `Nộp bài với ${answers.length}/${attempt.totalQuestions} câu đã trả lời? Sau khi nộp không thể sửa đáp án.`,
                    )
                  )
                    void act('submit');
                }}
              >
                Nộp bài
              </Button>
            </div>
          )}
          {attempt.result && (
            <div className="rounded-xl bg-soft p-4" role="status">
              <h4 className="font-extrabold">
                Kết quả: {attempt.result.score}/{attempt.result.maxScore}
              </h4>
              <p className="mt-2 text-sm">
                Đúng {attempt.result.correctCount}/{attempt.result.totalQuestions} câu · Đã trả lời{' '}
                {attempt.result.answeredCount} câu
              </p>
            </div>
          )}
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              if (
                JSON.stringify(answers) !== JSON.stringify(attempt.answers) &&
                !window.confirm('Tải lại sẽ thay đáp án chưa lưu bằng bản trên hệ thống. Tiếp tục?')
              )
                return;
              void act('reload');
            }}
          >
            Tải lại bài / kết quả
          </Button>
        </>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
