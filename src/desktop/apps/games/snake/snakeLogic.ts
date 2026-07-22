export const CELL = 16;
export const COLS = 20;
export const ROWS = 20;
export const TICK_MS = 110;

export type Point = { x: number; y: number };
export type Direction = 'up' | 'down' | 'left' | 'right';

export type GameState = {
  snake: Point[];
  /** Direction of the last applied move (not the latest keypress). */
  direction: Direction;
  food: Point | null;
  score: number;
  gameOver: boolean;
  won: boolean;
};

export const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

/** Uniform free-cell pick; null when the snake fills the board (never loops). */
export function randomFood(snake: Point[]): Point | null {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const free: Point[] = [];
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

export function initialState(): GameState {
  const snake: Point[] = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  return {
    snake,
    direction: 'right',
    food: randomFood(snake),
    score: 0,
    gameOver: false,
    won: false,
  };
}

export function stepGame(prev: GameState, nextDirection: Direction): GameState {
  if (prev.gameOver || prev.won) return prev;

  // Never reverse into the neck: compare against the direction of the last
  // applied move, not the latest keypress. Two quick turns within one tick
  // (e.g. right → up → left) must not collapse into a 180° suicide.
  const direction = OPPOSITE[nextDirection] === prev.direction ? prev.direction : nextDirection;

  const head = prev.snake[0];
  const delta: Record<Direction, Point> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const nextHead = {
    x: head.x + delta[direction].x,
    y: head.y + delta[direction].y,
  };

  const hitWall = nextHead.x < 0 || nextHead.x >= COLS || nextHead.y < 0 || nextHead.y >= ROWS;
  const willEat = prev.food !== null && nextHead.x === prev.food.x && nextHead.y === prev.food.y;
  const body = willEat ? prev.snake : prev.snake.slice(0, -1);
  const hitSelf = body.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

  if (hitWall || hitSelf) {
    return { ...prev, gameOver: true };
  }

  const nextSnake = [nextHead, ...prev.snake];
  if (!willEat) nextSnake.pop();

  if (willEat && nextSnake.length === COLS * ROWS) {
    return { ...prev, snake: nextSnake, direction, food: null, score: prev.score + 1, won: true };
  }

  return {
    snake: nextSnake,
    direction,
    food: willEat ? randomFood(nextSnake) : prev.food,
    score: willEat ? prev.score + 1 : prev.score,
    gameOver: false,
    won: false,
  };
}
