import type { Metadata } from 'next';
import { UserShell } from '@/components/layout/user-shell';
export const metadata: Metadata = {
  title: { default: 'Tài khoản | Mindy', template: '%s | Mindy' },
  robots: { index: false, follow: false },
};
export default function UserLayout(props: { children: React.ReactNode }) {
  return <UserShell>{props.children}</UserShell>;
}
