'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  Users,
  ChartNoAxesCombined,
  TrendingUp,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMentorQuery } from '../api/mentor-queries';
import { workspaceSchema } from '../schemas/workspace-contracts';
import { MentorHeading, MentorQueryState } from './mentor-shared';
import { MentorUnits } from './mentor-units';
import { MentorClassStudents } from './mentor-class-students';
import { MentorClassTimetable } from './mentor-class-timetable';
import { MentorClassAttendance, MentorClassProgress } from './mentor-class-reports';

export function MentorClassPage(props: { classId: string }) {
  const [tab, setTab] = useState('units');
  const query = useMentorQuery(`mentor/classes/${props.classId}`, workspaceSchema);
  const item = query.data;
  const tabs = [
    { icon: BookOpen, id: 'units', title: 'Chương', allowed: item?.status !== 'CANCELLED' },
    { icon: CalendarDays, id: 'sessions', title: 'Buổi học', allowed: true },
    { icon: Users, id: 'students', title: 'Học viên', allowed: item?.capabilities.readClassRoster },
    {
      icon: ChartNoAxesCombined,
      id: 'attendance',
      title: 'Chuyên cần',
      allowed: item?.capabilities.readClassReports,
    },
    {
      icon: TrendingUp,
      id: 'progress',
      title: 'Tiến độ',
      allowed: item?.capabilities.readClassReports,
    },
  ].filter((entry) => entry.allowed);
  const active = tabs.some((entry) => entry.id === tab) ? tab : tabs[0]?.id;
  return (
    <>
      <Link href="/mentor/classes" className="mb-6 inline-block text-sm font-bold text-mint">
        ← Lớp của tôi
      </Link>
      <MentorHeading
        title={item?.name ?? 'Quản lý lớp học'}
        description={
          item ? `${item.code} · ${item.course.title}` : 'Theo dõi lớp và các buổi được phân công.'
        }
      />
      <MentorQueryState pending={query.isPending} error={query.error} retry={query.refetch}>
        {item && (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">
                <GraduationCap aria-hidden="true" className="size-4 shrink-0 text-mint" />
                {item.accessScope === 'SESSION'
                  ? 'Dạy thay · Chỉ xem chương và buổi được phân công'
                  : 'Mentor chính · Theo dõi toàn lớp'}{' '}
                · {item.visibleUnitCount} chương · {item.visibleSessionCount} buổi
                {item.readonly ? ' · Chỉ xem lịch sử' : ''}
              </p>
              <Button
                variant="ghost"
                aria-label="Tải lại quyền"
                className="text-muted"
                onClick={() => query.refetch()}
              >
                <RefreshCw aria-hidden="true" className="size-4" />
                Làm mới lớp
              </Button>
            </div>
            <div
              className="mb-7 flex gap-1 overflow-x-auto border-b border-line"
              role="group"
              aria-label="Nội dung lớp học"
            >
              {tabs.map((entry) => (
                <Button
                  key={entry.id}
                  aria-pressed={active === entry.id}
                  variant="unstyled"
                  size="unstyled"
                  className={`relative min-h-12 shrink-0 gap-2 rounded-none border-b-2 px-3 text-sm font-bold sm:px-5 ${active === entry.id ? 'border-mint bg-mint/5 text-mint' : 'border-transparent text-muted hover:bg-soft hover:text-forest'}`}
                  onClick={() => setTab(entry.id)}
                >
                  <entry.icon aria-hidden="true" className="size-4" />
                  {entry.title}
                </Button>
              ))}
            </div>
            {active === 'units' && (
              <MentorUnits
                classId={props.classId}
                canAuthor={item.capabilities.authorMaterials && !item.readonly}
              />
            )}
            {active === 'sessions' && <MentorClassTimetable classId={props.classId} />}
            {active === 'students' && <MentorClassStudents classId={props.classId} />}
            {active === 'attendance' && <MentorClassAttendance classId={props.classId} />}
            {active === 'progress' && <MentorClassProgress classId={props.classId} />}
          </>
        )}
      </MentorQueryState>
    </>
  );
}
