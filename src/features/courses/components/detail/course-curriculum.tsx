import type { CourseDetail } from '../../schemas/course-contracts';

export function CourseCurriculum(props: { units: CourseDetail['units'] }) {
  const units = [...props.units].sort((a, b) => a.unitNumber - b.unitNumber);
  return (
    <section
      id="giao-trinh"
      className="mt-8 border-t border-canvas pt-8 text-forest"
      aria-labelledby="curriculum-title"
    >
      <div className="mb-5">
        <h3 id="curriculum-title" className="text-xl font-extrabold sm:text-2xl">
          Giáo trình khóa học
        </h3>
        <p className="mt-2 text-sm font-semibold text-muted">{units.length} học phần</p>
      </div>
      {units.length === 0 ? (
        <p className="text-base text-muted">Giáo trình đang được cập nhật.</p>
      ) : (
        <ol className="space-y-3">
          {units.map((unit) => (
            <li
              key={unit.id}
              className="flex min-h-18 items-start gap-3 rounded-xl border-2 border-canvas bg-canvas p-4 shadow-sm shadow-forest/5 sm:gap-4"
            >
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-lg bg-logo-soft text-base font-extrabold text-mint"
              >
                {unit.unitNumber}
              </span>
              <div className="min-w-0 pt-1">
                <h4 className="text-base leading-relaxed font-bold sm:text-lg">{unit.title}</h4>
                {unit.description && (
                  <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-muted">
                    {unit.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
