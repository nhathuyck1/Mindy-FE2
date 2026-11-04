import { describe, expect, it, vi } from 'vitest';
import { QuizSession } from './quiz-session';
import { attemptSchema } from '../schemas/assignment-contracts';
import * as f from '../../../../tests/fixtures/assignment-data';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
describe('serialized quiz answers', () => {
  it('coalesces changes during a slow save and uses the acknowledged version', async () => {
    const first = deferred<ReturnType<typeof attemptSchema.parse>>();
    const write = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ ...attemptSchema.parse(f.attempt), version: 3 });
    const session = new QuizSession(attemptSchema.parse(f.attempt), write, () => undefined);
    session.select(f.ids.question, 'A');
    const saving = session.flush();
    session.select(f.ids.question, 'B');
    session.select(f.ids.question, 'D');
    expect(write).toHaveBeenCalledTimes(1);
    first.resolve({ ...attemptSchema.parse(f.attempt), version: 2 });
    await saving;
    expect(write.mock.calls[1][0]).toMatchObject({
      expectedVersion: 2,
      answers: [{ questionId: f.ids.question, selectedOption: 'D' }],
    });
    expect(session.answers[0].selectedOption).toBe('D');
    expect(session.dirty).toBe(false);
  });
  it('waits for save before submitting latest answers and locks further editing', async () => {
    const first = deferred<ReturnType<typeof attemptSchema.parse>>();
    const write = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ ...attemptSchema.parse(f.attempt), status: 'GRADED', version: 3 });
    const session = new QuizSession(attemptSchema.parse(f.attempt), write, () => undefined);
    session.select(f.ids.question, 'A');
    const saving = session.flush();
    const submitting = session.submit();
    session.select(f.ids.question, 'D');
    expect(write).toHaveBeenCalledTimes(1);
    first.resolve({ ...attemptSchema.parse(f.attempt), version: 2 });
    await saving;
    await submitting;
    expect(write.mock.calls[1][0]).toMatchObject({
      submit: true,
      expectedVersion: 2,
      answers: [{ questionId: f.ids.question, selectedOption: 'A' }],
    });
  });
  it('keeps unsaved answers and blocks submit after a conflict or unknown write', async () => {
    const write = vi.fn().mockRejectedValue(new Error('unknown outcome'));
    const session = new QuizSession(attemptSchema.parse(f.attempt), write, () => undefined);
    session.select(f.ids.question, 'B');
    await expect(session.flush()).rejects.toThrow();
    expect(session.answers[0].selectedOption).toBe('B');
    expect(session.blocked).toBe(true);
    await expect(session.submit()).rejects.toThrow('Cần tải lại');
    expect(write).toHaveBeenCalledTimes(1);
  });
});
