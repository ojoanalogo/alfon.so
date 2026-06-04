import { describe, it, expect, vi, afterEach } from 'vitest';
import { positionNearCenter, JITTER_X, JITTER_Y } from './windowPlacement';
import { EDGE_MARGIN, TASKBAR_HEIGHT } from './layoutConstants';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('positionNearCenter', () => {
  it('is deterministic for a given window id (hash-seeded jitter)', () => {
    const a = positionNearCenter(1200, 800, 400, 300, 'notes');
    const b = positionNearCenter(1200, 800, 400, 300, 'notes');
    expect(a).toEqual(b);
  });

  it('gives different placements for different ids', () => {
    const a = positionNearCenter(1200, 800, 400, 300, 'notes');
    const b = positionNearCenter(1200, 800, 400, 300, 'terminal');
    expect(a).not.toEqual(b);
  });

  it('is deterministic with a null window id (fixed fallback seed)', () => {
    const a = positionNearCenter(1200, 800, 400, 300, null);
    const b = positionNearCenter(1200, 800, 400, 300, null);
    expect(a).toEqual(b);
  });

  it('places the window within the jitter radius of the viewport center', () => {
    const vw = 1600;
    const vh = 1000;
    const ww = 400;
    const wh = 300;
    const centerX = (vw - ww) / 2;
    const centerY = (vh - TASKBAR_HEIGHT - wh) / 2;
    const { x, y } = positionNearCenter(vw, vh, ww, wh, 'notes');
    expect(Math.abs(x - centerX)).toBeLessThanOrEqual(JITTER_X);
    expect(Math.abs(y - centerY)).toBeLessThanOrEqual(JITTER_Y);
  });

  it('uses Math.random for jitter when random=true (id ignored)', () => {
    // 0.5 → zero offset, so the window lands exactly at center.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const vw = 1600;
    const vh = 1000;
    const ww = 400;
    const wh = 300;
    const { x, y } = positionNearCenter(vw, vh, ww, wh, 'ignored', true);
    expect(x).toBe(Math.round((vw - ww) / 2));
    expect(y).toBe(Math.round((vh - TASKBAR_HEIGHT - wh) / 2));
  });

  it('clamps to EDGE_MARGIN when the window is larger than the work area', () => {
    const { x, y } = positionNearCenter(500, 400, 900, 700, 'too-big');
    expect(x).toBe(EDGE_MARGIN);
    expect(y).toBe(EDGE_MARGIN);
  });

  it('keeps the window inside the work area (edge margins, above taskbar)', () => {
    const vw = 1000;
    const vh = 700;
    const ww = 400;
    const wh = 300;
    const { x, y } = positionNearCenter(vw, vh, ww, wh, 'pos');

    const maxX = Math.max(EDGE_MARGIN, vw - ww - EDGE_MARGIN);
    const maxY = Math.max(EDGE_MARGIN, vh - TASKBAR_HEIGHT - wh - EDGE_MARGIN);

    expect(x).toBeGreaterThanOrEqual(EDGE_MARGIN);
    expect(x).toBeLessThanOrEqual(maxX);
    expect(y).toBeGreaterThanOrEqual(EDGE_MARGIN);
    expect(y).toBeLessThanOrEqual(maxY);
  });

  it('returns integer coordinates', () => {
    const { x, y } = positionNearCenter(1234, 777, 401, 333, 'round');
    expect(Number.isInteger(x)).toBe(true);
    expect(Number.isInteger(y)).toBe(true);
  });
});
