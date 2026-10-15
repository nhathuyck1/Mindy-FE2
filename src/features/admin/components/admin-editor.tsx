'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Users, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAdminDetail } from '../api/admin-edit-queries';
import { adminResources, type AdminResource, type AdminRow } from '../lib/admin-resources';
import { AdminRecordDetails } from './admin-record-details';
import { AdminQueryState } from './admin-query-state';
import { AdminCreateUserForm, AdminUserForm, AdminUserStatusAction } from './admin-user-form';
import { AdminCourseForm } from './admin-course-form';
import { AdminCreateClassForm, AdminClassForm } from './admin-class-form';

function AdminEditorDialog(props: {
  resource: AdminResource;
  id?: string;
  onClose: () => void;
  returnFocus?: HTMLElement | null;
  embedded?: boolean;
}) {
  const [id, setId] = useState(props.id);
  const query = useAdminDetail(props.resource, id);
  const label = adminResources[props.resource].singular;
  return (
    <Modal
      title={
        id && props.resource === 'users'
          ? 'Trạng thái tài khoản'
          : `${id ? 'Quản lý' : 'Tạo'} ${label}`
      }
      onClose={props.onClose}
      contentClassName="sm:max-w-3xl"
      returnFocus={props.returnFocus}
      embedded={props.embedded}
    >
      <div className="p-5 sm:p-6">
        {id ? (
          query.isPending || query.isError ? (
            <AdminQueryState
              loading={query.isPending}
              variant="modal"
              error={query.error}
              onRetry={() => query.refetch()}
            />
          ) : query.data.resource === 'users' ? (
            <AdminUserForm user={query.data.value} />
          ) : query.data.resource === 'courses' ? (
            <AdminCourseForm initial={query.data.value} onCreated={setId} />
          ) : (
            <AdminClassForm initial={query.data.value} />
          )
        ) : props.resource === 'users' ? (
          <AdminCreateUserForm onCreated={setId} />
        ) : props.resource === 'courses' ? (
          <AdminCourseForm onCreated={setId} />
        ) : (
          <AdminCreateClassForm onCreated={setId} />
        )}
      </div>
    </Modal>
  );
}

export function AdminEditorButton(props: { resource: AdminResource }) {
  const [open, setOpen] = useState(false);
  const label = adminResources[props.resource].singular;
  return (
    <>
      <Button
        type="button"
        className="min-h-12"
        aria-label={`Tạo ${label}`}
        onClick={() => setOpen(true)}
      >
        + Tạo {label}
      </Button>
      {open && <AdminEditorDialog resource={props.resource} onClose={() => setOpen(false)} />}
    </>
  );
}

export function AdminRowActions(props: { resource: AdminResource; row: AdminRow }) {
  const [action, setAction] = useState<'view' | 'edit' | null>(null);
  const [returnFocus, setReturnFocus] = useState<HTMLButtonElement | null>(null);
  const popupId = useId();
  const label = adminResources[props.resource].singular;
  const actions = [
    {
      value: 'view' as const,
      label: 'Xem thông tin',
      icon: Eye,
      color:
        'border-mint/30 bg-soft text-mint hover:bg-mint/15 data-[active=true]:bg-mint data-[active=true]:text-canvas',
    },
    {
      value: 'edit' as const,
      label: props.resource === 'users' ? 'Đổi trạng thái tài khoản' : `Chỉnh sửa ${label}`,
      icon: props.resource === 'users' ? ShieldCheck : Pencil,
      color:
        'border-status-yellow/30 bg-status-yellow/8 text-status-yellow hover:bg-status-yellow/15 data-[active=true]:bg-status-yellow data-[active=true]:text-canvas',
    },
  ];
  const close = () => setAction(null);
  const studentsLabel = 'Danh sách học viên';
  return (
    <>
      <div
        role="group"
        aria-label={`Thao tác ${props.row.name}`}
        className="inline-flex items-center gap-2"
      >
        {actions.map((item) =>
          props.resource === 'users' && item.value === 'edit' ? (
            <AdminUserStatusAction key={item.value} row={props.row} />
          ) : (
            <Button
              key={item.value}
              type="button"
              variant="outline"
              size="icon"
              className={`size-11 rounded-lg ${item.color}`}
              title={item.label}
              aria-label={`${item.label}: ${props.row.name}`}
              aria-haspopup="dialog"
              aria-expanded={action === item.value}
              aria-controls={action === item.value ? popupId : undefined}
              data-active={action === item.value}
              onClick={(event) => {
                setReturnFocus(event.currentTarget);
                setAction(item.value);
              }}
            >
              <item.icon className="size-4" />
            </Button>
          ),
        )}
        {props.resource === 'classes' && (
          <Button
            asChild
            variant="outline"
            size="icon"
            className="size-11 rounded-lg border-status-green/30 bg-status-green/8 text-status-green hover:bg-status-green/15"
          >
            <Link
              href={`/admin/classes/${props.row.id}/students`}
              title={studentsLabel}
              aria-label={`${studentsLabel}: ${props.row.name}`}
            >
              <Users className="size-4" />
            </Link>
          </Button>
        )}
      </div>
      {action && (
        <Modal
          id={popupId}
          title={
            action === 'view'
              ? `Thông tin ${label}`
              : props.resource === 'users'
                ? 'Trạng thái tài khoản'
                : `Quản lý ${label}`
          }
          onClose={close}
          returnFocus={returnFocus}
          contentClassName="w-[calc(100vw-2rem)] max-w-3xl sm:max-w-3xl"
        >
          <div>
            {action === 'view' && (
              <AdminRecordDetails
                embedded
                resource={props.resource}
                row={props.row}
                onClose={close}
              />
            )}
            {action === 'edit' && (
              <AdminEditorDialog
                embedded
                resource={props.resource}
                id={props.row.id}
                onClose={close}
              />
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
