'use client';

import { Check, CircleDashed, Users, X } from 'lucide-react';
import type { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { attendanceSchema } from '../schemas/mentor-contracts';
import { mentorLabels } from './mentor-shared';

type AttendanceItem = z.infer<typeof attendanceSchema>['items'][number];
type MarkAttendance = (item: AttendanceItem, status: 'PRESENT' | 'ABSENT') => void;

function StudentIdentity(props: { name: string }) {
  const initials = props.name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join('')
    .toLocaleUpperCase('vi');
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-mint/10 text-[16px] font-semibold text-forest"
      >
        {initials}
      </span>
      <span className="min-w-0 text-[20px] leading-7 font-semibold [overflow-wrap:anywhere]">
        {props.name}
      </span>
    </div>
  );
}

function AttendanceStatus(props: { status: AttendanceItem['status'] }) {
  const Icon = props.status === 'PRESENT' ? Check : props.status === 'ABSENT' ? X : CircleDashed;
  const tone =
    props.status === 'PRESENT'
      ? 'border-mint/20 bg-mint/8 text-forest'
      : props.status === 'ABSENT'
        ? 'border-status-red/20 bg-status-red/5 text-status-red'
        : 'border-line bg-soft/50 text-muted';
  return (
    <Badge
      variant="outline"
      className={`gap-2 px-3 py-1.5 text-[16px] leading-6 font-medium [&>svg]:size-4 ${tone}`}
    >
      <Icon aria-hidden="true" />
      {mentorLabels[props.status]}
    </Badge>
  );
}

function AttendanceActions(props: {
  item: AttendanceItem;
  name: string;
  disabled: boolean;
  onMark: MarkAttendance;
}) {
  return (
    <div
      role="group"
      aria-label={`Điểm danh: ${props.name}`}
      className="inline-grid w-55 max-w-full grid-cols-2 gap-1 rounded-xl border border-line bg-soft/70 p-1"
    >
      {(['PRESENT', 'ABSENT'] as const).map((status) => {
        const selected = props.item.status === status;
        const present = status === 'PRESENT';
        const Icon = present ? Check : X;
        return (
          <Button
            key={status}
            type="button"
            variant="unstyled"
            size="unstyled"
            aria-label={`${present ? 'Có mặt' : 'Vắng'}: ${props.name}`}
            aria-pressed={selected}
            disabled={props.disabled}
            onClick={() => {
              if (!selected) void props.onMark(props.item, status);
            }}
            className={`h-11 min-w-0 rounded-lg border px-2 text-[15px] font-semibold disabled:opacity-100 ${
              selected
                ? present
                  ? 'border-mint/30 bg-canvas text-forest shadow-xs'
                  : 'border-status-red/25 bg-canvas text-status-red shadow-xs'
                : present
                  ? 'border-transparent text-muted hover:bg-mint/8 hover:text-forest disabled:text-muted/70'
                  : 'border-transparent text-muted hover:bg-status-red/5 hover:text-status-red disabled:text-muted/70'
            }`}
          >
            <Icon aria-hidden="true" className="size-4" />
            {present ? 'Có mặt' : 'Vắng'}
          </Button>
        );
      })}
    </div>
  );
}

export function MentorAttendanceRoster(props: {
  items: AttendanceItem[];
  disabled: boolean;
  scheduled: boolean;
  onMark: MarkAttendance;
}) {
  if (props.items.length === 0)
    return (
      <div
        role="status"
        className="grid min-h-48 justify-items-center content-center gap-4 rounded-xl border border-dashed border-line bg-soft/20 p-6 text-center"
      >
        <Users aria-hidden="true" className="size-8 text-mint" />
        <p className="max-w-md text-[16px] leading-7 text-muted">
          {props.scheduled
            ? 'Bắt đầu buổi để chụp danh sách điểm danh.'
            : 'Chưa có học viên trong danh sách điểm danh.'}
        </p>
      </div>
    );

  return (
    <div
      role="region"
      aria-label="Danh sách điểm danh"
      className="@container/attendance-roster min-w-0"
    >
      <div className="hidden overflow-hidden rounded-xl border border-line @3xl/attendance-roster:block">
        <Table className="table-fixed text-[16px] leading-6">
          <caption className="sr-only">Học viên, trạng thái và thao tác điểm danh buổi học</caption>
          <TableHeader className="bg-soft/60">
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="w-2/5 px-5 py-4 font-semibold">
                Học viên
              </TableHead>
              <TableHead scope="col" className="px-5 py-4 font-semibold">
                Trạng thái
              </TableHead>
              <TableHead scope="col" className="w-72 px-5 py-4 text-left font-semibold">
                <span className="block w-55 max-w-full text-center">Điểm danh</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.items.map((item) => {
              const name = item.student.displayName?.trim() || 'Học viên';
              return (
                <TableRow key={item.attendanceId}>
                  <TableHead scope="row" className="px-5 py-5 whitespace-normal">
                    <StudentIdentity name={name} />
                    {item.entryType === 'MAKEUP' && (
                      <span className="mt-2 block text-sm text-mint">Học bù</span>
                    )}
                  </TableHead>
                  <TableCell className="px-5 py-5">
                    <AttendanceStatus status={item.status} />
                  </TableCell>
                  <TableCell className="px-5 py-5 text-left">
                    <AttendanceActions
                      item={item}
                      name={name}
                      disabled={props.disabled}
                      onMark={props.onMark}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line @3xl/attendance-roster:hidden">
        {props.items.map((item) => {
          const name = item.student.displayName?.trim() || 'Học viên';
          return (
            <li key={item.attendanceId} className="space-y-4 p-4">
              <StudentIdentity name={name} />
              <div className="flex flex-wrap items-center justify-start gap-3">
                <AttendanceStatus status={item.status} />
                <AttendanceActions
                  item={item}
                  name={name}
                  disabled={props.disabled}
                  onMark={props.onMark}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
