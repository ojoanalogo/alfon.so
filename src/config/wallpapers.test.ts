import { describe, it, expect } from 'vitest';
import { DEFAULT_WALLPAPER_ID, resolveWallpaperId, defaultWallpaperId } from './wallpapers';

describe('defaultWallpaperId', () => {
  it('returns the default id when it is available', () => {
    expect(defaultWallpaperId(new Set(['1', '7', DEFAULT_WALLPAPER_ID]))).toBe(DEFAULT_WALLPAPER_ID);
  });

  it('falls back to the numerically smallest id when the default is missing', () => {
    expect(defaultWallpaperId(new Set(['7', '2', '5']))).toBe('2');
    // Numeric sort, not lexicographic ('10' > '2').
    expect(defaultWallpaperId(new Set(['10', '2', '30']))).toBe('2');
  });

  it('returns null for an empty set', () => {
    expect(defaultWallpaperId(new Set())).toBeNull();
  });
});

describe('resolveWallpaperId', () => {
  const ids = new Set(['1', '4', '7', DEFAULT_WALLPAPER_ID]);

  it('returns the stored id when it is available', () => {
    expect(resolveWallpaperId('7', ids)).toBe('7');
  });

  it('falls back when the stored id is unknown', () => {
    expect(resolveWallpaperId('99', ids)).toBe(DEFAULT_WALLPAPER_ID);
    expect(resolveWallpaperId('99', new Set(['7', '2', '5']))).toBe('2');
  });

  it('returns null when nothing is available', () => {
    expect(resolveWallpaperId('99', new Set())).toBeNull();
  });
});
