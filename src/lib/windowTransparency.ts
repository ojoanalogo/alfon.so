import { readStorageItem, removeStorageItem, STORAGE_KEYS, writeStorageItem } from './storage';

export const WINDOW_TRANSPARENCY_CHANGE = 'window-transparency-change';

/** Frosted-card amount: 0 is solid, 100 is fully glassy. */
export const DEFAULT_WINDOW_TRANSPARENCY = 24;
export const MIN_WINDOW_TRANSPARENCY = 0;
export const MAX_WINDOW_TRANSPARENCY = 100;

export function clampWindowTransparency(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_WINDOW_TRANSPARENCY;
  return Math.min(MAX_WINDOW_TRANSPARENCY, Math.max(MIN_WINDOW_TRANSPARENCY, Math.round(value)));
}

/** Reads the stored level. Legacy `false` is solid; legacy `true` and empty use the default. */
export function getWindowTransparency(): number {
  const stored = readStorageItem(STORAGE_KEYS.windowTransparency);
  if (stored === 'false') return MIN_WINDOW_TRANSPARENCY;
  if (stored == null || stored === 'true') return DEFAULT_WINDOW_TRANSPARENCY;
  return clampWindowTransparency(Number(stored));
}

export function applyWindowTransparencyToDocument(
  level: number,
  root: HTMLElement = document.documentElement,
) {
  const next = clampWindowTransparency(level);
  if (next === DEFAULT_WINDOW_TRANSPARENCY) {
    root.style.removeProperty('--window-transparency');
  } else {
    root.style.setProperty('--window-transparency', String(next));
  }
}

function dispatchWindowTransparencyChange() {
  window.dispatchEvent(
    new CustomEvent(WINDOW_TRANSPARENCY_CHANGE, {
      detail: { level: getWindowTransparency() },
    }),
  );
}

export function setWindowTransparency(level: number) {
  const next = clampWindowTransparency(level);
  if (next === DEFAULT_WINDOW_TRANSPARENCY) {
    removeStorageItem(STORAGE_KEYS.windowTransparency);
  } else {
    writeStorageItem(STORAGE_KEYS.windowTransparency, String(next));
  }

  applyWindowTransparencyToDocument(next);
  dispatchWindowTransparencyChange();
}

export function syncWindowTransparencyFromStorage() {
  applyWindowTransparencyToDocument(getWindowTransparency());
  dispatchWindowTransparencyChange();
}

export function attachWindowTransparencyListener(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handler = () => onChange();
  window.addEventListener(WINDOW_TRANSPARENCY_CHANGE, handler);
  return () => window.removeEventListener(WINDOW_TRANSPARENCY_CHANGE, handler);
}
