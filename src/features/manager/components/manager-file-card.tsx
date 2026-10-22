import { CheckCircle2, CircleSlash, Clock3, FileText, LoaderCircle, XCircle } from 'lucide-react';
import type { MaterialDetail } from '../schemas/manager-contracts';

export type ManagerUploadedFile = {
  id: string;
  name: string;
  kind: NonNullable<MaterialDetail['file']>['kind'];
  sizeBytes: number;
};

export function managerFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const unit = bytes < 1024 * 1024 ? 'KB' : 'MB';
  const size = bytes / (unit === 'KB' ? 1024 : 1024 * 1024);
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(size)} ${unit}`;
}

export const managerFileKindLabels = {
  PDF: 'PDF',
  IMAGE: 'Hình ảnh',
  DOCUMENT: 'Word',
  PRESENTATION: 'PowerPoint',
  SPREADSHEET: 'Excel',
  AUDIO: 'Âm thanh',
  VIDEO: 'Video',
  SOURCE_CODE: 'Văn bản / mã nguồn',
};

export function ManagerFileCard(props: {
  file: { name: string; sizeBytes: number; kind?: ManagerUploadedFile['kind'] };
  state?: 'ready' | 'uploading' | 'pending' | 'failed' | 'cancelled';
  message?: string;
  action?: React.ReactNode;
}) {
  const state = props.state ?? 'ready';
  const appearance = {
    ready: {
      label: 'Đã tải lên thành công',
      tone: 'border-status-green/30 bg-status-green/5 text-status-green',
      icon: CheckCircle2,
    },
    uploading: {
      label: 'Đang tải lên / kiểm tra',
      tone: 'border-mint/30 bg-mint/5 text-mint',
      icon: LoaderCircle,
    },
    pending: {
      label: 'Đang chờ kiểm tra',
      tone: 'border-line bg-soft/40 text-muted',
      icon: Clock3,
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
  }[state];
  const Icon = appearance.icon;
  return (
    <div
      role={state === 'failed' ? 'alert' : 'status'}
      aria-atomic="true"
      data-upload-state={state}
      className={`min-w-0 rounded-xl border p-4 ${appearance.tone}`}
    >
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] leading-6 font-semibold text-foreground [overflow-wrap:anywhere]">
            {props.file.name}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] leading-6">
            <span className="font-semibold">{appearance.label}</span>
            <span className="text-muted">
              {props.file.kind && `${managerFileKindLabels[props.file.kind]} · `}
              {managerFileSize(props.file.sizeBytes)}
            </span>
          </p>
        </div>
        <Icon
          aria-hidden="true"
          className={`mt-0.5 size-5 shrink-0 ${state === 'uploading' ? 'motion-safe:animate-spin' : ''}`}
        />
      </div>
      {props.message && (
        <p className="mt-2 text-[14px] leading-6 [overflow-wrap:anywhere]">{props.message}</p>
      )}
      {props.action && <div className="mt-3 flex flex-wrap justify-end gap-2">{props.action}</div>}
    </div>
  );
}
