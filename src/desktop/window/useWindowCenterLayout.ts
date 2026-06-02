import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { TASKBAR_HEIGHT } from '../state/useWindowManager';

const EDGE_MARGIN = 8;

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

      setDisplayPos({ x: nextX, y: nextY });
      onGeometryChangeRef.current({ x: nextX, y: nextY, width: roundedWidth });
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
