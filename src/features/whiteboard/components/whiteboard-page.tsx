'use client';
import Link from 'next/link';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { useSession } from '@/features/auth/api/auth-queries';
import { boardUuid } from '../schemas/whiteboard-contracts';
import { SessionBoardPanel } from './session-board-panel';

function SessionWhiteboard(props: { sessionId: string }) {
  const session = useSession();
  if (!session.data || !['MENTOR', 'STUDENT'].includes(session.data.role))
    return (
      <main className="p-8">
        <p>Bảng dành cho mentor và học viên của buổi học.</p>
        <Link href="/">Về trang chủ</Link>
      </main>
    );
  return <SessionBoardPanel sessionId={props.sessionId} />;
}
export function WhiteboardPage(props: { sessionId: string }) {
  if (!boardUuid.safeParse(props.sessionId).success)
    return <main className="p-8">Địa chỉ buổi học không hợp lệ.</main>;
  return (
    <AuthGuard>
      <SessionWhiteboard sessionId={props.sessionId} />
    </AuthGuard>
  );
}
