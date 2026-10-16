import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import '@/app/admin/admin.css';
import { ManagerShell } from '@/components/layout/manager-shell';
export const metadata: Metadata = {
  title: { default: 'Manager | Mindy', template: '%s | Mindy Manager' },
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default function ManagerLayout(props: { children: React.ReactNode }) {
  return (
    <div data-admin-root className="contents">
      <ManagerShell>{props.children}</ManagerShell>
    </div>
  );
}
