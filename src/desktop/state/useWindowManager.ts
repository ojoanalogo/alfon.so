import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { WindowDef, WindowGeometry, WindowState } from '../types';
import {
  resolveWindowGeometry,
  resolveDefaultOpenGeometry,
  effectiveMinWidth,
} from '../lib/viewport';
import { isMobileViewport, MIN_WIDTH, MIN_HEIGHT } from '../lib/layoutConstants';
import { STATE_CLASS } from '../lib/stateClasses';

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
  /**
   * Recompute default geometry for closed windows from the live viewport. Open
   * windows are left alone — centered ones are owned by `useWindowCenterLayout`,
   * which measures their real box and reports back through `setGeometry`.
   */
  relayoutToViewport: (viewportWidth: number, viewportHeight: number) => void;
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

  // Refs let bringToFront read the latest focus/z without re-creating the
  // callback (it's wired into every window's pointer-down).
  const focusedIdRef = useRef(focusedId);
  focusedIdRef.current = focusedId;
  const windowsRef = useRef(windows);
  windowsRef.current = windows;

  const bringToFront = useCallback((id: string) => {
    const target = windowsRef.current[id];
    // Already the focused, top-most window — pointer-downs on it are common, so
    // skip the z bump + state write that would otherwise force a no-op re-render.
    const alreadyTop = !!target && focusedIdRef.current === id && target.zIndex === topZ.current;
    if (target && !alreadyTop) {
      topZ.current += 1;
      const z = topZ.current;
      setWindows((prev) => {
        const next = prev[id];
        if (!next) return prev;
        return { ...prev, [id]: { ...next, zIndex: z } };
      });
    }
    setFocusedId(id);
  }, []);

  const focus = useCallback(
    (id: string) => {
      bringToFront(id);
    },
    [bringToFront],
  );

  // `open` fully places a window on the closed→open transition: it resets
  // userSized and resolves the declared default geometry. Restoring a minimized
  // (already-open) window deliberately preserves its current geometry.
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
          const geo = resolveDefaultOpenGeometry(def, vw, vh);
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
      if (document.body.classList.contains(STATE_CLASS.windowGesturing)) {
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
    (vw: number, vh: number) => {
      setWindows((prev) => {
        let next: Record<string, WindowState> | null = null;
        for (const def of defs) {
          const target = prev[def.id];
          if (!target || target.open) continue;
          const geo = resolveWindowGeometry(def, vw, vh);
          const updated: WindowState = {
            ...target,
            x: geo.x,
            y: geo.y,
            width: geo.width,
            height: def.defaultHeight ?? geo.height,
          };
          if (geometryUnchanged(updated, target)) continue;
          if (!next) next = { ...prev };
          next[def.id] = updated;
        }
        return next ?? prev;
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
