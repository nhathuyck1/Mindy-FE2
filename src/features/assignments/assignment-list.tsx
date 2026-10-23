'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAssignments } from './api';
import { AssignmentEditor } from './assignment-editor';
import { QuizPlayer } from './quiz-player';
import type { Assignment } from './contracts';
export function AssignmentList(props: {
  classId?: string;
  sessionId: string;
  author?: boolean;
  readonly?: boolean;
}) {
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [creating, setCreating] = useState(false);
  const path = props.author
    ? `mentor/class-sessions/${props.sessionId}/assignments`
    : `me/classes/${props.classId}/assignments?sessionId=${props.sessionId}`;
  const query = useAssignments(path);
  return (
    <section
      className="space-y-4 rounded-xl border border-line p-4 sm:p-6"
      aria-label="Bài tập và bài kiểm tra"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold">Bài tập & bài kiểm tra</h3>
          <p className="mt-1 text-sm text-muted">
            {props.author
              ? 'Tạo bản nháp → soạn câu hỏi → phát hành cho học viên của buổi này.'
              : 'Đọc yêu cầu → làm bài → nộp bài → xem kết quả.'}
          </p>
        </div>
        {props.author && !props.readonly && (
          <Button
            onClick={() => {
              setCreating(true);
              setSelected(null);
            }}
          >
            Giao bài mới
          </Button>
        )}
      </div>
      {query.isPending ? (
        <p role="status">Đang tải bài tập…</p>
      ) : query.isError ? (
        <div role="alert">
          <p>Chưa tải được bài tập.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {query.data.length === 0 && (
            <li className="py-3 text-sm text-muted">
              {props.author
                ? 'Chưa có bài tập cho buổi này. Tạo bài mới để bắt đầu.'
                : 'Mentor chưa phát hành bài tập cho buổi này.'}
            </li>
          )}
          {query.data.map((item) => (
            <li key={item.id} className="space-y-2 py-4">
              <p className="text-xs font-bold text-mint">
                {item.purpose === 'HOMEWORK' ? 'BÀI TẬP VỀ NHÀ' : 'BÀI KIỂM TRA'} ·{' '}
                {item.status === 'DRAFT'
                  ? 'Bản nháp · Học viên chưa thấy'
                  : item.status === 'PUBLISHED'
                    ? 'Đã phát hành'
                    : 'Đã lưu trữ'}
              </p>
              <h4 className="font-bold">{item.title}</h4>
              <p className="text-sm text-muted">
                {item.dueAt
                  ? `Hạn nộp: ${new Date(item.dueAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (UTC+7)`
                  : 'Không đặt hạn nộp'}{' '}
                ·{' '}
                {item.timeLimitMinutes
                  ? `${item.timeLimitMinutes} phút`
                  : 'Không giới hạn thời gian'}{' '}
                · Điểm tối đa {item.maxScore}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelected(item);
                  setCreating(false);
                }}
              >
                {props.author ? 'Xem / soạn bài' : 'Xem yêu cầu / làm bài'}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {props.author && (creating || selected) && (
        <AssignmentEditor
          key={selected?.id ?? 'new'}
          sessionId={props.sessionId}
          assignment={selected}
          readonly={props.readonly}
          onClose={() => {
            setCreating(false);
            setSelected(null);
          }}
        />
      )}
      {!props.author && selected && (
        <QuizPlayer key={selected.id} assignment={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
