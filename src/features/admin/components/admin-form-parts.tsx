'use client';

import { useId, useState } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ApiError } from '@/lib/api/client';

export function AdminField(props: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number;
  disabled?: boolean;
  multiline?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
}) {
  const id = useId();
  const common = {
    id,
    name: props.name,
    defaultValue: props.defaultValue,
    required: props.required,
    disabled: props.disabled,
    className: `w-full rounded-lg border-transparent bg-ink/4 text-[14px] md:text-[14px] ${props.multiline ? 'min-h-28' : 'h-12'}`,
  };
  return (
    <div className="min-w-0 space-y-2 [&>[data-slot=native-select-wrapper]]:w-full">
      <label htmlFor={id} className="block text-[14px] font-extrabold">
        {props.label}
        {props.required && (
          <span aria-hidden="true" className="text-status-red">
            {' *'}
          </span>
        )}
      </label>
      {props.options ? (
        <NativeSelect {...common}>
          <NativeSelectOption value="">
            Chọn {props.label.toLocaleLowerCase('vi')}
          </NativeSelectOption>
          {props.options.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : props.multiline ? (
        <Textarea {...common} maxLength={props.maxLength} rows={3} />
      ) : (
        <Input
          {...common}
          type={props.type ?? 'text'}
          maxLength={props.maxLength}
          min={props.min}
          max={props.max}
          step={props.step}
          autoComplete={props.type === 'password' ? 'new-password' : undefined}
        />
      )}
      {props.hint && <p className="text-[13px] leading-5 text-muted">{props.hint}</p>}
    </div>
  );
}

export function adminFormError(error: unknown): string {
  if (error instanceof z.ZodError)
    return (
      'Vui lòng kiểm tra thông tin: ' +
      error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    );
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (error.status === 403) return 'Tài khoản không có quyền thực hiện thao tác này.';
    if (error.status === 409)
      return `Không thể lưu do trùng dữ liệu hoặc điều kiện chưa phù hợp. ${error.message}`;
    return error.message;
  }
  return 'Chưa thể lưu thay đổi. Vui lòng thử lại.';
}

export function AdminFormMessage(props: { error?: string; saved?: boolean }) {
  if (props.error)
    return (
      <p
        role="alert"
        className="rounded-lg border border-coral/30 bg-peach p-3 text-sm leading-6 break-words"
      >
        {props.error}
      </p>
    );
  if (props.saved)
    return (
      <p role="status" className="rounded-lg border border-line bg-canvas p-3 text-sm">
        Đã lưu thay đổi.
      </p>
    );
  return null;
}

export function AdminConfirmAction(props: {
  label: string;
  description: string;
  pending?: boolean;
  disabled?: boolean;
  onConfirm: () => Promise<void>;
  destructive?: boolean;
  trigger?: { icon: React.ReactNode; label: string; className: string };
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!props.pending) setOpen(value);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={props.disabled || props.pending}
          onClick={() => {
            setError('');
          }}
          className={
            props.trigger?.className ??
            (props.destructive ? 'border-coral/40 bg-peach text-forest' : '')
          }
          aria-label={props.trigger?.label}
          title={props.label}
        >
          {props.trigger?.icon ?? props.label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="admin-typography max-h-[90dvh] overflow-y-auto border-line bg-canvas text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>{props.label}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-7 text-muted">
            {props.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AdminFormMessage error={error} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.pending}>Quay lại</AlertDialogCancel>
          <Button
            type="button"
            disabled={props.pending}
            onClick={async () => {
              setError('');
              try {
                await props.onConfirm();
                setOpen(false);
              } catch (failure) {
                setError(adminFormError(failure));
              }
            }}
          >
            {props.pending ? 'Đang xử lý…' : 'Xác nhận'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AdminSubmitButton(props: { pending: boolean; label?: string; disabled?: boolean }) {
  return (
    <div className="col-span-full flex justify-end">
      <Button type="submit" disabled={props.pending || props.disabled} className="min-h-11">
        {props.pending ? 'Đang lưu…' : (props.label ?? 'Lưu thay đổi')}
      </Button>
    </div>
  );
}

export const optionalText = (data: FormData, key: string) =>
  String(data.get(key) ?? '').trim() || undefined;
