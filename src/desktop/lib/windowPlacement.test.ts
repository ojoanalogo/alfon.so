import { describe, it, expect } from 'vitest';
import { positionNearCenter } from './windowPlacement';
import { EDGE_MARGIN, TASKBAR_HEIGHT } from './layoutConstants';

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
