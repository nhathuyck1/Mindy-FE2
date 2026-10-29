'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { ApiError } from '@/lib/api/client';
import { apiRequest } from '@/lib/api/client';
import { managerLeaveActionResultSchema } from '../schemas/manager-leave-contracts';

type LeaveAction = {
  path: string;
  body: Record<string, unknown>;
};

export function useManagerLeaveCommand() {
  const client = useQueryClient();
  const unresolved = useRef<{ fingerprint: string; key: string } | null>(null);

  return useMutation({
    retry: false,
    mutationFn: async (input: LeaveAction) => {
      const fingerprint = JSON.stringify([input.path, input.body]);
      const key =
        unresolved.current?.fingerprint === fingerprint
          ? unresolved.current.key
          : crypto.randomUUID();
      unresolved.current = { fingerprint, key };
      try {
        const result = await apiRequest({
          path: input.path,
          method: 'POST',
          body: input.body,
          idempotencyKey: key,
          schema: managerLeaveActionResultSchema,
        });
        unresolved.current = null;
        return result;
      } catch (error) {
        if (error instanceof ApiError && error.status < 500) unresolved.current = null;
        throw error;
      }
    },
    onSettled: async (data, error) => {
      const outcomeUnknown = !data && (!(error instanceof ApiError) || error.status >= 500);
      if (outcomeUnknown) return;
      await Promise.all([
        client.invalidateQueries({ queryKey: ['manager'] }),
        client.invalidateQueries({ queryKey: ['mentor'] }),
        client.invalidateQueries({ queryKey: ['my-classes'] }),
        client.invalidateQueries({ queryKey: ['my-schedule'] }),
      ]);
    },
  });
}

export function managerLeaveError(error: unknown): string {
  if (!(error instanceof ApiError))
    return error instanceof Error
      ? 'Chưa rõ kết quả xử lý do kết nối bị gián đoạn. Hãy thử lại cùng thao tác.'
      : 'Không thể hoàn tất thao tác. Hãy thử lại cùng thao tác.';

  const messages: Record<string, string> = {
    LEAVE_FORBIDDEN: 'Tài khoản không còn quyền xử lý đơn này.',
    LEAVE_NOT_FOUND: 'Không tìm thấy đơn. Hãy quay lại danh sách và tải lại.',
    LEAVE_REQUEST_STALE:
      'Lịch nguồn đã đổi. Không thể duyệt đơn này; mentor cần rút đơn chờ và gửi đơn mới.',
    LEAVE_VERSION_CONFLICT: 'Đơn đã thay đổi. Hãy tải lại chi tiết trước khi quyết định.',
    LEAVE_STATE_CONFLICT: 'Đơn đã được xử lý hoặc không còn ở trạng thái chờ duyệt.',
    LEAVE_REQUEST_EXPIRED: 'Đơn đã hết hạn. Hãy tải lại danh sách.',
    LEAVE_STUDENT_CONFLICT_ACK_REQUIRED:
      'Phát hiện xung đột lịch học viên mới. Hãy tải lại và xác nhận lại trước khi duyệt.',
    LEAVE_STUDENT_CONFLICT: 'Lịch dạy bù bị trùng lịch học viên; không thể duyệt đơn.',
    LEAVE_TARGET_CONFLICT: 'Lịch dạy bù hiện bị trùng. Hãy từ chối đơn để mentor gửi lịch mới.',
    SESSION_HAS_MAKEUP_PLACEMENTS:
      'Buổi gốc đang có học viên học bù đã xếp. Cần xử lý placement trước khi duyệt.',
    LEAVE_MENTOR_INACTIVE: 'Mentor đã ngừng hoạt động. Hãy xử lý tài khoản trước khi duyệt.',
    IDEMPOTENCY_KEY_REUSED:
      'Mã thao tác đã gắn với nội dung khác. Hãy tải lại đơn và mở xác nhận mới.',
  };
  if (messages[error.code]) return messages[error.code];
  if (error.status === 401) return 'Phiên đăng nhập hết hạn. Hãy đăng nhập lại.';
  if (error.status === 403) return 'Tài khoản hiện không có quyền quản lý đơn xin nghỉ.';
  if (error.status === 404) return 'Không tìm thấy đơn hoặc nguồn liên quan. Hãy tải lại.';
  if (error.status >= 500)
    return 'Máy chủ chưa xác nhận kết quả. Thử lại để gửi đúng cùng thao tác.';
  return error.message || 'Không thể hoàn tất thao tác. Hãy kiểm tra đơn rồi thử lại.';
}
