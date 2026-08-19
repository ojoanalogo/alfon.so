import { readStorageItem, removeStorageItem, STORAGE_KEYS, writeStorageItem } from './storage';

const CHANGE_EVENT = 'devfolio-window-transparency-change';

export const DEFAULT_WINDOW_TRANSPARENCY = true;

export function getWindowTransparencyEnabled(): boolean {
  const stored = readStorageItem(STORAGE_KEYS.windowTransparency);
  if (stored === 'false') return false;
  return DEFAULT_WINDOW_TRANSPARENCY;
}

export function applyWindowTransparencyToDocument(enabled: boolean) {
  if (enabled) {
    delete document.documentElement.dataset.windowTransparency;
  } else {
    document.documentElement.dataset.windowTransparency = 'false';
  }
}

function dispatchWindowTransparencyChange() {
  window.dispatchEvent(
    new CustomEvent(CHANGE_EVENT, {
      detail: { enabled: getWindowTransparencyEnabled() },
    }),
  );
}

export function setWindowTransparencyEnabled(enabled: boolean) {
  if (enabled === DEFAULT_WINDOW_TRANSPARENCY) {
    removeStorageItem(STORAGE_KEYS.windowTransparency);
  } else {
    writeStorageItem(STORAGE_KEYS.windowTransparency, String(enabled));
  }

  applyWindowTransparencyToDocument(enabled);
  dispatchWindowTransparencyChange();
}

export function syncWindowTransparencyFromStorage() {
  applyWindowTransparencyToDocument(getWindowTransparencyEnabled());
  dispatchWindowTransparencyChange();
}

export function attachWindowTransparencyListener(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
