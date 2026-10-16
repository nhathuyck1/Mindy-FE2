import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import './admin.css';

export const metadata: Metadata = {
  title: { default: 'Quản trị | Mindy', template: '%s | Mindy Admin' },
  robots: { index: false, follow: false },
};

export default function AdminLayout(props: { children: React.ReactNode }) {
  return (
    <div data-admin-root className="contents">
      {props.children}
    </div>
  );
}
