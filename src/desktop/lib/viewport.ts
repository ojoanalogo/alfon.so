import type { WindowDef, WindowGeometry } from '../types';
import { positionNearCenter } from './windowPlacement';
import {
  minWidthForDef,
  isMobileViewport,
  MIN_WIDTH,
  MIN_HEIGHT,
  TASKBAR_HEIGHT,
  EDGE_MARGIN,
} from './layoutConstants';

export function effectiveMinWidth(def: WindowDef, viewportWidth: number): number {
  const configured = minWidthForDef(def);
  const available = Math.max(240, viewportWidth - EDGE_MARGIN * 2);
  if (isMobileViewport(viewportWidth)) {
    return Math.min(configured, available);
  }
  return Math.min(configured, Math.max(MIN_WIDTH, available));
}

/** Clamp a default width to the viewport's usable span, never below `minWidth`. */
export function clampWidth(defaultWidth: number, minWidth: number, viewportWidth: number): number {
  const available = Math.max(240, viewportWidth - EDGE_MARGIN * 2);
  return Math.max(minWidth, Math.min(defaultWidth, available));
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
      : clampWidth(def.defaultWidth, minW, viewportWidth);

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

/**
 * Inline height + min-height for a window: a fixed pixel height, the app default
 * height, or (when content-sized) just a min-height floor.
 */
export function resolveWindowHeightStyle(
  height: number | null,
  defaultHeight: number | undefined,
  minHeight: number | undefined,
): { height?: string; minHeight?: number } {
  return {
    height:
      height != null ? `${height}px` : defaultHeight != null ? `${defaultHeight}px` : undefined,
    minHeight: height == null && minHeight != null ? minHeight : undefined,
  };
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
    viewportWidth ??
    (typeof window !== 'undefined' ? window.innerWidth : defaultWidth + EDGE_MARGIN * 2);
  return clampWidth(defaultWidth, minWidth, vw);
}
