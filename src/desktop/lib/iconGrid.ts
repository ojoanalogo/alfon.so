import {
  EDGE_MARGIN,
  isLandscapePhoneViewport,
  isMobileViewport,
  readSafeAreaInsets,
  taskbarReservedHeight,
} from './layoutConstants';

export const BASE_ICON_X = 16;
export const BASE_ICON_Y = 16;

const MAX_ROWS_DESKTOP = 6;
const ROW_PITCH_DESKTOP = 84;
const COL_PITCH_DESKTOP = 96;
/** Matches `.desktop-icon` width (`7rem` at 16px root). */
const ICON_WIDTH_DESKTOP = 112;
const ICON_HEIGHT_DESKTOP = 72;

const MAX_ROWS_NARROW = 4;
const ROW_PITCH_NARROW = 100;
const COL_PITCH_NARROW = 100;
/** Matches `.desktop-icon` width on narrow viewports (`5.75rem`). */
const ICON_WIDTH_NARROW = 92;
const ICON_HEIGHT_NARROW = 104;

export interface IconGrid {
  maxRows: number;
  rowPitch: number;
  colPitch: number;
}

export interface IconPosition {
  x: number;
  y: number;
}

export function iconFootprint(viewportWidth?: number): { width: number; height: number } {
  if (isMobileViewport(viewportWidth)) {
    return { width: ICON_WIDTH_NARROW, height: ICON_HEIGHT_NARROW };
  }
  return { width: ICON_WIDTH_DESKTOP, height: ICON_HEIGHT_DESKTOP };
}

/** Phone portrait and landscape use gutters so columns span the work area evenly. */
export function usesEvenColumnLayout(viewportWidth?: number, viewportHeight?: number): boolean {
  const vw = viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
  const vh = viewportHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 768);
  return isMobileViewport(vw) || isLandscapePhoneViewport(vw, vh);
}

/** X position for a column index when distributing icons with equal gutters. */
export function iconColumnX(col: number, columnCount: number, viewportWidth: number): number {
  const { width: iconWidth } = iconFootprint(viewportWidth);
  const safe = readSafeAreaInsets();
  const left = BASE_ICON_X + safe.left;
  const right = EDGE_MARGIN + safe.right;
  const workWidth = viewportWidth - left - right;

  if (columnCount <= 1) return left;

  const totalIconsWidth = columnCount * iconWidth;
  const gutter = (workWidth - totalIconsWidth) / (columnCount + 1);
  return Math.round(left + gutter + col * (iconWidth + gutter));
}

/** Compute icon grid parameters from the current viewport dimensions. */
export function iconGridForViewport(viewportWidth?: number, viewportHeight?: number): IconGrid {
  const vw = viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
  const vh = viewportHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 768);
  const narrow = isMobileViewport(vw);
  const rowPitch = narrow ? ROW_PITCH_NARROW : ROW_PITCH_DESKTOP;
  const colPitch = narrow ? COL_PITCH_NARROW : COL_PITCH_DESKTOP;
  const { height: iconHeight } = iconFootprint(vw);

  const safe = readSafeAreaInsets();
  const workHeight = vh - taskbarReservedHeight(safe.bottom) - BASE_ICON_Y - EDGE_MARGIN - safe.top;
  const fitRows = Math.max(1, Math.floor(workHeight / rowPitch));
  const cap = narrow ? MAX_ROWS_NARROW : MAX_ROWS_DESKTOP;

  const maxRows = Math.max(1, Math.min(cap, fitRows, Math.floor(workHeight / iconHeight)));

  return { maxRows, rowPitch, colPitch };
}

/** Default top-left positions for a list of icons in column-major order. */
export function iconPositionsForIcons(
  icons: ReadonlyArray<{ id: string }>,
): Record<string, IconPosition> {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const { maxRows, rowPitch, colPitch } = iconGridForViewport(vw, vh);
  const columnCount = Math.max(1, Math.ceil(icons.length / maxRows));
  const evenColumns = usesEvenColumnLayout(vw, vh);

  const entries = icons.map((icon, index) => {
    const col = Math.floor(index / maxRows);
    const row = index % maxRows;
    const x = evenColumns ? iconColumnX(col, columnCount, vw) : BASE_ICON_X + col * colPitch;
    return [icon.id, { x, y: BASE_ICON_Y + row * rowPitch }] as const;
  });
  return Object.fromEntries(entries);
}
