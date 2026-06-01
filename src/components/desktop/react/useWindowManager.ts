import { useCallback, useMemo, useRef, useState } from 'react';
import type { WindowDef, WindowGeometry, WindowState } from './types';
import { resolveWindowGeometry, effectiveMinWidth } from './utils/viewport';

export const MIN_WIDTH = 400;
export const MIN_HEIGHT = 140;
export const TASKBAR_HEIGHT = 40;

export function minWidthForDef(def: WindowDef): number {
  return def.minWidth ?? MIN_WIDTH;
}

function createInitialState(
  defs: WindowDef[],
  viewportWidth: number,
  viewportHeight: number,
): Record<string, WindowState> {
  const entries = defs.map((def) => {
    const geometry = resolveWindowGeometry(def, viewportWidth, viewportHeight);
    const state: WindowState = {
      id: def.id,
      ...geometry,
      open: Boolean(def.defaultOpen),
      minimized: false,
      maximized: false,
      zIndex: def.initialZ ?? 10,
      height: def.defaultHeight ?? geometry.height,
    };
    return [def.id, state] as const;
  });
  return Object.fromEntries(entries);
}

export interface WindowManager {
  windows: Record<string, WindowState>;
  order: string[];
  focusedId: string | null;
  open: (id: string) => void;
  close: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focus: (id: string) => void;
  unfocus: () => void;
  setGeometry: (id: string, geometry: Partial<WindowGeometry>) => void;
}

export function useWindowManager(
  defs: WindowDef[],
  viewportWidth: number,
  viewportHeight: number,
): WindowManager {
  const order = useMemo(() => defs.map((def) => def.id), [defs]);
  const [windows, setWindows] = useState<Record<string, WindowState>>(() =>
    createInitialState(defs, viewportWidth, viewportHeight),
  );

  const topZ = useRef(
    Math.max(10, ...defs.map((def) => def.initialZ ?? 10)),
  );
  const [focusedId, setFocusedId] = useState<string | null>(() => {
    const firstOpen = defs.find((def) => def.defaultOpen);
    return firstOpen ? firstOpen.id : null;
  });

  const bringToFront = useCallback((id: string) => {
    topZ.current += 1;
    const z = topZ.current;
    setWindows((prev) => {
      const target = prev[id];
      if (!target) return prev;
      return { ...prev, [id]: { ...target, zIndex: z } };
    });
    setFocusedId(id);
  }, []);

  const focus = useCallback(
    (id: string) => {
      bringToFront(id);
    },
    [bringToFront],
  );

  const open = useCallback(
    (id: string) => {
      setWindows((prev) => {
        const target = prev[id];
        if (!target) return prev;
        return { ...prev, [id]: { ...target, open: true, minimized: false } };
      });
      bringToFront(id);
    },
    [bringToFront],
  );

  const close = useCallback((id: string) => {
    setWindows((prev) => {
      const target = prev[id];
      if (!target) return prev;
      return {
        ...prev,
        [id]: { ...target, open: false, minimized: false, maximized: false },
      };
    });
    setFocusedId((current) => (current === id ? null : current));
  }, []);

  const minimize = useCallback((id: string) => {
    setWindows((prev) => {
      const target = prev[id];
      if (!target) return prev;
      return { ...prev, [id]: { ...target, minimized: true } };
    });
    setFocusedId((current) => (current === id ? null : current));
  }, []);

  const toggleMaximize = useCallback(
    (id: string) => {
      setWindows((prev) => {
        const target = prev[id];
        if (!target || !target.open) return prev;
        return { ...prev, [id]: { ...target, maximized: !target.maximized } };
      });
      bringToFront(id);
    },
    [bringToFront],
  );

  const setGeometry = useCallback(
    (id: string, geometry: Partial<WindowGeometry>) => {
      setWindows((prev) => {
        const target = prev[id];
        if (!target) return prev;
        const def = defs.find((entry) => entry.id === id);
        const vw =
          typeof window !== 'undefined' ? window.innerWidth : viewportWidth;
        const minW = def
          ? effectiveMinWidth(def, vw)
          : Math.min(MIN_WIDTH, vw - 16);
        const next: Partial<WindowGeometry> = { ...geometry };
        if (next.width != null) next.width = Math.max(minW, next.width);
        if (next.height != null) next.height = Math.max(MIN_HEIGHT, next.height);
        // Bail out if nothing actually changed so the `windows` reference is
        // preserved — this breaks the applyLayout effect's self-retrigger loop.
        const changed = (Object.keys(next) as (keyof WindowGeometry)[]).some(
          (key) => next[key] !== target[key],
        );
        if (!changed) return prev;
        return { ...prev, [id]: { ...target, ...next } };
      });
    },
    [defs, viewportWidth],
  );

  const unfocus = useCallback(() => {
    setFocusedId(null);
  }, []);

  return {
    windows,
    order,
    focusedId,
    open,
    close,
    minimize,
    toggleMaximize,
    focus,
    unfocus,
    setGeometry,
  };
}
