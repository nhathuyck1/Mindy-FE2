'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ShellFocusContext = createContext<(on: boolean) => void>(() => {});

/**
 * Full-height work screens (code workspace, authoring studio) call this while mounted: the shell
 * collapses its sidebar to icons and hides the top bar/footer so the page owns the viewport.
 */
export function useShellFocus() {
  const setFocus = useContext(ShellFocusContext);
  useEffect(() => {
    setFocus(true);
    return () => setFocus(false);
  }, [setFocus]);
}

/** Shell side: focus flag plus a collapsed sidebar that is restored when focus ends. */
export function useShellFocusState() {
  const [collapsed, setCollapsed] = useState(false);
  const [focus, setFocusState] = useState(false);
  const before = useRef(false);
  const setFocus = useCallback((on: boolean) => {
    setFocusState(on);
    setCollapsed((current) => {
      if (on) before.current = current;
      return on ? true : before.current;
    });
  }, []);
  return { collapsed, setCollapsed, focus, setFocus };
}

export function ShellFocusProvider(props: {
  value: (on: boolean) => void;
  children: React.ReactNode;
}) {
  return <ShellFocusContext value={props.value}>{props.children}</ShellFocusContext>;
}
