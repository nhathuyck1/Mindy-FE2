'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  const params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname();
  const statusValue = params.get(config.statusKey) ?? '';
  const status = config.tabs.some((value) => value === statusValue) ? statusValue : '';
  const filterValue = params.get(config.filterKey) ?? '';
  const filter = config.filters.some(([value]) => value === filterValue) ? filterValue : '';
  const [search, setSearch] = useState(() =>
    props.resource === 'users' ? (params.get('q') ?? '') : '',
  );
  const rawSearch = params.get('q')?.trim() ?? '';
  const userSearch = rawSearch.length <= 100 && rawSearch.length !== 1 ? rawSearch : '';
  const [composing, setComposing] = useState(false);
  const requestedPage = Number(params.get('page') ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedSize = Number(params.get('pageSize') ?? 10);
  const pageSize = [10, 20, 50].includes(requestedSize) ? requestedSize : 10;
  function changeFilters(values: Record<string, string | number>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value === '' || (key === 'page' && value === 1)) next.delete(key);
      else next.set(key, String(value));
    }
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false });
    setSelected(new Set());
  }
  const [sort, setSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [hidden, setHidden] = useState<Set<OptionalColumn>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (props.resource !== 'users' || composing) return;
    if (search.trim().length === 1) return;
    if (search.trim() === userSearch) return;
    const timer = window.setTimeout(() => {
      changeFilters({ q: search.trim(), page: 1 });
      setSelected(new Set());
    }, 250);
    return () => window.clearTimeout(timer);
    // Filter navigation is handled by the current render's URL snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, userSearch, composing, props.resource, page]);

  const searchTooShort = props.resource === 'users' && search.trim().length === 1;

  const query = useAdminList(props.resource, {
    page,
    pageSize,
    ...(props.resource === 'users' ? { q: userSearch } : {}),
    [config.statusKey]: status,
    ...(config.filterKey ? { [config.filterKey]: filter } : {}),
  });
  const rows = (query.data?.items ?? []).filter(
    (row) =>
      props.resource === 'users' ||
      normalizeAdminSearch([row.name, row.subtitle, row.secondary].join(' ')).includes(
        normalizeAdminSearch(search),
      ),
  );
  if (sort !== 'none')
    rows.sort((a, b) => a.name.localeCompare(b.name, 'vi') * (sort === 'asc' ? 1 : -1));
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));
  useEffect(() => {
    if (query.isSuccess && page > totalPages) {
      const next = new URLSearchParams(params);
      next.set('page', String(totalPages));
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
  }, [query.isSuccess, page, totalPages, params, pathname, router]);
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));
  const exportRows = selected.size ? rows.filter((row) => selected.has(row.id)) : rows;
  const columnLabels = {
    secondary: config.secondary,
    status: 'Trạng thái',
    metric: config.metric,
    date: config.date,
  };

  function changePage(next: number) {
    changeFilters({ page: next });
    if (props.resource !== 'users') setSearch('');
    setSelected(new Set());
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
          <p className="eyebrow mb-2 text-muted">Quản lý đào tạo</p>
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
            disabled={query.isError || query.isPending || searchTooShort || !exportRows.length}
            className="admin-button admin-button-primary"
            title="Xuất các dòng đã chọn hoặc kết quả hiển thị trên trang hiện tại"
          >
            <Icon name="download" className="size-4" />
            Xuất CSV
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
                changeFilters({ [config.statusKey]: tab, page: 1 });
              }}
              className={`relative min-h-12 shrink-0 cursor-pointer rounded-none border-b-2 pr-6 pl-3 text-sm font-extrabold transition-colors ${status === tab ? 'border-mint text-mint' : 'border-transparent text-muted hover:bg-soft'}`}
            >
              {tab ? statusLabels[tab] : 'Tất cả'}
              {status === tab &&
                (query.isPending ? (
                  <Skeleton
                    aria-hidden="true"
                    className="absolute top-1 right-0.5 h-4 w-6 rounded-full"
                  />
                ) : (
                  <span className="absolute top-1 right-0.5 min-w-4 rounded-full border border-pastel-red/40 bg-canvas px-1 text-[10px] leading-3.5 font-extrabold text-pastel-red tabular-nums">
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
              aria-label={
                props.resource === 'users' ? 'Tìm người dùng' : `Tìm ${config.singular} trong trang`
              }
              placeholder={
                props.resource === 'users'
                  ? 'Tìm tên, email, số điện thoại…'
                  : `Tìm ${config.singular} trong trang…`
              }
              maxLength={props.resource === 'users' ? 100 : undefined}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={() => setComposing(false)}
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
                changeFilters({ [config.filterKey]: event.target.value, page: 1 });
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

        {searchTooShort ? (
          <p role="status" className="p-8 text-center text-sm text-muted">
            Nhập ít nhất 2 ký tự để tìm người dùng.
          </p>
        ) : query.isPending || query.isError ? (
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
                  changeFilters({ pageSize: Number(event.target.value), page: 1 });
                }}
              >
                {[10, 20, 50].map((value) => (
                  <NativeSelectOption key={value}>{value}</NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          </div>
          <nav aria-label="Phân trang bảng quản trị" className="flex items-center gap-2">
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              className="admin-icon-button border border-line"
              aria-label="Trang trước"
              disabled={page <= 1 || query.isFetching || searchTooShort}
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
              disabled={page >= totalPages || query.isFetching || query.isError || searchTooShort}
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
