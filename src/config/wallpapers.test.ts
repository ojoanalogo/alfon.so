import { describe, it, expect } from 'vitest';
import { resolveWallpaperId } from './wallpapers';

describe('resolveWallpaperId', () => {
  const ids = new Set(['01', '03', '05']);

  it('returns the stored id when it is available', () => {
    expect(resolveWallpaperId('03', ids)).toBe('03');
  });

  it('returns null when the stored id is unknown', () => {
    expect(resolveWallpaperId('99', ids)).toBeNull();
    expect(resolveWallpaperId('06', ids)).toBeNull();
  });

  it('returns null when nothing is available', () => {
    expect(resolveWallpaperId('03', new Set())).toBeNull();
  });
});
