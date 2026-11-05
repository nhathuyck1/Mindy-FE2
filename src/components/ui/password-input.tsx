'use client';

import { useId, useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function PasswordInput(props: Omit<ComponentProps<typeof Input>, 'type'>) {
  const generatedId = useId();
  const [visible, setVisible] = useState(false);
  const { className, id = generatedId, ...inputProps } = props;
  return (
    <div className="relative">
      <Input
        {...inputProps}
        id={id}
        type={visible ? 'text' : 'password'}
        className={cn(className, 'pr-12')}
      />
      <button
        type="button"
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={visible}
        aria-controls={id}
        disabled={props.disabled}
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-1 my-auto flex size-11 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-mint/8 hover:text-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint disabled:cursor-not-allowed disabled:opacity-50"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="size-5" />
        ) : (
          <Eye aria-hidden="true" className="size-5" />
        )}
      </button>
    </div>
  );
}
