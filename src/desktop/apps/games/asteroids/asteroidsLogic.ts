export const WIDTH = 320;
export const HEIGHT = 320;
export const SHIP_R = 10;
export const TICK_MS = 16;

export type Asteroid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

export type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
};

export type GameState = {
  shipX: number;
  shipY: number;
  angle: number;
  vx: number;
  vy: number;
  asteroids: Asteroid[];
  bullets: Bullet[];
  score: number;
  gameOver: boolean;
  tick: number;
  fireCooldown: number;
};

export function wrap(value: number, max: number): number {
  if (value < 0) return value + max;
  if (value >= max) return value - max;
  return value;
}

function spawnWave(count: number): Asteroid[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    vx: (Math.random() - 0.5) * 1.6,
    vy: (Math.random() - 0.5) * 1.6,
    r: 22 + Math.random() * 10,
  }));
}

export function initialState(): GameState {
  return {
    shipX: WIDTH / 2,
    shipY: HEIGHT / 2,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    asteroids: spawnWave(3),
    bullets: [],
    score: 0,
    gameOver: false,
    tick: 0,
    fireCooldown: 0,
  };
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function splitAsteroid(asteroid: Asteroid): Asteroid[] {
  if (asteroid.r <= 14) return [];
  const r = asteroid.r * 0.55;
  return [
    { ...asteroid, r, vx: asteroid.vx + 0.7, vy: asteroid.vy - 0.5 },
    {
      ...asteroid,
      r,
      x: asteroid.x + 6,
      y: asteroid.y - 4,
      vx: asteroid.vx - 0.5,
      vy: asteroid.vy + 0.6,
    },
  ];
}

export function stepGame(
  prev: GameState,
  input: { rotate: number; thrust: boolean; fire: boolean },
): GameState {
  if (prev.gameOver) return prev;

  const angle = prev.angle + input.rotate * 0.08;
  let vx = prev.vx * 0.98;
  let vy = prev.vy * 0.98;

  if (input.thrust) {
    vx += Math.cos(angle) * 0.18;
    vy += Math.sin(angle) * 0.18;
  }

  const speed = Math.hypot(vx, vy);
  if (speed > 4.5) {
    vx = (vx / speed) * 4.5;
    vy = (vy / speed) * 4.5;
  }

  const shipX = wrap(prev.shipX + vx, WIDTH);
  const shipY = wrap(prev.shipY + vy, HEIGHT);

  let bullets = prev.bullets
    .map((bullet) => ({
      ...bullet,
      x: wrap(bullet.x + bullet.vx, WIDTH),
      y: wrap(bullet.y + bullet.vy, HEIGHT),
      ttl: bullet.ttl - 1,
    }))
    .filter((bullet) => bullet.ttl > 0);

  let fireCooldown = Math.max(0, prev.fireCooldown - 1);
  if (input.fire && fireCooldown === 0) {
    bullets.push({
      x: shipX + Math.cos(angle) * (SHIP_R + 4),
      y: shipY + Math.sin(angle) * (SHIP_R + 4),
      vx: Math.cos(angle) * 4.5,
      vy: Math.sin(angle) * 4.5,
      ttl: 50,
    });
    fireCooldown = 10;
  }

  let asteroids = prev.asteroids.map((asteroid) => ({
    ...asteroid,
    x: wrap(asteroid.x + asteroid.vx, WIDTH),
    y: wrap(asteroid.y + asteroid.vy, HEIGHT),
  }));

  let score = prev.score;
  const survivingBullets: Bullet[] = [];

  for (const bullet of bullets) {
    let hit = false;
    const nextAsteroids: Asteroid[] = [];
    for (const asteroid of asteroids) {
      if (!hit && dist(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.r) {
        hit = true;
        score += Math.round(asteroid.r);
        nextAsteroids.push(...splitAsteroid(asteroid));
      } else {
        nextAsteroids.push(asteroid);
      }
    }
    asteroids = nextAsteroids;
    if (!hit) survivingBullets.push(bullet);
  }
  bullets = survivingBullets;

  const crashed = asteroids.some(
    (asteroid) => dist(shipX, shipY, asteroid.x, asteroid.y) < asteroid.r + SHIP_R,
  );
  if (crashed) {
    return {
      ...prev,
      shipX,
      shipY,
      angle,
      vx,
      vy,
      asteroids,
      bullets,
      score,
      gameOver: true,
      tick: prev.tick + 1,
      fireCooldown,
    };
  }

  if (asteroids.length === 0) {
    asteroids = spawnWave(3 + Math.floor(prev.tick / 600));
  }

  return {
    shipX,
    shipY,
    angle,
    vx,
    vy,
    asteroids,
    bullets,
    score,
    gameOver: false,
    tick: prev.tick + 1,
    fireCooldown,
  };
}
