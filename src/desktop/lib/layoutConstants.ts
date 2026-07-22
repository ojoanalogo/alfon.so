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
/** Short viewports (e.g. phone landscape) — used for smaller window caps, not full-bleed. */
export const COMPACT_HEIGHT_PX = 520;
/** Max default window width as a fraction of viewport on phone landscape. */
export const LANDSCAPE_PHONE_WIDTH_FRACTION = 0.65;
/** Max default window height as a fraction of work area on phone landscape. */
export const LANDSCAPE_PHONE_HEIGHT_FRACTION = 0.85;

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const ZERO_INSETS: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/** Read safe-area insets from CSS custom properties (set in global.css). */
export function readSafeAreaInsets(): SafeAreaInsets {
  if (typeof document === 'undefined') return ZERO_INSETS;
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseFloat(style.getPropertyValue('--safe-area-top')) || 0,
    right: parseFloat(style.getPropertyValue('--safe-area-right')) || 0,
    bottom: parseFloat(style.getPropertyValue('--safe-area-bottom')) || 0,
    left: parseFloat(style.getPropertyValue('--safe-area-left')) || 0,
  };
}

/** Taskbar content height plus bottom inset (safe area or landscape pad). */
export function readTaskbarBottomPad(): number {
  if (typeof document === 'undefined') return 0;
  const style = getComputedStyle(document.documentElement);
  return parseFloat(style.getPropertyValue('--taskbar-bottom-pad')) || 0;
}

export function taskbarReservedHeight(bottomInset?: number): number {
  const safe = bottomInset ?? readSafeAreaInsets().bottom;
  const pad = Math.max(safe, readTaskbarBottomPad());
  return TASKBAR_HEIGHT + pad;
}

export function minWidthForDef(def: WindowDef): number {
  return def.minWidth ?? MIN_WIDTH;
}

export function isMobileViewport(width?: number): boolean {
  // An explicit width is authoritative — honor it even during SSR, where a
  // pure-width caller (e.g. createInitialState's fallback) must not be told
  // "desktop" just because `window` is absent.
  if (width != null) return width < MOBILE_BREAKPOINT_PX;
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT_PX;
}

/** True for narrow portrait viewports that need full-bleed window layout. */
export function isCompactLayoutViewport(width?: number, _height?: number): boolean {
  if (width != null) return width < MOBILE_BREAKPOINT_PX;
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT_PX;
}

/** Wide but short viewports (phone landscape) — desktop chrome, smaller windows. */
export function isLandscapePhoneViewport(width?: number, height?: number): boolean {
  const w = width ?? (typeof window !== 'undefined' ? window.innerWidth : 0);
  const h = height ?? (typeof window !== 'undefined' ? window.innerHeight : 0);
  return w >= MOBILE_BREAKPOINT_PX && h < COMPACT_HEIGHT_PX;
}
