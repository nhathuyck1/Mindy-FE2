import { useId } from 'react';
import { Icon } from '@/components/ui/icon';
import type { CourseCategory } from '../../schemas/course-contracts';
import type { PriceFilter } from '../../lib/course-format';

export interface CatalogFilters {
  categoryId: string;
  deliveryMode: '' | 'ONLINE' | 'OFFLINE';
  price: PriceFilter;
}

export const priceOptions = [
  { value: '', label: 'Tất cả mức giá' },
  { value: 'free', label: 'Miễn phí' },
  { value: 'under-million', label: 'Dưới 1.000.000 ₫' },
  { value: 'from-million', label: 'Từ 1.000.000 ₫' },
] as const;
export const deliveryOptions = [
  { value: '', label: 'Tất cả hình thức' },
  { value: 'ONLINE', label: 'Trực tuyến' },
  { value: 'OFFLINE', label: 'Tại trung tâm' },
] as const;

export function CourseFilters(props: {
  filters: CatalogFilters;
  categories: CourseCategory[];
  categoriesError: boolean;
  retryCategories: () => void;
  onChange: (filters: CatalogFilters) => void;
  onReset: () => void;
}) {
  const groupId = useId();
  return (
    <aside
      className="self-start rounded-xl border border-line bg-canvas p-5 lg:sticky lg:top-28"
      aria-label="Bộ lọc khóa học"
    >
      <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
        <h2 className="flex items-center gap-2 text-base font-extrabold">
          <Icon name="filter" className="size-4" /> Bộ lọc
        </h2>
        <button
          type="button"
          onClick={props.onReset}
          className="min-h-11 cursor-pointer text-sm font-bold text-mint"
        >
          Đặt lại
        </button>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-extrabold uppercase tracking-wide">Danh mục</legend>
        {[{ id: '', name: 'Tất cả khóa học' }, ...props.categories].map((category) => (
          <label
            key={category.id}
            className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold"
          >
            <input
              type="radio"
              name={`${groupId}-course-category`}
              checked={props.filters.categoryId === category.id}
              onChange={() => props.onChange({ ...props.filters, categoryId: category.id })}
              className="size-4 shrink-0 accent-mint"
            />
            {category.name}
          </label>
        ))}
        {props.categoriesError && (
          <button
            type="button"
            onClick={props.retryCategories}
            className="min-h-11 cursor-pointer text-sm font-bold text-mint"
          >
            Tải lại danh mục
          </button>
        )}
      </fieldset>
      <fieldset className="mt-5 border-t border-line pt-5">
        <legend className="sr-only">Hình thức học</legend>
        <p className="mb-2 text-sm font-extrabold uppercase tracking-wide" aria-hidden="true">
          Hình thức học
        </p>
        {deliveryOptions.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold"
          >
            <input
              type="radio"
              name={`${groupId}-course-delivery`}
              checked={props.filters.deliveryMode === option.value}
              onChange={() => props.onChange({ ...props.filters, deliveryMode: option.value })}
              className="size-4 accent-mint"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <fieldset className="mt-5 border-t border-line pt-5">
        <legend className="sr-only">Mức học phí</legend>
        <p className="mb-2 text-sm font-extrabold uppercase tracking-wide" aria-hidden="true">
          Mức học phí
        </p>
        {priceOptions.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold"
          >
            <input
              type="radio"
              name={`${groupId}-course-price`}
              checked={props.filters.price === option.value}
              onChange={() => props.onChange({ ...props.filters, price: option.value })}
              className="size-4 accent-mint"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <p className="mt-5 border-t border-line pt-5 text-sm leading-relaxed font-semibold text-muted">
        Chọn hình thức để tìm khóa học có lớp đang mở phù hợp với bạn.
      </p>
    </aside>
  );
}
