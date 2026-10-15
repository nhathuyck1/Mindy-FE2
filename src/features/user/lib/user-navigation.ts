import { BookOpen, CalendarDays, FolderOpen, ReceiptText, UserRound } from 'lucide-react';

export const userNavigation = [
  { href: '/user/profile', label: 'Thông tin cá nhân', icon: UserRound },
  { href: '/user/orders', label: 'Đơn hàng của tôi', icon: ReceiptText },
  { href: '/user/schedule', label: 'Lịch học', icon: CalendarDays },
  { href: '/user/courses', label: 'Khóa học của tôi', icon: BookOpen },
  { href: '/user/materials', label: 'Tài liệu học tập', icon: FolderOpen },
] as const;
