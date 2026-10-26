import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE } from '@/lib/storage';
import {
  applyWindowTransparencyToDocument,
  DEFAULT_WINDOW_TRANSPARENCY,
  getWindowTransparency,
  setWindowTransparency,
} from '@/lib/windowTransparency';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.removeProperty('--window-transparency');
});

describe('windowTransparency', () => {
  it('defaults to the frosted level when nothing is stored', () => {
    expect(getWindowTransparency()).toBe(DEFAULT_WINDOW_TRANSPARENCY);
    applyWindowTransparencyToDocument(DEFAULT_WINDOW_TRANSPARENCY);
    expect(document.documentElement.style.getPropertyValue('--window-transparency')).toBe('');
  });

  it('treats the legacy off switch as fully solid', () => {
    localStorage.setItem(STORAGE.windowTransparency, 'false');
    expect(getWindowTransparency()).toBe(0);
  });

  it('persists a custom level and applies it to the document', () => {
    setWindowTransparency(60);

    expect(getWindowTransparency()).toBe(60);
    expect(localStorage.getItem(STORAGE.windowTransparency)).toBe('60');
    expect(document.documentElement.style.getPropertyValue('--window-transparency')).toBe('60');
  });

  it('clamps the level to 0–100', () => {
    setWindowTransparency(140);
    expect(getWindowTransparency()).toBe(100);

    setWindowTransparency(-20);
    expect(getWindowTransparency()).toBe(0);
  });

  it('returning to the default clears storage and the inline variable', () => {
    setWindowTransparency(80);
    setWindowTransparency(DEFAULT_WINDOW_TRANSPARENCY);

    expect(getWindowTransparency()).toBe(DEFAULT_WINDOW_TRANSPARENCY);
    expect(localStorage.getItem(STORAGE.windowTransparency)).toBeNull();
    expect(document.documentElement.style.getPropertyValue('--window-transparency')).toBe('');
  });
});
