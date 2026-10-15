'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { useAdminList } from '../api/admin-queries';
import {
  adminCsv,
  adminResources,
  optionalColumns,
  type OptionalColumn,
  normalizeAdminSearch,
  statusLabels,
  type AdminResource,
} from '../lib/admin-resources';
import { AdminQueryState } from './admin-query-state';

import { AdminDataTable } from './admin-data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminEditorButton } from './admin-editor';

export function AdminResourcePage(props: { resource: AdminResource }) {
  const config = adminResources[props.resource];
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [hidden, setHidden] = useState<Set<OptionalColumn>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const query = useAdminList(props.resource, {
    page,
    pageSize,
    [config.statusKey]: status,
    ...(config.filterKey ? { [config.filterKey]: filter } : {}),
  });
  const rows = (query.data?.items ?? []).filter((row) =>
    normalizeAdminSearch([row.name, row.subtitle, row.secondary].join(' ')).includes(
      normalizeAdminSearch(search),
    ),
  );
  if (sort !== 'none')
    rows.sort((a, b) => a.name.localeCompare(b.name, 'vi') * (sort === 'asc' ? 1 : -1));
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));
  const exportRows = selected.size ? rows.filter((row) => selected.has(row.id)) : rows;
  const columnLabels = {
    secondary: config.secondary,
    status: 'Trạng thái',
    metric: config.metric,
    date: config.date,
  };

  function changePage(next: number) {
    setPage(next);
    setSearch('');
    setSelected(new Set());
  }
  function resetFilters() {
    setStatus('');
    setFilter('');
    setSearch('');
    changePage(1);
  }
  function exportCsv() {
    const url = URL.createObjectURL(
      new Blob([adminCsv(exportRows, props.resource)], { type: 'text/csv;charset=utf-8;' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mindy-${props.resource}-trang-${page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow mb-2 text-mint">Quản lý đào tạo</p>
          <h1 className="text-[34px] leading-tight font-extrabold tracking-tight sm:text-[38px]">
            {config.title}
          </h1>
          <p className="mt-2 text-base leading-6 text-muted">{config.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminEditorButton resource={props.resource} />
          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            onClick={exportCsv}
            disabled={query.isError || query.isPending || !exportRows.length}
            className="admin-button admin-button-primary"
            title="Xuất các dòng đã chọn hoặc kết quả hiển thị trên trang hiện tại"
          >
            <Icon name="download" className="size-4" />
            Xuất CSV{selected.size ? ` (${selected.size})` : ''}
          </Button>
        </div>
      </div>

      <section className="admin-table-panel" aria-label={`Danh sách ${config.singular}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-6 pb-5 sm:px-6">
          <h2 className="text-lg font-extrabold">Danh sách {config.singular}</h2>
          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm font-bold text-muted disabled:opacity-50"
          >
            <Icon
              name="refresh"
              className={`size-4 ${query.isFetching ? 'motion-safe:animate-spin' : ''}`}
            />
            Làm mới
          </Button>
        </div>

        <div
          className="flex max-w-full gap-1 overflow-x-auto border-b border-line px-5 sm:px-6"
          role="group"
          aria-label="Lọc theo trạng thái"
        >
          {config.tabs.map((tab) => (
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              key={tab}
              aria-label={tab ? statusLabels[tab] : 'Tất cả'}
              aria-pressed={status === tab}
              onClick={() => {
                setStatus(tab);
                changePage(1);
              }}
              className={`min-h-12 shrink-0 cursor-pointer rounded-none border-b-2 px-3 text-sm font-extrabold transition-colors ${status === tab ? 'border-mint text-mint' : 'border-transparent text-muted hover:bg-soft'}`}
            >
              {tab ? statusLabels[tab] : 'Tất cả'}
              {status === tab &&
                (query.isPending ? (
                  <Skeleton aria-hidden="true" className="h-6 w-9 rounded-md" />
                ) : (
                  <span className="rounded-md border border-line bg-soft px-2 py-0.5 text-sm font-extrabold tabular-nums">
                    {query.data?.total.toLocaleString('vi-VN') ?? '—'}
                  </span>
                ))}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
          <div className="relative min-w-0 flex-[1_1_200px] sm:max-w-80">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            />
            <Input
              aria-label={`Tìm ${config.singular} trong trang`}
              placeholder={`Tìm ${config.singular} trong trang…`}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSelected(new Set());
              }}
              className="h-12 w-full min-w-0 rounded-lg border border-line bg-canvas pr-3 pl-9 text-sm"
            />
          </div>
          {config.filterKey && (
            <NativeSelect
              aria-label={config.filterLabel}
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                changePage(1);
              }}
              className="h-12 max-w-full rounded-lg border border-line bg-canvas px-3 text-sm font-bold"
            >
              <NativeSelectOption value="">{config.filterLabel}</NativeSelectOption>
              {config.filters.map(([value, label]) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
          <div className="ml-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="unstyled"
                  size="unstyled"
                  className="admin-button min-h-10 text-sm"
                >
                  <Icon name="panel" className="size-4" />
                  Cột hiển thị
                  <Icon name="chevron" className="size-3 rotate-90" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="admin-typography w-48 rounded-xl border-line bg-canvas p-2 shadow-lg shadow-forest/10"
              >
                {optionalColumns.map((column) => (
                  <label
                    key={column}
                    className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm hover:bg-soft"
                  >
                    <Checkbox
                      checked={!hidden.has(column)}
                      className="accent-mint"
                      onCheckedChange={() =>
                        setHidden((previous) => {
                          const next = new Set(previous);
                          if (next.has(column)) next.delete(column);
                          else next.add(column);
                          return next;
                        })
                      }
                    />
                    {columnLabels[column]}
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {(selected.size > 0 || status || filter || search) && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-soft/45 px-5 py-2.5 text-[15px] text-muted sm:px-6">
            {selected.size > 0 && <p aria-live="polite">Đã chọn {selected.size} dòng</p>}
            {(status || filter || search) && (
              <Button
                variant="unstyled"
                size="unstyled"
                type="button"
                className="cursor-pointer font-extrabold text-mint"
                onClick={resetFilters}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        )}

        {query.isPending || query.isError ? (
          <AdminQueryState
            loading={query.isPending}
            columns={7 - hidden.size}
            error={query.error}
            onRetry={() => query.refetch()}
          />
        ) : rows.length === 0 ? (
          <div role="status" className="grid min-h-64 place-items-center p-6 text-center">
            <div>
              <Icon name="search" className="mx-auto size-8 text-mint" />
              <p className="mt-4 text-base font-extrabold">
                {search || status || filter
                  ? 'Không có kết quả phù hợp'
                  : `Chưa có ${config.singular}`}
              </p>
              <p className="mt-2 text-sm text-muted">
                {search || status || filter
                  ? 'Thử thay đổi từ khóa hoặc bộ lọc.'
                  : 'Dữ liệu mới sẽ xuất hiện tại đây.'}
              </p>
              {(search || status || filter || page > 1) && (
                <Button
                  variant="unstyled"
                  size="unstyled"
                  type="button"
                  onClick={resetFilters}
                  className="admin-button mt-5"
                >
                  Về danh sách đầu
                </Button>
              )}
            </div>
          </div>
        ) : (
          <AdminDataTable
            resource={props.resource}
            rows={rows}
            page={page}
            total={query.data.total}
            sort={sort}
            hidden={hidden}
            selected={selected}
            onSort={() => setSort(sort === 'asc' ? 'desc' : 'asc')}
            onSelectAll={() =>
              setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)))
            }
            onSelect={(id) =>
              setSelected((previous) => {
                const next = new Set(previous);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-4 text-sm text-muted sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              Số dòng
              <NativeSelect
                aria-label="Số dòng mỗi trang"
                value={pageSize}
                className="h-9 rounded-lg border border-line bg-canvas px-2 font-bold"
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  changePage(1);
                }}
              >
                {[10, 20, 50].map((value) => (
                  <NativeSelectOption key={value}>{value}</NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <span aria-live="polite">
              {query.isError || query.isPending
                ? '—'
                : `${rows.length} dòng hiển thị / ${query.data.total.toLocaleString('vi-VN')} kết quả`}
            </span>
          </div>
          <nav aria-label="Phân trang bảng quản trị" className="flex items-center gap-2">
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              className="admin-icon-button border border-line"
              aria-label="Trang trước"
              disabled={page <= 1 || query.isFetching}
              onClick={() => changePage(page - 1)}
            >
              <Icon name="chevron" className="size-4 rotate-180" />
            </Button>
            <span className="px-2 font-bold tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              className="admin-icon-button border border-line"
              aria-label="Trang sau"
              disabled={page >= totalPages || query.isFetching || query.isError}
              onClick={() => changePage(page + 1)}
            >
              <Icon name="chevron" className="size-4" />
            </Button>
          </nav>
        </div>
      </section>
    </>
  );
}
