import { describe, expect, it } from 'vitest';
import {
  BALL,
  BRICK_OFFSET_X,
  BRICK_OFFSET_Y,
  BRICK_W,
  WIDTH,
  initialState,
  stepGame,
} from './BreakoutGame';

describe('breakout stepGame', () => {
  it('reflects exactly once when the ball overlaps two bricks in a tick (no tunneling)', () => {
    // Position the ball, after one step, straddling the gap between col 0 and col 1
    // of the top row so it overlaps both bricks simultaneously while moving up.
    const targetX = BRICK_OFFSET_X + BRICK_W + 2; // 46 — inside both adjacent bricks
    const targetY = BRICK_OFFSET_Y + 5; // 33 — inside the top row band
    const ballVy = -2;
    const game = {
      ...initialState(),
      ballX: targetX,
      ballY: targetY - ballVy,
      ballVx: 0,
      ballVy,
    };

    const next = stepGame(game, 0);

    // Both overlapped bricks are destroyed...
    expect(next.bricks[0][0]).toBe(false);
    expect(next.bricks[0][1]).toBe(false);
    // ...but the ball bounces back down instead of passing straight through.
    expect(next.ballVy).toBe(2);
  });

  it('clamps the ball inside the wall after reflecting (no sticky-wall jitter)', () => {
    const game = {
      ...initialState(),
      ballX: WIDTH - BALL / 2 + 1, // already past the right wall
      ballY: 200, // clear of bricks and paddle
      ballVx: 4, // still moving into the wall
      ballVy: -1,
    };

    const next = stepGame(game, 0);

    expect(next.ballX).toBe(WIDTH - BALL / 2);
    expect(next.ballVx).toBeLessThan(0);
  });
});
