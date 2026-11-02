'use client';
import { useState } from 'react';
import { ArrowLeft, FileText, Download, LoaderCircle, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { apiRequest } from '@/lib/api/client';
import { assignmentError } from '../api/assignment-queries';
import { downloadSchema, type Assignment } from '../schemas/assignment-contracts';

export const panelClass = 'min-w-0 rounded-2xl border border-line bg-canvas p-5 sm:p-6';
export const fieldClass = 'grid min-w-0 gap-2 text-sm font-bold';
export const assignmentRootClass =
  'assignment-workspace min-w-0 space-y-6 font-sans text-base text-ink';
export function dateLabel(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(new Date(value))
    : 'Không giới hạn';
}
export function AssignmentHeading(props: {
  title: string;
  back?: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="min-w-0 space-y-4">
      {props.back && (
        <Link
          href={props.back}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-mint"
        >
          <ArrowLeft size={18} />
          {props.backLabel ?? 'Bài tập'}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="min-w-0 text-2xl font-extrabold break-words sm:text-3xl">{props.title}</h1>
        {props.children}
      </div>
    </header>
  );
}
const statusLabels: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã giao',
  ARCHIVED: 'Đã lưu trữ',
  SUBMITTED: 'Đã nộp',
  IN_PROGRESS: 'Đang làm',
  FINALIZING: 'Đang chấm',
  GRADED: 'Đã chấm',
  VOIDED: 'Đã hủy',
  RELEASED: 'Đã trả điểm',
  READY: 'Tệp hợp lệ',
};
export function Status(props: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-soft px-3 py-1.5 text-sm font-bold text-forest">
      {['SUBMITTED', 'GRADED', 'RELEASED', 'READY'].includes(props.value) && (
        <Check size={14} aria-hidden="true" />
      )}
      {statusLabels[props.value] ?? props.value}
    </span>
  );
}
export function QueryState(props: {
  pending: boolean;
  error: unknown;
  retry: () => unknown;
  children?: React.ReactNode;
}) {
  if (props.pending)
    return (
      <div role="status" className={`${panelClass} flex items-center gap-3 text-muted`}>
        <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />
        Đang tải bài tập…
      </div>
    );
  if (props.error)
    return (
      <div className={panelClass}>
        <ErrorNotice error={props.error} />
        <Button variant="outline" className="mt-3" onClick={() => props.retry()}>
          Thử lại
        </Button>
      </div>
    );
  return props.children;
}
export function ErrorNotice(props: { error: unknown }) {
  return props.error ? (
    <p
      role="alert"
      className="rounded-lg border border-coral/40 bg-coral/10 p-3 text-sm break-words"
    >
      {assignmentError(props.error)}
    </p>
  ) : null;
}
export function Pager(props: {
  page: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
  hideCount?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(props.total / (props.pageSize ?? 20)));
  if (pages === 1) return null;
  return (
    <nav
      aria-label="Phân trang bài tập"
      className="flex flex-wrap items-center justify-between gap-3 pt-4"
    >
      <span className="text-sm text-muted">
        {!props.hideCount && `${props.total} mục · `}Trang {props.page}/{pages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={props.page <= 1}
          onClick={() => props.onChange(props.page - 1)}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          disabled={props.page >= pages}
          onClick={() => props.onChange(props.page + 1)}
        >
          Sau
        </Button>
      </div>
    </nav>
  );
}
export function Confirm(props: {
  title: string;
  children: React.ReactNode;
  busy: boolean;
  error?: unknown;
  onClose: () => void;
  onConfirm: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <Modal
      title={props.title}
      onClose={() => {
        if (!props.busy) props.onClose();
      }}
      contentClassName="assignment-workspace font-sans"
    >
      <div className="space-y-5 p-5">
        {props.children}
        <ErrorNotice error={props.error} />
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" disabled={props.busy} onClick={props.onClose}>
            Hủy
          </Button>
          <Button disabled={props.busy || props.disabled} onClick={props.onConfirm}>
            {props.busy ? 'Đang gửi…' : (props.label ?? 'Xác nhận')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
export function AssignmentMeta(props: { item: Assignment }) {
  const a = props.item;
  return (
    <div className={panelClass}>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Status value={a.status} />
        <span className="text-sm text-muted">
          {a.type === 'QUIZ' ? 'Trắc nghiệm' : 'Bài nộp ZIP'} ·{' '}
          {a.purpose === 'TEST' ? 'Kiểm tra' : 'Bài về nhà'}
        </span>
      </div>
      <dl className="grid gap-5 sm:grid-cols-3">
        {[
          ['Hạn nộp', dateLabel(a.dueAt)],
          ['Điểm tối đa', a.maxScore],
          [
            a.type === 'QUIZ' ? 'Thời gian làm bài' : 'Số lượt tối đa',
            a.type === 'QUIZ'
              ? a.timeLimitMinutes
                ? `${a.timeLimitMinutes} phút`
                : 'Không giới hạn'
              : `${a.maxAttempts} lượt`,
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      {a.description && (
        <p className="mt-5 border-t border-line pt-5 whitespace-pre-wrap break-words">
          {a.description}
        </p>
      )}
    </div>
  );
}
export function FileDownload(props: {
  file: { id: string; originalFilename: string; sizeBytes: number };
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function download() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await apiRequest({
        path: `assignment-files/${props.file.id}/download`,
        schema: downloadSchema,
      });
      const link = document.createElement('a');
      link.href = result.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.referrerPolicy = 'no-referrer';
      link.click();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-4">
        <FileText className="size-5 shrink-0 text-mint" />
        <div className="min-w-0 flex-1">
          <p className="font-bold break-all">{props.file.originalFilename}</p>
          <p className="text-sm text-muted">
            {props.file.sizeBytes < 1024
              ? `${props.file.sizeBytes} B`
              : props.file.sizeBytes < 1048576
                ? `${(props.file.sizeBytes / 1024).toFixed(1)} KB`
                : `${(props.file.sizeBytes / 1048576).toFixed(1)} MB`}
          </p>
        </div>
        <Button variant="outline" disabled={busy} onClick={download}>
          <Download size={16} />
          {busy ? 'Đang lấy tệp…' : 'Tải tệp'}
        </Button>
      </div>
      <ErrorNotice error={error} />
    </div>
  );
}
