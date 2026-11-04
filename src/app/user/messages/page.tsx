import { Suspense } from 'react';
import { ChatPage } from '@/features/chat/components/chat-page';
export const metadata = { title: 'Tin nhắn' };
export default function MessagesPage() {
  return (
    <Suspense fallback={<p>Đang tải tin nhắn…</p>}>
      <ChatPage />
    </Suspense>
  );
}
