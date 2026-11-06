'use client';
import { toast } from 'sonner';
import { useAppDispatch } from '@/lib/store/hooks';
import { sendToChat } from '@/lib/store/ui-slice';
import { CHAT_TEXT_MAX, type ChatCodeLanguage, codeFence } from '../lib/chat-code';

/**
 * "Gửi vào chat": wraps the code in a fence and hands it to the floating chat, which opens so the
 * user picks a conversation; the composer then holds it as a draft to send or edit.
 */
export function useSendCodeToChat() {
  const dispatch = useAppDispatch();
  return (code: string, language: ChatCodeLanguage) => {
    if (!code.trim()) return void toast.error('Chưa có code để gửi.');
    const text = codeFence(code, language);
    if (text.length > CHAT_TEXT_MAX)
      return void toast.error('Đoạn code quá dài cho một tin nhắn (tối đa 4000 ký tự).');
    dispatch(sendToChat(text));
  };
}
