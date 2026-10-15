'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminCreateOptions, useAdminWrite } from '../api/admin-edit-queries';
import {
  createAdminClassSchema,
  updateAdminClassSchema,
  type AdminClassDetail,
} from '../schemas/admin-write-contracts';
import {
  AdminField,
  AdminSubmitButton,
  AdminFormMessage,
  AdminConfirmAction,
  adminFormError,
  optionalText,
} from './admin-form-parts';
import { AdminQueryState } from './admin-query-state';
import { AdminStatus } from './admin-status';
import { AdminClassSessions } from './admin-class-sessions';

function ClassScheduleFields(props: { initial?: AdminClassDetail }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <AdminField
        name="startDate"
        label="Ngày khai giảng"
        type="date"
        defaultValue={props.initial?.startDate}
        required
      />
      <AdminField
        name="endDate"
        label="Ngày kết thúc"
        type="date"
        defaultValue={props.initial?.endDate}
        required
      />
      <AdminField
        name="maxStudents"
        label="Sĩ số tối đa"
        type="number"
        defaultValue={props.initial?.maxStudents ?? 20}
        min={1}
        max={1000}
        step={1}
        required
      />
      <AdminField
        name="deliveryMode"
        label="Hình thức"
        defaultValue={props.initial?.deliveryMode ?? 'ONLINE'}
        required
        options={[
          { value: 'ONLINE', label: 'Trực tuyến' },
          { value: 'OFFLINE', label: 'Tại trung tâm' },
        ]}
      />
    </div>
  );
}

export function AdminCreateClassForm(props: { onCreated: (id: string) => void }) {
  const { courses, mentors } = useAdminCreateOptions();
  const mutation = useAdminWrite();
  const [error, setError] = useState('');
  if (courses.isPending || mentors.isPending || courses.isError || mentors.isError)
    return (
      <AdminQueryState
        loading={courses.isPending || mentors.isPending}
        variant="modal"
        error={courses.error ?? mentors.error}
        onRetry={() => {
          courses.refetch();
          mentors.refetch();
        }}
      />
    );
  const ready = courses.data.length > 0 && mentors.data.length > 0;
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setError('');
        const data = new FormData(event.currentTarget);
        try {
          const body = createAdminClassSchema.parse({
            courseId: data.get('courseId'),
            mentorId: data.get('mentorId'),
            code: data.get('code'),
            name: data.get('name'),
            startDate: data.get('startDate'),
            endDate: data.get('endDate'),
            maxStudents: Number(data.get('maxStudents')),
            deliveryMode: data.get('deliveryMode'),
            meetingUrl: optionalText(data, 'meetingUrl'),
          });
          const result = await mutation.mutateAsync({
            path: 'admin/classes',
            method: 'POST',
            body,
          });
          props.onCreated(result.id);
        } catch (failure) {
          setError(adminFormError(failure));
        }
      }}
    >
      <AdminField
        name="courseId"
        label="Khóa học"
        required
        options={courses.data.map((course) => ({
          value: course.id,
          label: `${course.code} — ${course.title}`,
        }))}
      />
      {!courses.data.length && (
        <p className="text-sm text-muted">
          Cần khóa học đã kích hoạt.{' '}
          <Link href="/admin/courses" className="font-bold text-mint underline">
            Quản lý khóa học
          </Link>
        </p>
      )}
      <AdminField
        name="mentorId"
        label="Giảng viên"
        required
        options={mentors.data.map((mentor) => ({
          value: mentor.id,
          label: `${mentor.displayName} (${mentor.email})`,
        }))}
      />
      {!mentors.data.length && (
        <p className="text-sm text-muted">
          Cần tài khoản MENTOR đang hoạt động.{' '}
          <Link href="/admin/users" className="font-bold text-mint underline">
            Quản lý người dùng
          </Link>
        </p>
      )}
      <AdminField name="code" label="Mã lớp" required maxLength={50} />
      <AdminField name="name" label="Tên lớp" required maxLength={250} />
      <ClassScheduleFields />
      <AdminField name="meetingUrl" label="Link học trực tuyến" type="url" maxLength={2048} />
      <p className="text-sm leading-7 text-muted">
        Lớp mới ở trạng thái bản nháp, sao chép học phần từ khóa học. Sau khi tạo, thêm lịch buổi
        rồi mở tuyển sinh.
      </p>
      <AdminFormMessage error={error} />
      <AdminSubmitButton pending={mutation.isPending} disabled={!ready} label="Tạo lớp học" />
    </form>
  );
}

export function AdminClassForm(props: { initial: AdminClassDetail }) {
  const mutation = useAdminWrite();
  const [error, setError] = useState('');
  const editable = !['COMPLETED', 'CANCELLED'].includes(props.initial.status);
  const actions =
    props.initial.status === 'DRAFT'
      ? [
          { name: 'open', label: 'Mở tuyển sinh' },
          { name: 'cancel', label: 'Hủy lớp' },
        ]
      : props.initial.status === 'OPEN'
        ? [
            { name: 'start', label: 'Bắt đầu lớp' },
            { name: 'cancel', label: 'Hủy lớp' },
          ]
        : props.initial.status === 'IN_PROGRESS'
          ? [
              { name: 'complete', label: 'Hoàn thành lớp' },
              { name: 'cancel', label: 'Hủy lớp' },
            ]
          : [];
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Mã lớp: {props.initial.code}</p>
        <AdminStatus status={props.initial.status} />
      </div>
      <p className="text-sm leading-7 text-muted">
        Giảng viên: <strong>{props.initial.mentor.displayName || 'Chưa cập nhật tên'}</strong>. Phân
        công lại giảng viên cần quy trình riêng có lý do và kiểm tra lịch.
      </p>
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError('');
          const data = new FormData(event.currentTarget);
          const draftFields =
            props.initial.status === 'DRAFT'
              ? {
                  startDate: data.get('startDate'),
                  endDate: data.get('endDate'),
                  maxStudents: Number(data.get('maxStudents')),
                  deliveryMode: data.get('deliveryMode'),
                }
              : {};
          try {
            await mutation.mutateAsync({
              path: `admin/classes/${props.initial.id}`,
              method: 'PATCH',
              body: updateAdminClassSchema.parse({
                name: data.get('name'),
                meetingUrl: optionalText(data, 'meetingUrl') ?? null,
                ...draftFields,
              }),
            });
          } catch (failure) {
            setError(adminFormError(failure));
          }
        }}
      >
        <fieldset disabled={!editable || mutation.isPending} className="space-y-5">
          <AdminField
            name="name"
            label="Tên lớp"
            defaultValue={props.initial.name}
            required
            maxLength={250}
          />
          {props.initial.status === 'DRAFT' && <ClassScheduleFields initial={props.initial} />}
          <AdminField
            name="meetingUrl"
            label="Link học trực tuyến"
            defaultValue={props.initial.meetingUrl ?? ''}
            type="url"
            maxLength={2048}
            hint="Để trống khi lưu để bỏ link học của lớp."
          />
          {!editable ? (
            <p className="text-sm text-muted">Lớp đã hoàn thành hoặc đã hủy chỉ hỗ trợ xem.</p>
          ) : (
            <>
              <p className="text-sm text-muted">
                Ngày học, sĩ số và hình thức chỉ sửa được khi lớp còn là bản nháp.
              </p>
              <AdminSubmitButton pending={mutation.isPending} label="Lưu lớp học" />
            </>
          )}
        </fieldset>
        <AdminFormMessage error={error} saved={mutation.isSuccess} />
      </form>
      {actions.length > 0 && (
        <section className="space-y-3 border-t border-line pt-5">
          <h3 className="font-extrabold">Trạng thái lớp</h3>
          <p className="text-sm leading-7 text-muted">
            Mở tuyển sinh cần lịch buổi hợp lệ. Hoàn thành lớp cần xử lý xong các buổi học còn dang
            dở.
          </p>
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <AdminConfirmAction
                key={action.name}
                label={action.label}
                destructive={action.name === 'cancel'}
                pending={mutation.isPending}
                description={
                  action.name === 'cancel'
                    ? `Hủy lớp “${props.initial.name}”? Lớp sẽ chuyển sang trạng thái đã hủy và không thể tiếp tục chỉnh sửa.`
                    : `${action.label} “${props.initial.name}”? Hệ thống sẽ kiểm tra điều kiện trước khi chuyển trạng thái.`
                }
                onConfirm={async () => {
                  await mutation.mutateAsync({
                    path: `admin/classes/${props.initial.id}/${action.name}`,
                    method: 'POST',
                    body: {},
                  });
                }}
              />
            ))}
          </div>
        </section>
      )}
      <AdminClassSessions classroom={props.initial} editable={editable} />
    </div>
  );
}
