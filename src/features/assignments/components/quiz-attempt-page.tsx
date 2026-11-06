'use client';
import { useEffect, useRef, useState } from 'react';
import { Clock3, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest, ApiError } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { sessionSignal } from '@/lib/api/session-coordinator';
import { useAssignmentQuery } from '../api/assignment-queries';
import { QuizSession } from '../api/quiz-session';
import * as dto from '../schemas/assignment-contracts';
import {
  AssignmentHeading,
  QueryState,
  Status,
  ErrorNotice,
  Confirm,
  assignmentRootClass,
  panelClass,
} from './assignment-ui';

export function QuizAttemptPage(props: { submissionId: string }) {
  const valid = dto.uuid.safeParse(props.submissionId).success;
  const query = useAssignmentQuery(
    `me/assignment-submissions/${props.submissionId}`,
    dto.attemptSchema,
    valid,
  );
  if (!valid) return <p>Không tìm thấy bài làm.</p>;
  return (
    <div className={assignmentRootClass}>
      <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>
        {query.data && <QuizAttempt key={query.data.attemptId} initial={query.data} />}
      </QueryState>
    </div>
  );
}
function QuizAttempt(props: { initial: dto.Attempt }) {
  const [attempt, setAttempt] = useState(props.initial);
  const [error, setError] = useState<unknown>(null);
  const [confirm, setConfirm] = useState(false);
  const [reload, setReload] = useState(false);
  const [tick, setTick] = useState(0);
  const [, render] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pollEnded, setPollEnded] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);
  const router = useRouter();
  const controller = useRef<AbortController | null>(null);
  const clock = useRef({ server: Date.parse(props.initial.serverNow), monotonic: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [engine, setEngine] = useState(
    () => new QuizSession(props.initial, write, () => render((n) => n + 1)),
  );
  async function write(input: {
    submit: boolean;
    expectedVersion: number;
    answers: dto.Answer[];
    key: string;
  }) {
    const signal = controller.current?.signal;
    signal?.throwIfAborted();
    if (
      props.initial.expiresAt &&
      clock.current.server + performance.now() - clock.current.monotonic >=
        Date.parse(props.initial.expiresAt)
    ) {
      setAttempt((previous) => ({ ...previous, status: 'FINALIZING' }));
      throw new ApiError(409, 'ASSIGNMENT_DEADLINE_PASSED', 'Đã hết thời gian làm bài.');
    }
    const result = await apiRequest({
      path: `me/assignment-submissions/${props.initial.attemptId}/${input.submit ? 'submit' : 'answers'}`,
      method: input.submit ? 'POST' : 'PUT',
      body: { expectedVersion: input.expectedVersion, answers: input.answers },
      schema: dto.attemptSchema,
      idempotencyKey: input.key,
      signal,
    });
    clock.current = { server: Date.parse(result.serverNow), monotonic: performance.now() };
    setAttempt(result);
    return result;
  }
  useEffect(() => {
    const local = new AbortController();
    controller.current = local;
    clock.current.monotonic = performance.now();
    const session = sessionSignal();
    const stop = () => {
      local.abort();
      if (timer.current) clearTimeout(timer.current);
    };
    // Only an ended auth session blocks editing; Strict Mode also runs effect cleanup on mount.
    const endSession = () => {
      engine.blocked = true;
      stop();
      render((n) => n + 1);
    };
    if (session.aborted) endSession();
    else session.addEventListener('abort', endSession, { once: true });
    const interval = setInterval(() => setTick((n) => n + 1), 500);
    const unload = (e: BeforeUnloadEvent) => {
      if (engine.dirty || engine.saving) e.preventDefault();
    };
    window.addEventListener('beforeunload', unload);
    const navigate = (event: MouseEvent) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
        return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === '_blank' ||
        anchor.origin !== location.origin ||
        anchor.getAttribute('href')?.startsWith('#') ||
        (!engine.dirty && !engine.saving)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setLeaving(anchor.pathname + anchor.search + anchor.hash);
    };
    document.addEventListener('click', navigate, true);
    const currentUrl = location.href;
    const currentRoute = history.state;
    const navigation =
      'navigation' in window && window.navigation instanceof EventTarget ? window.navigation : null;
    const traverse = (event: Event) => {
      if (
        (!engine.dirty && !engine.saving) ||
        !event.cancelable ||
        !('navigationType' in event) ||
        event.navigationType !== 'traverse' ||
        !('destination' in event) ||
        !event.destination ||
        typeof event.destination !== 'object' ||
        !('url' in event.destination) ||
        typeof event.destination.url !== 'string'
      )
        return;
      const target = new URL(event.destination.url);
      if (target.origin !== location.origin || target.href === location.href) return;
      event.preventDefault();
      setLeaving(target.pathname + target.search + target.hash);
    };
    navigation?.addEventListener('navigate', traverse);
    const back = (event: PopStateEvent) => {
      if (!engine.dirty && !engine.saving) return;
      const target = location.pathname + location.search + location.hash;
      if (location.href === currentUrl) return;
      event.stopImmediatePropagation();
      history.pushState(currentRoute, '', currentUrl);
      setLeaving(target);
    };
    if (!navigation) window.addEventListener('popstate', back, true);
    return () => {
      stop();
      clearInterval(interval);
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', navigate, true);
      window.removeEventListener('popstate', back, true);
      navigation?.removeEventListener('navigate', traverse);
      session.removeEventListener('abort', endSession);
    };
  }, [engine]);
  const elapsed =
    typeof performance === 'undefined' || !clock.current.monotonic
      ? 0
      : performance.now() - clock.current.monotonic;
  const remaining =
    attempt.expiresAt === null
      ? null
      : Math.max(
          0,
          Math.ceil((Date.parse(attempt.expiresAt) - clock.current.server - elapsed) / 1000),
        );
  const expired = remaining === 0;
  const active = attempt.status === 'IN_PROGRESS' && !expired;
  useEffect(() => {
    if (!active || !engine.dirty || engine.blocked || engine.submitting) return;
    const timeout = setTimeout(() => {
      void engine.flush().catch(setError);
    }, 800);
    timer.current = timeout;
    return () => clearTimeout(timeout);
  }, [engine, active, engine.answers, engine.dirty, engine.blocked, engine.submitting]);
  useEffect(() => {
    const local = new AbortController();
    async function sync() {
      if (engine.saving || engine.submitting || !active) return;
      const observedVersion = engine.version;
      try {
        const result = await apiRequest({
          path: `me/assignment-submissions/${attempt.attemptId}`,
          schema: dto.attemptSchema,
          signal: local.signal,
        });
        if (engine.saving || engine.submitting || engine.version !== observedVersion) return;
        clock.current = { server: Date.parse(result.serverNow), monotonic: performance.now() };
        if (result.version !== engine.version) {
          engine.blocked = true;
          setError(new Error('Phiên bản đã thay đổi.'));
        }
        setAttempt(result);
      } catch (e) {
        if (!local.signal.aborted) setError(e);
      }
    }
    window.addEventListener('focus', sync);
    return () => {
      local.abort();
      window.removeEventListener('focus', sync);
    };
  }, [active, attempt.attemptId, engine]);
  useEffect(() => {
    if (active || attempt.status === 'VOIDED' || (attempt.status === 'GRADED' && attempt.result))
      return;
    const local = new AbortController();
    const start = performance.now();
    let timeout: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const result = await apiRequest({
          path: `me/assignment-submissions/${attempt.attemptId}/result`,
          schema: dto.attemptSchema,
          signal: local.signal,
        });
        if (local.signal.aborted) return;
        setAttempt(result);
        if (result.status === 'GRADED' || result.status === 'VOIDED') return;
        if (performance.now() - start >= 60_000) {
          setPollEnded(true);
          return;
        }
        timeout = setTimeout(poll, Math.min(10, Math.max(1, result.retryAfterSeconds ?? 2)) * 1000);
      } catch (e) {
        if (!local.signal.aborted) {
          setError(e);
          setPollEnded(true);
        }
      }
    }
    void poll();
    return () => {
      local.abort();
      clearTimeout(timeout);
    };
  }, [active, attempt.attemptId, attempt.status, attempt.result]);
  void tick;
  async function readSaved() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await apiRequest({
        path: `me/assignment-submissions/${attempt.attemptId}`,
        schema: dto.attemptSchema,
      });
      clock.current = { server: Date.parse(result.serverNow), monotonic: performance.now() };
      setAttempt(result);
      setEngine(new QuizSession(result, write, () => render((n) => n + 1)));
      setError(null);
      setReload(false);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AssignmentHeading
        title={attempt.result ? 'Kết quả bài làm' : 'Bài trắc nghiệm'}
        back={`/user/assignments/${attempt.assignmentId}`}
      />
      <div className={`${panelClass} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <Status
            value={expired && attempt.status === 'IN_PROGRESS' ? 'FINALIZING' : attempt.status}
          />
          <span className="text-sm">
            {engine.answers.length}/{attempt.totalQuestions} câu đã chọn
          </span>
        </div>
        {remaining !== null && active && (
          <span className="flex items-center gap-2 font-bold tabular-nums">
            <Clock3 size={18} />
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </span>
        )}
        <span role="status" className="text-sm text-muted">
          {engine.blocked
            ? 'Cần kiểm tra bản đã lưu'
            : engine.saving
              ? 'Đang lưu…'
              : engine.dirty
                ? 'Chưa lưu'
                : 'Đã lưu'}
        </span>
      </div>
      <ErrorNotice error={error} />
      {attempt.result && (
        <section className={`${panelClass} flex flex-wrap items-center gap-5`}>
          <CheckCircle2 className="size-10 text-mint" />
          <div>
            <p className="text-sm text-muted">Điểm của bạn</p>
            <p className="text-3xl font-extrabold text-forest">
              {attempt.result.score}
              <span className="text-lg text-muted"> / {attempt.result.maxScore}</span>
            </p>
          </div>
          <p>
            {attempt.result.correctCount}/{attempt.result.totalQuestions} câu đúng
          </p>
        </section>
      )}
      {!active && !attempt.result && attempt.status !== 'VOIDED' && (
        <section className={panelClass}>
          <p>
            {pollEnded
              ? 'Chưa có kết quả. Bạn có thể kiểm tra lại.'
              : 'Bài đang được chấm. Đáp án đã lưu sẽ được dùng để tính điểm.'}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={async () => {
              try {
                const result = await apiRequest({
                  path: `me/assignment-submissions/${attempt.attemptId}/result`,
                  schema: dto.attemptSchema,
                });
                setAttempt(result);
                setError(null);
              } catch (e) {
                setError(e);
              }
            }}
          >
            Kiểm tra kết quả
          </Button>
        </section>
      )}
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0 space-y-5">
          {attempt.questions.map((q, index) => {
            const result = attempt.result?.results.find((r) => r.questionId === q.id);
            const incorrect = result?.isCorrect === false;
            const questionTone = incorrect ? 'text-status-red' : '';
            return (
              <fieldset
                id={`question-${q.id}`}
                key={q.id}
                disabled={!active || engine.blocked || engine.submitting || confirm}
                className={`${panelClass} scroll-mt-5 space-y-3`}
              >
                <legend className="sr-only">Câu {index + 1}</legend>
                <h2 className={`font-extrabold ${questionTone}`}>Câu {index + 1}</h2>
                <p className={`whitespace-pre-wrap break-words ${questionTone}`}>{q.prompt}</p>
                {q.options.map((option) => {
                  const selected = engine.answers.some(
                    (a) => a.questionId === q.id && a.selectedOption === option.label,
                  );
                  const showCorrectAnswer = incorrect && result.correctOption === option.label;
                  let optionTone = selected ? 'border-mint bg-mint/10' : 'border-line';
                  if (showCorrectAnswer) {
                    optionTone = 'border-status-red/30 bg-status-red/8 font-bold text-status-red';
                  }
                  return (
                    <label
                      key={option.label}
                      className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border p-3 ${optionTone}`}
                    >
                      <input
                        className="mt-1 accent-mint"
                        type="radio"
                        name={q.id}
                        checked={selected}
                        onChange={() => engine.select(q.id, option.label)}
                      />
                      <span className="min-w-0 whitespace-pre-wrap break-words">
                        <strong>{option.label}.</strong> {option.text}
                      </span>
                    </label>
                  );
                })}
                {result && (
                  <p className={`font-bold ${incorrect ? 'text-status-red' : 'text-forest'}`}>
                    {result.isCorrect ? 'Đúng' : `Sai · Đáp án đúng: ${result.correctOption}`}
                  </p>
                )}
              </fieldset>
            );
          })}
        </div>
        <aside className={`${panelClass} h-fit space-y-4 lg:sticky lg:top-5`}>
          <h2 className="font-extrabold">Các câu hỏi</h2>
          <nav aria-label="Các câu hỏi" className="flex flex-wrap gap-2">
            {attempt.questions.map((q, i) => (
              <a
                key={q.id}
                href={`#question-${q.id}`}
                className={`flex size-11 items-center justify-center rounded-lg border text-sm font-bold ${engine.answers.some((a) => a.questionId === q.id) ? 'border-mint bg-mint/10' : 'border-line'}`}
                aria-label={`Câu ${i + 1}${engine.answers.some((a) => a.questionId === q.id) ? ', đã chọn' : ', chưa chọn'}`}
              >
                {i + 1}
              </a>
            ))}
          </nav>
          {active && (
            <Button
              className="w-full"
              disabled={engine.blocked || engine.submitting}
              onClick={() => setConfirm(true)}
            >
              Nộp bài
            </Button>
          )}
          {engine.blocked && (
            <Button variant="outline" onClick={() => setReload(true)}>
              Tải lại bài đã lưu
            </Button>
          )}
        </aside>
      </div>
      {confirm && (
        <Confirm
          title="Nộp bài trắc nghiệm?"
          busy={engine.submitting}
          error={error}
          disabled={engine.answers.length !== attempt.totalQuestions || !active || engine.blocked}
          onClose={() => setConfirm(false)}
          label="Xác nhận nộp bài"
          onConfirm={async () => {
            if (timer.current) clearTimeout(timer.current);
            try {
              const result = await engine.submit();
              if (result) {
                setAttempt(result);
                setError(null);
                setConfirm(false);
              }
            } catch (e) {
              setError(e);
            }
          }}
        >
          <p>
            {engine.answers.length === attempt.totalQuestions
              ? 'Sau khi nộp, bạn không thể sửa đáp án.'
              : `Còn ${attempt.totalQuestions - engine.answers.length} câu chưa chọn. Hãy hoàn tất trước khi nộp.`}
          </p>
        </Confirm>
      )}
      {leaving && (
        <Confirm
          title="Rời bài đang làm?"
          busy={false}
          label="Rời bài"
          onClose={() => setLeaving(null)}
          onConfirm={() => {
            if (leaving) router.push(leaving);
          }}
        >
          <p>Đáp án chưa lưu có thể bị mất. Bạn có thể ở lại để chờ lưu xong.</p>
        </Confirm>
      )}
      {reload && (
        <Confirm
          title="Dùng bản đã lưu?"
          busy={busy}
          error={error}
          onClose={() => setReload(false)}
          onConfirm={readSaved}
        >
          <p>Những lựa chọn chưa lưu trên màn hình sẽ được thay bằng bản trên máy chủ.</p>
        </Confirm>
      )}
    </>
  );
}
