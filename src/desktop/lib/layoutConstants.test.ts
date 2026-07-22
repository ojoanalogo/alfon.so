import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  isMobileViewport,
  isCompactLayoutViewport,
  isLandscapePhoneViewport,
  minWidthForDef,
  MIN_WIDTH,
  MOBILE_BREAKPOINT_PX,
  COMPACT_HEIGHT_PX,
} from './layoutConstants';
import { makeWindowDef } from '@test/factories';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isMobileViewport', () => {
  it('is true below the breakpoint', () => {
    expect(isMobileViewport(MOBILE_BREAKPOINT_PX - 1)).toBe(true);
    expect(isMobileViewport(320)).toBe(true);
  });

  it('is false at and above the breakpoint', () => {
    expect(isMobileViewport(MOBILE_BREAKPOINT_PX)).toBe(false);
    expect(isMobileViewport(1024)).toBe(false);
  });

  it('returns false during SSR (no window) when called without a width', () => {
    vi.stubGlobal('window', undefined);
    expect(isMobileViewport()).toBe(false);
  });

  it('honors an explicit width during SSR (no window) instead of assuming desktop', () => {
    vi.stubGlobal('window', undefined);
    expect(isMobileViewport(390)).toBe(true);
    expect(isMobileViewport(1024)).toBe(false);
  });
});

describe('isCompactLayoutViewport', () => {
  it('is true below the width breakpoint', () => {
    expect(isCompactLayoutViewport(MOBILE_BREAKPOINT_PX - 1, 800)).toBe(true);
  });

  it('is false below the height threshold when wide (phone landscape uses desktop layout)', () => {
    expect(isCompactLayoutViewport(844, COMPACT_HEIGHT_PX - 1)).toBe(false);
  });

  it('is false on a typical desktop viewport', () => {
    expect(isCompactLayoutViewport(1024, 768)).toBe(false);
  });

  it('returns false during SSR when called without dimensions', () => {
    vi.stubGlobal('window', undefined);
    expect(isCompactLayoutViewport()).toBe(false);
  });
});

describe('isLandscapePhoneViewport', () => {
  it('is true when wide and short', () => {
    expect(isLandscapePhoneViewport(844, COMPACT_HEIGHT_PX - 1)).toBe(true);
  });

  it('is false on portrait mobile', () => {
    expect(isLandscapePhoneViewport(MOBILE_BREAKPOINT_PX - 1, 800)).toBe(false);
  });

  it('is false on a typical desktop viewport', () => {
    expect(isLandscapePhoneViewport(1024, 768)).toBe(false);
  });
});

describe('minWidthForDef', () => {
  it('uses the def minWidth when present', () => {
    expect(minWidthForDef(makeWindowDef({ minWidth: 480 }))).toBe(480);
  });

  it('falls back to the global MIN_WIDTH', () => {
    expect(minWidthForDef(makeWindowDef())).toBe(MIN_WIDTH);
  });
});
