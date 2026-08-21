import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE } from './storage';
import { syncDocumentPreferencesFromStorage } from './syncDocumentPreferences';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  delete document.documentElement.dataset.themePreference;
  delete document.documentElement.dataset.windowTransparency;
});

describe('syncDocumentPreferencesFromStorage', () => {
  it('defaults to system preference without a stored theme', () => {
    syncDocumentPreferencesFromStorage(document.documentElement, localStorage, false);
    expect(document.documentElement.dataset.themePreference).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applies dark mode from storage', () => {
    localStorage.setItem(STORAGE.theme, 'dark');
    syncDocumentPreferencesFromStorage(document.documentElement, localStorage, false);
    expect(document.documentElement.dataset.themePreference).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('follows system dark when no explicit theme is stored', () => {
    syncDocumentPreferencesFromStorage(document.documentElement, localStorage, true);
    expect(document.documentElement.dataset.themePreference).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('marks window transparency disabled from storage', () => {
    localStorage.setItem(STORAGE.windowTransparency, 'false');
    syncDocumentPreferencesFromStorage();
    expect(document.documentElement.dataset.windowTransparency).toBe('false');
  });
});
