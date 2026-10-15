'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  adminResources,
  formatAdminDate,
  optionalColumns,
  type AdminResource,
  type AdminRow,
  type OptionalColumn,
} from '../lib/admin-resources';
import { AdminStatus } from './admin-status';
import { AdminRowActions } from './admin-editor';
export function AdminDataTable(props: {
  resource: AdminResource;
  rows: AdminRow[];
  page: number;
  total: number;
  sort: 'none' | 'asc' | 'desc';
  hidden: Set<OptionalColumn>;
  selected: Set<string>;
  onSort: () => void;
  onSelectAll: () => void;
  onSelect: (id: string) => void;
}) {
  const config = adminResources[props.resource];
  const allSelected =
    props.rows.length > 0 && props.rows.every((row) => props.selected.has(row.id));
  const columnLabels = {
    secondary: config.secondary,
    status: 'Trạng thái',
    metric: config.metric,
    date: config.date,
  };
  return (
    <div
      className="max-w-full overflow-x-auto"
      tabIndex={0}
      role="region"
      aria-label={`Bảng ${config.singular}, cuộn ngang để xem thêm`}
    >
      <Table className="admin-data-table">
        <TableCaption className="sr-only">
          Danh sách {config.singular}, trang {props.page}. {props.total} kết quả theo bộ lọc.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="admin-selection-cell w-12 min-w-12 p-0!">
              <div className="flex items-center justify-center">
                <Checkbox
                  aria-label="Chọn tất cả dòng trong trang"
                  checked={allSelected}
                  onCheckedChange={props.onSelectAll}
                  className="accent-mint"
                />
              </div>
            </TableHead>
            <TableHead
              scope="col"
              aria-sort={
                props.sort === 'asc' ? 'ascending' : props.sort === 'desc' ? 'descending' : 'none'
              }
            >
              <Button
                variant="unstyled"
                size="unstyled"
                type="button"
                onClick={props.onSort}
                className="inline-flex cursor-pointer items-center gap-2"
              >
                {config.primary}
                <span aria-hidden="true">
                  {props.sort === 'asc' ? '↑' : props.sort === 'desc' ? '↓' : '↕'}
                </span>
              </Button>
            </TableHead>
            {optionalColumns
              .filter((column) => !props.hidden.has(column))
              .map((column) => (
                <TableHead key={column} scope="col">
                  {columnLabels[column]}
                </TableHead>
              ))}
            <TableHead scope="col" className="text-right">
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.rows.map((row) => (
            <TableRow key={row.id} data-selected={props.selected.has(row.id)}>
              <TableCell className="admin-selection-cell w-12 min-w-12 p-0!">
                <div className="flex items-center justify-center">
                  <Checkbox
                    aria-label={`Chọn ${row.name}`}
                    checked={props.selected.has(row.id)}
                    onCheckedChange={() => props.onSelect(row.id)}
                    className="accent-mint"
                  />
                </div>
              </TableCell>
              <TableHead scope="row">
                <div className="min-w-0">
                  <p
                    className="max-w-65 truncate text-sm font-extrabold text-muted"
                    title={row.name}
                  >
                    {row.name}
                  </p>
                  {props.resource === 'users' && (
                    <p
                      className="mt-1 max-w-65 truncate text-[15px] font-normal text-muted"
                      title={row.subtitle}
                    >
                      {row.subtitle}
                    </p>
                  )}
                </div>
              </TableHead>
              {!props.hidden.has('secondary') && (
                <TableCell>
                  <span className="block max-w-45 truncate" title={row.secondary}>
                    {row.secondary}
                  </span>
                </TableCell>
              )}
              {!props.hidden.has('status') && (
                <TableCell>
                  <AdminStatus status={row.status} />
                </TableCell>
              )}
              {!props.hidden.has('metric') && (
                <TableCell>
                  <span className="whitespace-nowrap tabular-nums">{row.metric}</span>
                  {row.capacity && (
                    <div
                      className="mt-2 h-1 w-20 overflow-hidden rounded-full bg-line"
                      role="meter"
                      aria-label="Tỷ lệ chỗ còn lại"
                      aria-valuemin={0}
                      aria-valuemax={row.capacity.max}
                      aria-valuenow={row.capacity.available}
                    >
                      <div
                        className="h-full rounded-full bg-mint"
                        style={{
                          width: `${Math.min(100, (row.capacity.available / row.capacity.max) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </TableCell>
              )}
              {!props.hidden.has('date') && (
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatAdminDate(row.date)}
                </TableCell>
              )}
              <TableCell className="text-right">
                <AdminRowActions resource={props.resource} row={row} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
