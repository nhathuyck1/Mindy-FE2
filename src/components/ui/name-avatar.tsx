import { cn } from '@/lib/utils';
export function nameInitials(name: string) {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  if (!words.length) return '?';
  return (
    Array.from(words[0])[0] + (words.length > 1 ? Array.from(words[words.length - 1])[0] : '')
  ).toLocaleUpperCase('vi');
}
export function NameAvatar(props: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-mint/15 text-sm font-extrabold text-forest',
        props.className,
      )}
    >
      {nameInitials(props.name)}
    </span>
  );
}
