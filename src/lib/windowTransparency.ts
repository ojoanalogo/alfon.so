const STORAGE_KEY = 'devfolio.window-transparency';
const CHANGE_EVENT = 'devfolio-window-transparency-change';

export const DEFAULT_WINDOW_TRANSPARENCY = true;

export function getWindowTransparencyEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'false') return false;
  } catch {
    /* private mode */
  }
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
  try {
    if (enabled === DEFAULT_WINDOW_TRANSPARENCY) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    }
  } catch {
    /* private mode */
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
