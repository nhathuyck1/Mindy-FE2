'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminWrite } from '../api/admin-edit-queries';
import {
  scheduleAdminSessionSchema,
  updateAdminSessionTimeSchema,
  type AdminClassDetail,
} from '../schemas/admin-write-contracts';
import {
  AdminField,
  AdminSubmitButton,
  AdminFormMessage,
  adminFormError,
  optionalText,
} from './admin-form-parts';

const sessionStatusLabels = {
  SCHEDULED: 'Đã xếp lịch',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};
const dateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

export function AdminClassSessions(props: { classroom: AdminClassDetail; editable: boolean }) {
  const mutation = useAdminWrite();
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const units = [...props.classroom.units].sort((a, b) => a.position - b.position);
  return (
    <section className="space-y-5 border-t border-line pt-6">
      <h3 className="text-lg font-extrabold">Học phần & lịch buổi</h3>
      <p className="text-sm leading-7 text-muted">
        Giờ Việt Nam (UTC+7). Mỗi buổi trong một ngày, trong khoảng thời gian của lớp; hệ thống kiểm
        tra trùng lịch giảng viên khi ghi.
      </p>
      {units.map((unit) => (
        <div key={unit.id} className="rounded-xl border border-line p-4">
          <h4 className="font-extrabold break-words">
            {unit.position}. {unit.title}
          </h4>
          {unit.sessions.length ? (
            <ul className="mt-3 space-y-3">
              {[...unit.sessions]
                .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
                .map((session) => (
                  <li key={session.id} className="border-t border-line pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold break-words">{session.title}</p>
                        <p className="mt-1 text-[15px] leading-6 text-muted">
                          {dateTime(session.startsAt)} → {dateTime(session.endsAt)} ·{' '}
                          {sessionStatusLabels[session.status]}
                        </p>
                        <p className="text-[15px] text-muted">
                          {session.roomName || 'Chưa có phòng'}
                        </p>
                      </div>
                      {props.editable && session.status === 'SCHEDULED' && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditing(editing === session.id ? null : session.id)}
                        >
                          Đổi giờ buổi {session.sessionNumber}
                        </Button>
                      )}
                    </div>
                    {editing === session.id && (
                      <form
                        className="mt-4 space-y-3 rounded-lg border border-line bg-canvas p-3"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          setError('');
                          const data = new FormData(event.currentTarget);
                          try {
                            await mutation.mutateAsync({
                              path: `admin/classes/${props.classroom.id}/sessions/${session.id}`,
                              method: 'PATCH',
                              body: updateAdminSessionTimeSchema.parse({
                                startTime: data.get('startTime'),
                                endTime: data.get('endTime'),
                              }),
                            });
                            setEditing(null);
                          } catch (failure) {
                            setError(adminFormError(failure));
                          }
                        }}
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <AdminField
                            name="startTime"
                            label="Giờ bắt đầu mới"
                            type="time"
                            required
                          />
                          <AdminField
                            name="endTime"
                            label="Giờ kết thúc mới"
                            type="time"
                            required
                          />
                        </div>
                        <p className="text-[15px] text-muted">
                          Chỉ đổi giờ; giữ nguyên ngày học của buổi.
                        </p>
                        <AdminSubmitButton pending={mutation.isPending} label="Lưu giờ buổi học" />
                      </form>
                    )}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Chưa có lịch buổi.</p>
          )}
        </div>
      ))}
      {!units.length && <p className="text-sm text-muted">Lớp chưa có học phần để xếp lịch.</p>}
      {props.editable && units.length > 0 && (
        <form
          className="space-y-4 rounded-xl border border-line p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            setError('');
            const date = String(data.get('date'));
            try {
              await mutation.mutateAsync({
                path: `admin/classes/${props.classroom.id}/sessions`,
                method: 'POST',
                body: scheduleAdminSessionSchema.parse({
                  classUnitId: data.get('classUnitId'),
                  title: data.get('title'),
                  startsAt: `${date}T${data.get('startTime')}:00+07:00`,
                  endsAt: `${date}T${data.get('endTime')}:00+07:00`,
                  roomName: optionalText(data, 'roomName'),
                  meetingUrl: optionalText(data, 'meetingUrl'),
                }),
              });
              form.reset();
            } catch (failure) {
              setError(adminFormError(failure));
            }
          }}
        >
          <h4 className="font-extrabold">Thêm buổi học</h4>
          <AdminField
            name="classUnitId"
            label="Học phần của lớp"
            required
            options={units.map((unit) => ({
              value: unit.id,
              label: `${unit.position}. ${unit.title}`,
            }))}
          />
          <AdminField name="title" label="Tên buổi học" required maxLength={250} />
          <AdminField
            name="date"
            label="Ngày học"
            type="date"
            required
            min={props.classroom.startDate}
            max={props.classroom.endDate}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField name="startTime" label="Giờ bắt đầu" type="time" required />
            <AdminField name="endTime" label="Giờ kết thúc" type="time" required />
          </div>
          <AdminField name="roomName" label="Phòng học" maxLength={150} />
          <AdminField name="meetingUrl" label="Link riêng của buổi" type="url" maxLength={2048} />
          <AdminSubmitButton pending={mutation.isPending} label="Thêm buổi học" />
        </form>
      )}
      <AdminFormMessage error={error} saved={mutation.isSuccess} />
    </section>
  );
}
