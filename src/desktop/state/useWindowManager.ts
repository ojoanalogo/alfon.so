import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { WindowDef, WindowGeometry, WindowState } from '../types';
import {
  resolveWindowGeometry,
  resolveDefaultOpenGeometry,
  effectiveMinWidth,
} from '../lib/viewport';
import { isMobileViewport, MIN_WIDTH, MIN_HEIGHT } from '../lib/layoutConstants';

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
      userSized: previous.userSized,
    };
    // Only keep custom geometry after move/resize; centered/default layout comes from fresh.
    if (previous.userSized && previous.open && !previous.minimized && !previous.maximized) {
      merged[id] = {
        ...merged[id],
        x: previous.x,
        y: previous.y,
        width: previous.width,
        height: previous.height,
      };
    }
  }
  return merged;
}

/** Apply an app's default geometry to a window, clearing the user-resized flag. */
function applyDefaultGeometry(
  target: WindowState,
  geo: WindowGeometry,
  def: WindowDef,
): WindowState {
  return {
    ...target,
    width: geo.width,
    height: def.defaultHeight ?? geo.height ?? target.height,
    userSized: false,
    ...(def.center ? {} : { x: geo.x, y: geo.y }),
  };
}

/** True when two states share x/y/width/height — the relayout/open bail-out. */
function geometryUnchanged(next: WindowState, target: WindowState): boolean {
  return (
    next.x === target.x &&
    next.y === target.y &&
    next.width === target.width &&
    next.height === target.height
  );
}

/** Measure a center window's on-screen box (the only DOM read in this module). */
function measureCenterWindow(def: WindowDef): {
  measuredWidth?: number;
  measuredHeight?: number;
} {
  const el = document.querySelector<HTMLElement>(`[data-window-id="${def.id}"]`);
  if (!el) return {};
  const rect = el.getBoundingClientRect();
  return {
    measuredWidth: rect.width > 0 ? rect.width : undefined,
    measuredHeight: def.defaultHeight == null && rect.height > 0 ? rect.height : undefined,
  };
}

export interface WindowManager {
  windows: Record<string, WindowState>;
  order: string[];
  focusedId: string | null;
  open: (id: string) => void;
  /** Apply declared default width/height when opening on desktop. */
  applyDefaultOpenLayout: (id: string, options?: { freshRandom?: boolean }) => void;
  close: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focus: (id: string) => void;
  unfocus: () => void;
  setGeometry: (id: string, geometry: Partial<WindowGeometry>) => void;
  /** Apply many geometry patches in one state update (layout passes). */
  setGeometries: (updates: Record<string, Partial<WindowGeometry>>) => void;
  /** Recompute default geometry for every window from the live viewport. */
  relayoutToViewport: (
    viewportWidth: number,
    viewportHeight: number,
    measureCenter?: boolean,
  ) => void;
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

  const topZ = useRef(Math.max(10, ...defs.map((def) => def.initialZ ?? 10)));
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

  const applyDefaultOpenLayout = useCallback(
    (id: string, options?: { freshRandom?: boolean }) => {
      const def = defs.find((entry) => entry.id === id);
      if (!def || typeof window === 'undefined' || isMobileViewport()) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const geo = resolveDefaultOpenGeometry(def, vw, vh, options);

      setWindows((prev) => {
        const target = prev[id];
        if (!target?.open) return prev;
        const next = applyDefaultGeometry(target, geo, def);
        if (geometryUnchanged(next, target) && target.userSized === false) {
          return prev;
        }
        return { ...prev, [id]: next };
      });
    },
    [defs],
  );

  const open = useCallback(
    (id: string) => {
      const def = defs.find((entry) => entry.id === id);
      const vw = typeof window !== 'undefined' ? window.innerWidth : viewportWidth;
      const vh = typeof window !== 'undefined' ? window.innerHeight : viewportHeight;

      setWindows((prev) => {
        const target = prev[id];
        if (!target) return prev;

        const wasClosed = !target.open;
        let next: WindowState = { ...target, open: true, minimized: false };

        if (wasClosed && def && !isMobileViewport(vw)) {
          const geo = resolveDefaultOpenGeometry(def, vw, vh, { freshRandom: true });
          next = applyDefaultGeometry(next, geo, def);
        }

        return { ...prev, [id]: next };
      });
      bringToFront(id);
    },
    [bringToFront, defs, viewportWidth, viewportHeight],
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
    (
      id: string,
      geometry: Partial<WindowGeometry>,
      target: WindowState,
    ): Partial<WindowGeometry> | null => {
      const def = defs.find((entry) => entry.id === id);
      const vw = typeof window !== 'undefined' ? window.innerWidth : viewportWidth;
      const minW = def ? effectiveMinWidth(def, vw) : Math.min(MIN_WIDTH, vw - 16);
      const next: Partial<WindowGeometry> & { userSized?: boolean } = { ...geometry };
      if (next.width != null) next.width = Math.max(minW, next.width);
      if (next.height != null) next.height = Math.max(MIN_HEIGHT, next.height);
      if (document.body.classList.contains('is-window-gesturing')) {
        next.userSized = true;
      }
      const changed =
        next.userSized === true && target.userSized !== true
          ? true
          : (Object.keys(next) as (keyof WindowGeometry)[]).some(
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
        let merged: Record<string, WindowState> = { ...prev };
        let changed = false;

        for (const def of defs) {
          const target = prev[def.id];
          if (!target || target.open) continue;
          const geo = resolveWindowGeometry(def, vw, vh);
          const next: WindowState = {
            ...target,
            x: geo.x,
            y: geo.y,
            width: geo.width,
            height: def.defaultHeight ?? geo.height,
          };
          if (geometryUnchanged(next, target)) {
            continue;
          }
          if (!changed) {
            merged = { ...prev };
            changed = true;
          }
          merged[def.id] = next;
        }

        if (!measureCenter) return merged;

        for (const def of defs) {
          if (!def.center) continue;

          const { measuredWidth, measuredHeight } = measureCenterWindow(def);

          // Content-sized center windows need a real box; avoid MIN_HEIGHT-based y.
          if (def.defaultHeight == null && measuredHeight == null) continue;

          const geo = resolveWindowGeometry(def, vw, vh, measuredHeight, measuredWidth);
          const target = merged[def.id];
          if (!target) continue;

          if (target.userSized) continue;

          const next: WindowState = {
            ...target,
            x: geo.x,
            y: geo.y,
            width: geo.width,
            height: def.defaultHeight ?? null,
          };
          if (geometryUnchanged(next, target)) {
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
    applyDefaultOpenLayout,
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
