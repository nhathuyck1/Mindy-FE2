'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useManagerQuery } from '../api/manager-queries';
import { managerMentorSchema, managerPeoplePageSchema } from '../schemas/manager-leave-contracts';

export function ManagerLeaveMentorFilter(props: {
  mentorId?: string;
  onSelect: (id: string | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  const suggestions = useManagerQuery(
    `manager/mentors?page=1&pageSize=20&q=${encodeURIComponent(query)}`,
    managerPeoplePageSchema,
    query.length >= 2 && !props.mentorId,
  );
  const selected = useManagerQuery(
    `manager/mentors/${props.mentorId ?? ''}`,
    managerMentorSchema.refine((mentor) => mentor.id === props.mentorId),
    Boolean(props.mentorId),
  );
  const waiting = query !== search.trim() || suggestions.isFetching;
  const items = waiting || suggestions.isError ? [] : (suggestions.data?.items ?? []);
  const expanded = open && !props.mentorId && search.trim().length >= 2;
  const value = props.mentorId ? selected.data?.displayName || search : search;

  function choose(index: number) {
    const mentor = items[index];
    if (!mentor) return;
    setSearch('');
    setQuery('');
    setOpen(false);
    setActive(-1);
    props.onSelect(mentor.id);
    input.current?.focus();
  }

  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor="leave-mentor-filter" className="block text-sm font-semibold">
        Tìm mentor
      </label>
      <Popover open={expanded} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div
            ref={anchor}
            className="flex min-h-12 min-w-0 items-center rounded-lg border border-line bg-canvas focus-within:border-mint focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-mint"
          >
            <Search aria-hidden="true" className="ml-3 size-4 shrink-0 text-muted" />
            <input
              ref={input}
              id="leave-mentor-filter"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={expanded}
              aria-controls="leave-mentor-suggestions"
              aria-activedescendant={
                expanded && items[active] ? `leave-mentor-${active}` : undefined
              }
              aria-describedby="leave-mentor-help"
              autoComplete="off"
              maxLength={100}
              placeholder="Tên hoặc email mentor"
              value={value}
              onFocus={() => setOpen(true)}
              onChange={(event) => {
                setSearch(event.target.value);
                setActive(-1);
                setOpen(true);
                if (props.mentorId) props.onSelect(null);
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;
                if (event.key === 'Escape') {
                  setOpen(false);
                  setActive(-1);
                }
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  setOpen(true);
                  if (!items.length) return;
                  const next =
                    active < 0
                      ? event.key === 'ArrowDown'
                        ? 0
                        : items.length - 1
                      : (active + (event.key === 'ArrowDown' ? 1 : items.length - 1)) %
                        items.length;
                  setActive(next);
                  document
                    .getElementById(`leave-mentor-${next}`)
                    ?.scrollIntoView({ block: 'nearest' });
                }
                if (event.key === 'Enter' && expanded) {
                  event.preventDefault();
                  choose(active);
                }
              }}
              className="min-h-12 w-full min-w-0 bg-transparent px-3 py-2 text-base outline-none! placeholder:text-muted sm:text-sm"
            />
            {(search || props.mentorId) && (
              <Button
                type="button"
                variant="ghost"
                aria-label="Xóa bộ lọc mentor"
                className="mr-0.5 size-11 shrink-0 px-0"
                onClick={() => {
                  setSearch('');
                  setQuery('');
                  setOpen(false);
                  setActive(-1);
                  props.onSelect(null);
                  input.current?.focus();
                }}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border-line bg-canvas p-1 text-foreground"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (event.target instanceof Node && anchor.current?.contains(event.target))
              event.preventDefault();
          }}
        >
          <div
            id="leave-mentor-suggestions"
            role="listbox"
            aria-label="Gợi ý mentor"
            aria-busy={waiting}
            className="max-h-64 overflow-y-auto overscroll-contain"
          >
            {waiting ? (
              <p role="status" className="p-3 text-sm text-muted">
                Đang tìm mentor…
              </p>
            ) : suggestions.isError ? (
              <div role="alert" className="space-y-2 p-3 text-sm">
                <p>Chưa tải được gợi ý mentor.</p>
                <Button variant="outline" size="sm" onClick={() => void suggestions.refetch()}>
                  Thử lại
                </Button>
              </div>
            ) : items.length ? (
              items.map((mentor, index) => (
                <button
                  key={mentor.id}
                  id={`leave-mentor-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onPointerMove={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(index)}
                  className="flex min-h-12 w-full items-center gap-3 rounded-lg p-3 text-left text-sm hover:bg-soft focus-visible:outline-2 focus-visible:outline-mint aria-selected:bg-soft"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold wrap-anywhere">{mentor.displayName}</span>
                    <span className="mt-0.5 block text-xs text-muted wrap-anywhere">
                      {mentor.email}
                    </span>
                  </span>
                  {index === active && (
                    <Check aria-hidden="true" className="size-4 shrink-0 text-mint" />
                  )}
                </button>
              ))
            ) : (
              <p role="status" className="p-3 text-sm text-muted">
                Không tìm thấy mentor khớp.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <p id="leave-mentor-help" className="text-xs leading-5 text-muted">
        {props.mentorId
          ? 'Đang lọc theo mentor đã chọn.'
          : 'Nhập ít nhất 2 ký tự, sau đó chọn mentor trong gợi ý.'}
      </p>
      {props.mentorId && selected.isError && (
        <p role="alert" className="text-sm text-muted">
          Chưa tải được tên mentor.{' '}
          <button type="button" className="text-link" onClick={() => void selected.refetch()}>
            Tải lại
          </button>
        </p>
      )}
    </div>
  );
}
