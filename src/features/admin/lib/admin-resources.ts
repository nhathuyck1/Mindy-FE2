import type { Icon } from '@/components/ui/icon';
import type { ComponentProps } from 'react';

export type AdminResource = 'users' | 'courses' | 'classes';
export const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  MENTOR: 'Giảng viên',
  STUDENT: 'Học viên',
};
export const statusLabels: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  PENDING_VERIFICATION: 'Chờ xác thực',
  SUSPENDED: 'Tạm khóa',
  true: 'Đã kích hoạt',
  false: 'Chưa kích hoạt',
  DRAFT: 'Bản nháp',
  OPEN: 'Đang tuyển sinh',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};
export const adminResources = {
  users: {
    title: 'Người dùng',
    singular: 'người dùng',
    description: 'Quản lý tài khoản và theo dõi trạng thái của mọi thành viên.',
    icon: 'users',
    primary: 'Thành viên',
    secondary: 'Vai trò',
    metric: 'Điện thoại',
    date: 'Ngày tạo',
    statusKey: 'status',
    tabs: ['', 'ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'],
    filterKey: 'role',
    filterLabel: 'Tất cả vai trò',
    filters: [
      ['ADMIN', 'Quản trị viên'],
      ['MANAGER', 'Quản lý'],
      ['MENTOR', 'Giảng viên'],
      ['STUDENT', 'Học viên'],
    ],
  },
  courses: {
    title: 'Khóa học',
    singular: 'khóa học',
    description: 'Theo dõi danh mục, học phí và trạng thái xuất bản khóa học.',
    icon: 'book',
    primary: 'Khóa học',
    secondary: 'Danh mục',
    metric: 'Học phí',
    date: 'Ngày tạo',
    statusKey: 'isActive',
    tabs: ['', 'true', 'false'],
    filterKey: '',
    filterLabel: '',
    filters: [],
  },
  classes: {
    title: 'Lớp học',
    singular: 'lớp học',
    description: 'Theo dõi lớp học từ bản nháp đến tuyển sinh và hoàn thành.',
    icon: 'calendar',
    primary: 'Lớp học',
    secondary: 'Giảng viên',
    metric: 'Chỗ còn lại',
    date: 'Khai giảng',
    statusKey: 'status',
    tabs: ['', 'DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    filterKey: 'deliveryMode',
    filterLabel: 'Tất cả hình thức',
    filters: [
      ['ONLINE', 'Trực tuyến'],
      ['OFFLINE', 'Tại trung tâm'],
    ],
  },
} as const satisfies Record<
  AdminResource,
  {
    title: string;
    singular: string;
    description: string;
    icon: ComponentProps<typeof Icon>['name'];
    primary: string;
    secondary: string;
    metric: string;
    date: string;
    statusKey: string;
    tabs: readonly string[];
    filterKey: string;
    filterLabel: string;
    filters: readonly (readonly [string, string])[];
  }
>;

export type AdminRow = {
  id: string;
  name: string;
  subtitle: string;
  secondary: string;
  status: string;
  metric: string;
  date: string;
  fields: { label: string; value: string }[];
  capacity?: { available: number; max: number };
};
export type AdminPageData = { items: AdminRow[]; page: number; pageSize: number; total: number };

export function formatAdminDate(value: string | null): string {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
}

export function normalizeAdminSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi');
}

// Prevent spreadsheet formulas in user-controlled exported cells.
export function adminCsv(rows: AdminRow[], resource: AdminResource): string {
  const config = adminResources[resource];
  const cell = (value: string) =>
    `"${(/^[\s\u0000-\u001f]*[=+@-]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
  return (
    '\uFEFF' +
    [
      [config.primary, 'Email / Mã', config.secondary, 'Trạng thái', config.metric, config.date],
      ...rows.map((row) => [
        row.name,
        row.subtitle,
        row.secondary,
        statusLabels[row.status],
        row.metric,
        formatAdminDate(row.date),
      ]),
    ]
      .map((row) => row.map(cell).join(','))
      .join('\r\n')
  );
}

export const optionalColumns = ['secondary', 'status', 'metric', 'date'] as const;
export type OptionalColumn = (typeof optionalColumns)[number];
