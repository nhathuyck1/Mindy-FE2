import type { Metadata } from 'next';
import { CourseCatalog } from '@/features/courses/components/catalog/course-catalog';

export const metadata: Metadata = {
  title: 'Học thử — Mindy Coding',
  description: 'Khám phá lớp học thử tại Mindy, xem lịch và chọn lớp phù hợp.',
};

export default function TrialPage() {
  return <CourseCatalog trialOnly />;
}
