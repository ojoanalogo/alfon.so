import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { centerInWorkArea } from '../lib/geometry';
import { STATE_CLASS } from '../lib/stateClasses';

interface WindowCenterLayoutOptions {
  rootRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  x: number;
  y: number;
  width: number;
  onGeometryChange: (geometry: { x?: number; y?: number; width?: number }) => void;
}

/**
 * Keeps center-flagged windows aligned to the viewport using the rendered box,
 * not estimates from state (content-sized height must come from the DOM).
 */
export function useWindowCenterLayout({
  rootRef,
  enabled,
  x,
  y,
  width,
  onGeometryChange,
}: WindowCenterLayoutOptions) {
  const userPositioned = useRef(false);
  const [userLocked, setUserLocked] = useState(false);
  const [displayPos, setDisplayPos] = useState({ x, y });
  const onGeometryChangeRef = useRef(onGeometryChange);
  onGeometryChangeRef.current = onGeometryChange;
  // Last geometry pushed upstream. The settle triggers (rAF passes, fonts.ready,
  // ResizeObserver) often resolve to the same box; only report real changes.
  const lastSentRef = useRef<{ x: number; y: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!userLocked) {
      setDisplayPos({ x, y });
    }
  }, [x, y, userLocked]);

  useLayoutEffect(() => {
    if (!enabled || userPositioned.current || typeof window === 'undefined') return;
    const el = rootRef.current;
    if (!el) return;

    let raf2 = 0;

    function syncPosition() {
      if (userPositioned.current || document.body.classList.contains(STATE_CLASS.windowGesturing)) {
        return;
      }

      const node = rootRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const center = centerInWorkArea(window.innerWidth, window.innerHeight, rect.width, rect.height);
      const nextX = Math.round(center.x);
      const nextY = Math.round(center.y);
      const roundedWidth = Math.round(rect.width);

      setDisplayPos((prev) =>
        prev.x === nextX && prev.y === nextY ? prev : { x: nextX, y: nextY },
      );

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
      // Drop the cached last-sent box so a re-enable (e.g. after maximize/minimize)
      // can re-report a corrected position even if it resolves to a prior value.
      lastSentRef.current = null;
    };
  }, [enabled, rootRef, width]);

  function markUserPositioned() {
    // For a centered window whose displayed (measured-centered) position has
    // drifted from the stored geometry, commit the displayed position before
    // locking. Otherwise displayX/Y switch from the measured `displayPos` to the
    // props `x`/`y` — a stale seed (the manager reseeds centered windows from a
    // MIN_HEIGHT placeholder the settle dedupe leaves uncorrected) — and the
    // window jumps on grab. Skip when not centered or already in sync, so a plain
    // window's drag never gets an extra (possibly one-frame-stale) report.
    // Only on the FIRST lock of a centered window: commit the currently displayed
    // (live measured-centered) position into stored geometry, so switching the
    // rendered source from `displayPos` to props x/y doesn't jump off a stale
    // seed. Once locked, `displayPos` stops updating and goes stale, so we must
    // never commit it again on a re-grab — guard with `!userLocked`.
    if (enabled && !userLocked && (displayPos.x !== x || displayPos.y !== y)) {
      onGeometryChangeRef.current({ x: displayPos.x, y: displayPos.y });
    }
    userPositioned.current = true;
    setUserLocked(true);
  }

  const displayX = userLocked ? x : displayPos.x;
  const displayY = userLocked ? y : displayPos.y;

  return { markUserPositioned, displayX, displayY };
}
