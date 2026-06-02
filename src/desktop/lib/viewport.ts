import type { WindowDef, WindowGeometry } from '../types';
import { positionNearCenter } from './windowPlacement';
import { minWidthForDef, MIN_WIDTH, MIN_HEIGHT, TASKBAR_HEIGHT } from '../state/useWindowManager';

/** Matches `40rem` breakpoints used in global.css. */
export const MOBILE_BREAKPOINT_PX = 640;

const EDGE_MARGIN = 8;

export function isMobileViewport(width?: number): boolean {
  if (typeof window === 'undefined') return false;
  return (width ?? window.innerWidth) < MOBILE_BREAKPOINT_PX;
}

export function effectiveMinWidth(def: WindowDef, viewportWidth: number): number {
  const configured = minWidthForDef(def);
  const available = Math.max(240, viewportWidth - EDGE_MARGIN * 2);
  if (isMobileViewport(viewportWidth)) {
    return Math.min(configured, available);
  }
  return Math.min(configured, Math.max(MIN_WIDTH, available));
}

export function mobileWindowGeometry(
  viewportWidth: number,
  viewportHeight: number,
): WindowGeometry {
  return {
    x: EDGE_MARGIN,
    y: EDGE_MARGIN,
    width: viewportWidth - EDGE_MARGIN * 2,
    height: viewportHeight - TASKBAR_HEIGHT - EDGE_MARGIN * 2,
  };
}

/**
 * Single source of truth for desktop window placement: mobile fit, min-width
 * clamp, width cap, and centering. Used both for the initial state (no measured
 * height) and for the post-render relayout pass (which passes the DOM-measured
 * height so centered, content-sized windows settle on their true center).
 */
export function resolveWindowGeometry(
  def: WindowDef,
  viewportWidth: number,
  viewportHeight: number,
  measuredHeight?: number,
  measuredWidth?: number,
  options?: { freshRandom?: boolean },
): WindowGeometry {
  if (isMobileViewport(viewportWidth)) {
    const mobile = mobileWindowGeometry(viewportWidth, viewportHeight);
    return {
      ...mobile,
      // Content-sized windows rely on mobile CSS (inset + height:auto), not inline height.
      height: def.defaultHeight ?? null,
    };
  }

  const minW = effectiveMinWidth(def, viewportWidth);
  const width =
    measuredWidth != null && measuredWidth > 0
      ? Math.max(minW, Math.round(measuredWidth))
      : Math.max(minW, Math.min(def.defaultWidth, viewportWidth - EDGE_MARGIN * 2));

  if (def.center) {
    const height = measuredHeight ?? def.defaultHeight ?? MIN_HEIGHT;
    const x = Math.max(EDGE_MARGIN, (viewportWidth - width) / 2);
    const y = Math.max(EDGE_MARGIN, (viewportHeight - TASKBAR_HEIGHT - height) / 2);
    return { x, y, width, height: def.defaultHeight ?? null };
  }

  const height = measuredHeight ?? def.defaultHeight ?? MIN_HEIGHT;
  const { x, y } = positionNearCenter(
    viewportWidth,
    viewportHeight,
    width,
    height,
    def.id,
    options?.freshRandom,
  );
  return { x, y, width, height: def.defaultHeight ?? null };
}

/** Canonical desktop open size from app defaults (ignores stale stored width). */
export function resolveDefaultOpenGeometry(
  def: WindowDef,
  viewportWidth: number,
  viewportHeight: number,
  options?: { freshRandom?: boolean },
): WindowGeometry {
  return resolveWindowGeometry(def, viewportWidth, viewportHeight, undefined, undefined, options);
}

/** Width to paint in the DOM — uses app default unless the user resized. */
export function resolveLayoutWidth(
  defaultWidth: number,
  state: { width: number; userSized?: boolean },
  minWidth = MIN_WIDTH,
  viewportWidth?: number,
): number {
  if (state.userSized) return state.width;
  const vw =
    viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : defaultWidth + EDGE_MARGIN * 2);
  const available = Math.max(240, vw - EDGE_MARGIN * 2);
  return Math.max(minWidth, Math.min(defaultWidth, available));
}
