import { STORAGE } from './storage';

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
    if (storage.getItem(STORAGE.windowTransparency) === 'false') {
      root.dataset.windowTransparency = 'false';
    }
  } catch {
    /* private mode */
  }
}

/**
 * Blocking head script: must stay inline (no module graph) to avoid a theme flash.
 * Keys are baked at build time from `STORAGE`; logic mirrors syncDocumentPreferencesFromStorage.
 */
export const BOOT_INLINE_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(STORAGE.theme)});var p=t==="light"||t==="dark"?t:"system";document.documentElement.dataset.themePreference=p;if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");}}catch{document.documentElement.dataset.themePreference="system";}try{if(localStorage.getItem(${JSON.stringify(STORAGE.windowTransparency)})==="false"){document.documentElement.dataset.windowTransparency="false";}}catch{}})();`;
