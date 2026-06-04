import { useMemo, type RefObject } from 'react';
import type { Variants } from 'framer-motion';

/**
 * Measure the genie-minimize delta: from the window's bottom-center to the
 * center of its taskbar tab (so the window appears to suck into the taskbar).
 * Falls back to a downward slide toward the taskbar when no tab is found.
 */
export function measureGenieTarget(
  el: HTMLElement | null,
  windowId: string,
): { dx: number; dy: number } {
  if (!el) return { dx: 0, dy: 360 };
  const rect = el.getBoundingClientRect();
  const winCenterX = rect.left + rect.width / 2;
  const winBottomY = rect.top + rect.height;
  const tab = document.querySelector(`[data-taskbar-window="${windowId}"]`);
  if (tab) {
    const tabRect = tab.getBoundingClientRect();
    return {
      dx: tabRect.left + tabRect.width / 2 - winCenterX,
      dy: tabRect.top + tabRect.height / 2 - winBottomY,
    };
  }
  return { dx: 0, dy: window.innerHeight - winBottomY + 48 };
}

/**
 * Framer-motion variants for the window shell: spring-in on open, fade on close,
 * and a genie suck-to-taskbar on minimize. The minimized target is measured
 * lazily at animation time from the live DOM box.
 */
export function useWindowVariants(
  rootRef: RefObject<HTMLElement | null>,
  windowId: string,
  prefersReduced: boolean,
): Variants {
  return useMemo<Variants>(
    () => ({
      open: {
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        x: 0,
        y: 0,
        transition: prefersReduced
          ? { duration: 0 }
          : { type: 'spring', stiffness: 460, damping: 34, mass: 0.85 },
      },
      closed: {
        opacity: 0,
        scaleX: 0.9,
        scaleY: 0.9,
        x: 0,
        y: 0,
        transition: prefersReduced ? { duration: 0 } : { duration: 0.16, ease: 'easeIn' },
      },
      minimized: () => {
        const target = measureGenieTarget(rootRef.current, windowId);
        return {
          opacity: 0,
          scaleX: 0.12,
          scaleY: 0.02,
          x: target.dx,
          y: target.dy,
          transition: prefersReduced
            ? { duration: 0 }
            : { duration: 0.42, ease: [0.4, 0.05, 0.25, 1] },
        };
      },
    }),
    [rootRef, windowId, prefersReduced],
  );
}
