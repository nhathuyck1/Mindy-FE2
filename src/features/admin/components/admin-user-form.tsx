'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { AdminRow } from '../lib/admin-resources';
import type { User } from '@/lib/api/contracts';
import { useSession } from '@/features/auth/api/auth-queries';
import { useAdminWrite } from '../api/admin-edit-queries';
import { createAdminUserSchema } from '../schemas/admin-write-contracts';
import { roleLabels } from '../lib/admin-resources';
import { AdminStatus } from './admin-status';
import {
  AdminField,
  AdminSubmitButton,
  AdminFormMessage,
  AdminConfirmAction,
  adminFormError,
  optionalText,
} from './admin-form-parts';

const MENTOR_SUSPEND_WARNING =
  ' Giảng viên bị khóa sẽ không thể bắt đầu các buổi đã xếp: hãy phân công giảng viên khác cho lớp và buổi sắp tới trước.';

function statusConfirmText(status: string, account: string, isMentor: boolean): string {
  const base = `Xác nhận ${status === 'ACTIVE' ? 'cho phép' : 'tạm khóa'} truy cập của tài khoản ${account}?`;
  return status === 'SUSPENDED' && isMentor ? base + MENTOR_SUSPEND_WARNING : base;
}

export function AdminCreateUserForm(props: { onCreated: (id: string) => void }) {
  const mutation = useAdminWrite();
  const [error, setError] = useState('');
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setError('');
        const data = new FormData(event.currentTarget);
        try {
          const body = createAdminUserSchema.parse({
            displayName: data.get('displayName'),
            email: String(data.get('email') ?? '').trim(),
            phone: optionalText(data, 'phone'),
            password: data.get('password'),
            role: data.get('role'),
          });
          const result = await mutation.mutateAsync({ path: 'admin/users', method: 'POST', body });
          props.onCreated(result.id);
        } catch (failure) {
          setError(adminFormError(failure));
        }
      }}
    >
      <AdminField name="displayName" label="Họ tên" required maxLength={150} />
      <AdminField name="email" label="Email" type="email" required maxLength={320} />
      <AdminField
        name="phone"
        label="Điện thoại"
        maxLength={32}
        hint="Nếu nhập, số điện thoại cần từ 7 đến 32 ký tự."
      />
      <AdminField
        name="role"
        label="Vai trò"
        required
        defaultValue="STUDENT"
        options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))}
      />
      <AdminField
        name="password"
        label="Mật khẩu ban đầu"
        type="password"
        required
        maxLength={128}
        hint="Từ 6 đến 128 ký tự. Tài khoản tạo bởi Admin ở trạng thái hoạt động."
      />
      <AdminFormMessage error={error} />
      <AdminSubmitButton pending={mutation.isPending} label="Tạo người dùng" />
    </form>
  );
}

export function AdminUserForm(props: { user: User }) {
  const mutation = useAdminWrite();
  // The BE rejects an admin changing their own status; hide the action instead of failing.
  const isSelf = useSession().data?.id === props.user.id;
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line p-4">
        <h3 className="font-extrabold break-words">{props.user.displayName}</h3>
        <p className="mt-1 text-sm break-all text-muted">{props.user.email}</p>
        <p className="mt-2 text-sm">
          {roleLabels[props.user.role]} · {props.user.phone || 'Chưa có số điện thoại'}
        </p>
        <div className="mt-3">
          <AdminStatus status={props.user.status} />
        </div>
      </div>
      <p className="text-sm leading-7 text-muted">
        Quản lý trạng thái truy cập tài khoản. Thông tin hồ sơ hiện chỉ hỗ trợ xem theo API của hệ
        thống.
      </p>
      <div className="flex flex-wrap gap-3">
        {(['ACTIVE', 'SUSPENDED'] as const)
          .filter((status) => !isSelf && status !== props.user.status)
          .map((status) => (
            <AdminConfirmAction
              key={status}
              label={status === 'ACTIVE' ? 'Mở tài khoản' : 'Khóa tài khoản'}
              destructive={status === 'SUSPENDED'}
              pending={mutation.isPending}
              description={statusConfirmText(
                status,
                props.user.email,
                props.user.role === 'MENTOR',
              )}
              onConfirm={async () => {
                await mutation.mutateAsync({
                  path: `admin/users/${props.user.id}/status`,
                  method: 'PATCH',
                  body: { status },
                });
              }}
            />
          ))}
      </div>
      <AdminFormMessage saved={mutation.isSuccess} />
    </div>
  );
}

export function AdminUserStatusAction(props: { row: AdminRow }) {
  const mutation = useAdminWrite();
  const isSelf = useSession().data?.id === props.row.id;
  const status = props.row.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
  const label = status === 'ACTIVE' ? 'Mở tài khoản' : 'Khóa tài khoản';
  if (isSelf) return null;
  return (
    <AdminConfirmAction
      label={label}
      description={statusConfirmText(
        status,
        props.row.subtitle,
        props.row.secondary === roleLabels.MENTOR,
      )}
      destructive={status === 'SUSPENDED'}
      pending={mutation.isPending}
      trigger={{
        icon: <Trash2 className="size-4" />,
        label: `${label}: ${props.row.name}`,
        className:
          'size-11 rounded-lg border-status-yellow/30 bg-status-yellow/8 p-0 text-status-yellow hover:bg-status-yellow/15',
      }}
      onConfirm={async () => {
        await mutation.mutateAsync({
          path: `admin/users/${props.row.id}/status`,
          method: 'PATCH',
          body: { status },
        });
      }}
    />
  );
}
