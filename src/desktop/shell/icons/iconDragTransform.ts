export const ICON_DRAG_SCALE = 1.18;
export const ICON_DRAG_RAMP_IN_MS = 480;
export const ICON_DRAG_RAMP_OUT_MS = 320;

export function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return 1 - (1 - x) ** 3;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Cloth bend on the glyph only; `ramp` is already eased (0 → 1) from the drag hook. */
export function iconGlyphDragTransform(tiltX: number, tiltY: number, ramp: number): string {
  const r = clamp(ramp, 0, 1);
  const tX = tiltX * r;
  const tY = tiltY * r;
  const skewX = tY * 0.58;
  const skewY = tX * 0.58;
  const scale = 1 + (ICON_DRAG_SCALE - 1) * r;
  const scaleX = scale * (1 + tY * 0.014);
  const scaleY = scale * (1 - tX * 0.014);
  return [
    `rotateX(${tX.toFixed(2)}deg)`,
    `rotateY(${tY.toFixed(2)}deg)`,
    `skewX(${skewX.toFixed(2)}deg)`,
    `skewY(${skewY.toFixed(2)}deg)`,
    `scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`,
  ].join(' ');
}

export interface IconDragMotion {
  bendX: number;
  bendY: number;
  wobbleX: number;
  wobbleY: number;
}

/** Gentle lean from drag distance; velocity drives the wobble. */
export function computeIconDragMotion(
  startX: number,
  startY: number,
  clientX: number,
  clientY: number,
  lastX: number,
  lastY: number,
): IconDragMotion {
  const dx = clientX - startX;
  const dy = clientY - startY;
  const vx = clientX - lastX;
  const vy = clientY - lastY;

  return {
    bendX: clamp(dy * 0.038, -6, 6),
    bendY: clamp(-dx * 0.038, -6, 6),
    wobbleX: clamp(vy * 0.52, -8, 8),
    wobbleY: clamp(-vx * 0.52, -8, 8),
  };
}
