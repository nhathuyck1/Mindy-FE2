'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useUnitMaterials } from '@/features/learning/api/learning-queries';
import { LearningMaterialList } from '@/features/learning/components/learning-material-list';
import { LearningState } from '@/features/learning/components/learning-state';
import type { LearningUnit } from '@/features/learning/schemas/learning-contracts';

export function StudentSessionMaterials(props: {
  classId: string;
  sessionId: string;
  unit: LearningUnit;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const locked = props.unit.status === 'LOCKED';
  const query = useUnitMaterials(props.classId, props.unit.id, !locked);
  const items =
    query.data?.filter((item) => !item.sessionId || item.sessionId === props.sessionId) ?? [];
  return (
    <section
      aria-label="Chương của buổi học"
      className="min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas"
    >
      <h2 className="flex items-start gap-2.5 border-b border-line bg-soft/35 px-5 py-4 text-lg font-extrabold">
        <BookOpen aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-mint" />
        <span className="min-w-0 [overflow-wrap:anywhere]">
          Chương {props.unit.position}: {props.unit.title}
        </span>
      </h2>
      {locked ? (
        <LearningState>Chương chưa được mở. Vui lòng chờ mentor mở nội dung.</LearningState>
      ) : query.isPending ? (
        <LearningState>Đang tải tài liệu buổi học…</LearningState>
      ) : query.isError ? (
        <LearningState error={query.error} retry={() => void query.refetch()} />
      ) : items.length ? (
        <LearningMaterialList
          items={items}
          classId={props.classId}
          unitId={props.unit.id}
          openId={openId}
          onToggle={(id) => setOpenId(openId === id ? null : id)}
        />
      ) : (
        <LearningState>Chưa có tài liệu được phát hành cho buổi học này.</LearningState>
      )}
    </section>
  );
}
