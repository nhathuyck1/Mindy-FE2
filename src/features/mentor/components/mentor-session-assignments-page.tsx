'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LinkLoadingIcon } from '@/components/ui/link-loading-icon';
import { AssignmentList } from '@/features/assignments/components/assignment-list';
import { useSession } from '@/features/auth/api/auth-queries';
import { MentorSessionAssignments } from '@/features/code-assignments/components/mentor-session-assignments';
import { useMentorQuery } from '../api/mentor-queries';
import { sessionContextSchema } from '../schemas/mentor-contracts';
import { workspaceSchema } from '../schemas/workspace-contracts';
import { MentorQueryState } from './mentor-shared';

export function MentorSessionAssignmentsPage(props: { sessionId: string }) {
  const actor = useSession();
  const context = useMentorQuery(`class-sessions/${props.sessionId}/context`, sessionContextSchema);
  const session = context.data?.session;
  const workspace = useMentorQuery(
    `mentor/classes/${session?.classId}`,
    workspaceSchema,
    Boolean(session),
  );
  const canCreate =
    session &&
    workspace.data &&
    (session.effectiveMentor?.id === actor.data?.id || workspace.data.accessScope === 'CLASS') &&
    !workspace.data.readonly &&
    ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(session.status);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <Link
        href={`/mentor/sessions/${props.sessionId}`}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-forest hover:underline"
      >
        <LinkLoadingIcon>
          <ArrowLeft aria-hidden="true" className="size-4" />
        </LinkLoadingIcon>
        Quay lại buổi học
      </Link>
      <MentorQueryState
        pending={context.isPending || Boolean(session && workspace.isPending)}
        error={context.error || workspace.error}
        retry={() => Promise.all([context.refetch(), ...(session ? [workspace.refetch()] : [])])}
      >
        {session && workspace.data && (
          <>
            <AssignmentList
              session={{
                id: session.sessionId,
                title: session.title,
                startsAt: session.startsAt,
                sessionNumber: null,
                unitTitle: null,
              }}
              mentor
              canCreate={Boolean(canCreate)}
            />
            <MentorSessionAssignments sessionId={props.sessionId} readonly={!canCreate} />
          </>
        )}
      </MentorQueryState>
    </div>
  );
}
