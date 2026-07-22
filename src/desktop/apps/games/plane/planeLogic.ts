export const WIDTH = 320;
export const HEIGHT = 400;
export const PLANE_W = 28;
export const PLANE_H = 20;
export const OBSTACLE_W = 36;
export const OBSTACLE_H = 16;
export const TICK_MS = 16;

export type Obstacle = { x: number; y: number; w: number; h: number };

export type GameState = {
  planeX: number;
  obstacles: Obstacle[];
  tick: number;
  score: number;
  gameOver: boolean;
};

export function initialState(): GameState {
  return {
    planeX: WIDTH / 2 - PLANE_W / 2,
    obstacles: [],
    tick: 0,
    score: 0,
    gameOver: false,
  };
}

export function spawnObstacle(): Obstacle {
  const w = OBSTACLE_W + Math.floor(Math.random() * 20);
  return {
    x: Math.random() * (WIDTH - w),
    y: -OBSTACLE_H,
    w,
    h: OBSTACLE_H,
  };
}

export function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function stepGame(prev: GameState, move: number): GameState {
  if (prev.gameOver) return prev;

  const planeX = Math.max(0, Math.min(WIDTH - PLANE_W, prev.planeX + move));
  const planeY = HEIGHT - PLANE_H - 16;
  const tick = prev.tick + 1;
  let obstacles = prev.obstacles
    .map((obstacle) => ({ ...obstacle, y: obstacle.y + 2.4 + tick * 0.002 }))
    .filter((obstacle) => obstacle.y < HEIGHT + OBSTACLE_H);

  if (tick % 55 === 0) {
    obstacles = [...obstacles, spawnObstacle()];
  }

  const hit = obstacles.some((obstacle) =>
    rectsOverlap(planeX, planeY, PLANE_W, PLANE_H, obstacle.x, obstacle.y, obstacle.w, obstacle.h),
  );

  if (hit) {
    return { ...prev, planeX, obstacles, tick, gameOver: true };
  }

  return {
    planeX,
    obstacles,
    tick,
    score: prev.score + 1,
    gameOver: false,
  };
}
