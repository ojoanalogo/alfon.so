import {
  EDGE_MARGIN,
  isMobileViewport,
  readSafeAreaInsets,
  taskbarReservedHeight,
} from './layoutConstants';

export const BASE_ICON_X = 16;
export const BASE_ICON_Y = 16;

const MAX_ROWS_DESKTOP = 6;
const ROW_PITCH_DESKTOP = 84;
const COL_PITCH_DESKTOP = 96;
const ICON_WIDTH_DESKTOP = 80;
const ICON_HEIGHT_DESKTOP = 72;

const MAX_ROWS_NARROW = 4;
const ROW_PITCH_NARROW = 100;
const COL_PITCH_NARROW = 100;
const ICON_WIDTH_NARROW = 96;
const ICON_HEIGHT_NARROW = 104;

export interface IconGrid {
  maxRows: number;
  rowPitch: number;
  colPitch: number;
}

export function iconFootprint(): { width: number; height: number } {
  if (isMobileViewport()) {
    return { width: ICON_WIDTH_NARROW, height: ICON_HEIGHT_NARROW };
  }
  return { width: ICON_WIDTH_DESKTOP, height: ICON_HEIGHT_DESKTOP };
}

/** Compute icon grid parameters from the current viewport dimensions. */
export function iconGridForViewport(viewportHeight?: number): IconGrid {
  const narrow = isMobileViewport();
  const rowPitch = narrow ? ROW_PITCH_NARROW : ROW_PITCH_DESKTOP;
  const colPitch = narrow ? COL_PITCH_NARROW : COL_PITCH_DESKTOP;
  const { height: iconHeight } = iconFootprint();

  const vh = viewportHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 768);
  const safe = readSafeAreaInsets();
  const workHeight = vh - taskbarReservedHeight(safe.bottom) - BASE_ICON_Y - EDGE_MARGIN - safe.top;
  const fitRows = Math.max(1, Math.floor(workHeight / rowPitch));
  const cap = narrow ? MAX_ROWS_NARROW : MAX_ROWS_DESKTOP;

  const maxRows = Math.max(1, Math.min(cap, fitRows, Math.floor(workHeight / iconHeight)));

  return { maxRows, rowPitch, colPitch };
}
