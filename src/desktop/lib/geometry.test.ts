import { describe, it, expect } from 'vitest';
import { clamp, clampBoxToWorkArea, centerInWorkArea } from './geometry';
import { EDGE_MARGIN, TASKBAR_HEIGHT } from './layoutConstants';

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the lower bound', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps to the upper bound', () => {
    expect(clamp(42, 0, 10)).toBe(10);
  });
});

describe('clampBoxToWorkArea', () => {
  it('pins a box past the top-left back to the edge margin', () => {
    expect(clampBoxToWorkArea(-50, -50, 100, 100, 1000, 800)).toEqual({
      x: EDGE_MARGIN,
      y: EDGE_MARGIN,
    });
  });

  it('keeps the bottom edge above the taskbar', () => {
    const { y } = clampBoxToWorkArea(0, 5000, 100, 100, 1000, 800);
    expect(y).toBe(800 - TASKBAR_HEIGHT - 100 - EDGE_MARGIN);
  });

  it('keeps the right edge inside the viewport', () => {
    const { x } = clampBoxToWorkArea(5000, 0, 100, 100, 1000, 800);
    expect(x).toBe(1000 - 100 - EDGE_MARGIN);
  });

  it('leaves a box already inside the work area untouched', () => {
    expect(clampBoxToWorkArea(120, 90, 100, 100, 1000, 800)).toEqual({ x: 120, y: 90 });
  });

  it('never pushes a box larger than the work area below the edge margin', () => {
    // Box wider/taller than the viewport: max(EDGE_MARGIN, …) wins on both axes.
    expect(clampBoxToWorkArea(0, 0, 2000, 2000, 1000, 800)).toEqual({
      x: EDGE_MARGIN,
      y: EDGE_MARGIN,
    });
  });
});

describe('centerInWorkArea', () => {
  it('centers a box within the work area (taskbar reserved)', () => {
    expect(centerInWorkArea(1200, 800, 600, 400)).toEqual({
      x: (1200 - 600) / 2,
      y: (800 - TASKBAR_HEIGHT - 400) / 2,
    });
  });

  it('top-aligns a box taller than the work area instead of going negative', () => {
    expect(centerInWorkArea(800, 600, 400, 900).y).toBe(EDGE_MARGIN);
  });

  it('left-aligns a box wider than the viewport instead of going negative', () => {
    expect(centerInWorkArea(300, 800, 600, 400).x).toBe(EDGE_MARGIN);
  });
});
