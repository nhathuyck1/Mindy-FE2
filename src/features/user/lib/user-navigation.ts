import {
  BookOpen,
  ClipboardList,
  CalendarDays,
  FolderOpen,
  ReceiptText,
  UserRound,
  MessageCircle,
  LayoutDashboard,
} from 'lucide-react';

export const userNavigation = [
  { href: '/user', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/user/orders', label: 'Đơn hàng của tôi', icon: ReceiptText },
  { href: '/user/schedule', label: 'Lịch học', icon: CalendarDays },
  { href: '/user/courses', label: 'Khóa học của tôi', icon: BookOpen },
  { href: '/user/materials', label: 'Tài liệu học tập', icon: FolderOpen },
  { href: '/user/assignments', label: 'Bài tập', icon: ClipboardList },
  { href: '/user/messages', label: 'Tin nhắn', icon: MessageCircle },
  { href: '/user/profile', label: 'Thông tin cá nhân', icon: UserRound },
] as const;
