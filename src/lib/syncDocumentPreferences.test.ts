import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE } from './storage';
import { syncDocumentPreferencesFromStorage } from './syncDocumentPreferences';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  delete document.documentElement.dataset.themePreference;
  document.documentElement.style.removeProperty('--window-transparency');
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

  it('applies a stored window transparency level', () => {
    localStorage.setItem(STORAGE.windowTransparency, '60');
    syncDocumentPreferencesFromStorage();
    expect(document.documentElement.style.getPropertyValue('--window-transparency')).toBe('60');
  });

  it('treats the legacy off switch as a solid window', () => {
    localStorage.setItem(STORAGE.windowTransparency, 'false');
    syncDocumentPreferencesFromStorage();
    expect(document.documentElement.style.getPropertyValue('--window-transparency')).toBe('0');
  });
});
