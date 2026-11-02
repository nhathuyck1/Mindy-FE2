import {
  BookOpen,
  Code2,
  CalendarDays,
  FolderOpen,
  ReceiptText,
  UserRound,
  MessageCircle,
} from 'lucide-react';

export const userNavigation = [
  { href: '/user/messages', label: 'Tin nhắn', icon: MessageCircle },
  { href: '/user/profile', label: 'Thông tin cá nhân', icon: UserRound },
  { href: '/user/orders', label: 'Đơn hàng của tôi', icon: ReceiptText },
  { href: '/user/schedule', label: 'Lịch học', icon: CalendarDays },
  { href: '/user/courses', label: 'Khóa học của tôi', icon: BookOpen },
  { href: '/user/materials', label: 'Tài liệu học tập', icon: FolderOpen },
  { href: '/user/assignments', label: 'Bài tập lập trình', icon: Code2 },
] as const;
