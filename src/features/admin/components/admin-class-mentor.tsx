'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AdminMentorPicker } from './admin-mentor-picker';
import { ApiError } from '@/lib/api/client';
import { useChangeClassMentor, useClassMentorCandidates } from '../api/admin-mentor-queries';
import type { AdminClassDetail } from '../schemas/admin-write-contracts';
import type { ClassMentorIntent } from '../schemas/admin-mentor-contracts';

export function AdminClassMentor(props: { classroom: AdminClassDetail; editable: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [composing, setComposing] = useState(false);
  useEffect(() => {
    if (composing) return;
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput, composing]);
  const [selected, setSelected] = useState('');
  const [reason, setReason] = useState('');
  const [intent, setIntent] = useState<ClassMentorIntent | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [stale, setStale] = useState(false);
  const [saved, setSaved] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const candidates = useClassMentorCandidates(props.classroom.id, page, search, expanded);
  const mutation = useChangeClassMentor(props.classroom.id);
  const chosen = candidates.data?.items.find((item) => item.id === selected && !item.isCurrent);
  const locked = uncertain || mutation.isPending;

  async function submit() {
    if (!intent || submitting.current || stale) return;
    submitting.current = true;
    setError('');
    try {
      const result = await mutation.mutateAsync(intent);
      setSaved(result.primaryMentor.displayName || intent.name);
      setOpen(false);
      setExpanded(false);
      setIntent(null);
      setUncertain(false);
      setSelected('');
      setReason('');
    } catch (failure) {
      const unknown =
        !(failure instanceof ApiError) || failure.status >= 500 || failure.status === 0;
      setUncertain(unknown);
      setStale(!unknown);
      setError(
        unknown
          ? 'Chưa xác định kết quả lưu. Bấm thử lại để kiểm tra cùng yêu cầu.'
          : 'Không thể đổi giảng viên. Tải lại danh sách để kiểm tra lịch và chọn lại.',
      );
    } finally {
      submitting.current = false;
    }
  }

  return (
    <section className="space-y-4 border-y border-line py-4" aria-label="Giảng viên phụ trách">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Giảng viên:{' '}
          <strong className="text-forest">
            {saved || props.classroom.mentor.displayName || 'Chưa cập nhật tên'}
          </strong>
        </p>
        {props.editable && (
          <Button
            type="button"
            variant="outline"
            disabled={locked}
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            Đổi giảng viên
          </Button>
        )}
      </div>
      {saved && (
        <p role="status" className="text-sm text-mint">
          Đã cập nhật giảng viên phụ trách.
        </p>
      )}
      {expanded && (
        <div className="space-y-4">
          <AdminMentorPicker
            query={candidates}
            search={searchInput}
            selected={selected}
            disabled={locked}
            waiting={searchInput.trim() !== search || composing}
            onComposing={setComposing}
            onSearch={(value) => {
              setSearchInput(value);
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
          <label className="grid gap-2 text-sm font-bold">
            Lý do thay đổi
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={locked}
              maxLength={1000}
              rows={2}
              className="w-full rounded-lg border border-line p-3 font-normal"
            />
          </label>
          <p className="text-sm text-muted">
            Chỉ đổi các buổi chưa bắt đầu. Giữ nguyên giảng viên dạy thay từng buổi.
          </p>
          <Button
            ref={trigger}
            type="button"
            disabled={
              !uncertain &&
              (!chosen ||
                !reason.trim() ||
                !candidates.data ||
                candidates.isFetching ||
                searchInput.trim() !== search ||
                composing)
            }
            onClick={() => {
              if (!uncertain && chosen && candidates.data) {
                setIntent({
                  key: crypto.randomUUID(),
                  name: chosen.displayName,
                  affectedSessionCount: candidates.data.affectedSessionCount,
                  body: {
                    mentorId: chosen.id,
                    reason: reason.trim(),
                    expectedVersion: candidates.data.assignmentVersion,
                  },
                });
                setStale(false);
                setError('');
              }
              setOpen(true);
            }}
          >
            {uncertain ? 'Kiểm tra lại yêu cầu' : 'Tiếp tục'}
          </Button>
        </div>
      )}
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!mutation.isPending) setOpen(next);
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
            <AlertDialogTitle>Đổi giảng viên phụ trách?</AlertDialogTitle>
            <AlertDialogDescription>
              {intent?.name} sẽ phụ trách {intent?.affectedSessionCount} buổi chưa bắt đầu của lớp “
              {props.classroom.name}”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="break-words text-sm text-muted">Lý do: {intent?.body.reason}</p>
          {error && (
            <p role="alert" className="text-sm text-headsup">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>Quay lại</AlertDialogCancel>
            {stale ? (
              <Button
                type="button"
                onClick={async () => {
                  const result = await candidates.refetch();
                  if (result.isSuccess) {
                    setSelected('');
                    setIntent(null);
                    setStale(false);
                    setError('');
                    setOpen(false);
                  } else setError('Không tải được danh sách. Vui lòng thử lại.');
                }}
              >
                Tải lại danh sách
              </Button>
            ) : (
              <Button type="button" disabled={mutation.isPending} onClick={submit}>
                {mutation.isPending ? 'Đang lưu…' : uncertain ? 'Thử lại' : 'Xác nhận đổi'}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
