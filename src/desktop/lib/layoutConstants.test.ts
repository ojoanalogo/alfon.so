import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  isMobileViewport,
  minWidthForDef,
  MIN_WIDTH,
  MOBILE_BREAKPOINT_PX,
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

describe('minWidthForDef', () => {
  it('uses the def minWidth when present', () => {
    expect(minWidthForDef(makeWindowDef({ minWidth: 480 }))).toBe(480);
  });

  it('falls back to the global MIN_WIDTH', () => {
    expect(minWidthForDef(makeWindowDef())).toBe(MIN_WIDTH);
  });
});
