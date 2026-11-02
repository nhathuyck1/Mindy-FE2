import type { Conversation } from '../schemas/chat-contracts';
export const conversationName = (conversation: Conversation) =>
  conversation.peer?.displayName || conversation.name || 'Nhóm lớp học';
