'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import type { CourseDetail } from '../../schemas/course-contracts';

export function CourseCurriculum(props: { units: CourseDetail['units'] }) {
  const units = [...props.units].sort((a, b) => a.unitNumber - b.unitNumber);
  const [expanded, setExpanded] = useState<string[]>(() => (units[0] ? [units[0].id] : []));
  const allExpanded = units.length > 0 && units.every((unit) => expanded.includes(unit.id));
  return (
    <section
      id="giao-trinh"
      className="rounded-xl border border-line bg-canvas p-5 sm:p-6"
      aria-labelledby="curriculum-title"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
        <div>
          <h2 id="curriculum-title" className="text-lg font-extrabold">
            Giáo trình khóa học
          </h2>
          <p className="mt-1 text-xs text-muted">
            {units.length} học phần · Lộ trình học từng bước
          </p>
        </div>
        {units.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(allExpanded ? [] : units.map((unit) => unit.id))}
            className="min-h-11 cursor-pointer text-xs font-bold text-mint"
          >
            {allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
          </button>
        )}
      </div>
      {units.length === 0 ? (
        <p className="text-sm text-muted">Giáo trình đang được cập nhật.</p>
      ) : (
        <div className="space-y-3">
          {units.map((unit) => {
            const open = expanded.includes(unit.id);
            return (
              <div key={unit.id} className="overflow-hidden rounded-lg border border-line">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`unit-${unit.id}`}
                    onClick={() =>
                      setExpanded(
                        open ? expanded.filter((id) => id !== unit.id) : [...expanded, unit.id],
                      )
                    }
                    className="flex min-h-16 w-full cursor-pointer items-center gap-3 bg-canvas px-4 py-3 text-left hover:text-mint"
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-md border text-xs font-extrabold ${open ? 'border-mint bg-mint text-canvas' : 'border-line bg-canvas text-forest'}`}
                    >
                      {unit.unitNumber}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-bold">{unit.title}</span>
                    <Icon
                      name="chevron"
                      className={`size-4 shrink-0 transition-transform ${open ? '-rotate-90' : 'rotate-90'}`}
                    />
                  </button>
                </h3>
                <div
                  id={`unit-${unit.id}`}
                  hidden={!open}
                  className="border-t border-line px-4 py-4 text-xs leading-relaxed text-muted"
                >
                  {unit.description && (
                    <p className="mb-3 whitespace-pre-line">{unit.description}</p>
                  )}
                  <p className="flex items-center gap-2">
                    <Icon name="check" className="size-4 shrink-0 text-mint" />
                    Điểm yêu cầu để hoàn thành: {unit.requiredScorePercent}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
