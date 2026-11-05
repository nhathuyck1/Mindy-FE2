'use client';

import { useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { useClassMentorCandidates } from '../api/admin-mentor-queries';

export function AdminMentorPicker(props: {
  query: ReturnType<typeof useClassMentorCandidates>;
  search: string;
  selected: string;
  disabled: boolean;
  waiting: boolean;
  onSearch: (value: string) => void;
  onComposing: (value: boolean) => void;
  onSelect: (id: string) => void;
  onPage: (page: number) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const items = props.query.data?.items ?? [];
  const selected = items.find((item) => item.id === props.selected);
  const busy = props.waiting || props.query.isFetching;
  const options = busy ? [] : items;
  function choose(index: number) {
    const item = options[index];
    if (!item || item.isCurrent) return;
    props.onSelect(item.id);
    input.current?.focus();
    setOpen(false);
    setActive(-1);
  }
  return (
    <div
      className="space-y-2"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      <label htmlFor={id} className="text-sm font-bold">
        Giảng viên mới
      </label>
      <div className="relative mt-2">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted"
        />
        <input
          ref={input}
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && !props.disabled}
          aria-controls={`${id}-list`}
          aria-activedescendant={open && options[active] ? `${id}-${active}` : undefined}
          autoComplete="off"
          placeholder="Tìm và chọn giảng viên…"
          maxLength={100}
          disabled={props.disabled}
          value={selected?.displayName ?? props.search}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onCompositionStart={() => props.onComposing(true)}
          onCompositionEnd={() => props.onComposing(false)}
          onChange={(event) => {
            props.onSearch(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'Escape' && open) {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              setActive(-1);
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setOpen(true);
              const available = options
                .map((item, index) => (item.isCurrent ? -1 : index))
                .filter((index) => index >= 0);
              if (!available.length) return;
              const current = available.indexOf(active);
              const next =
                current < 0
                  ? available[event.key === 'ArrowDown' ? 0 : available.length - 1]
                  : available[
                      (current + (event.key === 'ArrowDown' ? 1 : available.length - 1)) %
                        available.length
                    ];
              setActive(next);
              document.getElementById(`${id}-${next}`)?.scrollIntoView({ block: 'nearest' });
            }
            if (event.key === 'Enter' && open) {
              event.preventDefault();
              choose(active);
            }
          }}
          className="min-h-11 w-full rounded-lg border border-line bg-white py-3 pr-10 pl-10 text-sm outline-none placeholder:text-muted focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint/20 disabled:opacity-60"
        />
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-3.5 right-3 size-4 text-muted"
        />
      </div>
      {open && !props.disabled && (
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          {busy ? (
            <p role="status" className="p-3 text-sm text-muted">
              Đang tìm giảng viên…
            </p>
          ) : props.query.isError ? (
            <div role="alert" className="space-y-2 p-3 text-sm">
              <p>Không tải được giảng viên.</p>
              <Button type="button" variant="outline" onClick={() => props.query.refetch()}>
                Tải lại
              </Button>
            </div>
          ) : !items.length ? (
            <p role="status" className="p-3 text-sm text-muted">
              Không tìm thấy giảng viên phù hợp.
            </p>
          ) : null}
          <div
            id={`${id}-list`}
            role="listbox"
            aria-label="Giảng viên phù hợp"
            aria-busy={busy}
            className="max-h-52 overflow-y-auto"
          >
            {!props.query.isError &&
              options.map((item, index) => (
                <button
                  key={item.id}
                  id={`${id}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={props.selected === item.id}
                  aria-disabled={item.isCurrent}
                  disabled={item.isCurrent}
                  tabIndex={-1}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => choose(index)}
                  onPointerMove={() => setActive(index)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm break-words disabled:text-muted ${active === index || props.selected === item.id ? 'bg-soft text-forest' : 'hover:bg-soft'}`}
                >
                  <span>
                    {item.displayName}
                    {item.isCurrent && (
                      <span className="ml-2 text-xs text-muted">Đang phụ trách</span>
                    )}
                  </span>
                  {props.selected === item.id && (
                    <Check aria-hidden className="size-4 shrink-0 text-mint" />
                  )}
                </button>
              ))}
          </div>
          {!busy && props.query.data && props.query.data.total > props.query.data.pageSize && (
            <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2 text-xs text-muted">
              <Button
                type="button"
                variant="outline"
                disabled={props.query.data.page <= 1}
                onClick={() => {
                  setActive(-1);
                  props.onPage(props.query.data!.page - 1);
                }}
              >
                Trước
              </Button>
              <span>
                {props.query.data.page} /{' '}
                {Math.ceil(props.query.data.total / props.query.data.pageSize)}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={
                  props.query.data.page * props.query.data.pageSize >= props.query.data.total
                }
                onClick={() => {
                  setActive(-1);
                  props.onPage(props.query.data!.page + 1);
                }}
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
