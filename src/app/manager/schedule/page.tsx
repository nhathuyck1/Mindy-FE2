import type { Metadata } from 'next';
import { ManagerSchedulePage } from '@/features/manager/components/manager-schedule-page';

export const metadata: Metadata = { title: 'Lịch và khai giảng' };

export default function Page() {
  return <ManagerSchedulePage />;
}
