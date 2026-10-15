import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import type { Course } from '../../schemas/course-contracts';
import { formatPrice } from '../../lib/course-format';
import { CourseImage } from './course-image';

export function CourseCard(props: {
  course: Course;
  list?: boolean;
  headingLevel?: 2 | 3;
  comfortable?: boolean;
}) {
  const course = props.course;
  const Heading = props.headingLevel === 3 ? 'h3' : 'h2';
  return (
    <article
      className={`group relative flex h-full overflow-hidden rounded-xl border border-line bg-canvas transition-shadow hover:shadow-lg hover:shadow-forest/5 ${props.list ? 'flex-col sm:flex-row' : 'flex-col'}`}
    >
      <div
        className={`relative shrink-0 overflow-hidden bg-soft ${props.list ? 'aspect-video sm:aspect-auto sm:w-56' : 'aspect-video'}`}
      >
        <CourseImage
          src={course.imgUrl}
          title={course.title}
          sizes="(max-width: 639px) 90vw, (max-width: 1023px) 44vw, 310px"
        />
        <span
          className={`absolute top-3 left-3 rounded-md bg-canvas/95 px-2.5 py-1 font-extrabold text-forest ${props.comfortable ? 'text-xs' : 'text-[10px]'}`}
        >
          {course.code}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <p
          className={`mb-2 truncate font-bold text-mint ${props.comfortable ? 'min-h-5 text-sm' : 'min-h-4 text-[11px]'}`}
        >
          {course.category.name}
        </p>
        <Heading
          className={`leading-snug font-extrabold group-hover:text-mint ${props.comfortable ? 'min-h-[50px] text-lg' : 'min-h-11 text-base'}`}
        >
          <Link
            href={`/courses/${course.id}`}
            className="line-clamp-2 after:absolute after:inset-0"
          >
            {course.title}
          </Link>
        </Heading>
        <p
          className={`mt-2 mb-5 line-clamp-2 leading-relaxed text-muted ${props.comfortable ? 'min-h-12 text-sm font-semibold' : 'min-h-10 text-xs'}`}
        >
          {course.description ?? 'Khám phá nội dung và các lớp học của khóa học.'}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p
              className={
                props.comfortable ? 'text-xs font-semibold text-muted' : 'text-[10px] text-muted'
              }
            >
              Học phí khóa học
            </p>
            <p
              data-course-price
              className={`mt-1 whitespace-nowrap leading-tight font-extrabold tabular-nums text-mint ${props.comfortable ? 'text-[26px]' : 'text-2xl'}`}
            >
              {formatPrice(course.priceAmount)}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-soft text-mint"
          >
            <Icon name="arrow" className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
