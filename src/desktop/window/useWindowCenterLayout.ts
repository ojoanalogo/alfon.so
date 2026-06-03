import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { TASKBAR_HEIGHT, EDGE_MARGIN } from '../lib/layoutConstants';

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
      if (userPositioned.current || document.body.classList.contains('is-window-gesturing')) {
        return;
      }

      const node = rootRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nextX = Math.round(Math.max(EDGE_MARGIN, (vw - rect.width) / 2));
      const nextY = Math.round(Math.max(EDGE_MARGIN, (vh - TASKBAR_HEIGHT - rect.height) / 2));
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
    };
  }, [enabled, rootRef, width]);

  function markUserPositioned() {
    userPositioned.current = true;
    setUserLocked(true);
  }

  const displayX = userLocked ? x : displayPos.x;
  const displayY = userLocked ? y : displayPos.y;

  return { markUserPositioned, displayX, displayY };
}
