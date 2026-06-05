import { EDGE_MARGIN, TASKBAR_HEIGHT } from './layoutConstants';

/** Clamp `value` into the inclusive range `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Keep a `w`×`h` box fully inside the desktop work area: at least `EDGE_MARGIN`
 * from every edge, and never overlapping the taskbar at the bottom. Shared by
 * windows, dialogs, and desktop icons so the work-area definition lives in one
 * place. A box larger than the work area is pinned to the top-left margin.
 */
export function clampBoxToWorkArea(
  x: number,
  y: number,
  w: number,
  h: number,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  const maxX = Math.max(EDGE_MARGIN, viewportWidth - w - EDGE_MARGIN);
  const maxY = Math.max(EDGE_MARGIN, viewportHeight - TASKBAR_HEIGHT - h - EDGE_MARGIN);
  return {
    x: clamp(x, EDGE_MARGIN, maxX),
    y: clamp(y, EDGE_MARGIN, maxY),
  };
}

/**
 * Center a `boxW`×`boxH` box in the work area (the viewport minus the taskbar),
 * never crossing the edge margin. A box taller/wider than the work area is
 * top/left-aligned at `EDGE_MARGIN` rather than positioned off-screen.
 */
export function centerInWorkArea(
  viewportWidth: number,
  viewportHeight: number,
  boxW: number,
  boxH: number,
): { x: number; y: number } {
  return {
    x: Math.max(EDGE_MARGIN, (viewportWidth - boxW) / 2),
    y: Math.max(EDGE_MARGIN, (viewportHeight - TASKBAR_HEIGHT - boxH) / 2),
  };
}
