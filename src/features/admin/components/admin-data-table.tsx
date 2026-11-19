'use client';

import { useId, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NameAvatar } from '@/components/ui/name-avatar';
import { Icon } from '@/components/ui/icon';
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
import { AdminRecordDetails } from './admin-record-details';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const detailsId = useId();
  const visibleColumns = optionalColumns.filter((column) => !props.hidden.has(column));
  const SortIcon = props.sort === 'asc' ? ArrowUp : props.sort === 'desc' ? ArrowDown : ArrowUpDown;
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
      className="admin-table-scroll max-w-full overflow-x-auto"
      tabIndex={0}
      role="region"
      aria-label={`Bảng ${config.singular}, cuộn ngang để xem thêm`}
    >
      <Table className="admin-data-table admin-resource-table">
        <TableCaption className="sr-only">
          Danh sách {config.singular}, trang {props.page}. {props.total} kết quả theo bộ lọc.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="admin-selection-cell w-12 min-w-12 p-0!">
              <div className="flex items-center justify-center">
                <Checkbox
                  aria-label="Chọn tất cả dòng trong trang"
                  checked={
                    allSelected
                      ? true
                      : props.rows.some((row) => props.selected.has(row.id))
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={props.onSelectAll}
                  className="accent-mint"
                />
              </div>
            </TableHead>
            <TableHead scope="col" className="admin-expand-cell">
              <span className="sr-only">Chi tiết</span>
            </TableHead>
            <TableHead
              scope="col"
              className="font-medium"
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
                <SortIcon aria-hidden="true" className="size-3.5 text-muted" />
              </Button>
            </TableHead>
            <TableHead scope="col" className="font-medium">
              {props.resource === 'users' ? 'Email' : 'Mã'}
            </TableHead>
            {optionalColumns
              .filter((column) => !props.hidden.has(column))
              .map((column) => (
                <TableHead key={column} scope="col" className="font-medium">
                  {columnLabels[column]}
                </TableHead>
              ))}
            <TableHead scope="col" className="text-right font-medium">
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>
        {props.rows.map((row) => {
          const expanded = expandedId === row.id;
          const panelId = `${detailsId}-${row.id}`;
          return (
            <TableBody key={row.id} data-expanded={expanded}>
              <TableRow data-selected={props.selected.has(row.id)}>
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
                <TableCell className="admin-expand-cell">
                  <Button
                    variant="unstyled"
                    size="unstyled"
                    type="button"
                    className="admin-expand-button"
                    aria-label={`Xem thông tin: ${row.name}`}
                    title={expanded ? 'Thu gọn thông tin' : 'Xem thông tin'}
                    aria-expanded={expanded}
                    aria-controls={expanded ? panelId : undefined}
                    onClick={() => setExpandedId(expanded ? null : row.id)}
                  >
                    <ChevronDown
                      aria-hidden="true"
                      className={`size-4 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
                    />
                  </Button>
                </TableCell>
                <TableHead scope="row">
                  <div className="flex min-w-0 items-center gap-3">
                    {props.resource === 'users' ? (
                      <NameAvatar name={row.name} className="size-8 text-xs font-semibold" />
                    ) : (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-soft text-forest">
                        <Icon name={config.icon} className="size-4" />
                      </span>
                    )}
                    <p
                      className="max-w-56 truncate text-sm font-medium text-foreground"
                      title={row.name}
                    >
                      {row.name}
                    </p>
                  </div>
                </TableHead>
                <TableCell>
                  <span className="block max-w-56 truncate text-muted" title={row.subtitle}>
                    {row.subtitle}
                  </span>
                </TableCell>
                {!props.hidden.has('secondary') && (
                  <TableCell>
                    <span className="block max-w-45 truncate" title={row.secondary}>
                      {row.secondary}
                    </span>
                  </TableCell>
                )}
                {!props.hidden.has('status') && (
                  <TableCell>
                    <AdminStatus status={row.status} compact />
                  </TableCell>
                )}
                {!props.hidden.has('metric') && (
                  <TableCell>
                    <span className="whitespace-nowrap tabular-nums">{row.metric}</span>
                    {row.capacity && <span className="sr-only"> chỗ còn lại / sĩ số tối đa</span>}
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
              {expanded && (
                <TableRow className="admin-details-row">
                  <TableCell colSpan={5 + visibleColumns.length}>
                    <div
                      id={panelId}
                      role="region"
                      aria-label={`Thông tin ${config.singular}: ${row.name}`}
                      className="admin-inline-details"
                    >
                      <AdminRecordDetails resource={props.resource} row={row} />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          );
        })}
      </Table>
    </div>
  );
}
