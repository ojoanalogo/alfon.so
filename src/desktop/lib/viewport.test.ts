import { describe, it, expect } from 'vitest';
import {
  effectiveMinWidth,
  mobileWindowGeometry,
  resolveLayoutWidth,
  resolveWindowGeometry,
} from './viewport';
import { EDGE_MARGIN, MIN_WIDTH, TASKBAR_HEIGHT } from './layoutConstants';
import type { WindowDef } from '../types';

function makeDef(overrides: Partial<WindowDef> = {}): WindowDef {
  return {
    id: 'test',
    title: 'Test',
    defaultX: 0,
    defaultY: 0,
    defaultWidth: 600,
    initialZ: 10,
    ...overrides,
  };
}

describe('effectiveMinWidth', () => {
  it('never exceeds the available width on narrow viewports', () => {
    const def = makeDef({ minWidth: 600 });
    const vw = 400;
    expect(effectiveMinWidth(def, vw)).toBeLessThanOrEqual(vw - EDGE_MARGIN * 2);
  });

  it('honors the configured min width on wide viewports', () => {
    expect(effectiveMinWidth(makeDef({ minWidth: 600 }), 1400)).toBe(600);
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

describe('resolveWindowGeometry', () => {
  it('returns a full-bleed mobile box below the breakpoint', () => {
    const geo = resolveWindowGeometry(makeDef({ defaultHeight: 400 }), 500, 800);
    expect(geo.x).toBe(EDGE_MARGIN);
    expect(geo.y).toBe(EDGE_MARGIN);
    expect(geo.width).toBe(500 - EDGE_MARGIN * 2);
    // content-sized windows keep their defaultHeight, else null
    expect(geo.height).toBe(400);
  });

  it('centers a center-flagged window on a desktop viewport', () => {
    const def = makeDef({ center: true, defaultWidth: 600, defaultHeight: 400 });
    const geo = resolveWindowGeometry(def, 1200, 800);
    expect(geo.width).toBe(600);
    expect(geo.x).toBe(Math.max(EDGE_MARGIN, (1200 - 600) / 2));
    expect(geo.y).toBe(Math.max(EDGE_MARGIN, (800 - TASKBAR_HEIGHT - 400) / 2));
    expect(geo.height).toBe(400);
  });

  it('reports null height for content-sized windows', () => {
    const geo = resolveWindowGeometry(makeDef({ center: true }), 1200, 800);
    expect(geo.height).toBeNull();
  });

  it('never resolves a width below the effective minimum', () => {
    const def = makeDef({ defaultWidth: 1000, minWidth: 500 });
    const geo = resolveWindowGeometry(def, 1200, 800);
    expect(geo.width).toBeGreaterThanOrEqual(Math.min(MIN_WIDTH, effectiveMinWidth(def, 1200)));
  });
});
