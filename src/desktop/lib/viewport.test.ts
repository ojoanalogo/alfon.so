import { describe, it, expect } from 'vitest';
import {
  clampWidth,
  effectiveMinWidth,
  mobileWindowGeometry,
  resolveDefaultOpenGeometry,
  resolveLayoutWidth,
  resolveWindowGeometry,
  resolveWindowHeightStyle,
} from './viewport';
import { EDGE_MARGIN, MIN_WIDTH, TASKBAR_HEIGHT } from './layoutConstants';
import { makeWindowDef } from '@test/factories';

describe('effectiveMinWidth', () => {
  it('never exceeds the available width on narrow viewports', () => {
    const def = makeWindowDef({ minWidth: 600 });
    const vw = 400;
    expect(effectiveMinWidth(def, vw)).toBeLessThanOrEqual(vw - EDGE_MARGIN * 2);
  });

  it('honors the configured min width on wide viewports', () => {
    expect(effectiveMinWidth(makeWindowDef({ minWidth: 600 }), 1400)).toBe(600);
  });
});

describe('resolveLayoutWidth', () => {
  it('returns the stored width when the user resized', () => {
    expect(resolveLayoutWidth(600, { width: 999, userSized: true })).toBe(999);
  });

  it('clamps to the app default on a wide viewport', () => {
    expect(resolveLayoutWidth(600, { width: 0 }, MIN_WIDTH, 1400)).toBe(600);
  });

  it('falls back to the min width when the viewport is too narrow', () => {
    // available = max(240, 300 - 16) = 284 < MIN_WIDTH → clamps up to MIN_WIDTH
    expect(resolveLayoutWidth(600, { width: 0 }, MIN_WIDTH, 300)).toBe(MIN_WIDTH);
  });
});

describe('mobileWindowGeometry', () => {
  it('insets by the edge margin and reserves the taskbar', () => {
    expect(mobileWindowGeometry(390, 800)).toEqual({
      x: EDGE_MARGIN,
      y: EDGE_MARGIN,
      width: 390 - EDGE_MARGIN * 2,
      height: 800 - TASKBAR_HEIGHT - EDGE_MARGIN * 2,
    });
  });
});

describe('clampWidth', () => {
  it('returns the floor (minWidth) when defaultWidth is below it', () => {
    // available = max(240, 1200 - 16) = 1184; max(400, min(300, 1184)) = 400
    expect(clampWidth(300, 400, 1200)).toBe(400);
  });

  it('caps to available span when defaultWidth exceeds the viewport', () => {
    // available = max(240, 600 - 16) = 584; max(400, min(2000, 584)) = 584
    expect(clampWidth(2000, 400, 600)).toBe(600 - EDGE_MARGIN * 2);
  });

  it('returns defaultWidth unchanged when it is in range', () => {
    // available = max(240, 1200 - 16) = 1184; max(400, min(600, 1184)) = 600
    expect(clampWidth(600, 400, 1200)).toBe(600);
  });
});

describe('resolveDefaultOpenGeometry', () => {
  it('returns the default width and null height for a content-sized desktop window', () => {
    const geo = resolveDefaultOpenGeometry(makeWindowDef({ defaultWidth: 600 }), 1200, 800);
    expect(geo.width).toBe(600);
    expect(geo.height).toBeNull();
  });

  it('returns a full-bleed mobile box below the breakpoint', () => {
    const geo = resolveDefaultOpenGeometry(makeWindowDef({ defaultWidth: 600 }), 500, 800);
    expect(geo.x).toBe(EDGE_MARGIN);
    expect(geo.width).toBe(500 - EDGE_MARGIN * 2);
  });
});

describe('resolveWindowGeometry', () => {
  it('returns a full-bleed mobile box below the breakpoint', () => {
    const geo = resolveWindowGeometry(makeWindowDef({ defaultHeight: 400 }), 500, 800);
    expect(geo.x).toBe(EDGE_MARGIN);
    expect(geo.y).toBe(EDGE_MARGIN);
    expect(geo.width).toBe(500 - EDGE_MARGIN * 2);
    // content-sized windows keep their defaultHeight, else null
    expect(geo.height).toBe(400);
  });

  it('centers a center-flagged window on a desktop viewport', () => {
    const def = makeWindowDef({ center: true, defaultWidth: 600, defaultHeight: 400 });
    const geo = resolveWindowGeometry(def, 1200, 800);
    expect(geo.width).toBe(600);
    expect(geo.x).toBe(Math.max(EDGE_MARGIN, (1200 - 600) / 2));
    expect(geo.y).toBe(Math.max(EDGE_MARGIN, (800 - TASKBAR_HEIGHT - 400) / 2));
    expect(geo.height).toBe(400);
  });

  it('reports null height for content-sized windows', () => {
    const geo = resolveWindowGeometry(makeWindowDef({ center: true }), 1200, 800);
    expect(geo.height).toBeNull();
  });

  it('never resolves a width below the effective minimum', () => {
    const def = makeWindowDef({ defaultWidth: 1000, minWidth: 500 });
    const geo = resolveWindowGeometry(def, 1200, 800);
    expect(geo.width).toBeGreaterThanOrEqual(Math.min(MIN_WIDTH, effectiveMinWidth(def, 1200)));
  });

  it('uses the measured width when provided (rounded, min-clamped)', () => {
    const geo = resolveWindowGeometry(makeWindowDef({ defaultWidth: 600 }), 1200, 800, undefined, 523.4);
    expect(geo.width).toBe(523);
  });

  it('centers a content-sized window from the measured height; height stays null', () => {
    // No defaultHeight → content-sized; the measured box drives y, not height.
    const def = makeWindowDef({ center: true, defaultWidth: 600 });
    const geo = resolveWindowGeometry(def, 1200, 800, 320);
    expect(geo.y).toBe(Math.max(EDGE_MARGIN, (800 - TASKBAR_HEIGHT - 320) / 2));
    expect(geo.height).toBeNull();
  });

  it('positions a non-centered content-sized window near center with null height', () => {
    const geo = resolveWindowGeometry(makeWindowDef({ defaultWidth: 600 }), 1200, 800);
    expect(geo.height).toBeNull();
    expect(geo.x).toBeGreaterThanOrEqual(EDGE_MARGIN);
    expect(geo.y).toBeGreaterThanOrEqual(EDGE_MARGIN);
  });
});

describe('resolveWindowHeightStyle', () => {
  it('uses an explicit pixel height when set', () => {
    expect(resolveWindowHeightStyle(420, 500, 200)).toEqual({
      height: '420px',
      minHeight: undefined,
    });
  });

  it('falls back to the app default height when height is null', () => {
    expect(resolveWindowHeightStyle(null, 500, undefined)).toEqual({
      height: '500px',
      minHeight: undefined,
    });
  });

  it('uses only a min-height floor for content-sized windows with no default', () => {
    expect(resolveWindowHeightStyle(null, undefined, 200)).toEqual({
      height: undefined,
      minHeight: 200,
    });
  });
});
