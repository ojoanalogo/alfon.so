import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyWindowTransparencyToDocument,
  getWindowTransparencyEnabled,
  setWindowTransparencyEnabled,
} from '@/lib/windowTransparency';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.windowTransparency;
});

describe('windowTransparency', () => {
  it('defaults to enabled when nothing is stored', () => {
    expect(getWindowTransparencyEnabled()).toBe(true);
    applyWindowTransparencyToDocument(true);
    expect(document.documentElement.dataset.windowTransparency).toBeUndefined();
  });

  it('persists disabled state and applies it to the document', () => {
    setWindowTransparencyEnabled(false);

    expect(getWindowTransparencyEnabled()).toBe(false);
    expect(localStorage.getItem('alfonso:window-transparency')).toBe('false');
    expect(document.documentElement.dataset.windowTransparency).toBe('false');
  });

  it('re-enabling clears storage and removes the document attribute', () => {
    setWindowTransparencyEnabled(false);
    setWindowTransparencyEnabled(true);

    expect(getWindowTransparencyEnabled()).toBe(true);
    expect(localStorage.getItem('alfonso:window-transparency')).toBeNull();
    expect(document.documentElement.dataset.windowTransparency).toBeUndefined();
  });
});
