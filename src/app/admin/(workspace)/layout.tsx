import { AdminShell } from '@/components/layout/admin-shell';

export default function AdminWorkspaceLayout(props: { children: React.ReactNode }) {
  return <AdminShell>{props.children}</AdminShell>;
}
