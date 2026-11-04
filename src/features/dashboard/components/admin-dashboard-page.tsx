'use client';

import { useSession } from '@/features/auth/api/auth-queries';
import { AnalyticsDashboard } from './analytics-dashboard';

export function AdminDashboardPage() {
  const session = useSession();
  return <AnalyticsDashboard audience={session.data?.role === 'MANAGER' ? 'manager' : 'admin'} />;
}
