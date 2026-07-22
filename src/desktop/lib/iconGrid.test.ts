import { describe, it, expect, vi, afterEach } from 'vitest';
import { iconGridForViewport } from './iconGrid';
import { COMPACT_HEIGHT_PX, MOBILE_BREAKPOINT_PX } from './layoutConstants';
import { setViewport } from '@test/helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('iconGridForViewport', () => {
  it('uses 6 rows on a tall desktop viewport', () => {
    setViewport(1024, 768);
    expect(iconGridForViewport(768).maxRows).toBe(6);
  });

  it('reduces rows on a short landscape phone viewport', () => {
    setViewport(844, 390);
    const { maxRows } = iconGridForViewport(390);
    expect(maxRows).toBeLessThan(6);
    expect(maxRows).toBeGreaterThanOrEqual(1);
  });

  it('uses the narrow grid cap below the width breakpoint', () => {
    setViewport(MOBILE_BREAKPOINT_PX - 1, 800);
    expect(iconGridForViewport(800).maxRows).toBeLessThanOrEqual(4);
  });

  it('wraps icons into more columns when height is limited', () => {
    setViewport(844, 390);
    const { maxRows, rowPitch, colPitch } = iconGridForViewport(390);
    // 8 icons with maxRows should need ceil(8/maxRows) columns
    const cols = Math.ceil(8 / maxRows);
    expect(cols).toBeGreaterThan(1);
    expect(rowPitch).toBe(84);
    expect(colPitch).toBe(96);
  });
});

describe('compact layout threshold', () => {
  it('treats phone landscape as wide (not full-bleed compact)', () => {
    expect(844).toBeGreaterThanOrEqual(MOBILE_BREAKPOINT_PX);
    expect(390).toBeLessThan(COMPACT_HEIGHT_PX);
  });
});
