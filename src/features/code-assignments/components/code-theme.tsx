'use client';

import { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/** Editor colour themes; the variables live in globals.css under `[data-code-theme]`. */
export const codeThemes = [
  { id: 'mindy', label: 'Mindy tối', scheme: 'dark' },
  { id: 'night', label: 'Đêm', scheme: 'dark' },
  { id: 'light', label: 'Sáng', scheme: 'light' },
] as const;
export type CodeThemeId = (typeof codeThemes)[number]['id'];

const STORAGE_KEY = 'mindy.code.theme';

function isTheme(value: string | null): value is CodeThemeId {
  return codeThemes.some((t) => t.id === value);
}

/** Theme choice remembered per browser (falls back to Mindy dark when storage is unavailable). */
export function useCodeTheme() {
  const [theme, setTheme] = useState<CodeThemeId>(() => {
    if (typeof window === 'undefined') return 'mindy';
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return isTheme(stored) ? stored : 'mindy';
    } catch {
      return 'mindy';
    }
  });
  function change(next: CodeThemeId) {
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this visit.
    }
  }
  return [theme, change] as const;
}

export function codeThemeScheme(theme: CodeThemeId) {
  return codeThemes.find((t) => t.id === theme)?.scheme ?? 'dark';
}

/** Tiny editor preview drawn with the theme's own variables. */
function Swatch(props: { theme: CodeThemeId }) {
  return (
    <span
      data-code-theme={props.theme}
      aria-hidden="true"
      className="flex h-7 w-12 shrink-0 flex-col justify-center gap-1 rounded-md bg-ide px-1.5 ring-1 ring-ide-line"
    >
      <span className="flex gap-0.5">
        <span className="h-1 w-2.5 rounded-full bg-syn-keyword" />
        <span className="h-1 w-4 rounded-full bg-syn-function" />
      </span>
      <span className="flex gap-0.5 pl-1.5">
        <span className="h-1 w-3 rounded-full bg-syn-string" />
        <span className="h-1 w-2 rounded-full bg-syn-number" />
      </span>
    </span>
  );
}

export function CodeThemePicker(props: {
  value: CodeThemeId;
  onChange: (theme: CodeThemeId) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Đổi theme editor"
        title="Đổi theme editor"
        className="inline-flex size-7 items-center justify-center rounded-md text-ide-muted transition-colors duration-150 outline-none hover:bg-ide-raised hover:text-ide-text focus-visible:ring-2 focus-visible:ring-mint data-[state=open]:bg-ide-raised data-[state=open]:text-ide-text [&_svg]:size-3.75"
      >
        <Palette aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-52 rounded-xl border-line bg-canvas p-1.5 font-sans text-black shadow-lg shadow-forest/15"
      >
        <DropdownMenuLabel className="px-2 pt-1 pb-1.5 text-[11px] font-extrabold tracking-[0.12em] text-muted/70 uppercase">
          Theme editor
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={props.value}
          onValueChange={(value) => {
            if (isTheme(value)) props.onChange(value);
          }}
        >
          {codeThemes.map((t) => (
            <DropdownMenuRadioItem
              key={t.id}
              value={t.id}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pr-2 pl-1.5 text-[13px] font-bold outline-none focus:bg-soft data-[state=checked]:bg-soft [&>span:first-child]:hidden',
              )}
            >
              <Swatch theme={t.id} />
              <span className="flex-1">{t.label}</span>
              {props.value === t.id && (
                <Check aria-hidden="true" className="size-3.5 text-mint" strokeWidth={3} />
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
