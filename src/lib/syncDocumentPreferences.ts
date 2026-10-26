import { STORAGE } from './storage';
import { DEFAULT_WINDOW_TRANSPARENCY } from './windowTransparency';

/** Apply stored theme + window-transparency prefs to `<html>` before paint. */
export function syncDocumentPreferencesFromStorage(
  root: HTMLElement = document.documentElement,
  storage: Storage = localStorage,
  prefersDark: boolean = window.matchMedia('(prefers-color-scheme: dark)').matches,
): void {
  try {
    const theme = storage.getItem(STORAGE.theme);
    const preference = theme === 'light' || theme === 'dark' ? theme : 'system';
    root.dataset.themePreference = preference;
    if (theme === 'dark' || (!theme && prefersDark)) {
      root.classList.add('dark');
    }
  } catch {
    root.dataset.themePreference = 'system';
  }

  try {
    const stored = storage.getItem(STORAGE.windowTransparency);
    const level =
      stored === 'false'
        ? 0
        : stored == null || stored === 'true'
          ? DEFAULT_WINDOW_TRANSPARENCY
          : Number(stored);
    if (Number.isFinite(level) && level !== DEFAULT_WINDOW_TRANSPARENCY) {
      const clamped = Math.min(100, Math.max(0, Math.round(level)));
      root.style.setProperty('--window-transparency', String(clamped));
    } else {
      root.style.removeProperty('--window-transparency');
    }
  } catch {
    /* private mode */
  }
}

/**
 * Blocking head script: must stay inline (no module graph) to avoid a theme flash.
 * Keys are baked at build time from `STORAGE`; logic mirrors syncDocumentPreferencesFromStorage.
 */
export const BOOT_INLINE_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(STORAGE.theme)});var p=t==="light"||t==="dark"?t:"system";document.documentElement.dataset.themePreference=p;if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");}}catch{document.documentElement.dataset.themePreference="system";}try{var w=localStorage.getItem(${JSON.stringify(STORAGE.windowTransparency)});var n=w==="false"?0:w==null||w==="true"?${DEFAULT_WINDOW_TRANSPARENCY}:Number(w);if(isFinite(n)&&n!==${DEFAULT_WINDOW_TRANSPARENCY}){document.documentElement.style.setProperty("--window-transparency",String(Math.min(100,Math.max(0,Math.round(n)))));}else{document.documentElement.style.removeProperty("--window-transparency");}}catch{}})();`;
