'use client';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api/client';
import { useSession } from '@/features/auth/api/auth-queries';
import { sessionBoardSchema } from '../schemas/whiteboard-contracts';
export function useSessionBoard(sessionId: string) {
  const session = useSession();
  return useQuery({
    queryKey: ['whiteboard', session.data?.id, sessionId],
    enabled: !!session.data,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `class-sessions/${sessionId}/whiteboard`,
        schema: sessionBoardSchema,
        signal,
      }),
    retry: false,
  });
}
