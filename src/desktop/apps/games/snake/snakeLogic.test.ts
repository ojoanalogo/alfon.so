import { describe, expect, it } from 'vitest';
import {
  COLS,
  ROWS,
  initialState,
  randomFood,
  stepGame,
  type GameState,
  type Point,
} from './snakeLogic';

function makeGame(overrides: Partial<GameState> = {}): GameState {
  return { ...initialState(), ...overrides };
}

describe('snake stepGame', () => {
  it('moves the head one cell in the current direction and keeps length', () => {
    const game = makeGame();
    const next = stepGame(game, 'right');

    expect(next.snake[0]).toEqual({ x: 11, y: 10 });
    expect(next.snake).toHaveLength(3);
    expect(next.direction).toBe('right');
  });

  it('applies a perpendicular turn', () => {
    const next = stepGame(makeGame(), 'up');
    expect(next.snake[0]).toEqual({ x: 10, y: 9 });
    expect(next.direction).toBe('up');
  });

  it('ignores a direct reversal of the last applied move', () => {
    // Moving right; 'left' must be dropped, not suicide into the neck.
    const next = stepGame(makeGame(), 'left');

    expect(next.direction).toBe('right');
    expect(next.snake[0]).toEqual({ x: 11, y: 10 });
    expect(next.gameOver).toBe(false);
  });

  it('survives a rapid up-then-left input sequence within one tick', () => {
    // Regression: the old guard compared against the pending direction, so
    // right → up → left inside one tick passed validation and the head moved
    // left into its own neck.
    const moving = makeGame();
    const afterUp = stepGame(moving, 'up');
    // The queued 'left' is a reversal of the *last applied* move if no tick
    // happened in between — simulate by stepping with 'left' from a state whose
    // last move was right.
    const wouldBeSuicide = stepGame(moving, 'left');
    expect(wouldBeSuicide.gameOver).toBe(false);
    // Once 'up' was actually applied, 'left' is legal.
    const afterLeft = stepGame(afterUp, 'left');
    expect(afterLeft.gameOver).toBe(false);
    expect(afterLeft.direction).toBe('left');
  });

  it('ends the game when hitting a wall', () => {
    const game = makeGame({ snake: [{ x: COLS - 1, y: 5 }] });
    const next = stepGame(game, 'right');
    expect(next.gameOver).toBe(true);
  });

  it('ends the game when hitting its own body', () => {
    // 2x2 loop: head at (10,10) moving up into the tail segment at (10,11)
    // after turning left from (11,10)... build an explicit knot instead.
    const snake: Point[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 11, y: 11 },
      { x: 11, y: 10 },
      { x: 12, y: 10 },
    ];
    const game = makeGame({ snake, direction: 'up', food: { x: 0, y: 0 } });
    // Turning left moves the head to (9,10) — safe; moving down is a reversal.
    // Move right: head to (11,10) — occupied by the body → game over.
    const next = stepGame(game, 'right');
    expect(next.gameOver).toBe(true);
  });

  it('eats the food, grows, scores, and respawns it off the snake', () => {
    const game = makeGame({ food: { x: 11, y: 10 } });
    const next = stepGame(game, 'right');

    expect(next.score).toBe(1);
    expect(next.snake).toHaveLength(4);
    expect(next.snake[0]).toEqual({ x: 11, y: 10 });
    expect(next.food).not.toBeNull();
    const onSnake = next.snake.some((s) => s.x === next.food!.x && s.y === next.food!.y);
    expect(onSnake).toBe(false);
  });

  it('wins when the snake fills the board (no infinite food loop)', () => {
    const snake: Point[] = [];
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        snake.push({ x, y });
      }
    }
    // Remove the tail tip so there is exactly one free cell, right above the head.
    snake.shift(); // frees (0,0); head is now (0,1)
    const head = snake[0];
    const food: Point = { x: head.x, y: head.y - 1 };
    const game = makeGame({ snake, direction: 'up', food });
    const next = stepGame(game, 'up');

    expect(next.won).toBe(true);
    expect(next.food).toBeNull();
  });
});

describe('snake randomFood', () => {
  it('returns null when no cell is free', () => {
    const snake: Point[] = [];
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        snake.push({ x, y });
      }
    }
    expect(randomFood(snake)).toBeNull();
  });

  it('never picks an occupied cell', () => {
    const snake: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
    for (let i = 0; i < 50; i++) {
      const food = randomFood(snake);
      expect(food).not.toBeNull();
      expect(snake.some((s) => s.x === food!.x && s.y === food!.y)).toBe(false);
    }
  });
});
