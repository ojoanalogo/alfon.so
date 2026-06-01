import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { WindowDef, WindowGeometry, WindowState } from '../types';
import { resolveWindowGeometry, effectiveMinWidth } from '../lib/viewport';

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

/** Keep open/focus UI while replacing layout derived from the viewport. */
function mergeWindowUiState(
  fresh: Record<string, WindowState>,
  prev: Record<string, WindowState>,
): Record<string, WindowState> {
  const merged = { ...fresh };
  for (const id of Object.keys(merged)) {
    const previous = prev[id];
    if (!previous) continue;
    merged[id] = {
      ...merged[id],
      open: previous.open,
      minimized: previous.minimized,
      maximized: previous.maximized,
      zIndex: previous.zIndex,
    };
  }
  return merged;
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
  /** Apply many geometry patches in one state update (layout passes). */
  setGeometries: (updates: Record<string, Partial<WindowGeometry>>) => void;
  /** Recompute default geometry for every window from the live viewport. */
  relayoutToViewport: (viewportWidth: number, viewportHeight: number, measureCenter?: boolean) => void;
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

  // Recompute layout from the real viewport once on mount (props can be the SSR
  // fallback, and the responsive layout pass may not have committed yet).
  const syncedToWindowViewport = useRef(false);
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || syncedToWindowViewport.current) return;
    syncedToWindowViewport.current = true;
    const vw = window.innerWidth > 0 ? window.innerWidth : viewportWidth;
    const vh = window.innerHeight > 0 ? window.innerHeight : viewportHeight;
    setWindows((prev) => mergeWindowUiState(createInitialState(defs, vw, vh), prev));
  }, [defs]);

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

  const normalizeGeometryPatch = useCallback(
    (id: string, geometry: Partial<WindowGeometry>, target: WindowState): Partial<WindowGeometry> | null => {
      const def = defs.find((entry) => entry.id === id);
      const vw = typeof window !== 'undefined' ? window.innerWidth : viewportWidth;
      const minW = def ? effectiveMinWidth(def, vw) : Math.min(MIN_WIDTH, vw - 16);
      const next: Partial<WindowGeometry> = { ...geometry };
      if (next.width != null) next.width = Math.max(minW, next.width);
      if (next.height != null) next.height = Math.max(MIN_HEIGHT, next.height);
      const changed = (Object.keys(next) as (keyof WindowGeometry)[]).some(
        (key) => next[key] !== target[key],
      );
      return changed ? next : null;
    },
    [defs, viewportWidth],
  );

  const setGeometry = useCallback(
    (id: string, geometry: Partial<WindowGeometry>) => {
      setWindows((prev) => {
        const target = prev[id];
        if (!target) return prev;
        const next = normalizeGeometryPatch(id, geometry, target);
        if (!next) return prev;
        return { ...prev, [id]: { ...target, ...next } };
      });
    },
    [normalizeGeometryPatch],
  );

  const setGeometries = useCallback(
    (updates: Record<string, Partial<WindowGeometry>>) => {
      setWindows((prev) => {
        let nextState: Record<string, WindowState> | null = null;
        for (const [id, geometry] of Object.entries(updates)) {
          const target = (nextState ?? prev)[id];
          if (!target) continue;
          const patch = normalizeGeometryPatch(id, geometry, target);
          if (!patch) continue;
          if (!nextState) nextState = { ...prev };
          nextState[id] = { ...target, ...patch };
        }
        return nextState ?? prev;
      });
    },
    [normalizeGeometryPatch],
  );

  const relayoutToViewport = useCallback(
    (vw: number, vh: number, measureCenter = false) => {
      setWindows((prev) => {
        let merged = mergeWindowUiState(createInitialState(defs, vw, vh), prev);
        let changed = false;

        for (const def of defs) {
          if (!def.center) continue;

          let measuredHeight: number | undefined;
          if (measureCenter && def.defaultHeight == null) {
            const el = document.querySelector<HTMLElement>(`[data-window-id="${def.id}"]`);
            const rawHeight = el?.getBoundingClientRect().height;
            if (rawHeight) measuredHeight = rawHeight;
          }

          const geo = resolveWindowGeometry(def, vw, vh, measuredHeight);
          const target = merged[def.id];
          if (!target) continue;

          const next = {
            ...target,
            x: geo.x,
            y: geo.y,
            width: geo.width,
            height: def.defaultHeight ?? null,
          };
          if (
            next.x === target.x &&
            next.y === target.y &&
            next.width === target.width &&
            next.height === target.height
          ) {
            continue;
          }
          if (!changed) {
            merged = { ...merged };
            changed = true;
          }
          merged[def.id] = next;
        }

        return merged;
      });
    },
    [defs],
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
    setGeometries,
    relayoutToViewport,
  };
}
