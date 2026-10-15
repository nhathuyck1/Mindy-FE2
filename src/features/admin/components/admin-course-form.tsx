'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useCourseCategories } from '@/features/courses/api/course-queries';
import { useAdminWrite } from '../api/admin-edit-queries';
import {
  createAdminCategorySchema,
  createAdminCourseSchema,
  updateAdminCourseSchema,
  type AdminCourseDetail,
} from '../schemas/admin-write-contracts';
import {
  AdminField,
  AdminSubmitButton,
  AdminFormMessage,
  adminFormError,
  optionalText,
} from './admin-form-parts';
import { AdminQueryState } from './admin-query-state';
import { AdminCourseUnits } from './admin-course-units';

function AdminCategoryCreate(props: { onClose: () => void }) {
  const mutation = useAdminWrite();
  const [error, setError] = useState('');
  return (
    <Modal title="Tạo danh mục" onClose={props.onClose}>
      <form
        className="space-y-5 p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setError('');
          const data = new FormData(event.currentTarget);
          try {
            await mutation.mutateAsync({
              path: 'admin/course-categories',
              method: 'POST',
              body: createAdminCategorySchema.parse({
                name: data.get('name'),
                slug: optionalText(data, 'slug'),
                description: optionalText(data, 'description'),
              }),
            });
            props.onClose();
          } catch (failure) {
            setError(adminFormError(failure));
          }
        }}
      >
        <AdminField name="name" label="Tên danh mục" required maxLength={150} />
        <AdminField
          name="slug"
          label="Slug"
          maxLength={180}
          hint="Để trống để hệ thống tự tạo. Ví dụ: lap-trinh-web."
        />
        <AdminField name="description" label="Mô tả" multiline maxLength={2000} />
        <AdminFormMessage error={error} />
        <AdminSubmitButton pending={mutation.isPending} label="Tạo danh mục" />
      </form>
    </Modal>
  );
}

export function AdminCourseForm(props: {
  initial?: AdminCourseDetail;
  onCreated: (id: string) => void;
}) {
  const categories = useCourseCategories();
  const mutation = useAdminWrite();
  const [error, setError] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const options = (categories.data ?? []).map((item) => ({ value: item.id, label: item.name }));
  if (props.initial && !options.some((item) => item.value === props.initial?.category.id))
    options.unshift({ value: props.initial.category.id, label: props.initial.category.name });
  return (
    <div className="space-y-7">
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError('');
          const data = new FormData(event.currentTarget);
          const values = {
            categoryId: data.get('categoryId'),
            title: data.get('title'),
            description: String(data.get('description') ?? '').trim() || null,
            priceAmount: Number(data.get('priceAmount')),
            imgUrl: optionalText(data, 'imgUrl') ?? null,
          };
          try {
            if (props.initial)
              await mutation.mutateAsync({
                path: `admin/courses/${props.initial.id}`,
                method: 'PATCH',
                body: updateAdminCourseSchema.parse(values),
              });
            else {
              const result = await mutation.mutateAsync({
                path: 'admin/courses',
                method: 'POST',
                body: createAdminCourseSchema.parse({
                  ...values,
                  description: values.description ?? undefined,
                  code: data.get('code'),
                }),
              });
              props.onCreated(result.id);
            }
          } catch (failure) {
            setError(adminFormError(failure));
          }
        }}
      >
        {!props.initial && (
          <AdminField
            name="code"
            label="Mã khóa học"
            required
            maxLength={50}
            hint="Chỉ dùng chữ, số, dấu gạch ngang hoặc gạch dưới; mã không thay đổi sau khi tạo."
          />
        )}
        <AdminField
          name="title"
          label="Tên khóa học"
          defaultValue={props.initial?.title}
          required
          maxLength={250}
        />
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            {categories.isPending || categories.isError ? (
              <AdminQueryState
                loading={categories.isPending}
                columns={2}
                error={categories.error}
                onRetry={() => categories.refetch()}
              />
            ) : (
              <AdminField
                name="categoryId"
                label="Danh mục"
                defaultValue={props.initial?.category.id}
                required
                options={options}
              />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-12 shrink-0 px-3 text-[15px] sm:px-4 sm:text-sm"
            onClick={() => setCategoryOpen(true)}
          >
            Tạo danh mục mới
          </Button>
        </div>
        <AdminField
          name="priceAmount"
          label="Học phí (VND)"
          type="number"
          defaultValue={props.initial?.priceAmount ?? 0}
          required
          min={0}
          max={1_000_000_000_000}
          step={1}
          hint="Học phí mới chỉ áp dụng cho các lượt thanh toán sau này."
        />
        <AdminField
          name="imgUrl"
          label="URL ảnh khóa học"
          type="url"
          defaultValue={props.initial?.imgUrl ?? ''}
          maxLength={2048}
          hint="URL http/https. Để trống khi sửa để bỏ ảnh."
        />
        <AdminField
          name="description"
          label="Mô tả"
          defaultValue={props.initial?.description ?? ''}
          multiline
          maxLength={10_000}
        />
        <AdminFormMessage error={error} saved={mutation.isSuccess} />
        <AdminSubmitButton
          pending={mutation.isPending}
          disabled={categories.isPending || categories.isError || !options.length}
          label={props.initial ? 'Lưu khóa học' : 'Tạo khóa học'}
        />
      </form>
      {props.initial ? (
        <AdminCourseUnits course={props.initial} />
      ) : (
        <p className="text-sm leading-7 text-muted">
          Khóa học mới chưa được kích hoạt. Sau khi tạo, thêm học phần rồi kích hoạt để dùng khi tạo
          lớp.
        </p>
      )}
      {categoryOpen && <AdminCategoryCreate onClose={() => setCategoryOpen(false)} />}
    </div>
  );
}
