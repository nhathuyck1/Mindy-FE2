'use client';

import { Modal } from '@/components/ui/modal';
import {
  adminResources,
  formatAdminDate,
  type AdminResource,
  type AdminRow,
} from '../lib/admin-resources';
import { AdminStatus } from './admin-status';

export function AdminRecordDetails(props: {
  row: AdminRow;
  resource: AdminResource;
  onClose: () => void;
  returnFocus?: HTMLElement | null;
  embedded?: boolean;
}) {
  const config = adminResources[props.resource];
  return (
    <Modal
      title={`Thông tin ${config.singular}`}
      onClose={props.onClose}
      returnFocus={props.returnFocus}
      embedded={props.embedded}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-2xl font-extrabold break-words">{props.row.name}</p>
          <AdminStatus status={props.row.status} />
        </div>
        {props.resource === 'users' && (
          <p className="mt-1 text-base break-all text-muted">{props.row.subtitle}</p>
        )}
        <dl className="mt-6 divide-y divide-line text-base">
          {[
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
            <div key={field.label} className="grid gap-1 py-3 sm:grid-cols-[150px_1fr] sm:gap-4">
              <dt className="text-sm text-muted">{field.label}</dt>
              <dd className="min-w-0 font-semibold break-words">{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  );
}
