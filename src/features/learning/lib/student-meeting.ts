import type { LearningClass, LearningUnit } from '../schemas/learning-contracts';

export function studentMeetingUrl(
  context: LearningClass,
  session: LearningUnit['sessions'][number],
) {
  if (
    context.accessMode !== 'FULL' ||
    ['CANCELLED', 'COMPLETED'].includes(context.classStatus) ||
    ['CANCELLED', 'COMPLETED'].includes(session.status)
  )
    return null;
  return session.meetingUrl ?? context.meetingUrl;
}
