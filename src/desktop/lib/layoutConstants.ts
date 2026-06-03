import type { WindowDef } from '../types';

/** Minimum window width when resizing (px). */
export const MIN_WIDTH = 400;
/** Floor height for content-sized windows (px). */
export const MIN_HEIGHT = 140;
/** Taskbar height reserved at the bottom of the work area (px). */
export const TASKBAR_HEIGHT = 40;
/** Gap kept between windows/icons and the viewport edge (px). */
export const EDGE_MARGIN = 8;
/** Matches the `40rem` breakpoint used in global.css. */
export const MOBILE_BREAKPOINT_PX = 640;

export function minWidthForDef(def: WindowDef): number {
  return def.minWidth ?? MIN_WIDTH;
}

export function isMobileViewport(width?: number): boolean {
  if (typeof window === 'undefined') return false;
  return (width ?? window.innerWidth) < MOBILE_BREAKPOINT_PX;
}
