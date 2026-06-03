import { describe, it, expect } from 'vitest';
import {
  DEFAULT_WALLPAPER_ID,
  resolveWallpaperId,
  defaultWallpaperId,
} from './wallpapers';

describe('DEFAULT_WALLPAPER_ID', () => {
  it('is "4"', () => {
    expect(DEFAULT_WALLPAPER_ID).toBe('4');
  });
});

describe('defaultWallpaperId', () => {
  it('returns the default id when it is available', () => {
    expect(defaultWallpaperId(new Set(['1', '2', '4', '7']))).toBe('4');
  });

  it('returns the default id even when it is the only available id', () => {
    expect(defaultWallpaperId(new Set(['4']))).toBe('4');
  });

  it('falls back to the numerically smallest id when the default is missing', () => {
    expect(defaultWallpaperId(new Set(['7', '2', '5']))).toBe('2');
  });

  it('sorts numerically, not lexicographically, for the fallback', () => {
    // lexicographic sort would pick '10' before '2'
    expect(defaultWallpaperId(new Set(['10', '2', '30']))).toBe('2');
  });

  it('sorts numerically with multi-digit ids', () => {
    expect(defaultWallpaperId(new Set(['100', '11', '9', '20']))).toBe('9');
  });

  it('returns null for an empty set', () => {
    expect(defaultWallpaperId(new Set())).toBeNull();
  });

  it('returns the single available id when default is missing', () => {
    expect(defaultWallpaperId(new Set(['7']))).toBe('7');
  });

  it('returns the fallback id deterministically regardless of insertion order', () => {
    const a = defaultWallpaperId(new Set(['5', '3', '8']));
    const b = defaultWallpaperId(new Set(['8', '3', '5']));
    expect(a).toBe('3');
    expect(b).toBe('3');
  });
});

describe('resolveWallpaperId', () => {
  it('returns the stored id when it is available', () => {
    expect(resolveWallpaperId('7', new Set(['1', '4', '7']))).toBe('7');
  });

  it('returns the stored id even when it equals the default', () => {
    expect(resolveWallpaperId('4', new Set(['1', '4', '7']))).toBe('4');
  });

  it('falls back to the default id when the stored id is unknown', () => {
    expect(resolveWallpaperId('99', new Set(['1', '4', '7']))).toBe('4');
  });

  it('falls back to the numerically smallest id when stored and default are both missing', () => {
    expect(resolveWallpaperId('99', new Set(['7', '2', '5']))).toBe('2');
  });

  it('returns null when the stored id is unknown and the set is empty', () => {
    expect(resolveWallpaperId('99', new Set())).toBeNull();
  });

  it('returns null when the stored id is empty and the set is empty', () => {
    expect(resolveWallpaperId('', new Set())).toBeNull();
  });

  it('treats an empty stored id as unknown and falls back to the default', () => {
    expect(resolveWallpaperId('', new Set(['1', '4', '7']))).toBe('4');
  });

  it('handles a stored id that is present but not the default', () => {
    expect(resolveWallpaperId('1', new Set(['1', '4', '7']))).toBe('1');
  });
});
