import dynamic from 'next/dynamic';
import { ChevronDown, FileText, Paperclip, PlayCircle } from 'lucide-react';
import type { Material } from '../schemas/learning-contracts';
import { LearningState } from './learning-state';

const MaterialViewer = dynamic(
  () => import('./material-viewer').then((mod) => mod.MaterialViewer),
  {
    loading: () => <LearningState>Đang tải nội dung học…</LearningState>,
  },
);

export function LearningMaterialList(props: {
  items: Material[];
  classId: string;
  unitId: string;
  openId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-line">
      {props.items.map((item, index) => {
        const open = props.openId === item.id;
        const Icon =
          item.contentType === 'VIDEO'
            ? PlayCircle
            : item.contentType === 'FILE'
              ? Paperclip
              : FileText;
        const triggerId = `material-trigger-${item.id}`;
        const panelId = `material-panel-${item.id}`;
        return (
          <li key={item.id}>
            <h4>
              <button
                type="button"
                id={triggerId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => props.onToggle(item.id)}
                className={`flex min-h-11 w-full items-center gap-2.5 px-3 py-3 text-left text-sm transition-colors hover:bg-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mint sm:px-4 ${open ? 'bg-mint/10 text-forest' : ''}`}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0 text-mint" />
                <span className="min-w-0 flex-1 font-bold break-words">
                  {index + 1}. {item.title}
                </span>
                <span className="hidden shrink-0 text-xs text-muted sm:block">
                  {{ ARTICLE: 'Bài đọc', FILE: 'Tệp', VIDEO: 'Video' }[item.contentType]}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`size-4 shrink-0 text-mint ${open ? 'rotate-180' : ''}`}
                />
              </button>
            </h4>
            <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!open}>
              {open && (
                <div className="border-t border-line p-3 sm:p-4">
                  <MaterialViewer
                    classId={props.classId}
                    unitId={props.unitId}
                    materialId={item.id}
                  />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
