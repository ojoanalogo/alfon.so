import { MIN_HEIGHT, TASKBAR_HEIGHT } from './layoutConstants';
import { clampBoxToWorkArea } from './geometry';

/** Max px a window center may shift from the viewport center. */
export const JITTER_X = 140;
export const JITTER_Y = 100;

function hashUnit(id: string, salt: number): number {
  let hash = salt;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 10_000) / 10_000;
}

function jitterOffsets(id: string | null, random: boolean): { x: number; y: number } {
  if (random) {
    return {
      x: (Math.random() - 0.5) * 2 * JITTER_X,
      y: (Math.random() - 0.5) * 2 * JITTER_Y,
    };
  }

  const seed = id ?? 'window';
  return {
    x: (hashUnit(seed, 1) - 0.5) * 2 * JITTER_X,
    y: (hashUnit(seed, 2) - 0.5) * 2 * JITTER_Y,
  };
}

export function positionNearCenter(
  viewportWidth: number,
  viewportHeight: number,
  windowWidth: number,
  windowHeight: number,
  windowId: string | null,
  random = false,
): { x: number; y: number } {
  const workHeight = viewportHeight - TASKBAR_HEIGHT;
  const height = Math.max(MIN_HEIGHT, windowHeight);
  const { x: jitterX, y: jitterY } = jitterOffsets(windowId, random);

  const centerX = (viewportWidth - windowWidth) / 2;
  const centerY = (workHeight - height) / 2;

  const clamped = clampBoxToWorkArea(
    centerX + jitterX,
    centerY + jitterY,
    windowWidth,
    height,
    viewportWidth,
    viewportHeight,
  );

  return { x: Math.round(clamped.x), y: Math.round(clamped.y) };
}
