'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { useSession } from '@/features/auth/api/auth-queries';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api/client';
import { useSessionBoard } from '../api/whiteboard-queries';
import { boardUuid, sessionBoardSchema } from '../schemas/whiteboard-contracts';
import './whiteboard.css';

const Workspace = dynamic(
  () => import('./whiteboard-workspace').then((m) => m.WhiteboardWorkspace),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="p-8">
        Đang chuẩn bị bảng vẽ…
      </p>
    ),
  },
);
function SessionWhiteboard(props: { sessionId: string }) {
  const session = useSession(),
    context = useSessionBoard(props.sessionId),
    key = useRef<string | null>(null),
    [error, setError] = useState('');
  const create = useMutation({
    retry: false,
    mutationFn: () =>
      apiRequest({
        path: `class-sessions/${props.sessionId}/whiteboard`,
        method: 'POST',
        body: {},
        schema: sessionBoardSchema,
        idempotencyKey: key.current ?? (key.current = crypto.randomUUID()),
      }),
    onSuccess: () => {
      key.current = null;
      void context.refetch();
    },
    onError: () => setError('Chưa tạo được bảng. Bạn có thể thử lại cùng thao tác.'),
  });
  const data = context.data;
  if (!session.data || !['MENTOR', 'STUDENT'].includes(session.data.role))
    return (
      <main className="p-8">
        <p>Bảng dành cho mentor và học viên của buổi học.</p>
        <Link href="/">Về trang chủ</Link>
      </main>
    );
  if (context.isPending)
    return (
      <main className="p-8" role="status">
        Đang mở bảng của buổi học…
      </main>
    );
  if (context.isError)
    return (
      <main className="space-y-4 p-8">
        <p role="alert">Chưa thể mở bảng. Hãy kiểm tra quyền truy cập buổi học và kết nối.</p>
        <Button onClick={() => void context.refetch()}>Thử lại</Button>
        <Link
          href={session.data.role === 'MENTOR' ? '/mentor' : '/user/materials'}
          className="ml-4 text-link"
        >
          Về buổi học
        </Link>
      </main>
    );
  if (!data) return null;
  if (!data.board)
    return (
      <main className="whiteboard-empty">
        <div>
          <p className="mb-2 text-sm font-bold text-mint">MINDY · BẢNG VẼ LỚP HỌC</p>
          <h1 className="text-2xl font-extrabold">{data.context.sessionTitle}</h1>
          <p className="my-5">
            {data.capabilities.canCreate
              ? 'Tạo một không gian để giảng bài, ghi chú và cùng học.'
              : 'Mentor chưa tạo bảng cho buổi học này.'}
          </p>
          {data.capabilities.canCreate && (
            <Button
              disabled={create.isPending}
              onClick={() => {
                setError('');
                create.mutate();
              }}
            >
              {create.isPending ? 'Đang tạo…' : 'Tạo bảng vẽ'}
            </Button>
          )}
          {error && (
            <p role="alert" className="mt-4">
              {error}
            </p>
          )}
          <p className="mt-5">
            <Link
              className="text-link"
              href={
                data.context.mentor
                  ? `/mentor/sessions/${props.sessionId}`
                  : `/user/materials/${data.context.classId}`
              }
            >
              ← Về buổi học
            </Link>
          </p>
        </div>
      </main>
    );
  return (
    <Workspace
      key={`${session.data.id}/${data.board.id}`}
      initial={{ ...data, board: data.board }}
    />
  );
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
