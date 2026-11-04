import type { Answer, Attempt } from '../schemas/assignment-contracts';

type Write = (props: {
  submit: boolean;
  expectedVersion: number;
  answers: Answer[];
  key: string;
}) => Promise<Attempt>;
/** One write at a time. A failed/unknown write must be reconciled before another intention. */
export class QuizSession {
  answers: Answer[];
  version: number;
  dirty = false;
  blocked = false;
  submitting = false;
  private generation = 0;
  private running: Promise<void> | null = null;
  constructor(
    attempt: Attempt,
    private write: Write,
    private changed: () => void,
  ) {
    this.answers = attempt.answers;
    this.version = attempt.version;
  }
  select(questionId: string, selectedOption: Answer['selectedOption']) {
    if (this.blocked || this.submitting) return;
    this.answers = [
      ...this.answers.filter((a) => a.questionId !== questionId),
      { questionId, selectedOption },
    ];
    this.generation++;
    this.dirty = true;
    this.changed();
  }
  async flush() {
    if (this.running) return this.running;
    if (!this.dirty || this.blocked || this.submitting) return;
    const run = async () => {
      try {
        while (this.dirty && !this.blocked) {
          const generation = this.generation;
          const result = await this.write({
            submit: false,
            expectedVersion: this.version,
            answers: [...this.answers],
            key: crypto.randomUUID(),
          });
          this.version = result.version;
          this.dirty = this.generation !== generation;
          this.changed();
          if (result.status !== 'IN_PROGRESS') {
            this.blocked = true;
            break;
          }
        }
      } catch (e) {
        this.blocked = true;
        throw e;
      } finally {
        this.running = null;
        this.changed();
      }
    };
    this.running = run();
    this.changed();
    return this.running;
  }
  get saving() {
    return this.running !== null;
  }
  async submit() {
    if (this.submitting) return null;
    this.submitting = true;
    this.changed();
    try {
      if (this.running) await this.running;
      if (this.blocked) throw new Error('Cần tải lại bài đã lưu.');
      const result = await this.write({
        submit: true,
        expectedVersion: this.version,
        answers: [...this.answers],
        key: crypto.randomUUID(),
      });
      this.version = result.version;
      this.dirty = false;
      return result;
    } catch (e) {
      this.blocked = true;
      throw e;
    } finally {
      this.submitting = false;
      this.changed();
    }
  }
}
