'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { AdminMentorPicker } from '@/features/admin/components/admin-mentor-picker';
import { ApiError } from '@/lib/api/client';
import {
  useAssignSessionMentor,
  useSessionMentorCandidates,
} from '../api/teaching-assignment-queries';
import type {
  SessionMentorIntent,
  TeachingSession,
} from '../schemas/teaching-assignment-contracts';

export function teachingTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

export function SessionMentorForm(props: {
  session: TeachingSession;
  editable: boolean;
  refresh: () => Promise<unknown>;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [composing, setComposing] = useState(false);
  const [selected, setSelected] = useState('');
  const [clear, setClear] = useState(false);
  const [reason, setReason] = useState('');
  const [intent, setIntent] = useState<SessionMentorIntent | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const candidates = useSessionMentorCandidates(props.session.sessionId, page, search, true);
  const mutation = useAssignSessionMentor(props.session.sessionId, props.session.classId);
  const locked = uncertain || mutation.isPending;
  const chosen = candidates.data?.items.find((item) => item.id === selected && !item.isCurrent);
  const waiting = input.trim() !== search || composing;
  const versionChanged =
    candidates.data && candidates.data.sessionVersion !== props.session.version;
  const ready =
    props.editable &&
    !candidates.isError &&
    !candidates.isFetching &&
    candidates.data &&
    !waiting &&
    !versionChanged &&
    reason.trim() &&
    (clear || chosen);

  useEffect(() => {
    if (composing) return;
    const timer = window.setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [input, composing]);

  async function reload() {
    const result = await candidates.refetch();
    await props.refresh();
    if (result.isSuccess) {
      setSelected('');
      setClear(false);
      setIntent(null);
      setStale(false);
      setError('');
      setConfirming(false);
    } else setError('Không tải được danh sách. Vui lòng thử lại.');
  }
  async function submit() {
    if (!intent || submitting.current || stale) return;
    submitting.current = true;
    setError('');
    try {
      await mutation.mutateAsync(intent);
      props.onSaved(
        intent.body.mentorId === null
          ? 'Đã gỡ dạy thay. Buổi học trở về mentor chính.'
          : `Đã phân công ${intent.name} dạy thay.`,
      );
    } catch (failure) {
      const unknown =
        !(failure instanceof ApiError) || failure.status >= 500 || failure.status === 0;
      setUncertain(unknown);
      setStale(!unknown);
      setError(
        unknown
          ? 'Chưa xác định kết quả lưu. Thử lại để kiểm tra cùng yêu cầu.'
          : failure instanceof ApiError && [401, 403].includes(failure.status)
            ? 'Quyền truy cập đã thay đổi. Hãy đăng nhập lại trước khi tiếp tục.'
            : 'Phân công hoặc lịch trống đã thay đổi. Tải lại danh sách và chọn lại.',
      );
    } finally {
      submitting.current = false;
    }
  }

  return (
    <div className="mt-4 space-y-4 border-t border-line pt-4">
      {!props.editable && !uncertain && (
        <p role="status" className="text-sm leading-6">
          Không thể đổi phân công với trạng thái buổi học hoặc dữ liệu hiện tại. Hãy tải lại lịch
          hoặc chọn buổi khác.
        </p>
      )}
      <AdminMentorPicker
        label="Mentor dạy thay"
        query={candidates}
        search={input}
        selected={selected}
        disabled={locked || clear}
        waiting={waiting}
        onComposing={setComposing}
        onSearch={(value) => {
          setInput(value);
          setSelected('');
          setIntent(null);
        }}
        onSelect={(id) => {
          setSelected(id);
          setIntent(null);
        }}
        onPage={(next) => {
          setPage(next);
          setSelected('');
        }}
      />
      <p className="text-xs leading-5 text-muted">
        Danh sách đã kiểm tra lịch dạy và khoảng nghỉ được duyệt. Cần thống nhất với mentor trước
        khi phân công.
      </p>
      {props.session.assignmentType === 'SUBSTITUTE' && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={clear}
            disabled={locked}
            onChange={(event) => {
              setClear(event.target.checked);
              setSelected('');
              setIntent(null);
            }}
            className="size-4 accent-forest"
          />
          Gỡ dạy thay, giao lại cho {props.session.primaryMentor.displayName || 'mentor chính'}
        </label>
      )}
      <label className="grid gap-2 text-sm font-bold">
        Lý do phân công <span className="sr-only">(bắt buộc)</span>
        <textarea
          rows={2}
          required
          maxLength={1000}
          value={reason}
          disabled={locked}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Ví dụ: Mentor phụ trách bận đột xuất"
          className="w-full rounded-lg border border-line bg-canvas p-3 font-normal outline-none placeholder:text-muted focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint/20 disabled:opacity-60"
        />
      </label>
      {versionChanged && !uncertain && (
        <p role="alert" className="text-sm">
          Lịch buổi học đã thay đổi.{' '}
          <Button type="button" variant="link" onClick={reload}>
            Tải lại buổi học
          </Button>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          ref={trigger}
          type="button"
          disabled={mutation.isPending || (!uncertain && !ready)}
          onClick={() => {
            if (!uncertain && candidates.data && (clear || chosen)) {
              const target = clear
                ? { id: null, name: props.session.primaryMentor.displayName || 'Mentor chính' }
                : chosen
                  ? { id: chosen.id, name: chosen.displayName }
                  : null;
              if (!target) return;
              setIntent({
                key: crypto.randomUUID(),
                name: target.name,
                body: {
                  mentorId: target.id,
                  reason: reason.trim(),
                  expectedVersion: candidates.data.sessionVersion,
                },
              });
              setStale(false);
              setError('');
            }
            setConfirming(true);
          }}
        >
          {uncertain ? 'Kiểm tra lại yêu cầu' : 'Tiếp tục'}
        </Button>
        <Button type="button" variant="outline" disabled={locked} onClick={props.onClose}>
          Hủy
        </Button>
      </div>
      <AlertDialog
        open={confirming}
        onOpenChange={(next) => {
          if (!mutation.isPending) setConfirming(next);
        }}
      >
        <AlertDialogContent
          className="admin-typography max-h-[90dvh] overflow-y-auto"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {intent?.body.mentorId === null
                ? 'Gỡ phân công dạy thay?'
                : 'Xác nhận mentor dạy thay?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {intent?.name} sẽ dạy buổi “{props.session.title}”,{' '}
              {teachingTime(props.session.startsAt)} – {teachingTime(props.session.endsAt)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="break-words text-sm leading-6">Lý do: {intent?.body.reason}</p>
          {props.session.status === 'IN_PROGRESS' && (
            <p className="text-sm leading-6">
              Buổi đang học. Quyền thao tác buổi sẽ chuyển sang mentor vừa được phân công.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm leading-6 text-forest">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>Quay lại</AlertDialogCancel>
            {stale ? (
              <Button type="button" onClick={reload}>
                Tải lại danh sách
              </Button>
            ) : (
              <Button type="button" disabled={mutation.isPending} onClick={submit}>
                {mutation.isPending ? 'Đang lưu…' : uncertain ? 'Thử lại' : 'Xác nhận phân công'}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
