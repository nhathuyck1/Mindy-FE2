import type { Metadata } from 'next';
import { CourseCatalog } from '@/features/courses/components/catalog/course-catalog';

export const metadata: Metadata = {
  title: 'Khóa học — Mindy Coding',
  description:
    'Khám phá khóa học lập trình, xem giáo trình và chọn lớp cùng lịch học phù hợp tại Mindy.',
};

export default function CoursesPage() {
  return <CourseCatalog />;
}
