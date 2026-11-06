'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/api/auth-queries';
import { apiRequest, ApiError } from '@/lib/api/client';
import { useSessionBoard } from '../api/whiteboard-queries';
import { sessionBoardSchema } from '../schemas/whiteboard-contracts';
import type { BoardBridge } from './whiteboard-workspace';
import './whiteboard.css';

const Workspace = dynamic(
  () => import('./whiteboard-workspace').then((m) => m.WhiteboardWorkspace),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="whiteboard-state">
        Đang chuẩn bị bảng vẽ…
      </p>
    ),
  },
);

/**
 * The class-session board: read it, create it when allowed, then open the live workspace.
 * Used full screen (`/whiteboards/[sessionId]`) and embedded next to the code editor; both open
 * the same board, so a change in one shows in the other and for students.
 */
export function SessionBoardPanel(props: {
  sessionId: string;
  /** Fills its container instead of the viewport, with a compact toolbar. */
  embedded?: boolean;
  /** Embedded only: false while the panel is hidden (keeps syncing, takes no input). */
  active?: boolean;
  /** Embedded only: receives the bridge used by "Gửi lên bảng". */
  onReady?: (bridge: BoardBridge | null) => void;
}) {
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
    onError: (e) => {
      // Someone else (another tab, the full-screen board) created it first: open that board.
      if (e instanceof ApiError && e.status === 409 && e.code === 'BOARD_ALREADY_EXISTS') {
        key.current = null;
        void context.refetch();
        return;
      }
      setError('Chưa tạo được bảng. Bạn có thể thử lại cùng thao tác.');
    },
  });
  const data = context.data;
  const embedded = Boolean(props.embedded);
  const frame = (children: React.ReactNode, status = false) =>
    embedded ? (
      <div className="whiteboard-state" data-embedded role={status ? 'status' : undefined}>
        <div>{children}</div>
      </div>
    ) : (
      <main className="whiteboard-empty" role={status ? 'status' : undefined}>
        <div>{children}</div>
      </main>
    );

  if (context.isPending) return frame('Đang mở bảng của buổi học…', true);
  if (context.isError)
    return frame(
      <>
        <p role="alert" className="mb-4">
          Chưa thể mở bảng. Hãy kiểm tra quyền truy cập buổi học và kết nối.
        </p>
        <Button onClick={() => void context.refetch()}>Thử lại</Button>
        {!embedded && (
          <Link
            href={session.data?.role === 'MENTOR' ? '/mentor' : '/user/materials'}
            className="ml-4 text-link"
          >
            Về buổi học
          </Link>
        )}
      </>,
    );
  if (!data || !session.data) return null;
  if (!data.board)
    return frame(
      <>
        <p className="mb-2 text-sm font-bold text-mint">MINDY · BẢNG VẼ LỚP HỌC</p>
        {embedded ? (
          <h2 className="text-xl font-extrabold">{data.context.sessionTitle}</h2>
        ) : (
          <h1 className="text-2xl font-extrabold">{data.context.sessionTitle}</h1>
        )}
        <p className="my-4">
          {data.capabilities.canCreate
            ? 'Tạo một không gian để giảng bài, ghi chú và cùng học. Bảng dùng chung cho cả buổi học.'
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
        {!embedded && (
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
        )}
      </>,
    );
  return (
    <Workspace
      // Stable for the board's lifetime: tab switches and resizes must not remount it.
      key={`${session.data.id}/${data.board.id}`}
      initial={{ ...data, board: data.board }}
      embedded={embedded}
      active={props.active}
      onReady={props.onReady}
    />
  );
}
