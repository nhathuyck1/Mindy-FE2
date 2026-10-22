import { FileText, Video, Paperclip, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Material } from '../schemas/manager-contracts';
import { managerDate, ReviewBadge, typeLabels } from './manager-shared';

export function ManagerCourseMaterialsTable(props: {
  items: Material[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="@container/manager-register">
      <table className="hidden w-full table-fixed text-left text-sm @3xl/manager-register:table">
        <caption className="sr-only">Danh sách tài liệu trong chương</caption>
        <thead className="border-y border-line bg-soft/60 text-muted">
          <tr>
            <th scope="col" className="w-[42%] px-5 py-4 font-semibold">
              Tài liệu
            </th>
            <th scope="col" className="w-[20%] px-4 py-4 font-semibold">
              Trạng thái duyệt
            </th>
            <th scope="col" className="w-[22%] px-4 py-4 font-semibold">
              Cập nhật
            </th>
            <th scope="col" className="px-5 py-4 text-right font-semibold">
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {props.items.map((item) => {
            const Icon =
              item.contentType === 'VIDEO'
                ? Video
                : item.contentType === 'FILE'
                  ? Paperclip
                  : FileText;
            return (
              <tr key={item.id} className="align-top transition-colors hover:bg-soft/40">
                <td className="p-5">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-soft/50 text-mint"
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => props.onOpen(item.id)}
                        className="block text-left font-semibold text-foreground underline-offset-4 hover:text-mint hover:underline focus-visible:rounded-sm [overflow-wrap:anywhere]"
                      >
                        {item.title}
                      </button>
                      <p className="text-xs text-muted">
                        {typeLabels[item.contentType]} · Phiên bản {item.revision}
                      </p>
                      <p className="text-xs text-muted">
                        {item.publishedAt ? 'Đã xuất bản' : 'Chưa xuất bản'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-5">
                  <ReviewBadge status={item.reviewStatus} />
                </td>
                <td className="px-4 py-5 text-muted">
                  <time dateTime={item.updatedAt}>{managerDate(item.updatedAt)}</time>
                </td>
                <td className="px-4 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 text-mint"
                    aria-label={`Xem chi tiết: ${item.title}`}
                    onClick={() => props.onOpen(item.id)}
                  >
                    <Eye aria-hidden="true" className="size-5" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ul
        aria-label="Tài liệu trong chương"
        className="divide-y divide-line border-t border-line @3xl/manager-register:hidden"
      >
        {props.items.map((item) => (
          <li key={item.id} className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ReviewBadge status={item.reviewStatus} />
              <span className="text-xs text-muted">
                {typeLabels[item.contentType]} · v{item.revision}
              </span>
            </div>
            <button
              type="button"
              onClick={() => props.onOpen(item.id)}
              className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-semibold [overflow-wrap:anywhere]"
            >
              <span className="min-w-0">{item.title}</span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-mint" />
            </button>
            <div className="flex flex-wrap justify-between gap-2 text-xs leading-6 text-muted">
              <span>{item.publishedAt ? 'Đã xuất bản' : 'Chưa xuất bản'}</span>
              <time dateTime={item.updatedAt}>{managerDate(item.updatedAt)}</time>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
