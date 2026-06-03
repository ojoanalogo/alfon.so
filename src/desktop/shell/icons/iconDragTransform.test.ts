import { describe, it, expect } from 'vitest';
import {
  ICON_DRAG_SCALE,
  ICON_DRAG_RAMP_IN_MS,
  ICON_DRAG_RAMP_OUT_MS,
  easeOutCubic,
  iconGlyphDragTransform,
  computeIconDragMotion,
} from './iconDragTransform';

describe('exported RAMP constants', () => {
  it('exposes the documented scale and ramp durations', () => {
    expect(ICON_DRAG_SCALE).toBe(1.18);
    expect(ICON_DRAG_RAMP_IN_MS).toBe(480);
    expect(ICON_DRAG_RAMP_OUT_MS).toBe(320);
  });
});

describe('easeOutCubic', () => {
  it('maps the endpoints exactly: f(0)=0, f(1)=1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('is monotonically non-decreasing across the unit interval', () => {
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const v = easeOutCubic(i / 100);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('clamps input below 0 to f(0)=0', () => {
    expect(easeOutCubic(-0.5)).toBe(0);
    expect(easeOutCubic(-100)).toBe(0);
  });

  it('clamps input above 1 to f(1)=1', () => {
    expect(easeOutCubic(1.5)).toBe(1);
    expect(easeOutCubic(100)).toBe(1);
  });

  it('stays within [0,1] for interior values and ease-outs (front-loaded)', () => {
    const mid = easeOutCubic(0.5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    // ease-out cubic: 1 - (1-0.5)^3 = 1 - 0.125 = 0.875, past the midpoint
    expect(mid).toBeCloseTo(0.875, 10);
    expect(mid).toBeGreaterThan(0.5);
  });
});

describe('iconGlyphDragTransform', () => {
  it('produces an identity-ish transform at rest (ramp=0)', () => {
    const t = iconGlyphDragTransform(10, 20, 0);
    // ramp=0 zeroes tilt, so all rotations/skews collapse and scale is 1
    expect(t).toBe(
      'rotateX(0.00deg) rotateY(0.00deg) skewX(0.00deg) skewY(0.00deg) scale(1.0000, 1.0000)',
    );
  });

  it('clamps ramp above 1 (scale reaches full ICON_DRAG_SCALE base)', () => {
    const overshoot = iconGlyphDragTransform(0, 0, 5);
    const exact = iconGlyphDragTransform(0, 0, 1);
    expect(overshoot).toBe(exact);
    // with zero tilt, scale collapses to the base scale = ICON_DRAG_SCALE = 1.18
    expect(exact).toContain('scale(1.1800, 1.1800)');
  });

  it('clamps negative ramp to 0', () => {
    const neg = iconGlyphDragTransform(10, 20, -3);
    const rest = iconGlyphDragTransform(10, 20, 0);
    expect(neg).toBe(rest);
  });

  it('applies tilt at full ramp with the documented coupling', () => {
    const t = iconGlyphDragTransform(4, 2, 1);
    // tX=4, tY=2 -> skewX = tY*0.58 = 1.16, skewY = tX*0.58 = 2.32
    expect(t).toContain('rotateX(4.00deg)');
    expect(t).toContain('rotateY(2.00deg)');
    expect(t).toContain('skewX(1.16deg)');
    expect(t).toContain('skewY(2.32deg)');
  });

  it('scales ramp linearly between rest and full tilt', () => {
    const half = iconGlyphDragTransform(4, 0, 0.5);
    // tX = 4*0.5 = 2
    expect(half).toContain('rotateX(2.00deg)');
  });
});

describe('computeIconDragMotion', () => {
  it('returns zero bend and wobble fully at rest (no movement)', () => {
    const m = computeIconDragMotion(100, 100, 100, 100, 100, 100);
    expect(m.bendX).toBeCloseTo(0, 10);
    expect(m.bendY).toBeCloseTo(0, 10);
    expect(m.wobbleX).toBeCloseTo(0, 10);
    expect(m.wobbleY).toBeCloseTo(0, 10);
  });

  it('returns zero wobble when there is no velocity (current === last)', () => {
    // displaced from start but not moving relative to last frame
    const m = computeIconDragMotion(0, 0, 50, 50, 50, 50);
    expect(m.wobbleX).toBeCloseTo(0, 10);
    expect(m.wobbleY).toBeCloseTo(0, 10);
    // but bend reflects the displacement
    expect(m.bendX).not.toBe(0);
    expect(m.bendY).not.toBe(0);
  });

  it('bend derives from start->current delta; bendX from dy, bendY from -dx', () => {
    // dx = clientX - startX = 100, dy = clientY - startY = 50
    const m = computeIconDragMotion(0, 0, 100, 50, 0, 0);
    // bendX = clamp(dy*0.038) = 50*0.038 = 1.9
    expect(m.bendX).toBeCloseTo(1.9, 10);
    // bendY = clamp(-dx*0.038) = -100*0.038 = -3.8
    expect(m.bendY).toBeCloseTo(-3.8, 10);
  });

  it('wobble derives from last->current velocity; wobbleX from vy, wobbleY from -vx', () => {
    // vx = clientX - lastX = 5, vy = clientY - lastY = 10
    const m = computeIconDragMotion(0, 0, 100, 100, 95, 90);
    // wobbleX = clamp(vy*0.52) = 10*0.52 = 5.2
    expect(m.wobbleX).toBeCloseTo(5.2, 10);
    // wobbleY = clamp(-vx*0.52) = -5*0.52 = -2.6
    expect(m.wobbleY).toBeCloseTo(-2.6, 10);
  });

  it('clamps bend to the +/-6 range on large displacement', () => {
    const m = computeIconDragMotion(0, 0, 100000, 100000, 0, 0);
    expect(m.bendX).toBe(6);
    expect(m.bendY).toBe(-6);
  });

  it('clamps bend to the -6/+6 range on large negative displacement', () => {
    const m = computeIconDragMotion(0, 0, -100000, -100000, 0, 0);
    expect(m.bendX).toBe(-6);
    expect(m.bendY).toBe(6);
  });

  it('clamps wobble to the +/-8 range on large velocity', () => {
    const m = computeIconDragMotion(0, 0, 100000, 100000, 0, 0);
    expect(m.wobbleX).toBe(8);
    expect(m.wobbleY).toBe(-8);
  });

  it('clamps wobble to the -8/+8 range on large negative velocity', () => {
    const m = computeIconDragMotion(0, 0, -100000, -100000, 0, 0);
    expect(m.wobbleX).toBe(-8);
    expect(m.wobbleY).toBe(8);
  });

  it('sign invariants: moving down/right yields positive bendX and negative bendY', () => {
    const m = computeIconDragMotion(0, 0, 10, 10, 0, 0);
    expect(m.bendX).toBeGreaterThan(0); // dy > 0
    expect(m.bendY).toBeLessThan(0); // -dx < 0
  });

  it('is deterministic for identical inputs', () => {
    const a = computeIconDragMotion(3, 7, 42, 11, 40, 9);
    const b = computeIconDragMotion(3, 7, 42, 11, 40, 9);
    expect(a).toEqual(b);
  });
});
