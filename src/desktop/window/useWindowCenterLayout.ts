import { useLayoutEffect, useRef, type RefObject } from 'react';
import { centerInWorkArea } from '../lib/geometry';
import { STATE_CLASS } from '../lib/stateClasses';

interface WindowCenterLayoutOptions {
  rootRef: RefObject<HTMLElement | null>;
  /** center && open && !minimized && !maximized */
  enabled: boolean;
  /** Painted width; a change re-measures the centered box. */
  width: number;
  /** Once the user has moved/resized the window, stop centering it. */
  userSized?: boolean;
  /** Auto-layout reporter (routes to the manager's correctLayout). */
  onGeometryChange: (geometry: { x?: number; y?: number; width?: number }) => void;
}

/**
 * Centering as a placement policy: while a center-flagged window is auto-placed
 * (`enabled && !userSized`), measure its rendered box and write the centered
 * frame back through `onGeometryChange`. It owns no render-time position state —
 * the window renders from `state.x/y` like every other window. Once the user
 * moves/resizes it (`userSized`), this goes silent; on reopen the manager clears
 * `userSized` and the effect resumes.
 */
export function useWindowCenterLayout({
  rootRef,
  enabled,
  width,
  userSized,
  onGeometryChange,
}: WindowCenterLayoutOptions) {
  const onGeometryChangeRef = useRef(onGeometryChange);
  onGeometryChangeRef.current = onGeometryChange;
  // The settle triggers (rAF passes, fonts.ready, ResizeObserver) often resolve
  // to the same box; only report real changes.
  const lastSentRef = useRef<{ x: number; y: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!enabled || userSized || typeof window === 'undefined') return;
    const el = rootRef.current;
    if (!el) return;

    let raf2 = 0;

    function syncPosition() {
      // Never fight an in-progress drag in the window between grab and the first
      // move committing userSized.
      if (document.body.classList.contains(STATE_CLASS.windowGesturing)) return;

      const node = rootRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const center = centerInWorkArea(window.innerWidth, window.innerHeight, rect.width, rect.height);
      const nextX = Math.round(center.x);
      const nextY = Math.round(center.y);
      const roundedWidth = Math.round(rect.width);

      const last = lastSentRef.current;
      if (!last || last.x !== nextX || last.y !== nextY || last.width !== roundedWidth) {
        lastSentRef.current = { x: nextX, y: nextY, width: roundedWidth };
        onGeometryChangeRef.current({ x: nextX, y: nextY, width: roundedWidth });
      }
    }

    syncPosition();
    const raf1 = requestAnimationFrame(syncPosition);
    raf2 = requestAnimationFrame(() => requestAnimationFrame(syncPosition));
    void document.fonts?.ready.then(syncPosition);

    const observer = new ResizeObserver(syncPosition);
    observer.observe(el);
    window.addEventListener('resize', syncPosition);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      observer.disconnect();
      window.removeEventListener('resize', syncPosition);
      // Drop the cached box so a resume (e.g. reopen clearing userSized) can
      // re-report even if it resolves to a prior value.
      lastSentRef.current = null;
    };
  }, [enabled, rootRef, width, userSized]);
}
