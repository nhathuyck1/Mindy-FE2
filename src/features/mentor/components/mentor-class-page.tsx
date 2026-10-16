'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MentorHeading } from './mentor-shared';
import { MentorUnits } from './mentor-units';
import { MentorClassStudents } from './mentor-class-students';

export function MentorClassPage(props: { classId: string }) {
  const [tab, setTab] = useState<'students' | 'units'>('students');
  return (
    <>
      <Link href="/mentor/classes" className="mb-6 inline-block text-sm font-bold text-mint">
        ← Lớp của tôi
      </Link>
      <MentorHeading
        title="Quản lý lớp học"
        description="Theo dõi học viên và chuẩn bị nội dung cho các chương được phân công."
      />
      <div className="mb-6 flex flex-wrap gap-3" role="group" aria-label="Nội dung lớp học">
        <Button
          aria-pressed={tab === 'students'}
          variant={tab === 'students' ? 'default' : 'outline'}
          onClick={() => setTab('students')}
        >
          Học viên
        </Button>
        <Button
          aria-pressed={tab === 'units'}
          variant={tab === 'units' ? 'default' : 'outline'}
          onClick={() => setTab('units')}
        >
          Chương & học liệu
        </Button>
      </div>
      {tab === 'students' ? (
        <MentorClassStudents classId={props.classId} />
      ) : (
        <MentorUnits classId={props.classId} />
      )}
    </>
  );
}
