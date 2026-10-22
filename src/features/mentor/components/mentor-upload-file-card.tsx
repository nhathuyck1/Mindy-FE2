import { CheckCircle2, CircleSlash, FileText, LoaderCircle, XCircle } from 'lucide-react';

export type MentorUploadFile = { id: string; name: string; sizeBytes?: number };

export function MentorUploadFileCard(props: {
  file: { name: string; sizeBytes?: number };
  state: 'ready' | 'uploading' | 'failed' | 'cancelled';
  message?: string;
  action?: React.ReactNode;
}) {
  const state = {
    ready: {
      label: 'Tải lên thành công',
      tone: 'border-status-green/30 bg-status-green/5 text-status-green',
      icon: CheckCircle2,
    },
    uploading: {
      label: 'Đang tải lên',
      tone: 'border-mint/30 bg-mint/5 text-mint',
      icon: LoaderCircle,
    },
    failed: {
      label: 'Tải lên thất bại',
      tone: 'border-status-red/30 bg-status-red/5 text-status-red',
      icon: XCircle,
    },
    cancelled: {
      label: 'Đã hủy tải lên',
      tone: 'border-line bg-soft/40 text-muted',
      icon: CircleSlash,
    },
  }[props.state];
  const Icon = state.icon;
  const bytes = props.file.sizeBytes;
  const size =
    bytes === undefined
      ? ''
      : bytes >= 1048576
        ? `${(bytes / 1048576).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`
        : bytes >= 1024
          ? `${(bytes / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} KB`
          : `${bytes} B`;
  return (
    <div
      role={props.state === 'failed' ? 'alert' : 'status'}
      aria-atomic="true"
      data-upload-state={props.state}
      className={`min-w-0 rounded-xl border p-4 ${state.tone}`}
    >
      <div className="flex items-start gap-3">
        <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] leading-6 font-semibold text-foreground [overflow-wrap:anywhere]">
            {props.file.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] leading-6">
            <span className="font-semibold">{state.label}</span>
            {size && <span className="text-muted">{size}</span>}
          </div>
        </div>
        <Icon
          aria-hidden="true"
          className={`mt-0.5 size-5 shrink-0 ${props.state === 'uploading' ? 'motion-safe:animate-spin' : ''}`}
        />
      </div>
      {props.message && (
        <p className="mt-2 text-[14px] leading-6 [overflow-wrap:anywhere]">{props.message}</p>
      )}
      {props.action && <div className="mt-3 flex flex-wrap justify-end gap-2">{props.action}</div>}
    </div>
  );
}
