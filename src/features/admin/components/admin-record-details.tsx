'use client';

import {
  adminResources,
  formatAdminDate,
  type AdminResource,
  type AdminRow,
} from '../lib/admin-resources';

export function AdminRecordDetails(props: { row: AdminRow; resource: AdminResource }) {
  const config = adminResources[props.resource];
  return (
    <div>
      <p className="mb-5 text-sm font-medium whitespace-normal [overflow-wrap:anywhere] lg:hidden">
        {props.row.name}
      </p>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ...(props.resource === 'users' ? [] : [{ label: 'Mã', value: props.row.subtitle }]),
          ...props.row.fields,
          ...[
            { label: config.metric, value: props.row.metric },
            { label: config.date, value: formatAdminDate(props.row.date) },
          ].filter(
            // Bỏ cột bảng nếu fields đã có cùng nhãn hoặc cùng giá trị (vd. chỗ còn lại / sĩ số).
            (extra) =>
              !props.row.fields.some(
                (field) => field.label === extra.label || field.value === extra.value,
              ),
          ),
        ].map((field) => (
          <div
            key={field.label}
            className={`min-w-0 space-y-1.5 ${field.label === 'Mô tả' ? 'sm:col-span-2' : ''}`}
          >
            <dt className="text-xs font-medium text-muted">{field.label}</dt>
            <dd className="text-sm leading-6 font-normal whitespace-normal [overflow-wrap:anywhere]">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
