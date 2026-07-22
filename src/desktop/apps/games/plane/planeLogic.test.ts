import { describe, expect, it } from 'vitest';
import {
  HEIGHT,
  OBSTACLE_H,
  PLANE_H,
  PLANE_W,
  WIDTH,
  initialState,
  rectsOverlap,
  stepGame,
  type GameState,
} from './planeLogic';

const PLANE_Y = HEIGHT - PLANE_H - 16;

function makeGame(overrides: Partial<GameState> = {}): GameState {
  return { ...initialState(), ...overrides };
}

describe('plane stepGame', () => {
  it('moves the plane within the stage bounds', () => {
    expect(stepGame(makeGame({ planeX: 100 }), 5).planeX).toBe(105);
    expect(stepGame(makeGame({ planeX: 100 }), -5).planeX).toBe(95);
  });

  it('clamps the plane at the edges', () => {
    expect(stepGame(makeGame({ planeX: 2 }), -5).planeX).toBe(0);
    expect(stepGame(makeGame({ planeX: WIDTH - PLANE_W - 2 }), 5).planeX).toBe(WIDTH - PLANE_W);
  });

  it('scores and advances the tick while alive', () => {
    const next = stepGame(makeGame(), 0);
    expect(next.tick).toBe(1);
    expect(next.score).toBe(1);
  });

  it('drops obstacles below the stage', () => {
    const game = makeGame({
      obstacles: [{ x: 0, y: HEIGHT + OBSTACLE_H + 10, w: 40, h: OBSTACLE_H }],
    });
    expect(stepGame(game, 0).obstacles).toHaveLength(0);
  });

  it('spawns an obstacle on the spawn cadence (tick % 55)', () => {
    const next = stepGame(makeGame({ tick: 54 }), 0);
    expect(next.obstacles).toHaveLength(1);
    expect(next.obstacles[0].y).toBeLessThanOrEqual(0);
  });

  it('ends the game when an obstacle overlaps the plane', () => {
    const game = makeGame({
      planeX: 100,
      obstacles: [{ x: 100, y: PLANE_Y, w: 40, h: OBSTACLE_H }],
    });
    expect(stepGame(game, 0).gameOver).toBe(true);
  });

  it('survives an obstacle that passes beside the plane', () => {
    const game = makeGame({
      planeX: 100,
      obstacles: [{ x: 250, y: PLANE_Y, w: 40, h: OBSTACLE_H }],
    });
    expect(stepGame(game, 0).gameOver).toBe(false);
  });

  it('is a no-op once the game is over', () => {
    const game = makeGame({ gameOver: true, score: 42 });
    expect(stepGame(game, 5)).toBe(game);
  });
});

describe('plane rectsOverlap', () => {
  it('detects overlap and separation', () => {
    expect(rectsOverlap(0, 0, 10, 10, 5, 5, 10, 10)).toBe(true);
    expect(rectsOverlap(0, 0, 10, 10, 20, 20, 10, 10)).toBe(false);
    // Touching edges do not count as overlap.
    expect(rectsOverlap(0, 0, 10, 10, 10, 0, 10, 10)).toBe(false);
  });
});
