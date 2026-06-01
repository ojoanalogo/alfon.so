import { useLayoutEffect, useRef, type RefObject } from 'react';
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
 * not the width stored in state (min-width / content can differ).
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
  const positionRef = useRef({ x, y, width });
  positionRef.current = { x, y, width };
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
      const roundedWidth = Math.round(rect.width);
      const { x: currentX, y: currentY, width: currentWidth } = positionRef.current;

      const patch: { x?: number; y?: number; width?: number } = {};
      if (Math.abs(currentX - nextX) > 1) patch.x = nextX;
      if (Math.abs(currentY - nextY) > 1) patch.y = nextY;
      if (Math.abs(currentWidth - roundedWidth) > 1) patch.width = roundedWidth;
      if (Object.keys(patch).length === 0) return;

      onGeometryChangeRef.current(patch);
    }

    syncPosition();
    const raf1 = requestAnimationFrame(() => requestAnimationFrame(syncPosition));
    void document.fonts?.ready.then(syncPosition);

    const observer = new ResizeObserver(syncPosition);
    observer.observe(el);
    window.addEventListener('resize', syncPosition);

    return () => {
      cancelAnimationFrame(raf1);
      observer.disconnect();
      window.removeEventListener('resize', syncPosition);
    };
  }, [enabled, rootRef]);

  function markUserPositioned() {
    userPositioned.current = true;
  }

  return { markUserPositioned };
}
