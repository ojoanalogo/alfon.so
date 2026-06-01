import { useLayoutEffect, useRef, type RefObject } from 'react';
import { TASKBAR_HEIGHT } from '../state/useWindowManager';

const EDGE_MARGIN = 8;

interface WindowCenterLayoutOptions {
  rootRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  x: number;
  y: number;
  onGeometryChange: (geometry: { x?: number; y?: number }) => void;
}

/**
 * Keeps center-flagged windows aligned to the viewport using the rendered box,
 * not the width stored in state (min-width / content can differ).
 */
export function useWindowCenterLayout({
  rootRef,
  enabled,
  x,
  y,
  onGeometryChange,
}: WindowCenterLayoutOptions) {
  const userPositioned = useRef(false);
  const positionRef = useRef({ x, y });
  positionRef.current = { x, y };
  const onGeometryChangeRef = useRef(onGeometryChange);
  onGeometryChangeRef.current = onGeometryChange;

  useLayoutEffect(() => {
    if (!enabled || userPositioned.current || typeof window === 'undefined') return;
    const el = rootRef.current;
    if (!el) return;

    function syncPosition() {
      if (userPositioned.current || document.body.classList.contains('is-window-gesturing')) {
        return;
      }

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nextX = Math.round(Math.max(EDGE_MARGIN, (vw - rect.width) / 2));
      const nextY = Math.round(Math.max(EDGE_MARGIN, (vh - TASKBAR_HEIGHT - rect.height) / 2));
      const { x: currentX, y: currentY } = positionRef.current;

      const patch: { x?: number; y?: number } = {};
      if (Math.abs(currentX - nextX) > 1) patch.x = nextX;
      if (Math.abs(currentY - nextY) > 1) patch.y = nextY;
      if (Object.keys(patch).length === 0) return;

      onGeometryChangeRef.current(patch);
    }

    syncPosition();

    const observer = new ResizeObserver(syncPosition);
    observer.observe(el);
    window.addEventListener('resize', syncPosition);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncPosition);
    };
  }, [enabled, rootRef]);

  function markUserPositioned() {
    userPositioned.current = true;
  }

  return { markUserPositioned };
}
