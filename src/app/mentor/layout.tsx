import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import '@/app/admin/admin.css';
import { MentorShell } from '@/components/layout/mentor-shell';
export const metadata: Metadata = {
  title: { default: 'Mentor | Mindy', template: '%s | Mindy Mentor' },
  robots: { index: false, follow: false },
};
export default function MentorLayout(props: { children: React.ReactNode }) {
  return (
    <div data-admin-root className="contents">
      <MentorShell>{props.children}</MentorShell>
    </div>
  );
}
