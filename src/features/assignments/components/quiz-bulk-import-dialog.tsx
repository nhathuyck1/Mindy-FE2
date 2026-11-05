'use client';
import { useState } from 'react';
import { Download, FileUp, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import {
  maxQuizBulkBytes,
  parseQuizBulk,
  quizBulkExample,
  type QuizBulkResult,
} from '../lib/quiz-bulk-import';
import type { QuestionInput } from '../schemas/assignment-contracts';

export function QuizBulkImportDialog(props: {
  open: boolean;
  disabled: boolean;
  existingCount: number;
  onClose: () => void;
  onImport: (questions: QuestionInput[], replace: boolean) => void;
}) {
  const [source, setSource] = useState('');
  const [result, setResult] = useState<QuizBulkResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [replace, setReplace] = useState(false);
  if (!props.open) return null;
  const total = (replace ? 0 : props.existingCount) + (result?.questions.length ?? 0);
  const canImport =
    !!result?.questions.length &&
    !result.errors.length &&
    total <= 200 &&
    !reading &&
    !props.disabled;
  return (
    <Modal
      title="Nhập câu hỏi hàng loạt"
      onClose={props.onClose}
      contentClassName="assignment-workspace flex max-w-4xl flex-col overflow-hidden sm:max-w-4xl"
    >
      <div className="grid min-h-0 min-w-0 flex-1 gap-6 overflow-y-auto p-5 sm:p-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <p className="text-sm text-muted">
            Dán nhiều câu hỏi hoặc chọn tệp .txt UTF-8. Mỗi câu cần đủ A, B, C, D và một dòng đáp án
            đúng.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 text-sm font-bold text-forest focus-within:ring-2 focus-within:ring-mint">
              <FileUp size={16} aria-hidden="true" />
              {reading ? 'Đang đọc tệp…' : 'Chọn tệp .txt'}
              <input
                type="file"
                accept=".txt,text/plain"
                aria-label="Chọn tệp câu hỏi .txt"
                disabled={reading || props.disabled}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  setFileError(null);
                  setResult(null);
                  if (!file.name.toLowerCase().endsWith('.txt') || file.size > maxQuizBulkBytes) {
                    setFileError('Chọn tệp .txt UTF-8 không quá 8 MiB.');
                    return;
                  }
                  setReading(true);
                  try {
                    const text = new TextDecoder('utf-8', { fatal: true }).decode(
                      await file.arrayBuffer(),
                    );
                    setSource(text);
                  } catch {
                    setFileError('Không đọc được tệp. Hãy lưu dưới dạng văn bản UTF-8 và thử lại.');
                  } finally {
                    setReading(false);
                  }
                }}
              />
            </label>
            <Button asChild variant="ghost">
              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(quizBulkExample)}`}
                download="mau-cau-hoi-abcd.txt"
              >
                <Download size={16} aria-hidden="true" /> Tải mẫu
              </a>
            </Button>
          </div>
          <details className="text-sm">
            <summary className="min-h-11 cursor-pointer py-3 font-bold text-mint">
              Xem định dạng mẫu
            </summary>
            <pre className="rounded-lg bg-soft p-4 font-mono text-xs whitespace-pre-wrap break-words">
              {quizBulkExample}
            </pre>
          </details>
          <label className="grid gap-2 text-sm font-bold">
            Nội dung câu hỏi
            <Textarea
              value={source}
              rows={13}
              placeholder={quizBulkExample}
              disabled={reading || props.disabled}
              className="font-mono text-sm"
              onChange={(event) => {
                setSource(event.target.value);
                setResult(null);
                setFileError(null);
              }}
            />
          </label>
          {fileError && (
            <p role="alert" className="text-sm text-headsup">
              {fileError}
            </p>
          )}
          <Button
            variant="outline"
            disabled={!source.trim() || reading || props.disabled}
            onClick={() => setResult(parseQuizBulk(source))}
          >
            <ListChecks size={16} aria-hidden="true" /> Kiểm tra & xem trước
          </Button>
        </div>
        <div className="min-w-0 space-y-4 border-t border-line pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <h3 className="text-lg font-extrabold">Xem trước câu hỏi</h3>
          {!result && (
            <p className="text-sm text-muted">
              Kiểm tra nội dung để xem câu hỏi và đáp án đúng trước khi thêm.
            </p>
          )}
          {result && result.errors.length > 0 && (
            <div role="alert" className="space-y-2 rounded-lg bg-coral/10 p-4 text-sm">
              <p className="font-bold">Cần sửa {result.errors.length} lỗi trước khi nhập.</p>
              <ul className="list-disc space-y-1 pl-4">
                {result.errors.slice(0, 20).map((error, index) => (
                  <li key={index}>
                    Dòng {error.line}: {error.message}
                  </li>
                ))}
              </ul>
              {result.errors.length > 20 && <p>Và {result.errors.length - 20} lỗi khác.</p>}
            </div>
          )}
          {!!result?.questions.length && (
            <>
              <p role="status" className="text-sm font-bold text-forest">
                {result.questions.length} câu hỏi hợp lệ
              </p>
              <div className="max-h-80 divide-y divide-line overflow-y-auto">
                {result.questions.map((question, index) => (
                  <details key={index} className="py-3">
                    <summary className="cursor-pointer font-bold whitespace-pre-wrap break-words">
                      Câu {index + 1}. {question.prompt}
                    </summary>
                    <ul className="mt-3 space-y-2 text-sm">
                      {question.options.map((option) => (
                        <li
                          key={option.label}
                          className={`rounded-lg p-2 whitespace-pre-wrap break-words ${option.label === question.correctOption ? 'bg-mint/10 font-bold text-forest' : ''}`}
                        >
                          {option.label}. {option.text}
                          {option.label === question.correctOption ? ' · Đáp án đúng' : ''}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </>
          )}
          {props.existingCount > 0 && (
            <fieldset className="space-y-2 border-t border-line pt-4 text-sm">
              <legend className="sr-only">Cách nhập câu hỏi</legend>
              <label className="flex min-h-11 cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="quiz-bulk-mode"
                  className="accent-mint"
                  checked={!replace}
                  onChange={() => setReplace(false)}
                />
                Thêm vào cuối {props.existingCount} câu hiện có
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="quiz-bulk-mode"
                  className="accent-mint"
                  checked={replace}
                  onChange={() => setReplace(true)}
                />
                Thay toàn bộ {props.existingCount} câu hiện có
              </label>
            </fieldset>
          )}
          {total > 200 && (
            <p role="alert" className="text-sm text-headsup">
              Tổng {total} câu vượt giới hạn 200. Giảm số câu hoặc chọn thay toàn bộ.
            </p>
          )}
          <p className="text-sm text-muted">
            Câu hỏi được đưa vào trình soạn để chỉnh sửa. Nhấn “Lưu bộ câu hỏi” để lưu vào bài tập.
          </p>
        </div>
      </div>
      <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-line bg-canvas p-5">
        <Button variant="outline" onClick={props.onClose}>
          Hủy
        </Button>
        <Button
          disabled={!canImport}
          onClick={() => {
            if (canImport && result) {
              props.onImport(result.questions, replace);
              setSource('');
              setResult(null);
              setReplace(false);
            }
          }}
        >
          {replace ? 'Thay bằng' : 'Thêm'} {result?.questions.length || ''} câu hỏi
        </Button>
      </footer>
    </Modal>
  );
}
