'use client';

import { ChevronDown } from 'lucide-react';
import { NameAvatar } from '@/components/ui/name-avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function WhiteboardPeople(props: {
  self: { id: string; name: string };
  people: { id: string; name: string }[];
  online: boolean;
}) {
  const people = props.online
    ? [props.self, ...props.people.filter((person) => person.id !== props.self.id)]
    : [];
  const unique = [...new Map(people.map((person) => [person.id, person])).values()];
  return (
    <div className="whiteboard-people">
      <div className="whiteboard-self" title={`${props.self.name} (Bạn)`}>
        <NameAvatar name={props.self.name} className="size-8 text-xs" />
        <span className="whiteboard-self-name">{props.self.name}</span>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="whiteboard-people-trigger"
            aria-label={`Người đang hoạt động: ${unique.length}`}
          >
            {unique.length > 1 && (
              <span className="whiteboard-people-avatars" aria-hidden="true">
                {unique
                  .filter((person) => person.id !== props.self.id)
                  .slice(0, 2)
                  .map((person) => (
                    <NameAvatar
                      key={person.id}
                      name={person.name}
                      className="size-7 border-2 border-white text-[10px]"
                    />
                  ))}
              </span>
            )}
            <span>{unique.length} đang hoạt động</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          collisionPadding={12}
          aria-label="Người đang hoạt động"
          className="w-72 max-w-[calc(100vw-24px)] rounded-xl border-line bg-white p-0 font-brand text-forest"
        >
          <h2 className="border-b border-line px-4 py-3 text-sm font-extrabold">
            Người đang hoạt động ({unique.length})
          </h2>
          <div
            className="max-h-60 overflow-y-auto overscroll-contain p-2"
            tabIndex={0}
            aria-label="Danh sách người tham gia"
          >
            {unique.length ? (
              <ul className="space-y-1">
                {unique.map((person) => (
                  <li key={person.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                    <NameAvatar name={person.name} className="size-9 text-xs" />
                    <span className="min-w-0 flex-1 break-words text-sm font-bold">
                      {person.name}
                      {person.id === props.self.id && (
                        <span className="font-normal text-muted"> (Bạn)</span>
                      )}
                    </span>
                    <span className="size-2 shrink-0 rounded-full bg-mint" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-2 text-sm text-muted">Chưa kết nối với bảng.</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
