import type { WindowDef, WindowGeometry } from '../types';
import { positionNearCenter } from './windowPlacement';
import { centerInWorkArea, maxWindowHeight } from './geometry';
import {
  minWidthForDef,
  isMobileViewport,
  isCompactLayoutViewport,
  isLandscapePhoneViewport,
  MIN_WIDTH,
  MIN_HEIGHT,
  EDGE_MARGIN,
  LANDSCAPE_PHONE_WIDTH_FRACTION,
  LANDSCAPE_PHONE_HEIGHT_FRACTION,
  readSafeAreaInsets,
  taskbarReservedHeight,
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

/** Cap width for phone-landscape viewports so windows don't span edge-to-edge. */
export function landscapePhoneWidthCap(viewportWidth: number): number {
  return Math.round(viewportWidth * LANDSCAPE_PHONE_WIDTH_FRACTION);
}

/** Cap height for phone-landscape viewports based on the work area. */
export function landscapePhoneHeightCap(viewportHeight: number): number {
  const safe = readSafeAreaInsets();
  const workH = viewportHeight - safe.top - taskbarReservedHeight(safe.bottom) - EDGE_MARGIN * 2;
  return Math.round(workH * LANDSCAPE_PHONE_HEIGHT_FRACTION);
}

export function mobileWindowGeometry(
  viewportWidth: number,
  viewportHeight: number,
): WindowGeometry {
  const safe = readSafeAreaInsets();
  return {
    x: EDGE_MARGIN + safe.left,
    y: EDGE_MARGIN + safe.top,
    width: viewportWidth - EDGE_MARGIN * 2 - safe.left - safe.right,
    height: viewportHeight - taskbarReservedHeight(safe.bottom) - EDGE_MARGIN * 2 - safe.top,
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
): WindowGeometry {
  if (isCompactLayoutViewport(viewportWidth, viewportHeight)) {
    const mobile = mobileWindowGeometry(viewportWidth, viewportHeight);
    return {
      ...mobile,
      // Content-sized windows rely on mobile CSS (inset + height:auto), not inline height.
      height: def.defaultHeight ?? null,
    };
  }

  const minW = effectiveMinWidth(def, viewportWidth);
  let width =
    measuredWidth != null && measuredWidth > 0
      ? Math.max(minW, Math.round(measuredWidth))
      : clampWidth(def.defaultWidth, minW, viewportWidth);

  if (isLandscapePhoneViewport(viewportWidth, viewportHeight)) {
    width = Math.min(width, landscapePhoneWidthCap(viewportWidth));
  }

  const heightCap = isLandscapePhoneViewport(viewportWidth, viewportHeight)
    ? landscapePhoneHeightCap(viewportHeight)
    : undefined;

  if (def.center) {
    const capHeight = def.defaultOpen ? maxWindowHeight(viewportHeight) : MIN_HEIGHT;
    const rawHeight = measuredHeight ?? def.defaultHeight ?? capHeight;
    const height =
      heightCap != null && def.defaultHeight != null ? Math.min(rawHeight, heightCap) : rawHeight;
    const layoutHeight =
      def.defaultHeight != null
        ? height
        : def.defaultOpen
          ? Math.min(rawHeight, maxWindowHeight(viewportHeight))
          : height;
    const { x, y } = centerInWorkArea(viewportWidth, viewportHeight, width, layoutHeight);
    const resolvedHeight =
      def.defaultHeight != null && heightCap != null
        ? Math.min(def.defaultHeight, heightCap)
        : (def.defaultHeight ?? (def.defaultOpen ? maxWindowHeight(viewportHeight) : null));
    return { x, y, width, height: resolvedHeight };
  }

  const height = measuredHeight ?? def.defaultHeight ?? MIN_HEIGHT;
  const cappedHeight =
    heightCap != null && def.defaultHeight != null ? Math.min(height, heightCap) : height;
  const { x, y } = positionNearCenter(viewportWidth, viewportHeight, width, cappedHeight, def.id);
  const resolvedHeight =
    def.defaultHeight != null && heightCap != null
      ? Math.min(def.defaultHeight, heightCap)
      : (def.defaultHeight ?? null);
  return { x, y, width, height: resolvedHeight };
}

/** Canonical desktop open size from app defaults (ignores stale stored width). */
export function resolveDefaultOpenGeometry(
  def: WindowDef,
  viewportWidth: number,
  viewportHeight: number,
): WindowGeometry {
  return resolveWindowGeometry(def, viewportWidth, viewportHeight);
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
  viewportHeight?: number,
): number {
  if (state.userSized) return state.width;
  const vw =
    viewportWidth ??
    (typeof window !== 'undefined' ? window.innerWidth : defaultWidth + EDGE_MARGIN * 2);
  const vh = viewportHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 800);
  let width = clampWidth(defaultWidth, minWidth, vw);
  if (isLandscapePhoneViewport(vw, vh)) {
    width = Math.min(width, landscapePhoneWidthCap(vw));
  }
  return width;
}
