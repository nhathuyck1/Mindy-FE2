import { Check, FileText } from 'lucide-react';
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

export function ManagerFileCard(props: { file: ManagerUploadedFile; action?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-mint/25 bg-mint/5 p-4 sm:flex-nowrap">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-mint/15 bg-canvas text-mint">
        <FileText className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 basis-36">
        <p className="break-words text-sm font-semibold [overflow-wrap:anywhere]">
          {props.file.name}
        </p>
        <p className="mt-1 text-xs text-muted">
          {managerFileKindLabels[props.file.kind]} · {managerFileSize(props.file.sizeBytes)}
        </p>
        <p
          role="status"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-forest"
        >
          <Check className="size-3.5 text-mint" aria-hidden="true" />
          Đã tải lên thành công
        </p>
      </div>
      {props.action && <div className="ml-auto shrink-0">{props.action}</div>}
    </div>
  );
}
