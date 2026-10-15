import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';

export const metadata: Metadata = {
  title: { default: 'Quản trị | Mindy', template: '%s | Mindy Admin' },
  robots: { index: false, follow: false },
};

export default function AdminLayout(props: { children: React.ReactNode }) {
  return <AdminShell>{props.children}</AdminShell>;
}
