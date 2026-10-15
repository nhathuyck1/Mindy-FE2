'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminWrite } from '../api/admin-edit-queries';
import { addAdminCourseUnitSchema, type AdminCourseDetail } from '../schemas/admin-write-contracts';
import {
  AdminConfirmAction,
  AdminField,
  AdminSubmitButton,
  AdminFormMessage,
  adminFormError,
  optionalText,
} from './admin-form-parts';
import { AdminStatus } from './admin-status';

export function AdminCourseUnits(props: { course: AdminCourseDetail }) {
  const mutation = useAdminWrite();
  const [error, setError] = useState('');
  const units = [...props.course.units].sort((a, b) => a.unitNumber - b.unitNumber);
  async function move(index: number, offset: number) {
    setError('');
    const ids = units.map((unit) => unit.id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    try {
      await mutation.mutateAsync({
        path: `admin/courses/${props.course.id}/units/order`,
        method: 'PUT',
        body: { unitIds: ids },
      });
    } catch (failure) {
      setError(adminFormError(failure));
    }
  }
  return (
    <section className="space-y-5 border-t border-line pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-extrabold">Học phần & xuất bản</h3>
        <AdminStatus status={String(props.course.isActive)} />
      </div>
      <p className="text-sm leading-7 text-muted">
        Cần danh mục hoạt động và ít nhất một học phần để kích hoạt. Thay đổi học phần không tự cập
        nhật các lớp đã tạo.
      </p>
      <ol className="divide-y divide-line rounded-xl border border-line">
        {units.map((unit, index) => (
          <li key={unit.id} className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="font-bold break-words">
                {unit.unitNumber}. {unit.title}
              </p>
              <p className="mt-1 text-[15px] text-muted">
                Điểm yêu cầu: {unit.requiredScorePercent}%
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label={`Đưa ${unit.title} lên`}
                disabled={index === 0 || mutation.isPending || units.length > 200}
                onClick={() => move(index, -1)}
              >
                ↑
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label={`Đưa ${unit.title} xuống`}
                disabled={index === units.length - 1 || mutation.isPending || units.length > 200}
                onClick={() => move(index, 1)}
              >
                ↓
              </Button>
            </div>
          </li>
        ))}
      </ol>
      {!units.length && (
        <p className="text-sm text-muted">Chưa có học phần. Thêm học phần đầu tiên bên dưới.</p>
      )}
      <form
        className="space-y-4 rounded-xl border border-line p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          setError('');
          try {
            await mutation.mutateAsync({
              path: `admin/courses/${props.course.id}/units`,
              method: 'POST',
              body: addAdminCourseUnitSchema.parse({
                title: data.get('title'),
                description: optionalText(data, 'description'),
                requiredScorePercent: Number(data.get('requiredScorePercent')),
              }),
            });
            form.reset();
          } catch (failure) {
            setError(adminFormError(failure));
          }
        }}
      >
        <h4 className="font-extrabold">Thêm học phần</h4>
        <AdminField name="title" label="Tên học phần" required maxLength={250} />
        <AdminField name="description" label="Mô tả học phần" multiline maxLength={10_000} />
        <AdminField
          name="requiredScorePercent"
          label="Điểm đạt (%)"
          type="number"
          defaultValue={80}
          min={0}
          max={100}
          step={0.01}
          required
        />
        <AdminSubmitButton pending={mutation.isPending} label="Thêm học phần" />
      </form>
      <AdminFormMessage error={error} saved={mutation.isSuccess} />
      {!props.course.isActive && (
        <AdminConfirmAction
          label="Kích hoạt khóa học"
          disabled={!units.length}
          pending={mutation.isPending}
          description={`Kích hoạt khóa học “${props.course.title}” để có thể tạo lớp và hiển thị trong danh mục công khai?`}
          onConfirm={async () => {
            await mutation.mutateAsync({
              path: `admin/courses/${props.course.id}/activate`,
              method: 'POST',
              body: {},
            });
          }}
        />
      )}
    </section>
  );
}
