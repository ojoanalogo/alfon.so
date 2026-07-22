import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  iconColumnX,
  iconGridForViewport,
  iconPositionsForIcons,
  usesEvenColumnLayout,
} from './iconGrid';
import { COMPACT_HEIGHT_PX, MOBILE_BREAKPOINT_PX } from './layoutConstants';
import { setViewport } from '@test/helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('iconGridForViewport', () => {
  it('uses 6 rows on a tall desktop viewport', () => {
    setViewport(1024, 768);
    expect(iconGridForViewport(1024, 768).maxRows).toBe(6);
  });

  it('reduces rows on a short landscape phone viewport', () => {
    setViewport(844, 390);
    const { maxRows } = iconGridForViewport(844, 390);
    expect(maxRows).toBeLessThan(6);
    expect(maxRows).toBeGreaterThanOrEqual(1);
  });

  it('uses the narrow grid cap below the width breakpoint', () => {
    setViewport(MOBILE_BREAKPOINT_PX - 1, 800);
    expect(iconGridForViewport(MOBILE_BREAKPOINT_PX - 1, 800).maxRows).toBeLessThanOrEqual(4);
  });

  it('wraps icons into more columns when height is limited', () => {
    setViewport(844, 390);
    const { maxRows, rowPitch, colPitch } = iconGridForViewport(844, 390);
    const cols = Math.ceil(8 / maxRows);
    expect(cols).toBeGreaterThan(1);
    expect(rowPitch).toBe(84);
    expect(colPitch).toBe(96);
  });
});

describe('usesEvenColumnLayout', () => {
  it('is true on portrait mobile', () => {
    expect(usesEvenColumnLayout(390, 800)).toBe(true);
  });

  it('is true on phone landscape', () => {
    expect(usesEvenColumnLayout(844, COMPACT_HEIGHT_PX - 1)).toBe(true);
  });

  it('is false on a typical desktop viewport', () => {
    expect(usesEvenColumnLayout(1024, 768)).toBe(false);
  });
});

describe('iconColumnX', () => {
  it('distributes two columns with equal gutters on a narrow viewport', () => {
    setViewport(390, 800);
    const x0 = iconColumnX(0, 2, 390);
    const x1 = iconColumnX(1, 2, 390);
    const iconWidth = 92;
    const gutter0 = x0 - 16;
    const gutterBetween = x1 - (x0 + iconWidth);
    const gutterEnd = 390 - 8 - (x1 + iconWidth);
    expect(Math.abs(gutter0 - gutterBetween)).toBeLessThanOrEqual(1);
    expect(Math.abs(gutter0 - gutterEnd)).toBeLessThanOrEqual(1);
  });
});

describe('iconPositionsForIcons', () => {
  it('uses even column spacing on portrait mobile', () => {
    setViewport(390, 800);
    const icons = Array.from({ length: 6 }, (_, index) => ({ id: `i${index}` }));
    const positions = iconPositionsForIcons(icons);
    const xs = Object.values(positions)
      .map((pos) => pos.x)
      .sort((a, b) => a - b);
    const uniqueXs = [...new Set(xs)];
    expect(uniqueXs.length).toBe(2);
    const gap = uniqueXs[1] - uniqueXs[0];
    expect(gap).toBeGreaterThan(92);
  });

  it('uses even column spacing on phone landscape', () => {
    setViewport(844, 390);
    const icons = Array.from({ length: 8 }, (_, index) => ({ id: `i${index}` }));
    const positions = iconPositionsForIcons(icons);
    const xs = Object.values(positions)
      .map((pos) => pos.x)
      .sort((a, b) => a - b);
    const uniqueXs = [...new Set(xs)];
    expect(uniqueXs.length).toBeGreaterThan(1);
    const pitch = uniqueXs[1] - uniqueXs[0];
    for (let index = 1; index < uniqueXs.length; index++) {
      expect(uniqueXs[index] - uniqueXs[index - 1]).toBe(pitch);
    }
  });
});

describe('compact layout threshold', () => {
  it('treats phone landscape as wide (not full-bleed compact)', () => {
    expect(844).toBeGreaterThanOrEqual(MOBILE_BREAKPOINT_PX);
    expect(390).toBeLessThan(COMPACT_HEIGHT_PX);
  });
});
